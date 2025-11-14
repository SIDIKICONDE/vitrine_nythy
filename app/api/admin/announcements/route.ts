import { adminDb } from '@/lib/firebase-admin';
import { Announcement } from '@/types/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour la gestion des annonces
 * GET /api/admin/announcements - Liste toutes les annonces
 * POST /api/admin/announcements - Créer une nouvelle annonce
 */
export async function GET() {
  try {
    const announcementsSnapshot = await adminDb
      .collection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const announcements: Announcement[] = announcementsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data['title'] || '',
        message: data['message'] || '',
        type: data['type'] || 'info',
        priority: data['priority'] || 'medium',
        targetAudience: data['targetAudience'] || 'all',
        imageUrl: data['imageUrl'],
        actionLabel: data['actionLabel'],
        actionUrl: data['actionUrl'],
        isActive: data['isActive'] ?? true,
        startDate: data['startDate']?.toDate?.()?.toISOString() || new Date().toISOString(),
        endDate: data['endDate']?.toDate?.()?.toISOString(),
        createdAt: data['createdAt']?.toDate?.()?.toISOString() || new Date().toISOString(),
        createdBy: data['createdBy'] || '',
        readBy: data['readBy'] || [],
      };
    });

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement annonces:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des annonces' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newAnnouncement = {
      title: body.title,
      message: body.message,
      type: body.type || 'info',
      priority: body.priority || 'medium',
      targetAudience: body.targetAudience || 'all',
      imageUrl: body.imageUrl,
      actionLabel: body.actionLabel,
      actionUrl: body.actionUrl,
      isActive: body.isActive ?? true,
      startDate: new Date(body.startDate || Date.now()),
      endDate: body.endDate ? new Date(body.endDate) : null,
      createdAt: new Date(),
      createdBy: body.createdBy || 'admin',
      readBy: [],
    };

    const docRef = await adminDb.collection('announcements').add(newAnnouncement);

    console.log(`✅ [ADMIN] Annonce ${docRef.id} créée`);

    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur création annonce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'annonce' },
      { status: 500 }
    );
  }
}

