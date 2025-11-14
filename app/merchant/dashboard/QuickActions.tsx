/**
 * QuickActions - Actions rapides du dashboard
 */

'use client';

import Link from 'next/link';

interface ActionButtonProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  color?: string;
}

function ActionButton({ href, icon, title, description, color = 'primary' }: ActionButtonProps) {
  return (
    <Link href={href}>
      <div className={`
        liquid-glass p-6 hover:shadow-custom-xl transition-all duration-300 
        group cursor-pointer border-2 border-transparent hover:border-${color}
      `}>
        <div className="flex items-start gap-4">
          <div className="text-4xl">{icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1">
              {title}
            </h3>
            <p className="text-sm text-foreground-muted">
              {description}
            </p>
          </div>
          <div className="text-foreground-muted group-hover:text-primary transition-colors">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        Actions rapides
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionButton
          href="/merchant/products/new"
          icon="➕"
          title="Nouveau produit"
          description="Ajouter un produit anti-gaspillage"
          color="primary"
        />

        <ActionButton
          href="/merchant/products"
          icon="📦"
          title="Mes produits"
          description="Gérer mes produits actifs"
          color="secondary"
        />

        <ActionButton
          href="/merchant/orders"
          icon="🛒"
          title="Commandes"
          description="Voir les commandes en cours"
          color="primary"
        />

        <ActionButton
          href="/merchant/stats"
          icon="📊"
          title="Statistiques"
          description="Analyser mes performances"
          color="secondary"
        />

        <ActionButton
          href="/merchant/profile"
          icon="⚙️"
          title="Profil"
          description="Modifier mes informations"
          color="primary"
        />

        <ActionButton
          href="/merchant/settings"
          icon="🔧"
          title="Paramètres"
          description="Configurer mon commerce"
          color="secondary"
        />
      </div>
    </div>
  );
}

