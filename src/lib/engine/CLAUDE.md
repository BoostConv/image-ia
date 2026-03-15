# Engine — Pipeline de génération de visuels publicitaires

## Architecture (9 stages)

```
A: context-filter.ts     → Filtre et structure le contexte brand/product/persona
J: batch-locker.ts       → Verrouille le batch (promise + proof + thesis)
B: creative-planner.ts   → Claude génère 3-5 ConceptSpec (idées créatives)
B2: creative-critic.ts   → Évalue et filtre les concepts faibles
C: art-director.ts       → Convertit concept → AdDirectorSpec (direction visuelle)
D: prompt-builder.ts     → Construit le prompt structuré pour Gemini
E: renderer.ts           → Gemini génère l'image
H: quality-gate.ts       → Valide le rendu (retry si échec)
K: dual-evaluator.ts     → Score final sur 10 dimensions
```

Orchestrateur : `pipeline.ts`. Point d'entrée : `POST /api/generate-batch` → construit `RawPipelineInput` → `runPipeline()`.

## Types clés (types.ts)

| Type | Rôle |
|------|------|
| `RawPipelineInput` | Entrée brute du pipeline (brand, products, personas, angles, etc.) |
| `FilteredContext` | Contexte structuré après context-filter (couches 1-4, red_lines, brand_rules) |
| `ConceptSpec` | Idée créative (ad_job, headline, visual_device, belief_shift...) |
| `AdDirectorSpec` | Direction visuelle (éclairage, style, matières, props, composition) |
| `BuiltPrompt` | Prompt final pour Gemini (systemInstruction + contents) |

## Couches stratégiques (4 niveaux d'enrichissement)

1. **Couche 1** — Brief stratégique : identiteFondamentale, positionnementStrategique, tonCommunication
2. **Couche 2** — Analyse produit : FAB benefits, USP triptyque, DUR problems, value equation
3. **Couche 3** — Angles marketing (EPIC) : Emotional, Practical, Identity, Critical
4. **Couche 4** — Rich Persona : 5-level desires, triggers, language profile, decision style

## Structure du prompt Gemini (prompt-builder.ts)

Gemini reçoit **2 niveaux séparés** :

**`systemInstruction`** (identité permanente, poids fort) :
```
[IDENTITÉ VISUELLE MARQUE] — palette, typo, ton visuel
[RÈGLES TYPOGRAPHIQUES]    — sans-serif, contraste, lisibilité mobile
[RÈGLES PRODUIT]           — fidélité packaging depuis photo référence
[INTERDITS — NE JAMAIS VIOLER] — brand rules visual + interdits génériques
[RAPPEL CRITIQUE — FIDÉLITÉ PRODUIT] — redondance voulue pour poids
```

**`contents`** (brief créatif spécifique à cette ad) :
```
[STRATÉGIE]    — objectif, émotion visée, promesse, belief shift
[CONCEPT]      — l'idée forte (visual_device), tension visuelle
[DIRECTION ARTISTIQUE] — éclairage, style, matières, props
[COMPOSITION]  — format, structure, cadrage, placement produit, zone libre
[TEXTE]        — headline (bold), sous-texte, marque, placement
```

## Base de connaissances (knowledge/)

15 fichiers TypeScript, ~166K chars de méthodologie publicitaire importée depuis des PDFs :

| Fichier | Source PDF | Contenu |
|---------|-----------|---------|
| `schwartz-persuasion.ts` | Schwartz awareness | 5 niveaux de conscience → stratégie par niveau |
| `patterns-library.ts` | patterns_persuasifs_v3.pdf | 20 patterns + 50 sous-types + matrice de sélection |
| `layouts-library.ts` | layouts_categorises.pdf | 100 layouts classés en 24 familles |
| `copywriting-framework.ts` | copywriting_ads.pdf | 13 mécanismes de headline + Mark Morgan Ford rules |
| `content-brief-rules.ts` | content_brief_visuel.pdf | Psycho visuelle, pattern Z/F, anti-AI, ugly ads |
| `neuro-design.ts` | — | Règles neuro-design (contraste, hiérarchie, focal) |
| `visual-concepts.ts` | — | Concepts visuels par niveau de conscience |
| `psychology.ts` | — | Psychologie cognitive appliquée aux ads |
| `advanced-tactics.ts` | — | Tactiques avancées par awareness level |
| `copywriting-rules.ts` | — | Règles copy de base |
| `headlines.ts` | — | Templates de headlines + règles texte sur image |
| `evaluator-calibration.ts` | — | Calibration du scoring |

**Sélecteur intelligent** (`selector.ts`) :
- `getKnowledgeForStage(stage, awareness, formatFamilies?)` → renvoie ~3-5K chars pertinents par stage
- Chaque stage ne reçoit QUE ce dont il a besoin, pas les 166K complets
- Injection : `creative-planner.ts` appelle `getKnowledgeForStage("planner", awareness, formats)`

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `pipeline.ts` | Orchestrateur — enchaîne les 9 stages |
| `types.ts` | Tous les types du pipeline |
| `context-filter.ts` | Filtre contexte + injecte brandRules, red_lines, couches 2-4 |
| `creative-planner.ts` | Claude génère les ConceptSpec |
| `art-director.ts` | Direction artistique complète |
| `prompt-builder.ts` | Construit prompt structuré pour Gemini |
| `renderer.ts` | Appel Gemini + gestion images référence |
| `copy-editor.ts` | Claude Haiku polit headline (max 10 mots) |
| `taxonomy.ts` | 8 taxonomies fermées (AdJob, FormatFamily, LayoutFamily...) |
| `headline-utils.ts` | smartTruncateHeadline — jamais couper mid-phrase |
| `composer.ts` | Overlay SVG texte sur image (Sharp) |
| `brand-style-policy.ts` | Résumé style visuel de la marque |
| `layout-templates.ts` | Templates de layout par famille |
| `reference-selector.ts` | Sélection images référence produit |

## Brand Rules (flux d'injection)

```
generate-batch/route.ts → passe brand.brandRules (JSONB)
  → context-filter.ts → dispatche en brand_rules_copy / visual / concept
    → creative-planner.ts reçoit copy + concept rules
    → prompt-builder.ts reçoit visual rules → injecté dans [INTERDITS]
```

4 catégories : **copy** (formulations interdites), **visual** (visuels à éviter), **concept** (types d'idées à bloquer), **global** (appliqué partout).

## Niveaux de créativité

| Niveau | Nom | Effet |
|--------|-----|-------|
| 1 | Classique | Squelette strict (ad_job, lever, layout fixés) |
| 2 | Créatif | Squelette souple, exploration encouragée |
| 3 | Expérimental | Claude peut override ad_job, lever, layout. Gemini reçoit [MODE EXPERIMENTAL] |

Propagation : `creativityLevel` → `creative-planner.ts` → `pipeline.ts` → `prompt-builder.ts` → Gemini systemInstruction + contents.
