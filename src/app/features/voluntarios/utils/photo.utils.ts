export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

export function validatePhotoFile(file: File): string | null {
  if (file.size > PHOTO_MAX_BYTES) return 'A foto deve ter no máximo 5 MB.';
  const mime = (file.type || '').toLowerCase();
  if (mime && !PHOTO_MIME_TYPES.includes(mime)) {
    return 'Envie uma imagem JPG, PNG, WEBP ou HEIC.';
  }
  return null;
}

export function readPhotoPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    reader.readAsDataURL(file);
  });
}
