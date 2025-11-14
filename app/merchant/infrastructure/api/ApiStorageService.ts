/**
 * Service de stockage pour l'upload d'images via API
 */

import { StorageService } from '@/app/merchant/domain/services/StorageService';
import { createAuthHeaders } from '@/lib/csrf-client';

export class ApiStorageService implements StorageService {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload un fichier
   * @param file Fichier à uploader
   * @param path Chemin complet (ex: merchants/{merchantId}/logo/...)
   * @returns URL publique du fichier uploadé
   */
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      // Extraire le merchantId du path (format: merchants/{merchantId}/...)
      const merchantId = this.extractMerchantIdFromPath(path);

      // Utiliser la méthode uploadImage existante
      return await this.uploadImage(merchantId, file, path);
    } catch (error) {
      console.error('Erreur uploadFile:', error);
      throw error;
    }
  }

  /**
   * Supprime un fichier
   * @param path Chemin du fichier à supprimer
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await this.deleteImage(path);
    } catch (error) {
      console.error('Erreur deleteFile:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL publique d'un fichier
   * @param path Chemin du fichier
   * @returns URL publique
   */
  async getPublicUrl(path: string): Promise<string> {
    // Pour l'instant, on retourne le path tel quel
    // Dans une vraie implémentation, cela dépendrait du service de stockage
    return path;
  }

  /**
   * Vérifie si un fichier existe
   * @param path Chemin du fichier
   * @returns true si le fichier existe
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`${this.baseUrl}/merchant/upload/exists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Erreur fileExists:', error);
      return false;
    }
  }

  /**
   * Extrait le merchantId du path
   * @param path Chemin complet (ex: merchants/{merchantId}/logo/...)
   * @returns merchantId
   */
  private extractMerchantIdFromPath(path: string): string {
    const parts = path.split('/');

    // Format attendu: merchants/{merchantId}/...
    if (parts[0] === 'merchants' && parts.length >= 2 && parts[1]) {
      return parts[1];
    }

    throw new Error(`Invalid path format. Expected "merchants/{merchantId}/..." but got "${path}"`);
  }

  /**
   * Upload une image
   */
  async uploadImage(
    merchantId: string,
    file: File,
    path: string
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('merchantId', merchantId);
      formData.append('path', path);

      const headers = await createAuthHeaders();

      const response = await fetch(`${this.baseUrl}/merchant/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'upload de l\'image');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de l\'upload de l\'image');
      }

      return data.url;
    } catch (error) {
      console.error('Erreur uploadImage:', error);
      throw error;
    }
  }

  /**
   * Supprime une image
   */
  async deleteImage(path: string): Promise<void> {
    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`${this.baseUrl}/merchant/upload`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la suppression de l\'image');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la suppression de l\'image');
      }
    } catch (error) {
      console.error('Erreur deleteImage:', error);
      throw error;
    }
  }
}

// Instance singleton
const apiStorageService = new ApiStorageService();
export default apiStorageService;

