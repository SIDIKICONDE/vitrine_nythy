/**
 * Types partagés pour les composants du Header
 */

export type MegaMenuItem = {
  title: string;
  description: string;
  href: string;
  badge?: string;
  imageUrl?: string;
};

export type MegaMenuSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: MegaMenuItem[];
};

