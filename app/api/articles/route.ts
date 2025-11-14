import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllArticles, createArticle } from '@/lib/articles-server';

/**
 * GET /api/articles - Récupérer tous les articles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;

    const articles = await getAllArticles(status || undefined);
    
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('Erreur API articles GET:', error);
    
    // Si c'est une erreur de credentials Firebase Admin, retourner un message plus clair
    if (error?.message?.includes('credential') || error?.code === 'auth/invalid-credential') {
      console.error('Firebase Admin credentials manquantes. Vérifiez .env.local');
      return NextResponse.json(
        { error: 'Configuration Firebase Admin manquante. Vérifiez les credentials dans .env.local', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des articles', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles - Créer un nouvel article
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const author = session.user?.name || session.user?.email || 'Admin';

    const article = await createArticle({
      ...body,
      author,
    });
    
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Erreur API articles POST:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'article' },
      { status: 500 }
    );
  }
}

