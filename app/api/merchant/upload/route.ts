/**
 * API Route: Upload d'images pour les commerçants
 * Endpoint: POST /api/merchant/upload
 * 🔐 Protégé par App Check avec protection contre le rejeu
 * 
 * Upload les fichiers vers Firebase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { sanitizeId } from '@/lib/security/sanitization';
import { sanitizeStoragePath, validateFileBasics, validateFileSignature } from '@/lib/security/file-validation';

export async function POST(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les uploads
    });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const merchantId = formData.get('merchantId') as string;
    const path = formData.get('path') as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      return NextResponse.json(
        { success: false, message: 'Merchant ID requis' },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { success: false, message: 'Chemin requis' },
        { status: 400 }
      );
    }

    // Logs pour vérifier la compression
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Fichier reçu: "${file.name}" | Type: ${file.type} | Taille: ${fileSizeMB} MB`);
    
    const merchantIdSafe = sanitizeId(merchantId);
    if (!merchantIdSafe) {
      return NextResponse.json(
        { success: false, message: 'Merchant ID invalide' },
        { status: 400 },
      );
    }

    const sanitizedPath = sanitizeStoragePath(path);
    if (!sanitizedPath) {
      return NextResponse.json(
        { success: false, message: 'Chemin de fichier invalide' },
        { status: 400 },
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const basicsValidation = validateFileBasics(file, {
      allowedMimeTypes: allowedTypes,
      maxSizeMB: 5,
    });
    if (!basicsValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: basicsValidation.message,
        },
        { status: 400 },
      );
    }

    // Vérifier si c'est un fichier WebP (compressé)
    if (file.type === 'image/webp') {
      console.log(`✅ Fichier WebP détecté - Compression réussie !`);
    }

    // Vérifier la taille (5MB max après compression)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Fichier trop volumineux après compression (${fileSizeMB} MB). Taille maximale: 5MB` 
        },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Le contenu du fichier ne correspond pas au type déclaré',
        },
        { status: 400 },
      );
    }

    // Upload vers Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(sanitizedPath);

    // Upload avec les métadonnées
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          merchantId: merchantIdSafe,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Rendre le fichier publique
    await fileRef.makePublic();

    // Obtenir l'URL publique
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${sanitizedPath}`;

    console.log(`✅ Fichier uploadé: ${publicUrl} | Taille finale: ${fileSizeMB} MB | Type: ${file.type}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Fichier uploadé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Supprimer un fichier
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function DELETE(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les suppressions
    });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, message: 'Chemin requis' },
        { status: 400 }
      );
    }

    const sanitizedPath = sanitizeStoragePath(path);
    if (!sanitizedPath) {
      return NextResponse.json(
        { success: false, message: 'Chemin invalide' },
        { status: 400 },
      );
    }

    // Supprimer de Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(sanitizedPath);

    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json(
        { success: false, message: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    await fileRef.delete();

    console.log('✅ Fichier supprimé:', sanitizedPath);

    return NextResponse.json({
      success: true,
      message: 'Fichier supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression',
      },
      { status: 500 }
    );
  }
}

