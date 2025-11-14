/**
 * Value Object: Money
 * Montant monétaire en centimes pour éviter les erreurs de précision
 */

export interface MoneyData {
  readonly amountMinor: number; // Centimes
  readonly currencyCode: string; // 'EUR', 'USD', etc.
}

export class Money {
  private constructor(
    public readonly amountMinor: number,
    public readonly currencyCode: string = 'EUR'
  ) {
    this.validate();
  }

  /**
   * Factory method depuis un montant décimal
   */
  static fromDecimal(amount: number, currencyCode: string = 'EUR'): Money {
    const amountMinor = Math.round(amount * 100);
    return new Money(amountMinor, currencyCode);
  }

  /**
   * Factory method depuis centimes
   */
  static fromMinor(amountMinor: number, currencyCode: string = 'EUR'): Money {
    return new Money(amountMinor, currencyCode);
  }

  /**
   * Créer depuis un objet MoneyData
   */
  static from(data: MoneyData): Money {
    return new Money(data.amountMinor, data.currencyCode);
  }

  /**
   * Zéro
   */
  static zero(currencyCode: string = 'EUR'): Money {
    return new Money(0, currencyCode);
  }

  /**
   * Validation
   */
  private validate(): void {
    if (!Number.isInteger(this.amountMinor)) {
      throw new Error('Le montant doit être un entier (centimes)');
    }
    if (this.currencyCode.length !== 3) {
      throw new Error('Le code devise doit contenir 3 caractères');
    }
  }

  /**
   * Montant en euros (décimal)
   */
  get amountDecimal(): number {
    return this.amountMinor / 100;
  }

  /**
   * Format "€10.50"
   */
  get formatted(): string {
    const symbol = this.getCurrencySymbol();
    return `${symbol}${this.amountDecimal.toFixed(2)}`;
  }

  /**
   * Est zéro
   */
  get isZero(): boolean {
    return this.amountMinor === 0;
  }

  /**
   * Est positif
   */
  get isPositive(): boolean {
    return this.amountMinor > 0;
  }

  /**
   * Est négatif
   */
  get isNegative(): boolean {
    return this.amountMinor < 0;
  }

  /**
   * Addition
   */
  add(other: Money): Money {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error('Impossible d\'additionner des devises différentes');
    }
    return new Money(this.amountMinor + other.amountMinor, this.currencyCode);
  }

  /**
   * Soustraction
   */
  subtract(other: Money): Money {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error('Impossible de soustraire des devises différentes');
    }
    return new Money(this.amountMinor - other.amountMinor, this.currencyCode);
  }

  /**
   * Multiplication
   */
  multiply(factor: number): Money {
    return new Money(Math.round(this.amountMinor * factor), this.currencyCode);
  }

  /**
   * Comparaison
   */
  compareTo(other: Money): number {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error('Impossible de comparer des devises différentes');
    }
    return this.amountMinor - other.amountMinor;
  }

  /**
   * Plus grand que
   */
  greaterThan(other: Money): boolean {
    return this.compareTo(other) > 0;
  }

  /**
   * Plus petit que
   */
  lessThan(other: Money): boolean {
    return this.compareTo(other) < 0;
  }

  /**
   * Égal à
   */
  equals(other: Money): boolean {
    return (
      this.amountMinor === other.amountMinor &&
      this.currencyCode === other.currencyCode
    );
  }

  /**
   * Obtenir le symbole de la devise
   */
  private getCurrencySymbol(): string {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      JPY: '¥',
    };
    return symbols[this.currencyCode] || this.currencyCode;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): MoneyData {
    return {
      amountMinor: this.amountMinor,
      currencyCode: this.currencyCode,
    };
  }
}

