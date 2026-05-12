# OrthoPilot

Application web interne pour un cabinet d’orthodontie / pédogodontie : **Next.js** (App Router), **TypeScript**, **Tailwind**, **Prisma** + **SQLite** en local.

## Prérequis

- Node.js **20+** (recommandé)
- npm (ou pnpm / yarn)

## Installation

À la racine du dossier `orthopilot-app` :

```bash
npm install
```

Créer le fichier d’environnement à partir du modèle :

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Appliquer les migrations Prisma et générer le client :

```bash
npx prisma migrate dev
npx prisma generate
```

Remplir la base avec les données de démonstration (utilisateurs de test, patients fictifs, etc.) :

```bash
npx prisma db seed
```

## Lancer le projet en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). La page de connexion redirige vers le tableau de bord si une session est active.

### Comptes de test (après seed)

Les mots de passe sont ceux définis dans `prisma/seed-b1.ts` (ex. **Naomi123!**, **Julie123!**, etc. — voir le fichier seed pour la liste complète et les emails `@cabinet.local`).

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `prisma db seed` |
| `npm run db:studio` | Prisma Studio |

## Structure utile

- `app/` — routes App Router (pages, API `app/api/`)
- `features/` — vues par domaine (dashboard, patients, etc.)
- `components/` — composants partagés (layout, dashboard, etc.)
- `lib/` — auth, validations Zod, utilitaires
- `prisma/` — `schema.prisma`, migrations, `seed-b1.ts`
- `services/` — logique métier Prisma

## Git / GitHub

1. Ne **pas** committer `.env`, ni la base SQLite locale (`dev.db`), ni `node_modules` / `.next` (déjà couverts par `.gitignore`).
2. Le dépôt peut versionner **`.env.example`** (sans secrets) et les **migrations** Prisma dans `prisma/migrations/`.
3. Après un clone : `npm install`, copier `.env.example` → `.env`, puis `npx prisma migrate dev` et `npx prisma db seed`.

## Licence

Usage interne / projet personnel — préciser la licence si le dépôt devient public.
