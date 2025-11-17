'use client';

/**
 * Conteneur des actions possibles sur un territoire
 */

import { useState } from 'react';
import AssignTerritoryForm from './AssignTerritoryForm';
import ReturnTerritoryForm from './ReturnTerritoryForm';
import type { EnrichedTerritoryProperties } from '../types';

interface TerritoryActionsProps {
  territory: EnrichedTerritoryProperties;
  onTerritoryUpdated: (updatedTerritory: EnrichedTerritoryProperties) => void;
}

type ActionMode = 'none' | 'assign' | 'return';

export default function TerritoryActions({
  territory,
  onTerritoryUpdated,
}: TerritoryActionsProps) {
  const [mode, setMode] = useState<ActionMode>('none');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAssignSuccess = (updatedTerritory: EnrichedTerritoryProperties) => {
    setMode('none');
    setSuccessMessage('✅ Territoire attribué avec succès');
    onTerritoryUpdated(updatedTerritory);

    // Masquer le message après 3 secondes
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleReturnSuccess = (updatedTerritory: EnrichedTerritoryProperties) => {
    setMode('none');
    setSuccessMessage('✅ Territoire marqué comme rendu');
    onTerritoryUpdated(updatedTerritory);

    // Masquer le message après 3 secondes
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCancel = () => {
    setMode('none');
  };

  // Message de succès affiché temporairement
  if (successMessage) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-sm font-medium text-green-800">{successMessage}</p>
      </div>
    );
  }

  // Formulaire d'attribution
  if (mode === 'assign') {
    return (
      <AssignTerritoryForm
        territoryCode={territory.code}
        territoryName={territory.name}
        onSuccess={handleAssignSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Formulaire de retour
  if (mode === 'return') {
    return (
      <ReturnTerritoryForm
        territoryCode={territory.code}
        territoryName={territory.name}
        assignedTo={territory.fullName}
        onSuccess={handleReturnSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Boutons d'action selon le statut
  return (
    <div className="space-y-3">
      {territory.status === 'available' && (
        <button
          onClick={() => setMode('assign')}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          📝 Attribuer ce territoire
        </button>
      )}

      {territory.status === 'assigned' && (
        <button
          onClick={() => setMode('return')}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          ✅ Marquer comme rendu
        </button>
      )}

      {territory.status === 'unknown' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            Statut inconnu - aucune action disponible
          </p>
        </div>
      )}
    </div>
  );
}
