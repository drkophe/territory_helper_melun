'use client';

/**
 * Page de la carte interactive des territoires
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { TerritoryCollection, SelectedTerritory } from '@/features/territories/types';

// Import dynamique pour éviter les problèmes SSR avec Leaflet
const MapContainer = dynamic(
  () => import('@/features/map/components/MapContainer'),
  { ssr: false }
);

const TerritoryLayer = dynamic(
  () => import('@/features/map/components/TerritoryLayer'),
  { ssr: false }
);

const TerritoryInfoPanel = dynamic(
  () => import('@/features/territories/components/TerritoryInfoPanel'),
  { ssr: false }
);

export default function CartePage() {
  const [territories, setTerritories] = useState<TerritoryCollection | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleTerritoryClick = (territory: SelectedTerritory) => {
    setSelectedTerritory(territory);
  };

  const handleClosePanel = () => {
    setSelectedTerritory(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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

        {!isLoading && !error && territories && (
          <>
            {/* Carte */}
            <MapContainer onMapReady={setMap} />

            {/* Couche des territoires */}
            {map && (
              <TerritoryLayer
                map={map}
                territories={territories}
                selectedTerritory={selectedTerritory}
                onTerritoryClick={handleTerritoryClick}
              />
            )}

            {/* Panel d'information */}
            <TerritoryInfoPanel
              territory={selectedTerritory}
              onClose={handleClosePanel}
            />
          </>
        )}

        {/* Statistiques en bas à gauche */}
        {!isLoading && !error && territories && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {territories.features.length}
              </span>{' '}
              territoires
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
