/* YouTube Data API v3 — chave exclusivamente no servidor. */
const WINDOW_MS=60_000, MAX_REQUESTS=12, MAX_BODY_BYTES=4000, PROVIDER_TIMEOUT_MS=10000, windows=new Map();
let activeRequests=0;
const MAX_CONCURRENT_REQUESTS=2;
function send(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return false;try{const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().toLowerCase();return Boolean(host)&&new URL(origin).host.toLowerCase()===host;}catch{return false;}}
function rateLimit(req){const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim(), now=Date.now(), item=windows.get(ip);if(!item||now-item.start>=WINDOW_MS){windows.set(ip,{start:now,count:1});if(windows.size>1000)for(const [k,v] of windows)if(now-v.start>=WINDOW_MS)windows.delete(k);return true;}item.count++;return item.count<=MAX_REQUESTS;}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(typeof req.body==='string')return JSON.parse(req.body);return {};}
async function fetchWithTimeout(url,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),PROVIDER_TIMEOUT_MS);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Método não permitido.'});}
 if(!sameOrigin(req))return send(res,403,{error:'Origem não autorizada.'});
 if(activeRequests>=MAX_CONCURRENT_REQUESTS)return send(res,429,{error:'Muitas buscas em andamento. Tente novamente em instantes.'});
 if(!rateLimit(req))return send(res,429,{error:'Muitas buscas em pouco tempo. Espere um minutinho.'});
 if(Number(req.headers['content-length']||0)>MAX_BODY_BYTES)return send(res,413,{error:'A busca enviada ficou grande demais.'});
 let data;try{data=body(req);}catch{return send(res,400,{error:'Não consegui ler a busca.'});}
 if(Buffer.byteLength(JSON.stringify(data),'utf8')>MAX_BODY_BYTES)return send(res,413,{error:'A busca enviada ficou grande demais.'});
 const query=String(data.query||'').trim().slice(0,120);
 if(query.length<2)return send(res,400,{error:'Digite pelo menos dois caracteres.'});
 const fallbackUrl='https://www.youtube.com/results?search_query='+encodeURIComponent(query);
 const key=process.env.YOUTUBE_API_KEY;
 if(!key)return send(res,503,{error:'A busca integrada do YouTube ainda não foi configurada no servidor.',fallbackUrl});
 activeRequests+=1;try{
  const url=new URL('https://www.googleapis.com/youtube/v3/search');
  url.search=new URLSearchParams({part:'snippet',type:'video',maxResults:'5',safeSearch:'moderate',q:query,key}).toString();
  const upstream=await fetchWithTimeout(url,{headers:{Accept:'application/json'}});
  if(!upstream.ok){console.error('[Pestinha YouTube] status',upstream.status);return send(res,502,{error:'O YouTube não conseguiu concluir a busca agora.',fallbackUrl});}
  const result=await upstream.json();
  const items=(Array.isArray(result.items)?result.items:[]).map(item=>({ytId:String(item.id?.videoId||''),name:String(item.snippet?.title||'Vídeo do YouTube').slice(0,120),artist:String(item.snippet?.channelTitle||'Canal do YouTube').slice(0,80),url:'https://www.youtube.com/watch?v='+encodeURIComponent(String(item.id?.videoId||''))})).filter(item=>/^[a-zA-Z0-9_-]{11}$/.test(item.ytId));
  return send(res,200,{items,fallbackUrl});
 }catch(error){console.error('[Pestinha YouTube]',error?.message||error);return send(res,502,{error:'Não consegui falar com o YouTube agora.',fallbackUrl});}finally{activeRequests=Math.max(0,activeRequests-1);}
}
