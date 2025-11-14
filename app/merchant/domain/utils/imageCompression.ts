/**
 * Utilitaires de compression d'images côté client
 * Utilise l'API Canvas du navigateur pour compresser les images
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 à 1.0
  maxSizeMB?: number; // Taille maximale cible en MB
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeMB: 5,
};

/**
 * Compresse une image en utilisant Canvas
 * @param file Fichier image à compresser
 * @param options Options de compression
 * @returns Promise<File> Fichier compressé
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let { width, height } = img;

        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height
          );
          width = width * ratio;
          height = height * ratio;
        }

        // Créer un canvas avec les nouvelles dimensions
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erreur lors de la compression'));
              return;
            }

            // Vérifier si la taille est acceptable
            const sizeMB = blob.size / (1024 * 1024);

            // Si la taille est encore trop grande, réduire la qualité progressivement
            if (sizeMB > opts.maxSizeMB && opts.quality > 0.1) {
              // Réessayer avec une qualité réduite
              const newQuality = Math.max(0.1, opts.quality - 0.2);
              compressImage(file, { ...opts, quality: newQuality })
                .then(resolve)
                .catch(reject);
              return;
            }

            // Créer un nouveau File avec le blob compressé en WebP
            // Changer l'extension du nom de fichier en .webp
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File(
              [blob],
              fileName,
              {
                type: 'image/webp', // Compression en WebP (meilleure compression que JPEG)
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          'image/webp', // Format de sortie WebP
          opts.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Vérifie si une image doit être compressée
 * @param file Fichier à vérifier
 * @param maxSizeMB Taille maximale en MB
 * @returns true si la compression est nécessaire
 */
export function shouldCompressImage(file: File, maxSizeMB: number = 5): boolean {
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB > maxSizeMB;
}

