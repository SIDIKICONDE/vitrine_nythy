/**
 * DomainEvent: MerchantVerifiedEvent
 * Événement émis lorsqu'un commerçant est vérifié par un administrateur
 */

import { DocumentType } from '../enums/DocumentType';
import { VerificationStatus } from '../enums/VerificationStatus';
import { DomainEvent } from './DomainEvent';

export class MerchantVerifiedEvent extends DomainEvent {
  constructor(
    public readonly merchantId: string,
    public readonly merchantName: string,
    public readonly adminId: string,
    public readonly verificationStatus: VerificationStatus,
    public readonly notes?: string,
    public readonly documentsChecked: DocumentType[] = [],
    occurredAt?: Date
  ) {
    super(occurredAt);
  }

  get aggregateId(): string {
    return this.merchantId;
  }

  get eventName(): string {
    return 'merchant.verified';
  }

  override toString(): string {
    return `MerchantVerifiedEvent(merchantId: ${this.merchantId}, adminId: ${this.adminId}, status: ${this.verificationStatus})`;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      merchantId: this.merchantId,
      merchantName: this.merchantName,
      adminId: this.adminId,
      verificationStatus: this.verificationStatus,
      notes: this.notes,
      documentsChecked: this.documentsChecked,
    };
  }
}
