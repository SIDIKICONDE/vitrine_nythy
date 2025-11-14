import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espace Marchand - Nythy',
  description: 'Gérez votre commerce sur Nythy',
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout minimal - les sous-pages gèrent leur propre layout
  return <>{children}</>;
}

