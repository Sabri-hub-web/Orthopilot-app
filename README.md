# OrthoPilot

Application web interne pour un cabinet d’orthodontie / pédogodontie : **Next.js** (App Router), **TypeScript**, **Tailwind**, **Prisma** + **PostgreSQL** (ex. **Supabase** en test / prod).

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

Appliquer les migrations Prisma (le client est régénéré après `npm install` via `postinstall`) :

```bash
# Développement local
npx prisma migrate dev

# Base déjà initialisée (CI / prod) — sans créer de migration
npx prisma migrate deploy
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

1. Ne **pas** committer `.env` ni les variantes (`.env.production`, etc.), ni les fichiers `*.db` locaux, ni `node_modules` / `.next` (voir `.gitignore`). **`.env.example`** reste versionné sans mots de passe réels.
2. Versionner les **migrations** dans `prisma/migrations/` ; les secrets Supabase restent dans le tableau de bord / Vercel uniquement.
3. Après un clone : `npm install`, copier `.env.example` → `.env`, renseigner `DATABASE_URL` / `DIRECT_URL`, puis `npx prisma migrate deploy` (ou `migrate dev`) et `npx prisma db seed` si besoin de données démo.

## Déploiement test (Vercel)

1. Projet Vercel pointant sur ce repo ; **Root directory** = dossier `orthopilot-app` si le repo est monorepo.
2. Variables d’environnement : au minimum **`DATABASE_URL`** (URL pooler transaction Supabase, comme en local), pour **Production** et **Preview** si tu utilises les deux. **`DIRECT_URL`** n’est pas nécessaire au runtime Vercel ; garde-la en local ou en CI pour `prisma migrate deploy`. Sans `DATABASE_URL`, le déploiement peut réussir mais l’app plantera à la première requête base (connexion, API).
3. Build : `npm run build` (défaut Vercel). `postinstall` exécute **`prisma generate`**.
4. Après le premier déploiement : appliquer le schéma sur la base cible avec `npx prisma migrate deploy` depuis ta machine (`.env` → prod) ou via une étape CI — pas automatiquement à chaque build Vercel sauf si tu l’ajoutes volontairement au script de build.
5. Cookie de session : en HTTPS (Vercel), le flag **Secure** sur le cookie d’auth est activé en production (`NODE_ENV=production`).

## Licence

Usage interne / projet personnel — préciser la licence si le dépôt devient public.
