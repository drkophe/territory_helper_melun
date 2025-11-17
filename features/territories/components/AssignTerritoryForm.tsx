'use client';

/**
 * Formulaire pour attribuer un territoire
 */

import { useState } from 'react';
import type { AssignTerritoryPayload } from '@/features/google-sheets/writer-types';
import { assignTerritoryApi } from '../services/territoryApi';
import type { EnrichedTerritoryProperties } from '../types';

interface AssignTerritoryFormProps {
  territoryCode: string;
  territoryName: string;
  onSuccess: (updatedTerritory: EnrichedTerritoryProperties) => void;
  onCancel: () => void;
}

export default function AssignTerritoryForm({
  territoryCode,
  territoryName,
  onSuccess,
  onCancel,
}: AssignTerritoryFormProps) {
  // Date du jour par défaut (format JJ/MM/AAAA)
  const today = new Date();
  const defaultDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [formData, setFormData] = useState({
    fullName: '',
    firstName: '',
    givenAt: defaultDate,
    comment: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: AssignTerritoryPayload = {
        code: territoryCode,
        fullName: formData.fullName.trim(),
        givenAt: formData.givenAt,
      };

      if (formData.firstName.trim()) {
        payload.firstName = formData.firstName.trim();
      }

      if (formData.comment.trim()) {
        payload.comment = formData.comment.trim();
      }

      console.log('📤 Soumission attribution:', payload);

      const updatedTerritory = await assignTerritoryApi(payload);

      console.log('✅ Territoire attribué:', updatedTerritory);
      onSuccess(updatedTerritory);
    } catch (err: any) {
      console.error('❌ Erreur attribution:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Attribuer le territoire
      </h2>

      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">{territoryCode}</span> - {territoryName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom complet */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom & prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jean Dupont"
            disabled={isSubmitting}
          />
        </div>

        {/* Prénom (optionnel) */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom seul (optionnel)
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jean"
            disabled={isSubmitting}
          />
        </div>

        {/* Date de remise */}
        <div>
          <label htmlFor="givenAt" className="block text-sm font-medium text-gray-700 mb-1">
            Date de remise <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="givenAt"
            required
            value={formData.givenAt}
            onChange={(e) => setFormData({ ...formData, givenAt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="JJ/MM/AAAA"
            pattern="\d{2}/\d{2}/\d{4}"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Format: JJ/MM/AAAA</p>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Informations supplémentaires..."
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? 'Attribution...' : 'Attribuer'}
          </button>
        </div>
      </form>
    </div>
  );
}
