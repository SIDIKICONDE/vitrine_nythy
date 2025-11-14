import { NextResponse } from 'next/server';

/**
 * Vider le cache
 * POST /api/admin/cache/clear
 */
export async function POST() {
  try {
    // TODO: Implémenter le vidage réel du cache
    console.log('🗑️ [ADMIN] Cache vidé');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur vidage cache:', error);
    return NextResponse.json(
      { error: 'Erreur lors du vidage du cache' },
      { status: 500 }
    );
  }
}

