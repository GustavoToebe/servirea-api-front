import { PHOTO_MAX_BYTES, readPhotoPreview, validatePhotoFile } from './photo.utils';

function arquivo(nome: string, tipo: string, tamanho: number): File {
  const blob = new Blob([new Uint8Array(tamanho)], { type: tipo });
  return new File([blob], nome, { type: tipo });
}

describe('validatePhotoFile', () => {
  it('aceita JPG pequeno', () => {
    expect(validatePhotoFile(arquivo('foto.jpg', 'image/jpeg', 1024))).toBeNull();
  });

  it('rejeita arquivo maior que 5 MB', () => {
    expect(validatePhotoFile(arquivo('foto.jpg', 'image/jpeg', PHOTO_MAX_BYTES + 1)))
      .toBe('A foto deve ter no máximo 5 MB.');
  });

  it('rejeita MIME que não é imagem aceita', () => {
    expect(validatePhotoFile(arquivo('doc.pdf', 'application/pdf', 100)))
      .toBe('Envie uma imagem JPG, PNG, WEBP ou HEIC.');
  });

  it('aceita arquivo sem MIME (o backend ainda valida)', () => {
    expect(validatePhotoFile(arquivo('foto', '', 100))).toBeNull();
  });
});

describe('readPhotoPreview', () => {
  it('lê o arquivo como data URL', async () => {
    const preview = await readPhotoPreview(arquivo('foto.png', 'image/png', 8));
    expect(preview.startsWith('data:image/png')).toBeTrue();
  });
});
