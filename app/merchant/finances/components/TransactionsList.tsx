/**
 * TransactionsList - Liste des transactions
 */

'use client';

import { Transaction, TransactionStatus, TransactionType } from '@/app/merchant/domain/entities/Transaction';

interface TransactionsListProps {
  transactions: Transaction[];
  loading?: boolean;
}

export default function TransactionsList({ transactions, loading }: TransactionsListProps) {
  const getTypeLabel = (type: TransactionType): string => {
    const labels: Record<TransactionType, string> = {
      [TransactionType.REVENUE]: 'Revenu',
      [TransactionType.PAYOUT]: 'Versement',
      [TransactionType.COMMISSION]: 'Commission',
      [TransactionType.REFUND]: 'Remboursement',
      [TransactionType.FEE]: 'Frais',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: TransactionStatus): string => {
    const labels: Record<TransactionStatus, string> = {
      [TransactionStatus.PENDING]: 'En attente',
      [TransactionStatus.PROCESSING]: 'En traitement',
      [TransactionStatus.COMPLETED]: 'Complétée',
      [TransactionStatus.FAILED]: 'Échouée',
      [TransactionStatus.CANCELLED]: 'Annulée',
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

  const getTypeIcon = (type: TransactionType): string => {
    const icons: Record<TransactionType, string> = {
      [TransactionType.REVENUE]: '💰',
      [TransactionType.PAYOUT]: '💸',
      [TransactionType.COMMISSION]: '📊',
      [TransactionType.REFUND]: '↩️',
      [TransactionType.FEE]: '💳',
    };
    return icons[type] || '💰';
  };

  if (loading) {
    return (
      <div className="liquid-glass p-12 text-center">
        <p className="text-foreground-muted">Chargement des transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="liquid-glass p-8 text-center">
        <div className="text-4xl mb-3">💳</div>
        <h4 className="font-semibold text-foreground mb-2">Aucune transaction</h4>
        <p className="text-sm text-foreground-muted">
          Vos transactions apparaîtront ici dès que vous recevrez vos premières commandes.
        </p>
      </div>
    );
  }

  return (
    <div className="liquid-glass p-6 rounded-xl">
      <h3 className="text-lg font-bold text-foreground mb-4">Transactions récentes</h3>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-surface-hover rounded-lg border border-border hover:bg-surface-active transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="text-2xl">{getTypeIcon(transaction.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">
                    {getTypeLabel(transaction.type)}
                  </p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusLabel(transaction.status)}
                  </span>
                </div>
                {transaction.description && (
                  <p className="text-sm text-foreground-muted">{transaction.description}</p>
                )}
                <p className="text-xs text-foreground-muted mt-1">
                  {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              {transaction.type === TransactionType.COMMISSION ? (
                <p className="text-lg font-bold text-orange-600">
                  -{Math.abs(transaction.netAmount.amountDecimal).toFixed(2)} €
                </p>
              ) : (
                <>
                  <p className={`text-lg font-bold ${transaction.isRevenue ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.isRevenue ? '+' : ''}{transaction.amount.formatted}
                  </p>
                  {transaction.fee && !transaction.fee.isZero && (
                    <>
                      <p className="text-xs text-foreground-muted">
                        Frais: {transaction.fee.formatted}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        Net: {transaction.netAmount.formatted}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

