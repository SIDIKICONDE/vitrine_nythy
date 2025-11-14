/**
 * Service de stockage pour les fichiers
 * Interface abstraite pour découpler le domaine de l'infrastructure
 * 
 * ✅ ARCHITECTURE DDD - PORT (Hexagonal Architecture)
 * - L'implémentation concrète (Firebase Storage, S3, etc.) sera dans l'infrastructure
 */

export interface StorageService {
  /**
   * Upload un fichier vers le stockage
   * @param file Fichier à uploader
   * @param path Chemin de destination
   * @returns URL publique du fichier uploadé
   */
  uploadFile(file: File, path: string): Promise<string>;

  /**
   * Supprime un fichier du stockage
   * @param path Chemin du fichier à supprimer
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Récupère l'URL publique d'un fichier
   * @param path Chemin du fichier
   * @returns URL publique
   */
  getPublicUrl(path: string): Promise<string>;

  /**
   * Vérifie si un fichier existe
   * @param path Chemin du fichier
   * @returns True si le fichier existe
   */
  fileExists(path: string): Promise<boolean>;
}

