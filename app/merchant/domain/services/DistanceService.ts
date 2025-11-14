/**
 * Service: DistanceService
 * Service de calculs géographiques
 */

import { GeoLocation, GeoLocationValue } from '../value-objects/GeoLocation';

/**
 * Bounding box pour recherche géographique
 */
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class DistanceService {
  /**
   * Rayon de la Terre en kilomètres
   */
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calcul de distance (formule de Haversine)
   */
  distanceKm(point1: GeoLocation | GeoLocationValue, point2: GeoLocation | GeoLocationValue): number {
    const loc1 = point1 instanceof GeoLocationValue ? point1 : GeoLocationValue.from(point1);
    const loc2 = point2 instanceof GeoLocationValue ? point2 : GeoLocationValue.from(point2);

    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) *
        Math.cos(this.toRadians(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return DistanceService.EARTH_RADIUS_KM * c;
  }

  /**
   * Direction cardinale
   */
  getCardinalDirection(from: GeoLocation | GeoLocationValue, to: GeoLocation | GeoLocationValue): string {
    const bearing = this.calculateBearing(from, to);
    const directions = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index] || 'Nord';
  }

  /**
   * Bearing (angle) en degrés
   */
  calculateBearing(from: GeoLocation | GeoLocationValue, to: GeoLocation | GeoLocationValue): number {
    const loc1 = from instanceof GeoLocationValue ? from : GeoLocationValue.from(from);
    const loc2 = to instanceof GeoLocationValue ? to : GeoLocationValue.from(to);

    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    const lat1 = this.toRadians(loc1.latitude);
    const lat2 = this.toRadians(loc2.latitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = Math.atan2(y, x);
    return (this.toDegrees(bearing) + 360) % 360;
  }

  /**
   * Tri par proximité
   */
  sortByProximity<T>(
    items: T[],
    center: GeoLocation | GeoLocationValue,
    getLatitude: (item: T) => number,
    getLongitude: (item: T) => number
  ): T[] {
    const centerLoc = center instanceof GeoLocationValue ? center : GeoLocationValue.from(center);

    return [...items].sort((a, b) => {
      const locA: GeoLocation = {
        latitude: getLatitude(a),
        longitude: getLongitude(a),
      };
      const locB: GeoLocation = {
        latitude: getLatitude(b),
        longitude: getLongitude(b),
      };

      const distA = this.distanceKm(centerLoc, locA);
      const distB = this.distanceKm(centerLoc, locB);

      return distA - distB;
    });
  }

  /**
   * Formatage de distance
   */
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    if (km < 10) {
      return `${km.toFixed(1)}km`;
    }
    return `${Math.round(km)}km`;
  }

  /**
   * Bounding box pour recherche géographique
   */
  getBoundingBox(center: GeoLocation | GeoLocationValue, radiusKm: number): BoundingBox {
    const loc = center instanceof GeoLocationValue ? center : GeoLocationValue.from(center);

    // Conversion en radians
    const latRad = this.toRadians(loc.latitude);
    const lonRad = this.toRadians(loc.longitude);

    // Rayon angulaire
    const angularRadius = radiusKm / DistanceService.EARTH_RADIUS_KM;

    // Latitude
    const north = this.toDegrees(latRad + angularRadius);
    const south = this.toDegrees(latRad - angularRadius);

    // Longitude (correction pour la convergence des méridiens)
    const deltaLon = Math.asin(Math.sin(angularRadius) / Math.cos(latRad));
    const east = this.toDegrees(lonRad + deltaLon);
    const west = this.toDegrees(lonRad - deltaLon);

    return { north, south, east, west };
  }

  /**
   * Convertir degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convertir radians en degrés
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

