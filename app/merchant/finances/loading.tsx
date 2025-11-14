import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import FinancesSkeleton from '@/app/merchant/components/skeletons/FinancesSkeleton';

export default function FinancesLoading() {
  const testUser = {
    name: 'Chargement...',
    email: '',
    image: null,
  };

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={testUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <FinancesSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

