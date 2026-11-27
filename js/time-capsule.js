import { getFirestore, doc, getDoc, setDoc } from './local-db.js';

const DB = getFirestore();
const REF = doc(DB, 'time_capsule', 'shared');
const $ = (root, selector) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
const validItem = item => item && typeof item === 'object' && ['pietro','emilly','ambos'].includes(item.author) && typeof item.message === 'string' && item.message.length <= 3000 && /^\d{4}-\d{2}-\d{2}$/.test(item.unlockAt) && typeof item.id === 'string';

export function initTimeCapsule() {
  if (document.getElementById('nt-time-capsule')) return;
  const host = document.createElement('section');
  host.id = 'nt-time-capsule';
  host.innerHTML = `
    <button class="nt-capsule-launch" type="button" aria-haspopup="dialog" aria-controls="nt-capsule-dialog"><span aria-hidden="true">⌛</span><span>Cápsula do tempo</span></button>
    <div class="nt-capsule-backdrop" id="nt-capsule-dialog" role="dialog" aria-modal="true" aria-labelledby="nt-capsule-title" hidden>
      <div class="nt-capsule-panel" role="document">
        <button class="nt-capsule-close" type="button" aria-label="Fechar">×</button>
        <div class="nt-capsule-kicker">UM PRESENTE PARA O FUTURO</div>
        <h2 id="nt-capsule-title">Cápsula do tempo 💌</h2>
        <div class="nt-capsule-intro-row">
          <p class="nt-capsule-intro">Guardem cartas, planos e lembranças para abrir no momento escolhido.</p>
          <figure class="nt-capsule-art"><img src="/assets/time-capsule-vignette.webp" alt="Envelope selado e cartas guardadas em um pote para o futuro." width="1200" height="900" loading="lazy" decoding="async"><figcaption>Uma palavra de hoje, para abraçar amanhã.</figcaption></figure>
        </div>
        <div class="nt-capsule-stats" aria-live="polite"><span><strong class="nt-capsule-total">0</strong> cartas</span><span><strong class="nt-capsule-ready">0</strong> liberadas</span><span><strong class="nt-capsule-waiting">0</strong> esperando</span></div>
        <form class="nt-capsule-form">
          <label>Quem está escrevendo?
            <select name="author" required><option value="pietro">Pietro</option><option value="emilly">Emilly</option><option value="ambos">Nós dois</option></select>
          </label>
          <label>Uma lembrança, desejo ou mensagem
            <textarea name="message" rows="4" maxlength="3000" required placeholder="O que você gostaria de contar para o seu eu do futuro?"></textarea>
            <small class="nt-capsule-counter">0 / 3000</small>
          </label>
          <label>Quando poderá ser aberta?
            <input name="unlockAt" type="date" required>
          </label>
          <button class="nt-capsule-save" type="submit">Guardar para o futuro ✨</button>
          <p class="nt-capsule-feedback" role="status" aria-live="polite"></p>
        </form>
        <div class="nt-capsule-list-wrap"><div class="nt-capsule-list-title"><h3>Cartas guardadas</h3><button class="nt-capsule-export" type="button">Fazer backup ↓</button></div><div class="nt-capsule-list"></div></div>
        <p class="nt-capsule-privacy">As cartas ficam neste navegador. Façam backup para não perder as mensagens se os dados do site forem apagados.</p>
      </div>
    </div>`;
  document.body.appendChild(host);
  const dialog = $(host, '#nt-capsule-dialog');
  const panel = $(host, '.nt-capsule-panel');
  const form = $(host, '.nt-capsule-form');
  const dateInput = $(form, '[name="unlockAt"]');
  const messageInput = $(form, '[name="message"]');
  const feedback = $(host, '.nt-capsule-feedback');
  dateInput.min = localDate(new Date());

  // Falhas de leitura não são convertidas em lista vazia: isso evita sobrescrever dados existentes.
  const read = async () => {
    const snap = await getDoc(REF);
    const items = snap.exists() ? snap.data().items : [];
    if (!Array.isArray(items)) throw new Error('Formato de armazenamento inválido.');
    return items.filter(validItem);
  };
  const write = async items => setDoc(REF, { items, updatedAt: new Date().toISOString(), schemaVersion: 2 });
  const authorName = author => author === 'ambos' ? 'Pietro & Emilly' : author === 'pietro' ? 'Pietro' : 'Emilly';
  const render = async () => {
    const items = await read();
    const today = localDate(new Date());
    const ready = items.filter(item => item.unlockAt <= today).length;
    $(host, '.nt-capsule-total').textContent = items.length;
    $(host, '.nt-capsule-ready').textContent = ready;
    $(host, '.nt-capsule-waiting').textContent = items.length - ready;
    const list = $(host, '.nt-capsule-list');
    if (!items.length) { list.innerHTML = '<p class="nt-capsule-empty">Ainda não há cartas. A primeira pode ser de vocês. 💗</p>'; return; }
    list.innerHTML = [...items].sort((a,b) => a.unlockAt.localeCompare(b.unlockAt)).map(item => {
      const unlocked = item.unlockAt <= today;
      return `<article class="nt-capsule-letter ${unlocked ? 'is-open' : 'is-locked'}" data-id="${esc(item.id)}"><div class="nt-capsule-letter-head"><strong>${unlocked ? '💌 Carta liberada' : '🔒 Carta fechada'}</strong><time>${esc(formatDate(item.unlockAt))}</time></div><small>De: ${authorName(item.author)}</small>${unlocked ? `<p>${esc(item.message).replace(/\n/g,'<br>')}</p>` : '<p>Esta mensagem está esperando o momento escolhido.</p>'}<button class="nt-capsule-delete" type="button" data-delete="${esc(item.id)}" aria-label="Excluir carta">Excluir carta</button></article>`;
    }).join('');
  };
  const open = async () => {
    dialog.hidden = false; document.body.classList.add('nt-capsule-open');
    try { await render(); } catch (error) { console.error('[Cápsula] leitura:', error); feedback.textContent = 'Não foi possível carregar as cartas. Nenhum dado foi alterado.'; }
    $(host, '.nt-capsule-close').focus();
  };
  const close = () => { dialog.hidden = true; document.body.classList.remove('nt-capsule-open'); $(host, '.nt-capsule-launch').focus(); };
  $(host, '.nt-capsule-launch').addEventListener('click', open);
  $(host, '.nt-capsule-close').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  document.addEventListener('keydown', event => {
    if (dialog.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  messageInput.addEventListener('input', () => { $(form, '.nt-capsule-counter').textContent = `${messageInput.value.length} / 3000`; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const message = String(data.get('message') || '').trim();
    const unlockAt = String(data.get('unlockAt') || '');
    if (!message) { feedback.textContent = 'Escreva uma mensagem antes de guardar.'; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(unlockAt) || unlockAt < localDate(new Date())) { feedback.textContent = 'Escolha hoje ou uma data futura.'; return; }
    const save = $(form, '.nt-capsule-save'); save.disabled = true; feedback.textContent = 'Guardando sua carta…';
    try {
      const items = await read();
      items.push({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, author: String(data.get('author')), message, unlockAt, createdAt: new Date().toISOString() });
      await write(items); form.reset(); dateInput.min = localDate(new Date()); $(form, '.nt-capsule-counter').textContent = '0 / 3000';
      feedback.textContent = 'Carta guardada. Ela estará aqui quando chegar a data. 💗'; await render();
    } catch (error) { console.error('[Cápsula] gravação:', error); feedback.textContent = 'Não foi possível guardar. Seus dados anteriores foram preservados.'; }
    finally { save.disabled = false; }
  });
  $(host, '.nt-capsule-list').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete]'); if (!button) return;
    if (!confirm('Excluir esta carta permanentemente?')) return;
    button.disabled = true;
    try { const items = await read(); await write(items.filter(item => item.id !== button.dataset.delete)); feedback.textContent = 'Carta excluída.'; await render(); }
    catch (error) { console.error('[Cápsula] exclusão:', error); feedback.textContent = 'Não foi possível excluir a carta.'; button.disabled = false; }
  });
  $(host, '.nt-capsule-export').addEventListener('click', async () => {
    const button = $(host, '.nt-capsule-export'); button.disabled = true;
    try {
      const backup = { app: 'Nosso-tempo', type: 'time-capsule-backup', version: 2, exportedAt: new Date().toISOString(), items: await read() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `nosso-tempo-capsula-${localDate(new Date())}.json`; link.click(); URL.revokeObjectURL(url);
      feedback.textContent = 'Backup baixado. Guardem o arquivo em um lugar seguro.';
    } catch (error) { console.error('[Cápsula] backup:', error); feedback.textContent = 'Não foi possível criar o backup.'; }
    finally { button.disabled = false; }
  });
}
