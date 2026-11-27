import { SEEDED_MEMORIES } from './memory-of-day.js';

const ICON = { achievement:'🏆', event:'🎉', milestone:'💫', movie:'🎬', quiz:'💘', music:'🎵', memory:'💭', special:'⭐' };
const LABEL = { achievement:'Conquista', event:'Evento', milestone:'Marco', movie:'Cinema', quiz:'Quiz', music:'Música', memory:'Memória', special:'Especial' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate = value => { const d = new Date(Number(value)); return Number.isFinite(d.getTime()) && Number(value) > 0 ? d : null; };
const monthName = d => new Intl.DateTimeFormat('pt-BR',{month:'long'}).format(d);
const dateLabel = d => new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(d);

function collectMemories() {
  let live = [];
  try { const core = window._loveCity?.getLoveCore?.(); if (Array.isArray(core?.memories)) live = core.memories; } catch (_) {}
  const ids = new Set(live.map(m => m?.id).filter(Boolean));
  const merged = [...live, ...SEEDED_MEMORIES.filter(m => !ids.has(m.id))];
  const seen = new Set();
  return merged.map((m, i) => ({...m, _date:validDate(m?.ts), _key:String(m?.id || `${m?.ts}-${i}`)}))
    .filter(m => m._date && String(m.summary || '').trim())
    .filter(m => { if (seen.has(m._key)) return false; seen.add(m._key); return true; })
    .sort((a,b) => b._date - a._date);
}

function download(name, content, type) {
  const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initRetrospectiva() {
  const host = document.getElementById('retrospectiva-wrap');
  if (!host || host.dataset.ready === '1') return;
  host.dataset.ready = '1';
  let all = collectMemories();
  let year = 'all', type = 'all', query = '';

  function render() {
    const years = [...new Set(all.map(m => String(m._date.getFullYear())))].sort((a,b)=>Number(b)-Number(a));
    const filtered = all.filter(m => (year === 'all' || String(m._date.getFullYear()) === year) && (type === 'all' || m.type === type) && (!query || `${m.summary} ${LABEL[m.type] || 'Memória'}`.toLocaleLowerCase('pt-BR').includes(query)));
    const count = filtered.length;
    const months = new Map();
    filtered.forEach(m => { const key = `${m._date.getFullYear()}-${String(m._date.getMonth()+1).padStart(2,'0')}`; if (!months.has(key)) months.set(key,{date:m._date,items:[]}); months.get(key).items.push(m); });
    const groups = [...months.values()].sort((a,b)=>b.date-a.date);
    const types = [...new Set(all.map(m=>m.type).filter(Boolean))].sort();
    const first = filtered.at(-1), last = filtered[0];
    host.innerHTML = `
      <section class="rt-shell" aria-label="Retrospectiva de memórias">
        <header class="rt-hero"><div class="rt-kicker">UM ÁLBUM DO QUE JÁ VIVEMOS</div><h2>O tempo guardou <em>isso tudo.</em></h2><p>Uma linha do tempo feita com os momentos registrados no Nosso Tempo.</p><div class="rt-stats"><div><strong>${count}</strong><span>memórias no filtro</span></div><div><strong>${groups.length}</strong><span>meses com lembranças</span></div><div><strong>${new Set(filtered.map(m=>m._date.getFullYear())).size}</strong><span>anos presentes</span></div></div></header>
        <div class="rt-toolbar"><label>Ano<select id="rt-year"><option value="all">Todos os anos</option>${years.map(y=>`<option value="${y}" ${year===y?'selected':''}>${y}</option>`).join('')}</select></label><label>Categoria<select id="rt-type"><option value="all">Todas</option>${types.map(t=>`<option value="${esc(t)}" ${type===t?'selected':''}>${esc(LABEL[t]||t)}</option>`).join('')}</select></label><label class="rt-search">Buscar<input id="rt-search" type="search" placeholder="Uma palavra ou lembrança…" value="${esc(query)}"></label><button type="button" class="rt-reset" id="rt-reset">Limpar</button></div>
        ${first && last ? `<div class="rt-range">De <b>${dateLabel(last._date)}</b> até <b>${dateLabel(first._date)}</b></div>` : ''}
        ${groups.length ? `<div class="rt-timeline">${groups.map(group=>`<section class="rt-month"><h3><span>${esc(monthName(group.date))}</span><small>${group.date.getFullYear()} · ${group.items.length} ${group.items.length===1?'lembrança':'lembranças'}</small></h3><div class="rt-cards">${group.items.map(m=>`<article class="rt-card"><div class="rt-icon">${ICON[m.type]||'💭'}</div><div class="rt-copy"><span class="rt-tag">${esc(LABEL[m.type]||'Memória')}</span><p>${esc(m.summary)}</p><time>${dateLabel(m._date)}</time></div></article>`).join('')}</div></section>`).join('')}</div>` : `<div class="rt-empty"><span>🕊️</span><b>Nenhuma lembrança encontrada</b><p>Tente outro ano, categoria ou palavra na busca.</p></div>`}
        <footer class="rt-footer"><span>As lembranças são lidas do Museu e das memórias já registradas.</span><div><button type="button" id="rt-export-json">Exportar JSON</button><button type="button" id="rt-export-csv">Exportar CSV</button></div></footer>
      </section>`;
    host.querySelector('#rt-year').addEventListener('change', e=>{year=e.target.value;render();});
    host.querySelector('#rt-type').addEventListener('change', e=>{type=e.target.value;render();});
    host.querySelector('#rt-search').addEventListener('input', e=>{query=e.target.value.trim().toLocaleLowerCase('pt-BR'); const pos=e.target.selectionStart; render(); const input=host.querySelector('#rt-search'); input.focus(); input.setSelectionRange(pos,pos);});
    host.querySelector('#rt-reset').addEventListener('click',()=>{year='all';type='all';query='';render();});
    host.querySelector('#rt-export-json').addEventListener('click',()=>download('nosso-tempo-retrospectiva.json',JSON.stringify(filtered.map(({id,type,summary,ts})=>({id,type,summary,ts})),null,2),'application/json;charset=utf-8'));
    host.querySelector('#rt-export-csv').addEventListener('click',()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['Data','Categoria','Memória'],...filtered.map(m=>[dateLabel(m._date),LABEL[m.type]||m.type,m.summary])];download('nosso-tempo-retrospectiva.csv','\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n'),'text/csv;charset=utf-8');});
  }
  render();
  try { window._retrospectivaUnsub?.(); if (typeof window._loveCity?.onLoveEvent === 'function') window._retrospectivaUnsub = window._loveCity.onLoveEvent('memory:added',()=>{all=collectMemories();render();}); } catch (_) {}
}
