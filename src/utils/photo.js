export const PHOTO_MAX_SIDE = 512;
export const PHOTO_MAX_FILE_MB = 15;

const loadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('decode'));
  img.src = url;
});

export async function preparePhoto(file) {
  if (!file) throw new Error('Файл не выбран');
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Нужно изображение: JPG, PNG или WEBP');
  }
  if (file.size > PHOTO_MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Файл больше ${PHOTO_MAX_FILE_MB} МБ — выберите фото поменьше`);
  }

  const url = URL.createObjectURL(file);
  try {
    let img;
    try {
      img = await loadImage(url);
    } catch {
      throw new Error('Браузер не смог открыть это фото. Сохраните его как JPG или PNG и попробуйте снова');
    }

    const ratio = Math.min(PHOTO_MAX_SIDE / img.naturalWidth, PHOTO_MAX_SIDE / img.naturalHeight, 1);
    const width = Math.max(1, Math.round(img.naturalWidth * ratio));
    const height = Math.max(1, Math.round(img.naturalHeight * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
