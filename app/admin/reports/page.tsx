'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { Report } from '@/types/admin';
import { AlertCircle, AlertTriangle, Calendar, CheckCircle, Clock, FileText, RefreshCw, Search, User, X } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de gestion des signalements
 */
export default function AdminReportsPage(): ReactElement {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 [Admin Reports] Chargement des signalements...');
      const response = await fetch('/api/admin/reports');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [Admin Reports] Données récupérées:', {
        total: data.reports?.length || 0,
        sample: data.reports?.[0] || null
      });
      setReports(data.reports || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [Admin Reports] Erreur chargement signalements:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir résoudre ce signalement ?')) {
      return;
    }
    try {
      await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
      });
      await loadReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Erreur résolution:', error);
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce signalement ?')) {
      return;
    }
    try {
      await fetch(`/api/admin/reports/${reportId}/dismiss`, {
        method: 'POST',
      });
      await loadReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Erreur rejet:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedContentType.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'reviewing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'dismissed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'user': return '👤';
      case 'merchant': return '🏪';
      case 'offer': return '🎁';
      default: return '📄';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Signalements
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {reports.length} signalements au total • {filteredReports.length} affichés
            </p>
          </div>
          <button
            onClick={loadReports}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Affichage erreur si nécessaire */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-700 dark:text-red-300 font-medium">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <ResponsiveGrid columns={{ initial: 1, sm: 2 }} gap={{ initial: 'sm', md: 'md' }}>
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par raison, description, auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filtre statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="reviewing">En cours</option>
              <option value="resolved">Résolus</option>
              <option value="dismissed">Rejetés</option>
            </select>
          </ResponsiveGrid>
        </div>

        {/* Liste des signalements */}
        {isLoading ? (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </ResponsiveGrid>
        ) : (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200 dark:border-red-800 p-5 sm:p-6 hover:shadow-2xl hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Icône d'alerte */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Raison et statut */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                          {report.reason}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm shrink-0 ${getStatusColor(report.status)}`}>
                          {report.status === 'pending' && '⏳ En attente'}
                          {report.status === 'reviewing' && '🔵 En cours'}
                          {report.status === 'resolved' && '✅ Résolu'}
                          {report.status === 'dismissed' && '❌ Rejeté'}
                        </span>
                      </div>

                      {/* Auteur et date */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 shrink-0" />
                          <span>{report.reporterName}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">
                      {report.description || 'Aucune description'}
                    </p>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>{getContentTypeIcon(report.reportedContentType)}</span>
                        {report.reportedContentType}
                      </span>
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-gray-700 dark:text-gray-300 text-xs">
                        ID: {report.reportedContentId.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun signalement trouvé</p>
              </div>
            )}
          </ResponsiveGrid>
        )}
      </div>

      {/* Modal détails du signalement */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedReport.reason}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status === 'pending' && '⏳ En attente'}
                    {selectedReport.status === 'reviewing' && '🔵 En cours'}
                    {selectedReport.status === 'resolved' && '✅ Résolu'}
                    {selectedReport.status === 'dismissed' && '❌ Rejeté'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {getContentTypeIcon(selectedReport.reportedContentType)} {selectedReport.reportedContentType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corps Modal */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Info rapporteur */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white text-lg font-bold">
                  {selectedReport.reporterName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-white">{selectedReport.reporterName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID: {selectedReport.reporterId}</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {new Date(selectedReport.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description du signalement:
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedReport.description || 'Aucune description disponible'}
                  </p>
                </div>
              </div>

              {/* Contenu signalé */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contenu signalé:</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type:</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {getContentTypeIcon(selectedReport.reportedContentType)} {selectedReport.reportedContentType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ID du contenu:</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                        {selectedReport.reportedContentId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes modérateur */}
              {selectedReport.moderatorNotes && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Notes modérateur:</h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedReport.moderatorNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Info résolution */}
              {selectedReport.resolvedAt && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Résolu le:</strong> {new Date(selectedReport.resolvedAt).toLocaleString('fr-FR')}
                    {selectedReport.resolvedBy && (
                      <> • <strong>Par:</strong> {selectedReport.resolvedBy}</>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Modal - Actions */}
            {selectedReport.status === 'pending' && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResolve(selectedReport.id)}
                    className="group/btn flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-br from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                  >
                    <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    Résoudre
                  </button>
                  <button
                    onClick={() => handleDismiss(selectedReport.id)}
                    className="group/btn flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-br from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                  >
                    <X className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    Rejeter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

