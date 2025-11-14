'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { SupportTicket } from '@/types/admin';
import { AlertCircle, Calendar, Clock, Mail, MessageSquare, RefreshCw, Send, User, X } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de gestion du support
 */
export default function AdminSupportPage(): ReactElement {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 [Admin Support] Chargement des tickets...');
      const response = await fetch('/api/admin/support');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [Admin Support] Données récupérées:', {
        total: data.tickets?.length || 0,
        sample: data.tickets?.[0] || null
      });
      setTickets(data.tickets || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [Admin Support] Erreur chargement tickets:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;

    try {
      console.log('📤 Envoi réponse pour ticket:', selectedTicket.id);
      // TODO: Implémenter l'API pour envoyer une réponse
      await fetch(`/api/admin/support/${selectedTicket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseText })
      });

      setResponseText('');
      setSelectedTicket(null);
      await loadTickets();
    } catch (error) {
      console.error('❌ Erreur envoi réponse:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    filterStatus === 'all' || ticket.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'waiting_response': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Support Client
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tickets.length} tickets au total • {filteredTickets.length} affichés
            </p>
          </div>
          <button
            onClick={loadTickets}
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
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 'all', label: 'Tous', emoji: '📋' },
              { value: 'open', label: 'Ouverts', emoji: '🟢' },
              { value: 'in_progress', label: 'En cours', emoji: '🔵' },
              { value: 'waiting_response', label: 'En attente', emoji: '🟡' },
              { value: 'resolved', label: 'Résolus', emoji: '✅' },
              { value: 'closed', label: 'Fermés', emoji: '⚫' }
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${filterStatus === status.value
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                <span className="mr-1">{status.emoji}</span>
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des tickets */}
        {isLoading ? (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </ResponsiveGrid>
        ) : (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 hover:shadow-2xl hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {ticket.userName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {/* Badge nombre de réponses */}
                    {ticket.responses.length > 0 && (
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">{ticket.responses.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Titre et badges */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority === 'urgent' && '🔴 '}
                            {ticket.priority === 'high' && '🟠 '}
                            {ticket.priority === 'medium' && '🟡 '}
                            {ticket.priority === 'low' && '🔵 '}
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Utilisateur */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 shrink-0" />
                          <span>{ticket.userName}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="truncate">{ticket.userEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Message aperçu */}
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">
                      {ticket.message || (ticket as any).description || 'Aucun message'}
                    </p>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-semibold shadow-sm ${getStatusColor(ticket.status)}`}>
                        {ticket.status === 'open' && '🟢 Ouvert'}
                        {ticket.status === 'in_progress' && '🔵 En cours'}
                        {ticket.status === 'waiting_response' && '🟡 En attente'}
                        {ticket.status === 'resolved' && '✅ Résolu'}
                        {ticket.status === 'closed' && '⚫ Fermé'}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-medium text-gray-700 dark:text-gray-300">
                        {ticket.category}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="w-3 h-3" />
                        <span>{ticket.responses.length} réponse{ticket.responses.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun ticket dans cette catégorie</p>
              </div>
            )}
          </ResponsiveGrid>
        )}
      </div>

      {/* Modal détails du ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedTicket.subject}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {selectedTicket.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corps Modal */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Info utilisateur */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white text-lg font-bold">
                  {selectedTicket.userName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{selectedTicket.userName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTicket.userEmail}</p>
                </div>
                <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>

              {/* Message initial */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message initial:</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedTicket.message || (selectedTicket as any).description || 'Aucun message disponible'}
                  </p>
                </div>
              </div>

              {/* Réponses */}
              {selectedTicket.responses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Réponses ({selectedTicket.responses.length})
                  </h3>
                  {selectedTicket.responses.map((response, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          {response.isAdmin && <span>👑</span>}
                          {response.isAdmin ? 'Admin' : 'Utilisateur'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(response.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal - Répondre */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Écrire une réponse..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendResponse();
                    }
                  }}
                />
                <button
                  onClick={handleSendResponse}
                  disabled={!responseText.trim()}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

