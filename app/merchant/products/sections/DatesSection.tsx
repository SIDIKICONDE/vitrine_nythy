/**
 * DatesSection - Section dates: fenêtre de retrait et date d'expiration
 * Aligné sur Flutter (dates_section.dart)
 */

'use client';

import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatesSectionProps {
  pickupStart: string;
  pickupEnd: string;
  expirationDate: string | null;
  onPickupStartChange: (value: string) => void;
  onPickupEndChange: (value: string) => void;
  onExpirationDateChange: (value: string | null) => void;
}

export default function DatesSection({
  pickupStart,
  pickupEnd,
  expirationDate,
  onPickupStartChange,
  onPickupEndChange,
  onExpirationDateChange,
}: DatesSectionProps) {
  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return 'Non définie';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Convertir string ISO en Date pour DatePicker
  const parseDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  // Convertir Date en string ISO incluant le fuseau local (évite le décalage à l'envoi)
  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00';

    const offsetMinutesTotal = -date.getTimezoneOffset();
    const offsetSign = offsetMinutesTotal >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(offsetMinutesTotal) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(offsetMinutesTotal) % 60).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
  };

  // Raccourcis de dates
  const setDateWithTime = (daysOffset: number, hour: number, minute: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, 0, 0);
    return formatDate(date);
  };

  const quickDates = [
    { label: "Aujourd'hui 18h", getValue: () => setDateWithTime(0, 18) },
    { label: "Aujourd'hui 20h", getValue: () => setDateWithTime(0, 20) },
    { label: "Demain 12h", getValue: () => setDateWithTime(1, 12) },
    { label: "Demain 20h", getValue: () => setDateWithTime(1, 20) },
  ];

  return (
    <div className="liquid-glass p-6 space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">
        📅 Dates et disponibilité
      </h3>

      {/* Fenêtre de retrait */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Fenêtre de retrait
        </h4>
        <p className="text-xs text-foreground-muted mb-4">
          Période pendant laquelle le client peut récupérer le produit
        </p>

        {/* Début de retrait */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Début du retrait *
          </label>

          {/* Raccourcis rapides */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickDates.map((quick) => (
              <button
                key={quick.label}
                type="button"
                onClick={() => onPickupStartChange(quick.getValue())}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors"
              >
                {quick.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DatePicker
              selected={parseDate(pickupStart)}
              onChange={(date) => onPickupStartChange(formatDate(date))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              locale={fr}
              minDate={new Date()}
              placeholderText="Sélectionner une date et heure"
              required
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
              wrapperClassName="flex-1"
            />
            {pickupStart && (
              <button
                type="button"
                onClick={() => onPickupStartChange('')}
                className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                title="Effacer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {pickupStart && (
            <p className="text-xs text-foreground-muted mt-1">
              ✅ {formatDateTime(pickupStart)}
            </p>
          )}
        </div>

        {/* Fin de retrait */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Fin du retrait *
          </label>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={parseDate(pickupEnd)}
              onChange={(date) => onPickupEndChange(formatDate(date))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              locale={fr}
              minDate={parseDate(pickupStart) || new Date()}
              placeholderText="Sélectionner une date et heure"
              required
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
              wrapperClassName="flex-1"
            />
            {pickupEnd && (
              <button
                type="button"
                onClick={() => onPickupEndChange('')}
                className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                title="Effacer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {pickupEnd && (
            <p className="text-xs text-foreground-muted mt-1">
              ✅ {formatDateTime(pickupEnd)}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4"></div>

      {/* Date d'expiration */}
      <div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date d'expiration <span className="text-xs text-foreground-muted font-normal">(recommandé)</span>
          </label>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={parseDate(expirationDate)}
              onChange={(date) => onExpirationDateChange(date ? formatDate(date) : null)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              locale={fr}
              minDate={parseDate(pickupEnd) || new Date()}
              placeholderText="Sélectionner une date et heure (optionnel)"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
              wrapperClassName="flex-1"
            />
            {expirationDate && (
              <button
                type="button"
                onClick={() => onExpirationDateChange(null)}
                className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                title="Effacer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {expirationDate && (
            <p className="text-xs text-foreground-muted mt-1">
              ✅ {formatDateTime(expirationDate)}
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          background-color: white;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.75rem 0.75rem 0 0;
          padding-top: 0.5rem;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker__day-name {
          color: #111827;
          font-weight: 600;
        }
        .react-datepicker__day {
          color: #374151;
          border-radius: 0.5rem;
          margin: 0.2rem;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6;
          border-radius: 0.5rem;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #8b5cf6 !important;
          color: white !important;
          font-weight: 600;
        }
        .react-datepicker__day--today {
          font-weight: 600;
          color: #8b5cf6;
        }
        .react-datepicker__time-container {
          border-left: 1px solid #e5e7eb;
        }
        .react-datepicker__time-list-item {
          color: #374151;
          padding: 0.5rem;
        }
        .react-datepicker__time-list-item:hover {
          background-color: #f3f4f6;
        }
        .react-datepicker__time-list-item--selected {
          background-color: #8b5cf6 !important;
          color: white !important;
          font-weight: 600;
        }
        .react-datepicker__navigation {
          top: 0.75rem;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
        }
      `}</style>
    </div>
  );
}
