import { deleteArticle, getArticleById, updateArticle } from '@/lib/articles-server';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/articles/[id] - Récupérer un article par ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Erreur API articles GET:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id] - Mettre à jour un article
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await updateArticle({
      id,
      ...body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API articles PUT:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id] - Supprimer un article
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    await deleteArticle(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API articles DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'article' },
      { status: 500 }
    );
  }
}

