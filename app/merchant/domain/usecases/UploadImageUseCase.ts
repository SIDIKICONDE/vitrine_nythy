/**
 * Use Case: UploadImageUseCase
 * Upload d'images pour les commerçants (logo, bannière, galerie)
 * 
 * ✅ ARCHITECTURE DDD
 * - Validation des fichiers
 * - Compression automatique des images
 * - Règles métier (taille, format)
 * - Service de stockage (Firebase Storage, S3, etc.)
 */

import { StorageService } from '../services/StorageService';
import { compressImage } from '../utils/imageCompression';

export type ImageType = 'logo' | 'banner' | 'gallery';

export interface UploadImageRequest {
  merchantId: string;
  file: File;
  imageType: ImageType;
}

export interface UploadImageResponse {
  url: string;
  fileName: string;
  size: number;
}

export class UploadImageUseCase {
  // Règles métier pour les images
  private static readonly MAX_SIZE_MB = 5;
  private static readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  private static readonly MAX_SIZE_BYTES = UploadImageUseCase.MAX_SIZE_MB * 1024 * 1024;

  constructor(
    private readonly storageService: StorageService
  ) { }

  /**
   * Exécute l'upload d'une image
   * @param request Requête d'upload
   * @throws Error Si la validation échoue
   */
  async execute(request: UploadImageRequest): Promise<UploadImageResponse> {
    // === 1. VALIDATION DES INPUTS ===
    this.validateRequest(request);

    // === 2. VALIDATION DU FORMAT (avant compression) ===
    this.validateFormat(request.file);

    // === 3. COMPRESSION AUTOMATIQUE EN WEBP ===
    // Compresser l'image en WebP avant la validation de taille
    let fileToUpload = request.file;
    try {
      console.log(`📦 Compression de l'image "${request.file.name}" (${(request.file.size / (1024 * 1024)).toFixed(2)} MB) en WebP...`);
      fileToUpload = await compressImage(request.file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        maxSizeMB: 5, // Taille cible après compression
      });
      const originalSizeMB = (request.file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
      const reduction = ((1 - fileToUpload.size / request.file.size) * 100).toFixed(1);
      console.log(`✅ Image compressée: ${originalSizeMB} MB → ${compressedSizeMB} MB (réduction de ${reduction}%)`);
    } catch (error) {
      console.warn('⚠️ Erreur lors de la compression, utilisation du fichier original:', error);
      // En cas d'erreur de compression, on continue avec le fichier original
      // mais on valide quand même la taille
      this.validateFileSize(request.file);
    }

    // === 4. VALIDATION DE LA TAILLE (après compression) ===
    this.validateFileSize(fileToUpload);

    // === 5. GÉNÉRATION DU CHEMIN DE STOCKAGE ===
    const storagePath = this.generateStoragePath(request.merchantId, request.imageType, fileToUpload);

    // === 6. UPLOAD VIA LE SERVICE DE STOCKAGE ===
    const uploadedUrl = await this.storageService.uploadFile(
      fileToUpload,
      storagePath
    );

    // === 7. RETOUR DE LA RÉPONSE ===
    return {
      url: uploadedUrl,
      fileName: fileToUpload.name,
      size: fileToUpload.size,
    };
  }

  /**
   * Validation de la requête
   */
  private validateRequest(request: UploadImageRequest): void {
    if (!request.merchantId || request.merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    if (!request.file) {
      throw new Error('File is required');
    }

    if (!request.imageType) {
      throw new Error('Image type is required');
    }
  }

  /**
   * Validation du format (avant compression)
   */
  private validateFormat(file: File): void {
    // Règle 1: Format autorisé
    if (!UploadImageUseCase.ALLOWED_FORMATS.includes(file.type)) {
      throw new Error(
        `Format non autorisé. Formats acceptés: ${UploadImageUseCase.ALLOWED_FORMATS.join(', ')}`
      );
    }

    // Règle 2: Nom de fichier valide
    if (!file.name || file.name.trim() === '') {
      throw new Error('Nom de fichier invalide');
    }
  }

  /**
   * Validation de la taille (après compression)
   * La limite est plus élevée car l'image sera compressée en WebP
   */
  private validateFileSize(file: File): void {
    // Limite après compression : 5MB
    // Si le fichier est encore trop grand après compression, c'est une erreur
    if (file.size > UploadImageUseCase.MAX_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Le fichier "${file.name}" est encore trop volumineux après compression (${fileSizeMB} MB). Veuillez choisir une image de meilleure qualité ou de dimensions plus petites.`
      );
    }
  }

  /**
   * Génération du chemin de stockage
   * Pattern: merchants/{merchantId}/{imageType}/{timestamp}_{filename}.webp
   */
  private generateStoragePath(
    merchantId: string,
    imageType: ImageType,
    file: File
  ): string {
    const timestamp = Date.now();
    // Le fichier est déjà en .webp après compression
    const extension = file.name.endsWith('.webp') ? '.webp' : '.webp';
    const sanitizedName = this.sanitizeFileName(file.name.replace(/\.webp$/, ''));

    return `merchants/${merchantId}/${imageType}/${timestamp}_${sanitizedName}${extension}`;
  }

  /**
   * Nettoyage du nom de fichier
   */
  private sanitizeFileName(fileName: string): string {
    // Retirer l'extension
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));

    // Garder seulement les caractères alphanumériques, tirets et underscores
    return nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 50); // Limiter à 50 caractères
  }
}

