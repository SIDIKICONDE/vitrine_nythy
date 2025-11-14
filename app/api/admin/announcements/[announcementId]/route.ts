import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Modifier ou supprimer une annonce
 * PATCH /api/admin/announcements/[announcementId] - Modifier
 * DELETE /api/admin/announcements/[announcementId] - Supprimer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { announcementId: string } }
) {
  try {
    const { announcementId } = params;
    const body = await request.json();

    await adminDb.collection('announcements').doc(announcementId).update({
      ...body,
      updatedAt: new Date(),
    });

    console.log(`✅ [ADMIN] Annonce ${announcementId} modifiée`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur modification annonce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { announcementId: string } }
) {
  try {
    const { announcementId } = params;

    await adminDb.collection('announcements').doc(announcementId).delete();

    console.log(`✅ [ADMIN] Annonce ${announcementId} supprimée`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur suppression annonce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

