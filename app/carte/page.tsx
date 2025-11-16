'use client';

/**
 * Page de la carte interactive des territoires
 */

// Désactiver la génération statique pour cette page (nécessite le navigateur)
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import dynamicImport from 'next/dynamic';
import type L from 'leaflet';
import type { TerritoryCollection, SelectedTerritory } from '@/features/territories/types';

// Import dynamique pour éviter les problèmes SSR avec Leaflet
const MapContainer = dynamicImport(
  () => import('@/features/map/components/MapContainer'),
  { ssr: false }
);

const TerritoryLayer = dynamicImport(
  () => import('@/features/map/components/TerritoryLayer'),
  { ssr: false }
);

const TerritoryInfoPanel = dynamicImport(
  () => import('@/features/territories/components/TerritoryInfoPanel'),
  { ssr: false }
);

const FiltersPanel = dynamicImport(
  () => import('@/features/map/components/FiltersPanel'),
  { ssr: false }
);

// Import types pour les filtres
import type { ColorMode, AgeFilter, StatusFilter } from '@/features/map/components/FiltersPanel';

export default function CartePage() {
  const [territories, setTerritories] = useState<TerritoryCollection | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenTerritories, setHiddenTerritories] = useState<Set<string>>(new Set());

  // États des filtres
  const [colorMode, setColorMode] = useState<ColorMode>('gradient');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hideBoundary, setHideBoundary] = useState<boolean>(true);

  // Charger les territoires
  useEffect(() => {
    async function loadTerritories() {
      try {
        console.log('🔄 Chargement des territoires...');
        const response = await fetch('/api/territories');
        console.log('📡 Réponse API:', response.status);

        if (!response.ok) {
          throw new Error('Failed to load territories');
        }
        const data = await response.json();
        console.log('✅ Territoires chargés:', data.features?.length || 0);
        setTerritories(data);
      } catch (err) {
        console.error('❌ Error loading territories:', err);
        setError('Impossible de charger les territoires');
      } finally {
        setIsLoading(false);
      }
    }

    loadTerritories();
  }, []);

  const handleTerritoryClick = async (territory: SelectedTerritory) => {
    setSelectedTerritory(territory);

    // Zoomer sur le territoire sélectionné
    if (map && territories) {
      const feature = territories.features.find(
        f => f.properties.name === territory.name
      );

      if (feature && feature.geometry) {
        // Import dynamique de Leaflet pour éviter les problèmes SSR
        const L = (await import('leaflet')).default;

        // Créer un layer temporaire pour obtenir les bounds
        const tempLayer = L.geoJSON(feature);
        const bounds = tempLayer.getBounds();

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [80, 80],
            maxZoom: 16 // Limite le zoom pour ne pas être trop proche
          });
        }
      }
    }
  };

  const handleClosePanel = () => {
    setSelectedTerritory(null);
  };

  const handleHideTerritory = (territoryName: string) => {
    setHiddenTerritories(prev => new Set([...prev, territoryName]));
  };

  const handleShowTerritory = (territoryName: string) => {
    setHiddenTerritories(prev => {
      const newSet = new Set(prev);
      newSet.delete(territoryName);
      return newSet;
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Filtrer les territoires pour exclure les masqués
  const visibleTerritories = territories ? {
    ...territories,
    features: territories.features.filter(
      feature => !hiddenTerritories.has(feature.properties.name)
    )
  } : null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Gestion des Territoires
          </h1>
          <p className="text-sm text-gray-500">
            Melun
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          Déconnexion
        </button>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des territoires...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && territories && visibleTerritories && (
          <>
            {/* Panneau de filtres */}
            <div className="absolute top-4 left-4 z-[1000] max-w-md">
              <FiltersPanel
                colorMode={colorMode}
                onColorModeChange={setColorMode}
                ageFilter={ageFilter}
                onAgeFilterChange={setAgeFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                hideBoundary={hideBoundary}
                onHideBoundaryChange={setHideBoundary}
              />
            </div>

            {/* Carte */}
            <MapContainer onMapReady={setMap} />

            {/* Couche des territoires */}
            {map && (
              <TerritoryLayer
                map={map}
                territories={visibleTerritories}
                selectedTerritory={selectedTerritory}
                onTerritoryClick={handleTerritoryClick}
                colorMode={colorMode}
                ageFilter={ageFilter}
                statusFilter={statusFilter}
                hideBoundary={hideBoundary}
              />
            )}

            {/* Panel d'information */}
            <TerritoryInfoPanel
              territory={selectedTerritory}
              onClose={handleClosePanel}
              onHide={handleHideTerritory}
            />
          </>
        )}

        {/* Statistiques en bas à gauche */}
        {!isLoading && !error && territories && visibleTerritories && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[500]">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {visibleTerritories.features.length}
              </span>{' '}
              / {territories.features.length} territoires
            </p>
            {hiddenTerritories.size > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                {hiddenTerritories.size} masqué{hiddenTerritories.size > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Liste des territoires masqués */}
        {!isLoading && !error && hiddenTerritories.size > 0 && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-[500]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Territoires masqués
              </h3>
              <span className="text-xs text-gray-500">
                {hiddenTerritories.size}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Array.from(hiddenTerritories).map(name => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-gray-700 truncate flex-1">{name}</span>
                  <button
                    onClick={() => handleShowTerritory(name)}
                    className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="Afficher"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
