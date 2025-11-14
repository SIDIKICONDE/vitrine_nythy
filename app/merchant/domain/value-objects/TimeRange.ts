/**
 * Value Object: TimeRange
 * Plage horaire (format HH:mm)
 */

export interface TimeRangeData {
  readonly start: string; // Format HH:mm
  readonly end: string; // Format HH:mm
}

export class TimeRange {
  private constructor(
    public readonly start: string,
    public readonly end: string
  ) {
    this.validate();
  }

  /**
   * Factory method
   */
  static create(start: string, end: string): TimeRange {
    return new TimeRange(start, end);
  }

  /**
   * Créer depuis un objet TimeRangeData
   */
  static from(data: TimeRangeData): TimeRange {
    return new TimeRange(data.start, data.end);
  }

  /**
   * Validation du format HH:mm
   */
  private validate(): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.start)) {
      throw new Error(`Format de début invalide: ${this.start}. Attendu: HH:mm`);
    }
    if (!timeRegex.test(this.end)) {
      throw new Error(`Format de fin invalide: ${this.end}. Attendu: HH:mm`);
    }

    const startMinutes = this.timeToMinutes(this.start);
    const endMinutes = this.timeToMinutes(this.end);

    if (startMinutes >= endMinutes) {
      throw new Error('L\'heure de début doit être avant l\'heure de fin');
    }
  }

  /**
   * Convertir HH:mm en minutes depuis minuit
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Durée en minutes
   */
  get durationMinutes(): number {
    const startMinutes = this.timeToMinutes(this.start);
    const endMinutes = this.timeToMinutes(this.end);
    return endMinutes - startMinutes;
  }

  /**
   * Durée en heures
   */
  get durationHours(): number {
    return this.durationMinutes / 60;
  }

  /**
   * Vérifie si une heure est dans la plage
   */
  containsTime(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return false;
    }

    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(this.start);
    const endMinutes = this.timeToMinutes(this.end);

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  /**
   * Vérifie si la plage chevauche une autre plage
   */
  overlaps(other: TimeRange): boolean {
    const thisStart = this.timeToMinutes(this.start);
    const thisEnd = this.timeToMinutes(this.end);
    const otherStart = this.timeToMinutes(other.start);
    const otherEnd = this.timeToMinutes(other.end);

    return thisStart < otherEnd && thisEnd > otherStart;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): TimeRangeData {
    return {
      start: this.start,
      end: this.end,
    };
  }
}

