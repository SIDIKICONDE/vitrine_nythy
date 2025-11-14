import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Article, ArticleStatus } from '@/types/article';

/**
 * Service serveur pour gérer les articles avec Firebase Admin SDK
 * (Bypass les règles Firestore - accès admin uniquement)
 */

const ARTICLES_COLLECTION = 'articles';

// Convertir Firestore Timestamp en Date
function convertFirestoreTimestamp(data: any): any {
  const converted = { ...data };
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  if (converted.publishedAt?.toDate) {
    converted.publishedAt = converted.publishedAt.toDate();
  }
  return converted;
}

// Générer un slug à partir du titre
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Récupérer tous les articles
 */
export async function getAllArticles(status?: ArticleStatus): Promise<Article[]> {
  try {
    const articlesRef = adminDb.collection(ARTICLES_COLLECTION);
    let query = articlesRef.orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertFirestoreTimestamp(doc.data()),
    })) as Article[];
  } catch (error: any) {
    console.error('Erreur lors de la récupération des articles:', error);
    
    // Si c'est une erreur de credentials, donner un message plus clair
    if (error?.message?.includes('credential') || error?.code === 'auth/invalid-credential') {
      console.error('⚠️ Firebase Admin credentials manquantes. Vérifiez .env.local');
      throw new Error('Configuration Firebase Admin manquante. Vérifiez les credentials dans .env.local');
    }
    
    // Pour les autres erreurs, retourner un tableau vide plutôt que de crasher
    console.warn('Erreur lors de la récupération des articles, retour d\'un tableau vide');
    return [];
  }
}

/**
 * Récupérer un article par ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const docRef = adminDb.collection(ARTICLES_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertFirestoreTimestamp(docSnap.data()),
    } as Article;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    throw error;
  }
}

/**
 * Créer un nouvel article
 */
export async function createArticle(data: {
  title: string;
  description: string;
  content: string;
  category: string;
  status: ArticleStatus;
  badge?: string;
  imageUrl?: string;
  author: string;
}): Promise<Article> {
  try {
    const now = new Date();
    const slug = generateSlug(data.title);
    
    const articleData = {
      ...data,
      slug,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      publishedAt: data.status === 'published' ? Timestamp.fromDate(now) : null,
    };
    
    const docRef = await adminDb.collection(ARTICLES_COLLECTION).add(articleData);
    const newDoc = await docRef.get();
    
    return {
      id: newDoc.id,
      ...convertFirestoreTimestamp(newDoc.data()),
    } as Article;
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    throw error;
  }
}

/**
 * Mettre à jour un article
 */
export async function updateArticle(data: {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  status?: ArticleStatus;
  badge?: string;
  imageUrl?: string;
}): Promise<void> {
  try {
    const { id, ...updateData } = data;
    const docRef = adminDb.collection(ARTICLES_COLLECTION).doc(id);
    
    const update: any = {
      ...updateData,
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    // Générer un nouveau slug si le titre a changé
    if (updateData.title) {
      update.slug = generateSlug(updateData.title);
    }
    
    // Mettre à jour publishedAt si le statut passe à published
    if (updateData.status === 'published') {
      const currentDoc = await docRef.get();
      if (currentDoc.exists && currentDoc.data()?.status !== 'published') {
        update.publishedAt = Timestamp.fromDate(new Date());
      }
    }
    
    await docRef.update(update);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    throw error;
  }
}

/**
 * Supprimer un article
 */
export async function deleteArticle(id: string): Promise<void> {
  try {
    const docRef = adminDb.collection(ARTICLES_COLLECTION).doc(id);
    await docRef.delete();
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    throw error;
  }
}

