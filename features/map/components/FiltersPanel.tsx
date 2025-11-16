'use client';

/**
 * Panneau de filtres pour la carte des territoires
 */

import { useState } from 'react';

export type ColorMode = 'gradient' | 'thresholds';
export type AgeFilter = 'all' | 'gt_10m' | 'gt_8m' | 'gt_6m' | 'gt_4m' | 'gt_2m';
export type StatusFilter = 'all' | 'available' | 'assigned';

interface FiltersPanelProps {
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  ageFilter: AgeFilter;
  onAgeFilterChange: (filter: AgeFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  hideBoundary: boolean;
  onHideBoundaryChange: (hide: boolean) => void;
}

export default function FiltersPanel({
  colorMode,
  onColorModeChange,
  ageFilter,
  onAgeFilterChange,
  statusFilter,
  onStatusFilterChange,
  hideBoundary,
  onHideBoundaryChange,
}: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Filtres & Affichage</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* 1. Toggle mode couleur */}
          <div className="border-b pb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={colorMode === 'thresholds'}
                onChange={(e) => onColorModeChange(e.target.checked ? 'thresholds' : 'gradient')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Afficher les disponibles par seuils de mois (au lieu du gradient)
              </span>
            </label>
            {colorMode === 'thresholds' && (
              <div className="mt-2 ml-6 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#E02424' }}></span>
                  <span>&gt; 10 mois (rouge)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }}></span>
                  <span>&gt; 8 mois (orange)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }}></span>
                  <span>&gt; 6 mois (vert)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></span>
                  <span>&gt; 4 mois (bleu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#FACC15' }}></span>
                  <span>&gt; 2 mois (jaune)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#EC4899' }}></span>
                  <span>&lt; 2 mois (rose)</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Filtre par statut */}
          <div className="border-b pb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Afficher :
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onStatusFilterChange('all')}
                className={`px-3 py-1 text-sm rounded ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => onStatusFilterChange('available')}
                className={`px-3 py-1 text-sm rounded ${
                  statusFilter === 'available'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Disponibles
              </button>
              <button
                onClick={() => onStatusFilterChange('assigned')}
                className={`px-3 py-1 text-sm rounded ${
                  statusFilter === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Attribués
              </button>
            </div>
          </div>

          {/* 3. Filtre par ancienneté (uniquement si disponibles visibles) */}
          {statusFilter !== 'assigned' && (
            <div className="border-b pb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibles non sortis depuis :
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onAgeFilterChange('all')}
                  className={`px-2 py-1 text-sm rounded ${
                    ageFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => onAgeFilterChange('gt_2m')}
                  className={`px-2 py-1 text-sm rounded ${
                    ageFilter === 'gt_2m'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  &gt; 2 mois
                </button>
                <button
                  onClick={() => onAgeFilterChange('gt_4m')}
                  className={`px-2 py-1 text-sm rounded ${
                    ageFilter === 'gt_4m'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  &gt; 4 mois
                </button>
                <button
                  onClick={() => onAgeFilterChange('gt_6m')}
                  className={`px-2 py-1 text-sm rounded ${
                    ageFilter === 'gt_6m'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  &gt; 6 mois
                </button>
                <button
                  onClick={() => onAgeFilterChange('gt_8m')}
                  className={`px-2 py-1 text-sm rounded ${
                    ageFilter === 'gt_8m'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  &gt; 8 mois
                </button>
                <button
                  onClick={() => onAgeFilterChange('gt_10m')}
                  className={`px-2 py-1 text-sm rounded ${
                    ageFilter === 'gt_10m'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  &gt; 10 mois
                </button>
              </div>
            </div>
          )}

          {/* 4. Masquer limite globale */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideBoundary}
                onChange={(e) => onHideBoundaryChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Masquer la limite globale (770131) MELUN
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
