import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles-server';

/**
 * GET /api/articles/public - Récupérer les articles publiés (endpoint public)
 * Utilisé par le méga menu et autres composants publics
 */
export async function GET() {
  try {
    // Récupérer uniquement les articles publiés
    const articles = await getAllArticles('published');
    
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('Erreur API articles publics GET:', error);
    
    // Retourner un tableau vide en cas d'erreur pour ne pas casser le site public
    return NextResponse.json([]);
  }
}

