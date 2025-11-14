/**
 * Value Object: RatingValue
 * Note avec validation (1-5 étoiles)
 */

export interface RatingValueData {
  readonly value: number;
}

export class RatingValue {
  private constructor(public readonly value: number) {
    this.validate();
  }

  /**
   * Factory method avec validation
   */
  static validated(value: number): RatingValue {
    return new RatingValue(value);
  }

  /**
   * Créer depuis un objet RatingValueData
   */
  static from(data: RatingValueData): RatingValue {
    return new RatingValue(data.value);
  }

  /**
   * Validation
   */
  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new Error('La note doit être un entier');
    }
    if (this.value < 1 || this.value > 5) {
      throw new Error('La note doit être entre 1 et 5');
    }
  }

  /**
   * Format "★★★★★"
   */
  get stars(): string {
    const fullStars = '★'.repeat(this.value);
    const emptyStars = '☆'.repeat(5 - this.value);
    return fullStars + emptyStars;
  }

  /**
   * Description textuelle
   */
  get description(): string {
    const descriptions: Record<number, string> = {
      1: 'Très mauvais',
      2: 'Mauvais',
      3: 'Moyen',
      4: 'Bien',
      5: 'Excellent',
    };
    return descriptions[this.value] || 'Inconnu';
  }

  /**
   * Convertir en pourcentage (0-100)
   */
  get percentage(): number {
    return (this.value / 5) * 100;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): RatingValueData {
    return {
      value: this.value,
    };
  }
}

