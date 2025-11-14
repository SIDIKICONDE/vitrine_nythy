interface ArticleFormHeaderProps {
  title: string;
  description: string;
  isEdit?: boolean;
}

/**
 * En-tête avec gradient pour les formulaires d'articles
 */
export function ArticleFormHeader({ title, description }: ArticleFormHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-8 mb-8 shadow-lg">
      <div className="relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-md">{title}</h1>
          <p className="mt-1 text-white drop-shadow-md">{description}</p>
        </div>
      </div>
      {/* Motif décoratif */}
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="white" />
          <circle cx="150" cy="50" r="40" fill="white" />
        </svg>
      </div>
    </div>
  );
}

