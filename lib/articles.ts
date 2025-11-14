import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Article, CreateArticleInput, UpdateArticleInput, ArticleStatus } from '@/types/article';

/**
 * Service pour gérer les articles avec Firebase
 */

const ARTICLES_COLLECTION = 'articles';

// Convertir Timestamp Firebase en Date
function convertTimestamps(data: any): any {
  const converted = { ...data };
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt instanceof Timestamp) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  if (converted.publishedAt instanceof Timestamp) {
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
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    if (status) {
      constraints.unshift(where('status', '==', status));
    }
    
    const q = query(articlesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Article[];
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    throw error;
  }
}

/**
 * Récupérer un article par ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()),
    } as Article;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    throw error;
  }
}

/**
 * Récupérer un article par slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(articlesRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Article;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article par slug:', error);
    throw error;
  }
}

/**
 * Créer un nouvel article
 */
export async function createArticle(input: CreateArticleInput): Promise<string> {
  try {
    const now = new Date();
    const slug = generateSlug(input.title);
    
    const articleData = {
      ...input,
      slug,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      publishedAt: input.status === 'published' ? Timestamp.fromDate(now) : null,
    };
    
    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), articleData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    throw error;
  }
}

/**
 * Mettre à jour un article
 */
export async function updateArticle(input: UpdateArticleInput): Promise<void> {
  try {
    const { id, ...data } = input;
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    // Générer un nouveau slug si le titre a changé
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    
    // Mettre à jour publishedAt si le statut passe à published
    if (data.status === 'published') {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists() && currentDoc.data().status !== 'published') {
        updateData.publishedAt = Timestamp.fromDate(new Date());
      }
    }
    
    await updateDoc(docRef, updateData);
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
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    throw error;
  }
}

/**
 * Récupérer les articles par catégorie
 */
export async function getArticlesByCategory(category: string, status: ArticleStatus = 'published'): Promise<Article[]> {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(
      articlesRef,
      where('category', '==', category),
      where('status', '==', status),
      orderBy('publishedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Article[];
  } catch (error) {
    console.error('Erreur lors de la récupération des articles par catégorie:', error);
    throw error;
  }
}

