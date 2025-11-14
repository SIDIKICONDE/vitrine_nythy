import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/geocode
 * -----------------
 * Utilise Nominatim (OpenStreetMap) pour géocoder une adresse
 * et retourner les coordonnées GPS (latitude/longitude).
 */
export async function POST(request: NextRequest) {
  try {
    const { address, postalCode, city, country = 'France' } = await request.json();

    if (!address || !postalCode || !city) {
      return NextResponse.json(
        {
          success: false,
          message: 'Adresse, code postal et ville sont requis pour le géocodage.',
        },
        { status: 400 },
      );
    }

    const queries = [
      `${address}, ${postalCode} ${city}, ${country}`,
      `${postalCode} ${city}, ${country}`,
      `${city}, ${country}`,
    ];

    const fetchGeocode = async (query: string) => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(
        query,
      )}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NythyApp/1.0 (contact@nythy.com)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur Nominatim (${response.status}): ${text}`);
      }

      const data: Array<{ lat: string; lon: string; display_name?: string }> = await response.json();
      return data;
    };

    let finalResult: { lat: string; lon: string; display_name?: string } | null = null;
    let usedQuery = queries[0];

    for (const query of queries) {
      const data = await fetchGeocode(query);
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        finalResult = data[0];
        usedQuery = query;
        break;
      }
    }

    if (!finalResult) {
      return NextResponse.json(
        {
          success: false,
          message: `Aucun résultat pour l'adresse: ${address}, ${postalCode} ${city}, ${country}`,
        },
        { status: 404 },
      );
    }

    const firstResult = finalResult;

    if (!firstResult?.lat || !firstResult?.lon) {
      return NextResponse.json(
        {
          success: false,
          message: 'Réponse géocode invalide: latitude/longitude manquantes.',
        },
        { status: 502 },
      );
    }

    const { lat, lon, display_name: displayName } = firstResult;

    return NextResponse.json({
      success: true,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      displayName: displayName ?? usedQuery,
      query: usedQuery,
    });
  } catch (error) {
    console.error('❌ [Geocode API] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur interne lors du géocodage',
      },
      { status: 500 },
    );
  }
}

