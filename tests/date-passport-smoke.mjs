import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const html = read('index.html');
const app = read('js/app.js');
const moduleSource = read('js/date-passport.js');
const serviceWorker = read('sw.js');
const manifest = JSON.parse(read('manifest.json'));

assert.match(html, /id="sec-encontros"/, 'a seção do passaporte precisa existir');
assert.match(html, /href="#sec-encontros"/, 'a navegação precisa levar ao passaporte');
assert.match(html, /id="passport-note-form"/, 'o formulário de lembrança precisa existir');
assert.match(app, /import \{ initDatePassport \} from '\.\/date-passport\.js'/, 'o módulo precisa ser importado');
assert.match(app, /initDatePassport\(db\)/, 'o passaporte precisa ser inicializado com o banco local');
assert.match(moduleSource, /setDoc\(reference, \{ entries \}\)/, 'os encontros precisam ser salvos localmente');
assert.match(moduleSource, /data-passport-action/, 'as ações do passaporte precisam ser delegadas');
assert.ok(serviceWorker.includes("'/js/date-passport.js'"), 'o módulo precisa entrar no cache offline');
assert.ok(serviceWorker.includes("'/css/date-passport.css'"), 'os estilos precisam entrar no cache offline');
assert.ok(manifest.shortcuts.some(item => item.url === '/#sec-encontros'), 'o PWA precisa ter atalho para o passaporte');

console.log('OK — Passaporte dos Encontros ligado à navegação, ao armazenamento local e ao cache offline.');
