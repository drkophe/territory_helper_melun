# Gestion des Territoires - Melun

Application web de gestion et d'attribution de territoires.

## 🚀 Sprint 1 - TERMINÉ

### Fonctionnalités implémentées

✅ **Authentification simple**
- Page de connexion protégée par mot de passe
- Session sécurisée avec cookies
- Déconnexion

✅ **Carte interactive**
- Carte Leaflet avec tuiles OpenStreetMap
- Affichage de tous les territoires (polygones)
- Hover effects et tooltips
- Zoom et navigation

✅ **Gestion des territoires**
- Parsing automatique du fichier KML
- Affichage des territoires sur la carte
- Clic sur territoire pour voir les détails
- Panel d'information avec code, nom et ville

## 🛠️ Stack Technique

- **Framework:** Next.js 15 (App Router)
- **Langage:** TypeScript strict
- **Styles:** Tailwind CSS
- **Carte:** Leaflet + react-leaflet
- **Parser KML:** @mapbox/togeojson

## 📦 Installation

```bash
# Installer les dépendances
npm install --legacy-peer-deps

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec votre mot de passe
```

## 🏃 Lancement

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Lancer en production
npm start
```

L'application sera accessible sur http://localhost:3000

## 🔐 Connexion

**Mot de passe par défaut:** `melun2024`

Modifiable dans `.env.local` :
```
AUTH_PASSWORD=votre_mot_de_passe
```

## 📁 Structure du Projet

```
├── app/                      # Pages Next.js (App Router)
│   ├── page.tsx             # Page de login
│   ├── carte/               # Page de la carte
│   └── api/                 # Routes API
│       ├── auth/           # Authentification
│       └── territories/    # Données territoires
├── features/                # Organisation par fonctionnalités
│   ├── auth/               # Feature authentification
│   ├── map/                # Feature carte
│   └── territories/        # Feature territoires
├── lib/                     # Utilitaires partagés
├── types/                   # Types TypeScript globaux
└── public/                  # Fichiers statiques
    └── territoires.kml     # Données KML des territoires
```

## ✅ Tests Manuels Sprint 1

### Authentification
- [ ] Accès à `/carte` sans authentification redirige vers `/`
- [ ] Login avec le bon mot de passe donne accès à `/carte`
- [ ] Login avec un mauvais mot de passe affiche une erreur
- [ ] Bouton déconnexion fonctionne

### Carte
- [ ] La carte se charge correctement
- [ ] La carte est centrée sur Melun/région
- [ ] Les tuiles OpenStreetMap s'affichent
- [ ] Tous les territoires sont visibles
- [ ] Le compteur affiche le bon nombre de territoires

### Territoires
- [ ] Les polygones ont une couleur bleue visible
- [ ] Au survol, l'opacité augmente
- [ ] Un tooltip affiche le nom du territoire
- [ ] Le curseur change au survol
- [ ] Clic sur un territoire ouvre le panel latéral

### Panel d'information
- [ ] Le panel s'affiche à droite
- [ ] Les informations sont correctes (code, nom, ville)
- [ ] Le bouton fermer fonctionne
- [ ] Cliquer sur un autre territoire met à jour le panel
- [ ] Le territoire sélectionné change de couleur (orange)

## 🎨 Configuration de la Carte

Les styles et couleurs sont facilement modifiables dans `features/map/config.ts` :

```typescript
// Style des territoires
export const DEFAULT_TERRITORY_STYLE = {
  color: '#3388ff',        // Couleur bordure
  fillColor: '#3388ff',    // Couleur remplissage
  fillOpacity: 0.2,        // Opacité (0-1)
  weight: 2,               // Épaisseur bordure
};
```

## 📝 Prochains Sprints

### Sprint 2 : Intégration Google Sheets (Lecture)
- Connexion à l'API Google Sheets
- Lecture des données métier (statut, assignation, dates)
- Affichage du statut sur la carte (couleurs dynamiques)
- Filtres par statut

### Sprint 3 : Intégration Google Sheets (Écriture)
- Formulaire d'attribution de territoire
- Bouton "Marquer comme rendu"
- Synchronisation en temps réel avec Google Sheets
- Historique des modifications

### Sprint 4 : Fonctionnalités avancées
- Recherche de territoire
- Statistiques et tableaux de bord
- Export de données
- Notifications

## 🐛 Débogage

### Problème : La carte ne s'affiche pas
- Vérifier que le fichier `public/territoires.kml` existe
- Ouvrir la console du navigateur pour voir les erreurs
- Vérifier que Leaflet CSS est importé dans `app/globals.css`

### Problème : Erreur de parsing KML
- Vérifier que le fichier KML est valide
- Tester l'endpoint `/api/territories` directement

### Problème : Erreur d'authentification
- Vérifier que `.env.local` existe
- Supprimer les cookies du navigateur
- Redémarrer le serveur

## 📄 Licence

Projet privé - Usage interne uniquement