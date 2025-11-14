/**
 * PayoutsList - Liste des versements
 */

'use client';

import { Transaction, TransactionStatus } from '@/app/merchant/domain/entities/Transaction';

interface PayoutsListProps {
  payouts: Transaction[];
  loading?: boolean;
}

export default function PayoutsList({ payouts, loading }: PayoutsListProps) {
  const getStatusLabel = (status: TransactionStatus): string => {
    const labels: Record<TransactionStatus, string> = {
      [TransactionStatus.PENDING]: 'En attente',
      [TransactionStatus.PROCESSING]: 'En traitement',
      [TransactionStatus.COMPLETED]: 'Complété',
      [TransactionStatus.FAILED]: 'Échoué',
      [TransactionStatus.CANCELLED]: 'Annulé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: TransactionStatus): string => {
    const colors: Record<TransactionStatus, string> = {
      [TransactionStatus.PENDING]: 'text-yellow-600 bg-yellow-50',
      [TransactionStatus.PROCESSING]: 'text-blue-600 bg-blue-50',
      [TransactionStatus.COMPLETED]: 'text-green-600 bg-green-50',
      [TransactionStatus.FAILED]: 'text-red-600 bg-red-50',
      [TransactionStatus.CANCELLED]: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="liquid-glass p-12 text-center">
        <p className="text-foreground-muted">Chargement des versements...</p>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="liquid-glass p-8 text-center">
        <div className="text-4xl mb-3">💸</div>
        <h4 className="font-semibold text-foreground mb-2">Aucun versement</h4>
        <p className="text-sm text-foreground-muted">
          Les versements sont effectués automatiquement chaque semaine une fois que vous aurez des revenus.
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass p-6 rounded-xl">
      <h3 className="text-lg font-bold text-foreground mb-4">Historique des versements</h3>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between p-4 bg-surface-hover rounded-lg border border-border hover:bg-surface-active transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="text-2xl">💸</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">Versement</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payout.status)}`}>
                    {getStatusLabel(payout.status)}
                  </span>
                </div>
                {payout.description && (
                  <p className="text-sm text-foreground-muted">{payout.description}</p>
                )}
                <p className="text-xs text-foreground-muted mt-1">
                  {payout.processedAt
                    ? `Traité le ${new Date(payout.processedAt).toLocaleDateString('fr-FR')}`
                    : `Créé le ${new Date(payout.createdAt).toLocaleDateString('fr-FR')}`}
                </p>
                {payout.failureReason && (
                  <p className="text-xs text-red-600 mt-1">⚠️ {payout.failureReason}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {Math.abs(payout.netAmount.amountDecimal).toFixed(2)} €
              </p>
              {payout.completedAt && (
                <p className="text-xs text-foreground-muted">
                  {new Date(payout.completedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

