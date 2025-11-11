/**
 * Types globaux pour l'application
 */

// Type pour un utilisateur authentifié
export interface User {
  authenticated: boolean;
}

// Export des types spécifiques aux features
export * from '../features/territories/types';
export * from '../features/map/types';
