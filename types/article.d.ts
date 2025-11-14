/**
 * Types pour les articles du blog Nythy
 */

export type ArticleCategory = 'blog' | 'press' | 'resources';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: ArticleCategory;
  status: ArticleStatus;
  badge?: string;
  imageUrl?: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  slug: string;
  showInMegaMenu?: boolean; // Afficher dans le méga menu de navigation
}

export interface CreateArticleInput {
  title: string;
  description: string;
  content: string;
  category: ArticleCategory;
  status: ArticleStatus;
  badge?: string;
  imageUrl?: string;
  author: string;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  id: string;
}

