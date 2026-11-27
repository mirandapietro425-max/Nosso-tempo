import {
  exportAllDocuments,
  getLocalDatabaseStatus,
  importDocuments,
  migrateLegacyLocalStorage,
} from './local-db.js';

const BACKUP_FORMAT = 'nosso-tempo-backup';
const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const ALLOWED_LOCAL_KEYS = /^(pe_|lc_|cinema_|home_|lib_|mood_|emotional_|event_)/i;

function readLocalState() {
  const state = {};
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key && ALLOWED_LOCAL_KEYS.test(key)) state[key] = localStorage.getItem(key);
  }
  return state;
}

function showStatus(text, isError = false) {
  const element = document.getElementById('data-storage-status');
  if (!element) return;
  element.textContent = text;
  element.classList.toggle('is-error', isError);
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportBackup() {
  try {
    const backup = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: await exportAllDocuments(),
      localStorage: readLocalState(),
    };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    if (blob.size > MAX_BACKUP_BYTES) throw new Error('O backup passou de 64 MB. Remova vídeos grandes e tente novamente.');
    const date = new Date().toISOString().slice(0, 10);
    saveBlob(blob, `nosso-tempo-backup-${date}.json`);
    showStatus('Backup baixado. Guarde o arquivo em um lugar seguro; ele contém os dados locais do app.');
  } catch (error) {
    showStatus(error?.message || 'Não foi possível criar o backup.', true);
  }
}

async function importBackup(file) {
  if (!file) return;
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new Error('O arquivo excede o limite de backup de 64 MB.');
    const backup = JSON.parse(await file.text());
    if (backup?.format !== BACKUP_FORMAT || backup?.version !== 1 || !Array.isArray(backup.documents)) {
      throw new Error('Este não parece ser um backup válido do Nosso Tempo.');
    }
    const count = backup.documents.length;
    if (!window.confirm(`Mesclar ${count} documento(s) do backup com os dados deste navegador? Documentos com o mesmo nome serão substituídos; os demais serão mantidos.`)) return;

    await importDocuments(backup.documents);
    const values = backup.localStorage && typeof backup.localStorage === 'object' ? backup.localStorage : {};
    let restoredKeys = 0;
    for (const [key, value] of Object.entries(values)) {
      if (!ALLOWED_LOCAL_KEYS.test(key) || typeof value !== 'string') continue;
      try { localStorage.setItem(key, value); restoredKeys++; } catch (_) {}
    }
    showStatus(`Backup restaurado: ${count} documento(s) e ${restoredKeys} preferência(s). Recarregando…`);
    setTimeout(() => location.reload(), 700);
  } catch (error) {
    showStatus(error?.message || 'Não foi possível restaurar o backup.', true);
  }
}

export async function initDataManager() {
  const exportButton = document.getElementById('data-export-button');
  const importButton = document.getElementById('data-import-button');
  const fileInput = document.getElementById('data-import-file');
  exportButton?.addEventListener('click', exportBackup);
  importButton?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    importBackup(file);
  });

  try {
    const count = await migrateLegacyLocalStorage();
    const status = await getLocalDatabaseStatus();
    showStatus(`${status.message}${count ? ` ${count} item(ns) antigo(s) foram preservados no banco local.` : ''}`);
  } catch (error) {
    showStatus('Não foi possível inicializar o armazenamento local. Faça um backup dos dados existentes antes de continuar.', true);
    console.error('[Dados locais]', error);
  }
}
