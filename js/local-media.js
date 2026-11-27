const DEFAULT_MAX_BYTES = 12 * 1024 * 1024;

export async function optimizeImageFile(file, { maxDimension = 1280, quality = 0.78 } = {}) {
  if (!(file instanceof Blob) || !file.type?.startsWith('image/') || file.type === 'image/gif') return file;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'));
      img.src = objectUrl;
    });
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Não foi possível preparar esta imagem.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Não foi possível comprimir esta imagem.');
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function fileToDataURL(file, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
  if (!(file instanceof Blob)) throw new TypeError('Arquivo inválido.');
  if (file.size > maxBytes) {
    const limit = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`O arquivo excede o limite local de ${limit} MB.`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
