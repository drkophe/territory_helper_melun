# Sprint 3 — Écriture vers Google Sheets (Actions)

## 📋 Résumé du Sprint 3

Sprint 3 implémente les fonctionnalités d'écriture vers Google Sheets pour la gestion des territoires :

- **US5** : Actions "Attribuer un territoire" et "Marquer comme rendu"
- **US6** : Formulaires avec UX soignée (validation, états de chargement, messages de succès/erreur)
- **Architecture** : Extension de l'infrastructure Google Sheets existante avec opérations d'écriture
- **Sync** : Re-lecture automatique après écriture pour mise à jour optimiste de l'UI

### Fonctionnalités clés

1. **Attribution de territoire** :
   - Formulaire avec : Nom complet, Prénom (optionnel), Date de remise, Commentaire
   - Calcul automatique : Contacter (+3 mois), Limite (+4 mois)
   - Écriture dans Google Sheets : Identité, Prénom, Donné, Contacter, Limite
   - Effacement de la date de retour
   - Statut passe à `assigned`

2. **Retour de territoire** :
   - Formulaire avec : Date de retour (défaut = aujourd'hui), Commentaire
   - Option : Vider l'attribution (nom, dates) ou conserver historique
   - Écriture dans Google Sheets : Rendu
   - Statut passe à `available`, recalcul de `daysSinceLastReturn`

3. **Synchronisation** :
   - Re-lecture de la ligne modifiée après écriture
   - Reconstruction de l'objet Territory enrichi
   - Mise à jour optimiste de l'état local (pas de rechargement complet)

---

## 🏗️ Plan Technique

### Backend

**Modules créés** :

1. **`features/google-sheets/writer-types.ts`** :
   - Schémas Zod : `AssignTerritorySchema`, `ReturnTerritorySchema`
   - Types : `AssignTerritoryPayload`, `ReturnTerritoryPayload`, `TerritoryPosition`, `TerritoryIndex`

2. **`features/google-sheets/index-builder.ts`** :
   - `buildTerritoryIndex()` : Construit Map<code, {sheetName, rowIndex}>
   - `getOrBuildIndex()` : Lazy loading avec cache en mémoire
   - `refreshIndex()` : Force la reconstruction de l'index
   - `findTerritoryPosition(code)` : Lookup O(1)

3. **`features/google-sheets/writer.ts`** :
   - `getSheetsClient()` : Client Google Sheets API avec auth
   - `calculateFollowUpDates(givenAt)` : Calcule Contacter (+3m) et Limite (+4m)
   - `assignTerritory(payload)` : Écriture attribution via batchUpdate
   - `returnTerritory(payload)` : Écriture retour via batchUpdate
   - `reFetchTerritory(code, sheetName)` : Re-lecture et reconstruction

**Routes API créées** :

- `POST /api/territories/assign` : Attribuer un territoire
- `POST /api/territories/return` : Marquer comme rendu
- `POST /api/territories/refresh` : Rafraîchir l'index (optionnel)

**Flux d'exécution** :
```
Frontend → POST /api/territories/assign
         → Validation Zod
         → findTerritoryPosition(code)
         → Google Sheets batchUpdate
         → reFetchTerritory()
         → Return EnrichedTerritoryProperties
         → Frontend update state
```

### Frontend

**Services créés** :

1. **`features/territories/services/territoryApi.ts`** :
   - `assignTerritoryApi(payload)` : Appel API assign
   - `returnTerritoryApi(payload)` : Appel API return
   - `refreshIndexApi()` : Appel API refresh

**Composants créés** :

1. **`AssignTerritoryForm.tsx`** :
   - Formulaire avec fullName, firstName, givenAt, comment
   - Validation pattern date DD/MM/YYYY
   - États : isSubmitting, error
   - Callbacks : onSuccess, onCancel

2. **`ReturnTerritoryForm.tsx`** :
   - Formulaire avec returnedAt, clearAssignment, comment
   - Date par défaut = aujourd'hui
   - Même pattern UX que AssignTerritoryForm

3. **`TerritoryActions.tsx`** :
   - Container gérant les modes : 'none' | 'assign' | 'return'
   - Boutons conditionnels selon statut du territoire
   - Messages de succès avec timeout 3s
   - Délégation aux formulaires spécifiques

**Modifications** :

1. **`TerritoryInfoPanel.tsx`** :
   - Import de `TerritoryActions`
   - Ajout prop `onTerritoryUpdated`
   - Remplacement des boutons désactivés par `<TerritoryActions />`

2. **`app/carte/page.tsx`** :
   - Fonction `handleTerritoryUpdated(updatedTerritory)` :
     - Met à jour la collection `territories` via map
     - Met à jour `selectedTerritory` si c'est le même
   - Passage de `onTerritoryUpdated` à `TerritoryInfoPanel`

---

## 🔧 Implémentation Backend

### 1. Types et Validation (writer-types.ts)

```typescript
import { z } from 'zod';

export const AssignTerritorySchema = z.object({
  code: z.string().min(1, 'Le code du territoire est requis'),
  fullName: z.string().min(1, 'Le nom complet est requis'),
  firstName: z.string().optional(),
  givenAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (JJ/MM/AAAA)'),
  contactAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  limitAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  comment: z.string().optional(),
});

export const ReturnTerritorySchema = z.object({
  code: z.string().min(1, 'Le code du territoire est requis'),
  returnedAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (JJ/MM/AAAA)'),
  comment: z.string().optional(),
  clearAssignment: z.boolean().default(true),
});

export interface TerritoryPosition {
  sheetName: string;
  rowIndex: number; // 1-based (ligne 1 = en-tête)
}

export type TerritoryIndex = Map<string, TerritoryPosition>;
```

**Rationale** :
- Validation stricte avec Zod pour sécurité et messages d'erreur clairs
- Format date français DD/MM/YYYY pour cohérence utilisateur
- `clearAssignment` par défaut true (comportement le plus courant)

### 2. Index Builder (index-builder.ts)

```typescript
export async function buildTerritoryIndex(): Promise<TerritoryIndex> {
  const index: TerritoryIndex = new Map();
  const sheets = getSheetsClient();

  for (const sheetName of SHEET_TABS) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`,
    });

    const rows = response.data.values || [];
    const headerMap = buildHeaderMapping(rows[0]);
    const codeColumnIndex = headerMap.get('code');

    for (let i = 1; i < rows.length; i++) {
      const rawCode = rows[i][codeColumnIndex];
      const normalizedCode = normalizeTerritoryCode(rawCode);
      index.set(normalizedCode, {
        sheetName: sheetName as SheetTabName,
        rowIndex: i + 1, // 1-based
      });
    }
  }

  return index;
}

let globalIndex: TerritoryIndex | null = null;

export async function getOrBuildIndex(): Promise<TerritoryIndex> {
  if (!globalIndex) {
    globalIndex = await buildTerritoryIndex();
  }
  return globalIndex;
}
```

**Avantages** :
- Lookup O(1) vs scan linéaire par onglet O(n)
- Cache en mémoire pour performances
- Normalisation des codes pour robustesse

**Limites** :
- Index peut devenir obsolète si modifications externes
- Solution : endpoint `/api/territories/refresh`

### 3. Writer (writer.ts)

**Calcul des dates de suivi** :

```typescript
function calculateFollowUpDates(givenAt: string): { contactAt: string; limitAt: string } {
  const [day, month, year] = givenAt.split('/').map(Number);
  const givenDate = new Date(year, month - 1, day);

  const contactDate = new Date(givenDate);
  contactDate.setMonth(contactDate.getMonth() + 3);

  const limitDate = new Date(givenDate);
  limitDate.setMonth(limitDate.getMonth() + 4);

  const formatDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return { contactAt: formatDate(contactDate), limitAt: formatDate(limitDate) };
}
```

**Attribution de territoire** :

```typescript
export async function assignTerritory(
  payload: AssignTerritoryPayload
): Promise<EnrichedTerritoryProperties> {
  // 1. Trouver la position
  const position = await findTerritoryPosition(payload.code);
  if (!position) {
    throw new Error(`Territoire ${payload.code} introuvable`);
  }

  // 2. Calculer les dates
  const followUpDates = calculateFollowUpDates(payload.givenAt);
  const contactAt = payload.contactAt || followUpDates.contactAt;
  const limitAt = payload.limitAt || followUpDates.limitAt;

  // 3. Préparer les mises à jour
  const updates = [
    { column: 'fullName', value: payload.fullName },
    { column: 'givenAt', value: payload.givenAt },
    { column: 'contactAt', value: contactAt },
    { column: 'limitAt', value: limitAt },
    { column: 'returnedAt', value: '' }, // Clear
  ];

  // 4. Batch update
  const batchData = updates.map(update => {
    const columnIndex = headerMap.get(update.column);
    const columnLetter = String.fromCharCode(65 + columnIndex);
    return {
      range: `${sheetName}!${columnLetter}${rowIndex}`,
      values: [[update.value]],
    };
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data: batchData },
  });

  // 5. Re-lecture et reconstruction
  return await reFetchTerritory(payload.code, sheetName);
}
```

**Points clés** :
- Single API call via batchUpdate (performance)
- Re-lecture pour garantir cohérence
- Calcul automatique des dates de suivi

### 4. Routes API

**POST /api/territories/assign** :

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = AssignTerritorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updatedTerritory = await assignTerritory(validation.data);

    return NextResponse.json({
      success: true,
      territory: updatedTerritory,
    });
  } catch (error: any) {
    console.error('❌ Erreur attribution:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'attribution' },
      { status: 500 }
    );
  }
}
```

**Pattern appliqué** :
1. Parse body
2. Validation Zod
3. Business logic
4. Return success ou error

---

## 🎨 Implémentation Frontend

### 1. Service API (territoryApi.ts)

```typescript
export async function assignTerritoryApi(
  payload: AssignTerritoryPayload
): Promise<EnrichedTerritoryProperties> {
  const response = await fetch('/api/territories/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data: ApiResponse<EnrichedTerritoryProperties> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors de l\'attribution');
  }

  return data.territory!;
}
```

**Avantages** :
- Séparation concerns (UI vs API calls)
- Type-safety avec TypeScript
- Gestion d'erreur centralisée

### 2. Formulaires

**AssignTerritoryForm.tsx** :

```typescript
const [formData, setFormData] = useState({
  fullName: '',
  firstName: '',
  givenAt: defaultDate, // Today in DD/MM/YYYY
  comment: '',
});

const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    const updatedTerritory = await assignTerritoryApi({
      code: territoryCode,
      fullName: formData.fullName.trim(),
      givenAt: formData.givenAt,
      firstName: formData.firstName.trim() || undefined,
      comment: formData.comment.trim() || undefined,
    });

    onSuccess(updatedTerritory);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

**UX Features** :
- Date par défaut = aujourd'hui
- Trim des valeurs
- Loading state avec spinner
- Error display
- Disabled state pendant soumission

### 3. Container d'Actions (TerritoryActions.tsx)

```typescript
type ActionMode = 'none' | 'assign' | 'return';

export default function TerritoryActions({
  territory,
  onTerritoryUpdated,
}: TerritoryActionsProps) {
  const [mode, setMode] = useState<ActionMode>('none');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAssignSuccess = (updatedTerritory) => {
    setMode('none');
    setSuccessMessage('✅ Territoire attribué avec succès');
    onTerritoryUpdated(updatedTerritory);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Affichage conditionnel des boutons
  if (territory.status === 'available') {
    return <button onClick={() => setMode('assign')}>Attribuer</button>;
  } else if (territory.status === 'assigned') {
    return <button onClick={() => setMode('return')}>Marquer comme rendu</button>;
  }

  // Affichage conditionnel des formulaires
  if (mode === 'assign') {
    return <AssignTerritoryForm onSuccess={handleAssignSuccess} onCancel={...} />;
  }
}
```

**Architecture** :
- State machine (none → assign/return → none)
- Success messages avec auto-dismiss (3s)
- Propagation de l'update au parent

### 4. Mise à jour de l'État (page.tsx)

```typescript
const handleTerritoryUpdated = (updatedTerritory: any) => {
  console.log('🔄 Mise à jour du territoire:', updatedTerritory.code);

  // Mise à jour de la collection
  setTerritories(prev => {
    if (!prev) return prev;

    return {
      ...prev,
      features: prev.features.map(f => {
        if (f.properties.code === updatedTerritory.code) {
          return {
            ...f,
            properties: {
              ...f.properties,
              ...updatedTerritory,
            },
          };
        }
        return f;
      }),
    };
  });

  // Mise à jour du territoire sélectionné
  if (selectedTerritory && (selectedTerritory.properties as any).code === updatedTerritory.code) {
    setSelectedTerritory({
      ...selectedTerritory,
      properties: {
        ...selectedTerritory.properties,
        ...updatedTerritory,
      },
    });
  }
};
```

**Rationale** :
- Mise à jour optimiste (pas de reload)
- Immutabilité (map au lieu de mutation)
- Sync entre collection et sélection

---

## 🧪 Scénarios de Tests

### Tests Manuels

#### Scénario 1 : Attribution d'un territoire disponible

**Pré-requis** :
- Avoir un territoire avec statut `available`
- Google Sheets accessible en écriture

**Steps** :
1. Ouvrir la carte
2. Cliquer sur un territoire disponible (couleur violet clair)
3. Panel s'ouvre à droite
4. Vérifier que le bouton "Attribuer ce territoire" est visible
5. Cliquer sur "Attribuer ce territoire"
6. Formulaire s'affiche avec champs :
   - Nom complet (requis)
   - Prénom (optionnel)
   - Date de remise (pré-rempli avec aujourd'hui)
   - Commentaire (optionnel)
7. Remplir :
   - Nom complet : "Jean Dupont"
   - Date de remise : "17/11/2025"
8. Cliquer sur "Attribuer"
9. Observer le spinner sur le bouton
10. Attendre le message de succès "✅ Territoire attribué avec succès"

**Résultats attendus** :
- Formulaire se ferme
- Panel affiche les nouvelles informations :
  - Statut : "Attribué" (badge orange)
  - Attribué à : "Jean Dupont"
  - Remis le : "17/11/2025"
  - Contacter le : "17/02/2026" (calculé +3 mois)
  - Limite : "17/03/2026" (calculé +4 mois)
- Territoire sur la carte change de couleur (orange)
- Bouton devient "Marquer comme rendu"
- Vérifier dans Google Sheets que la ligne est mise à jour

**Cas d'erreur à tester** :
- Nom complet vide → Message d'erreur "Le nom complet est requis"
- Date invalide (ex: "32/13/2025") → Message d'erreur format
- Perte de connexion → Message d'erreur réseau

#### Scénario 2 : Retour d'un territoire attribué

**Pré-requis** :
- Avoir un territoire avec statut `assigned` (utiliser le territoire du Scénario 1)

**Steps** :
1. Cliquer sur le territoire attribué (orange)
2. Panel s'ouvre
3. Vérifier que le bouton "Marquer comme rendu" est visible
4. Cliquer sur "Marquer comme rendu"
5. Formulaire s'affiche avec :
   - Date de retour (pré-rempli avec aujourd'hui)
   - Checkbox "Effacer l'attribution" (cochée par défaut)
   - Commentaire (optionnel)
6. Vérifier la date : "17/11/2025"
7. Laisser la checkbox cochée
8. Ajouter commentaire : "Territoire complété"
9. Cliquer sur "Marquer comme rendu"

**Résultats attendus** :
- Formulaire se ferme
- Panel affiche :
  - Statut : "Disponible" (badge vert)
  - Rendu le : "17/11/2025"
  - Commentaire : "Territoire complété"
  - Identité, Donné, Contacter, Limite sont effacés
- Territoire sur la carte devient violet (gradient selon ancienneté)
- Bouton redevient "Attribuer ce territoire"
- Vérifier dans Google Sheets

#### Scénario 3 : Retour avec conservation de l'historique

**Steps** :
1. Attribuer un territoire (Scénario 1)
2. Le marquer comme rendu MAIS décocher "Effacer l'attribution"
3. Soumettre

**Résultats attendus** :
- Statut : "Disponible"
- Rendu le : date du retour
- Identité, Donné, etc. CONSERVÉS (historique)

#### Scénario 4 : Annulation de formulaire

**Steps** :
1. Cliquer sur un territoire
2. Cliquer sur "Attribuer"
3. Remplir partiellement le formulaire
4. Cliquer sur "Annuler"

**Résultats attendus** :
- Formulaire se ferme
- Aucune modification dans Google Sheets
- Panel revient à l'état initial

#### Scénario 5 : Filtrage après modification

**Steps** :
1. Activer le filtre "Disponibles uniquement"
2. Attribuer un territoire disponible
3. Observer la carte

**Résultats attendus** :
- Le territoire disparaît de la carte (car plus disponible)
- Compteur de territoires se met à jour
- Si le panel est ouvert, il se ferme ou affiche le nouveau statut

#### Scénario 6 : Rafraîchissement de l'index

**Pré-requis** :
- Modifier manuellement un code de territoire dans Google Sheets

**Steps** :
1. Ouvrir la console développeur
2. Exécuter :
```javascript
fetch('/api/territories/refresh', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**Résultats attendus** :
- Réponse : `{ success: true, count: X, message: "Index rafraîchi: X territoires" }`
- Index reconstruit en mémoire

### Tests Automatisés (Suggestions)

#### Tests Unitaires

**features/google-sheets/writer.ts** :
```typescript
describe('calculateFollowUpDates', () => {
  test('calcule +3 mois pour contactAt et +4 mois pour limitAt', () => {
    const result = calculateFollowUpDates('17/11/2025');
    expect(result.contactAt).toBe('17/02/2026');
    expect(result.limitAt).toBe('17/03/2026');
  });

  test('gère les changements d\'année', () => {
    const result = calculateFollowUpDates('15/11/2025');
    expect(result.contactAt).toBe('15/02/2026');
    expect(result.limitAt).toBe('15/03/2026');
  });
});
```

**features/google-sheets/normalization.ts** :
```typescript
describe('normalizeTerritoryCode', () => {
  test('normalise les codes avec espaces', () => {
    expect(normalizeTerritoryCode('  M-01  ')).toBe('M-01');
  });

  test('convertit en majuscules', () => {
    expect(normalizeTerritoryCode('m-01')).toBe('M-01');
  });
});
```

#### Tests d'Intégration

**app/api/territories/assign/route.ts** :
```typescript
describe('POST /api/territories/assign', () => {
  test('retourne 400 si payload invalide', async () => {
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ code: '', fullName: '' }),
    }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Données invalides');
  });

  test('retourne 200 et territoire mis à jour si succès', async () => {
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        code: 'M-01',
        fullName: 'Jean Dupont',
        givenAt: '17/11/2025',
      }),
    }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.territory.fullName).toBe('Jean Dupont');
  });
});
```

#### Tests E2E (Playwright/Cypress)

```typescript
describe('Attribution de territoire', () => {
  test('attribuer un territoire disponible', async ({ page }) => {
    await page.goto('/carte');

    // Cliquer sur un territoire violet
    await page.locator('.leaflet-overlay-pane path[fill*="purple"]').first().click();

    // Panel s'ouvre
    await expect(page.locator('text=Territoire')).toBeVisible();

    // Cliquer sur Attribuer
    await page.locator('button:has-text("Attribuer ce territoire")').click();

    // Remplir le formulaire
    await page.fill('input[name="fullName"]', 'Jean Dupont');
    await page.fill('input[name="givenAt"]', '17/11/2025');

    // Soumettre
    await page.click('button:has-text("Attribuer")');

    // Vérifier le message de succès
    await expect(page.locator('text=Territoire attribué avec succès')).toBeVisible();

    // Vérifier le panel
    await expect(page.locator('text=Attribué à')).toBeVisible();
    await expect(page.locator('text=Jean Dupont')).toBeVisible();
  });
});
```

---

## 🚀 Suggestions d'Améliorations Futures

### Sprint 4 : Historique et Audit

**US7 : Journal des modifications**
- Table `territory_history` (ou onglet dédié dans Sheets)
- Enregistrer chaque action : attribution, retour, modification
- Colonnes : timestamp, action, territory_code, user, changes (JSON)
- Afficher l'historique dans le panel du territoire

**US8 : Authentification utilisateur**
- Actuellement : logout simple sans gestion d'identité
- Proposer : NextAuth.js avec Google OAuth
- Enregistrer l'utilisateur qui fait l'action dans l'historique

### Sprint 5 : Édition Avancée

**US9 : Modification en place**
- Bouton "Modifier" sur un territoire attribué
- Permettre de changer : fullName, dates, commentaire
- Conserve l'historique des modifications

**US10 : Attribution en masse**
- Sélectionner plusieurs territoires sur la carte
- Attribuer à la même personne en un clic
- Utile pour les campagnes par secteur

### Sprint 6 : Analytics et Rapports

**US11 : Dashboard de statistiques**
- Page `/dashboard` avec métriques :
  - Taux de couverture (attribués / total)
  - Distribution par statut (pie chart)
  - Territoires en retard (limitAt dépassée)
  - Top contributeurs (par nombre de territoires)

**US12 : Export de rapports**
- Export PDF d'un territoire avec toutes ses infos
- Export CSV de la liste filtrée
- Rapport mensuel automatique

### Sprint 7 : UX et Performance

**US13 : Mode hors ligne**
- Service Worker pour cache des données
- Synchronisation différée si perte de connexion
- Indicateur de statut de sync

**US14 : Notifications**
- Rappel avant limitAt (-7 jours, -3 jours, -1 jour)
- Email ou notification push
- Intégration avec API de notification

**US15 : Recherche et Tri**
- Barre de recherche pour trouver un territoire par code ou nom
- Tri des territoires par statut, date, priorité
- Filtres combinés (ex: disponibles + > 90 jours)

### Sprint 8 : Collaboration

**US16 : Commentaires multi-utilisateurs**
- Fil de commentaires par territoire (vs 1 commentaire unique)
- @mention d'autres utilisateurs
- Notifications

**US17 : Permissions et Rôles**
- Admin : peut tout faire
- Contributeur : peut attribuer/rendre ses propres territoires
- Lecteur : lecture seule
- Gestion des rôles via Google Sheets ou DB

### Sprint 9 : Intégrations

**US18 : Import/Export KML**
- Upload de nouveaux fichiers KML pour ajouter territoires
- Export de la carte avec filtres appliqués
- Mise à jour des géométries

**US19 : Synchronisation bi-directionnelle**
- Webhook sur Google Sheets pour détecter modifications externes
- Rafraîchissement automatique de l'index
- Notification des changements concurrents

**US20 : API publique**
- Endpoints REST pour applications tierces
- Documentation OpenAPI/Swagger
- Webhooks pour événements (territoire attribué, rendu)

### Améliorations Techniques

**Performance** :
- Virtualisation des listes de territoires (react-window)
- Lazy loading des géométries KML (charger seulement la bbox visible)
- Compression des données GeoJSON (gzip)
- CDN pour assets statiques

**Sécurité** :
- Rate limiting sur les API routes
- CSRF protection
- Input sanitization (XSS)
- Audit de dépendances (npm audit)

**Monitoring** :
- Sentry pour error tracking
- Analytics (Plausible, Umami)
- Logs structurés (Winston, Pino)
- Alertes sur échecs d'API

**Tests** :
- Augmenter la couverture de tests (objectif 80%)
- Tests de charge (K6, Artillery)
- Tests d'accessibilité (axe, Lighthouse)
- Tests visuels (Percy, Chromatic)

**Infrastructure** :
- CI/CD avec GitHub Actions
- Preview deployments (Vercel, Netlify)
- Environnements staging/production
- Backups automatiques de Google Sheets

---

## 📝 Checklist de Déploiement

Avant de déployer Sprint 3 en production :

- [ ] Vérifier les variables d'environnement :
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  - `GOOGLE_SHEET_ID`
- [ ] Tester tous les scénarios manuels
- [ ] Vérifier les permissions du service account (lecture + écriture)
- [ ] Tester la gestion d'erreur (perte de connexion, Sheets inaccessible)
- [ ] Vérifier les logs (pas de secrets exposés)
- [ ] Tester sur mobile (responsive)
- [ ] Vérifier l'accessibilité (keyboard navigation, screen readers)
- [ ] Documentation utilisateur (guide d'utilisation des actions)
- [ ] Formation des utilisateurs finaux
- [ ] Plan de rollback si problème

---

## 🎯 Conclusion

Sprint 3 transforme l'application de lecture seule en outil de gestion complet avec écriture vers Google Sheets. Les utilisateurs peuvent maintenant :

1. **Attribuer des territoires** avec calcul automatique des dates de suivi
2. **Marquer les retours** avec option de conservation d'historique
3. **Mise à jour en temps réel** sans rechargement de page

L'architecture reste propre et extensible, prête pour les sprints suivants (historique, analytics, collaboration).

**Prochaines étapes recommandées** :
1. Tests manuels complets
2. Déploiement sur environnement de staging
3. Formation des utilisateurs pilotes
4. Collecte de feedback
5. Planification Sprint 4 (Historique et Audit)
