'use client';

/**
 * Formulaire pour marquer un territoire comme rendu
 */

import { useState } from 'react';
import type { ReturnTerritoryPayload } from '@/features/google-sheets/writer-types';
import { returnTerritoryApi } from '../services/territoryApi';
import type { EnrichedTerritoryProperties } from '../types';

interface ReturnTerritoryFormProps {
  territoryCode: string;
  territoryName: string;
  assignedTo?: string;
  onSuccess: (updatedTerritory: EnrichedTerritoryProperties) => void;
  onCancel: () => void;
}

export default function ReturnTerritoryForm({
  territoryCode,
  territoryName,
  assignedTo,
  onSuccess,
  onCancel,
}: ReturnTerritoryFormProps) {
  // Date du jour par défaut (format JJ/MM/AAAA)
  const today = new Date();
  const defaultDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [formData, setFormData] = useState({
    returnedAt: defaultDate,
    comment: '',
    clearAssignment: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: ReturnTerritoryPayload = {
        code: territoryCode,
        returnedAt: formData.returnedAt,
        clearAssignment: formData.clearAssignment,
      };

      if (formData.comment.trim()) {
        payload.comment = formData.comment.trim();
      }

      console.log('📤 Soumission retour:', payload);

      const updatedTerritory = await returnTerritoryApi(payload);

      console.log('✅ Territoire rendu:', updatedTerritory);
      onSuccess(updatedTerritory);
    } catch (err: any) {
      console.error('❌ Erreur retour:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Marquer comme rendu
      </h2>

      <div className="mb-4 p-3 bg-green-50 rounded-md">
        <p className="text-sm text-green-800">
          <span className="font-semibold">{territoryCode}</span> - {territoryName}
        </p>
        {assignedTo && (
          <p className="text-sm text-green-700 mt-1">
            Attribué à: {assignedTo}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date de retour */}
        <div>
          <label htmlFor="returnedAt" className="block text-sm font-medium text-gray-700 mb-1">
            Date de retour <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="returnedAt"
            required
            value={formData.returnedAt}
            onChange={(e) => setFormData({ ...formData, returnedAt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="JJ/MM/AAAA"
            pattern="\d{2}/\d{2}/\d{4}"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Format: JJ/MM/AAAA</p>
        </div>

        {/* Vider l'attribution */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="clearAssignment"
            checked={formData.clearAssignment}
            onChange={(e) => setFormData({ ...formData, clearAssignment: e.target.checked })}
            className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
            disabled={isSubmitting}
          />
          <label htmlFor="clearAssignment" className="ml-2 text-sm text-gray-700">
            Réinitialiser le territoire (vider nom, dates de remise/contact/limite)
          </label>
        </div>

        {/* Commentaire */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Commentaire (optionnel)
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows={3}
            placeholder="Informations sur le retour..."
            disabled={isSubmitting}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? 'Enregistrement...' : 'Marquer comme rendu'}
          </button>
        </div>
      </form>
    </div>
  );
}
