# Boost IA Static — CLAUDE.md

## Projet
Plateforme de generation de visuels publicitaires Meta/Instagram par IA. Stack: Next.js 16 + React 19 + Drizzle ORM + PostgreSQL (Supabase) + Claude API + Gemini (rendu image).

## Commandes
- `npm run dev` — serveur dev
- `npx tsc --noEmit` — vérification types (toujours lancer après modification)
- DB migrations : pas de drizzle-kit push (bug), utiliser `node -e` avec le module `postgres` pour ALTER TABLE

## Conventions
- Français pour le contenu utilisateur et les noms stratégiques
- camelCase en TypeScript, snake_case en DB
- Composants UI : shadcn/radix (`src/components/ui/`)
- IDs : nanoid
- Images stockées dans `data/images/`, servies via `/api/images/[filePath]`
- Headlines : max 10 mots, smart truncation (jamais couper sur préposition/article)
- Pas de CTA dans les prompts Gemini

## Zones critiques
- **Pipeline de génération** : `src/lib/engine/` — voir `src/lib/engine/CLAUDE.md` pour l'architecture détaillée
- **Base de connaissances pub** : `src/lib/engine/knowledge/` — 15 fichiers, ~166K chars de méthodologie publicitaire (patterns, copywriting, neuro-design, psychologie)
- **Point d'entrée API** : `src/app/api/generate-batch/route.ts`
- **DB schema** : `src/lib/db/schema.ts` — colonnes JSONB ajoutées manuellement (voir commandes ci-dessus)
- **Brand Rules** : JSONB `brand_rules` sur `brands` — 4 catégories (copy, visual, concept, global) injectées dans le pipeline via `context-filter.ts`
