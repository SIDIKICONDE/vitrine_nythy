interface ArticleFormActionsProps {
  isSubmitting: boolean;
  status: string;
  onCancel: () => void;
}

/**
 * Barre d'actions sticky pour formulaires d'articles
 */
export function ArticleFormActions({ isSubmitting, status, onCancel }: ArticleFormActionsProps) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-sm">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 rounded-xl border-2 border-border bg-surface px-6 py-3 font-semibold text-foreground transition-all hover:bg-surface-muted hover:shadow-md"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Annuler
      </button>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`flex items-center gap-3 rounded-xl px-8 py-3 font-bold shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
          status === 'published' 
            ? 'bg-gradient-to-r from-primary to-primary-hover text-white' 
            : 'bg-white border-2 border-primary text-primary hover:bg-primary/5'
        }`}
      >
        {isSubmitting ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Enregistrement...
          </>
        ) : (
          <>
            {status === 'published' ? (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publier l'article
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Enregistrer le brouillon
              </>
            )}
          </>
        )}
      </button>
    </div>
  );
}

