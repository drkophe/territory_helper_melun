/**
 * Utilitaires partagés
 */

// Classe utilitaire pour fusionner des classes CSS (style Tailwind)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Récupérer une variable d'environnement côté serveur
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue || '';
}
