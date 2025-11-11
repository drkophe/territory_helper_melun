'use client';

/**
 * Panel d'information d'un territoire
 */

import type { SelectedTerritory } from '../types';

interface TerritoryInfoPanelProps {
  territory: SelectedTerritory | null;
  onClose: () => void;
}

export default function TerritoryInfoPanel({ territory, onClose }: TerritoryInfoPanelProps) {
  if (!territory) return null;

  return (
    <>
      {/* Overlay pour fermer au clic */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
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

            {territory.folder && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                  Ville
                </span>
                <span className="text-sm text-gray-900">
                  {territory.folder}
                </span>
              </div>
            )}

            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">
                Statut
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Non attribué
              </span>
            </div>
          </div>

          {/* Description */}
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

          {/* Placeholder pour futures fonctionnalités */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 italic">
              Les fonctionnalités d'attribution et de gestion seront disponibles dans les prochains sprints.
            </p>
          </div>

          {/* Actions futures */}
          <div className="space-y-3">
            <button
              disabled
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
            >
              Attribuer à une personne
            </button>
            <button
              disabled
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
            >
              Marquer comme rendu
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
