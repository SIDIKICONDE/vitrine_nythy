import { sanitizeText } from './sanitization';

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSizeMB?: number;
}

const DEFAULT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const DEFAULT_MAX_MB = 5;

const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/svg+xml': ['svg'],
};

export function validateFileBasics(file: File, options: FileValidationOptions = {}) {
  const allowedMime = options.allowedMimeTypes || DEFAULT_ALLOWED_MIME;
  const maxSize = (options.maxSizeMB || DEFAULT_MAX_MB) * 1024 * 1024;

  if (!allowedMime.includes(file.type)) {
    return {
      valid: false,
      message: `Type de fichier non autorisé (${file.type}). Types acceptés: ${allowedMime.join(', ')}`,
    };
  }

  if (file.size === 0) {
    return { valid: false, message: 'Fichier vide' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(2)} MB). Taille max: ${options.maxSizeMB || DEFAULT_MAX_MB} MB`,
    };
  }

  const extension = getFileExtension(file.name);
  if (!extension) {
    return { valid: false, message: 'Extension de fichier manquante' };
  }

  const expectedExtensions = MIME_EXTENSION_MAP[file.type] || [];
  if (expectedExtensions.length > 0 && !expectedExtensions.includes(extension)) {
    return {
      valid: false,
      message: `Extension "${extension}" ne correspond pas au type ${file.type}`,
    };
  }

  if (hasDoubleExtension(file.name)) {
    return { valid: false, message: 'Extension multiple détectée' };
  }

  return { valid: true };
}

export function getFileExtension(filename: string): string | null {
  const cleanName = filename.trim().toLowerCase();
  const parts = cleanName.split('.');
  if (parts.length < 2) {
    return null;
  }
  return parts.pop() || null;
}

function hasDoubleExtension(filename: string): boolean {
  const cleanName = filename.trim().toLowerCase();
  const parts = cleanName.split('.');
  if (parts.length <= 2) {
    return false;
  }
  const lastExtension = parts.pop();
  const secondExtension = parts.pop();
  if (!lastExtension || !secondExtension) {
    return false;
  }
  return lastExtension.length <= 4 && secondExtension.length <= 4;
}

export function sanitizeStoragePath(path: string): string | null {
  if (!path) {
    return null;
  }
  let clean = sanitizeText(path);
  clean = clean.replace(/\\/g, '/').replace(/^\//, '');
  if (clean.includes('..')) {
    return null;
  }
  return clean;
}

export function validateFileSignature(buffer: Buffer, mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case 'image/webp':
      return (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      );
    case 'image/svg+xml': {
      const text = buffer.toString('utf8', 0, 1024).trimStart().toLowerCase();
      return text.startsWith('<svg');
    }
    default:
      return false;
  }
}

