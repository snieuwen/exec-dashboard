# Architecture

## Boundaries

The shared repository owns generic estate classification, financial calculations, source evidence, navigation, filtering, exports and offline assembly. Each customer uses an ordinary local Codex project folder for branding, cleansing rules, contract interpretation and additional behavior. Customer files stay outside the shared core. No customer repository or fork is required.

The existing multi-customer release coordinator, fixed source paths, historical release registry, workbooks, report outputs and customer extraction scripts were deliberately not imported. The generic core has its own release sequence.

## Build pipeline

1. Load and validate customer configuration, defaulting to config/default.json.
2. Load a prepared source JSON file, or create a header-only empty source.
3. Validate the column layout against schemas/eix-columns.json.
4. Remove Inactive software/hardware rows, apply declarative customer rules and retain original row numbers. The same mandatory cleansing runs on browser uploads.
5. Assemble static geography, generic code, neutral CSS, configuration and optional external CSS/extension into a self-contained HTML report.
6. Write an adjacent manifest identifying the core version, build ID, source snapshot and content hashes.

Identical source/configuration/code and output options yield identical HTML. Build identity is based on content, not the wall clock. The displayed snapshot is the data date, separate from the core version.

## Modules

| Module | Responsibility |
|---|---|
| src/model.js | Normalization, classifications, grouping, financial bases, currency conversion and review flags |
| src/rules.js | Shared declarative cleansing and original row lineage |
| src/app.js | Browser state, navigation, drilldowns, source refresh and downloads |
| src/report-quantities.js | Product/metric/term quantity grouping and shared pivot interactions |
| src/report-footnotes.js | Presentation of common financial explanations |
| src/atlas.js | Map classification, aliases, measures and shading |
| src/xlsx-reader.js | Local workbook ZIP/XML reader |
| src/report.html | Data-free report shell and assembly markers |
| src/layout.css | Neutral layout and responsive/print behavior |
| scripts/build.cjs | Offline build entry point and provenance manifest |
| tools/prepare-source.py | Optional workbook-to-JSON preparation |

## Customer extension API

An external `extensionFile` may declare `const DashboardExtension = { transformRecords(records, context) { ... } }`. It executes within the report whenever records are normalized, including after workbook refresh. Context contains `source`, `config` and `options`; `options.includeInactive` distinguishes all retained statuses in the entity directory from Active financial reporting; source Inactive rows have already been removed and are never supplied to extensions.

The hook must be deterministic, synchronous and return a record array. Preserve record IDs, sheet names, original row pointers, raw financial fields and status scope. Add flags or additional derived fields rather than changing historical source facts. Validate contract calculations with examples in the local customer project. Extensions are trusted executable code, not a sandbox, and are embedded in saved customer reports. The core performs syntax checking; extension-specific semantics require customer tests.

Contract notes are plain text rendered under Data & assumptions. They do not execute calculations. Specialized contract reports require an extension or a separately tested customer tool.

## Distribution

Each local Codex project downloads a fixed release archive into a versioned folder under `_core/` and records it in CORE_VERSION.txt. Customer configuration and extensions live alongside the unchanged core copy. Invoke the builder directly with Node.js; normal customer use requires no Git repository or package installation.

Private repository access is required to download or update the core. After download, builds and reports work locally without repository access. A repository URL alone does not provide executable files. Updates are deliberate: retain the old core, test a new version with the same inputs and then update the version record.

## ULA quantity presentation

The shared model exposes licenseEntitlement(record), derived only from software License Level and the original quantity. The shared ReportQuantities renderer separates these records in quantity mode, reusing the existing pivot classes, expand/collapse actions and source-detail hooks. Financial mode bypasses this split. Customers consume this behavior by upgrading the unchanged core release; no customer-specific ULA renderer is required.
