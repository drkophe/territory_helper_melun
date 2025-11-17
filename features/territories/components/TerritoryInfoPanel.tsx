'use client';

/**
 * Panel d'information d'un territoire
 */

import type { SelectedTerritory, EnrichedTerritoryProperties } from '../types';
import { STATUS_COLORS } from '@/features/map/config';
import TerritoryActions from './TerritoryActions';

interface TerritoryInfoPanelProps {
  territory: SelectedTerritory | null;
  onClose: () => void;
  onHide?: (territoryName: string) => void;
  onTerritoryUpdated?: (territory: EnrichedTerritoryProperties) => void;
}

// Helper pour obtenir le label du statut
function getStatusLabel(status?: string): string {
  switch (status) {
    case 'available':
      return 'Disponible';
    case 'assigned':
      return 'Attribué';
    case 'unknown':
      return 'Inconnu';
    default:
      return 'Non attribué';
  }
}

// Helper pour obtenir la couleur du badge selon le statut
function getStatusBadgeClasses(status?: string): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'assigned':
      return 'bg-orange-100 text-orange-800';
    case 'unknown':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

export default function TerritoryInfoPanel({ territory, onClose, onHide, onTerritoryUpdated }: TerritoryInfoPanelProps) {
  if (!territory) return null;

  // Typer les propriétés enrichies si disponibles
  const enrichedProps = territory.properties as Partial<EnrichedTerritoryProperties>;

  const handleHide = () => {
    if (onHide) {
      onHide(territory.name);
      onClose();
    }
  };

  const handleTerritoryUpdated = (updatedTerritory: EnrichedTerritoryProperties) => {
    if (onTerritoryUpdated) {
      onTerritoryUpdated(updatedTerritory);
    }
  };

  return (
    <>
      {/* Overlay pour fermer au clic */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-[900] lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[1000] transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Territoire
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Code du territoire */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {territory.name}
            </h3>
            {territory.folder && (
              <p className="text-sm text-gray-500">
                {territory.folder}
              </p>
            )}
          </div>

          {/* Informations de base */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                Code
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {territory.name}
              </span>
            </div>

            {(enrichedProps.city || territory.folder) && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                  Ville
                </span>
                <span className="text-sm text-gray-900">
                  {enrichedProps.city || territory.folder}
                </span>
              </div>
            )}

            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                Statut
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(enrichedProps.status)}`}>
                {getStatusLabel(enrichedProps.status)}
              </span>
            </div>

            {enrichedProps.fullName && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                  Attribué à
                </span>
                <span className="text-sm text-gray-900 font-medium">
                  {enrichedProps.fullName}
                </span>
              </div>
            )}

            {enrichedProps.campaign && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                  Campagne
                </span>
                <span className="text-sm text-gray-900">
                  {enrichedProps.campaign}
                </span>
              </div>
            )}
          </div>

          {/* Dates (Sprint 2 - Google Sheets) */}
          {(enrichedProps.givenAt || enrichedProps.contactAt || enrichedProps.limitAt || enrichedProps.returnedAt) && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Dates
              </h4>

              {enrichedProps.givenAt && (
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">
                    Remis le
                  </span>
                  <span className="text-sm text-gray-900">
                    {enrichedProps.givenAt}
                  </span>
                </div>
              )}

              {enrichedProps.contactAt && (
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">
                    Contacté le
                  </span>
                  <span className="text-sm text-gray-900">
                    {enrichedProps.contactAt}
                  </span>
                </div>
              )}

              {enrichedProps.limitAt && (
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">
                    Limite
                  </span>
                  <span className="text-sm text-gray-900">
                    {enrichedProps.limitAt}
                  </span>
                </div>
              )}

              {enrichedProps.returnedAt && (
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">
                    Rendu le
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {enrichedProps.returnedAt}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Commentaires et informations (Sprint 2) */}
          {(enrichedProps.comment || enrichedProps.info) && (
            <div className="space-y-4">
              {enrichedProps.comment && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Commentaire
                  </h4>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
                    {enrichedProps.comment}
                  </p>
                </div>
              )}

              {enrichedProps.info && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Information
                  </h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    {enrichedProps.info}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description (Sprint 1 - KML) */}
          {territory.properties.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Description
              </h4>
              <p className="text-sm text-gray-600">
                {territory.properties.description}
              </p>
            </div>
          )}

          {/* Actions (Sprint 3 - Écriture) */}
          <div className="space-y-3">
            {/* Actions d'attribution / retour */}
            {enrichedProps.code && (
              <TerritoryActions
                territory={enrichedProps as EnrichedTerritoryProperties}
                onTerritoryUpdated={handleTerritoryUpdated}
              />
            )}

            {/* Action de masquage */}
            {onHide && (
              <button
                onClick={handleHide}
                className="w-full py-2 px-4 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Masquer ce territoire
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
