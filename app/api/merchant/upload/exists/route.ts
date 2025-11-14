/**
 * API Route: Vérifier l'existence d'un fichier
 * Endpoint: POST /api/merchant/upload/exists
 * 
 * Vérifie si un fichier existe dans Firebase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, exists: false, message: 'Chemin requis' },
        { status: 400 }
      );
    }

    // Vérifier si le fichier existe dans Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);

    const [exists] = await fileRef.exists();

    return NextResponse.json({
      success: true,
      exists: exists,
    });
  } catch (error) {
    console.error('❌ Erreur vérification existence:', error);
    return NextResponse.json(
      {
        success: false,
        exists: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la vérification',
      },
      { status: 500 }
    );
  }
}

