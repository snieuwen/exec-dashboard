# Architecture

## Boundaries

The core owns generic estate classification, financial calculations, source evidence, navigation, filtering, exports and offline assembly. Customer repositories own branding, cleansing rules, contract interpretation and additional customer behavior. Source files and report artifacts remain outside this repository.

The existing multi-customer release coordinator, fixed source paths, historical release registry, workbooks, report outputs and customer extraction scripts were deliberately not imported. The generic core has its own release sequence.

## Build pipeline

1. Load and validate customer configuration, defaulting to config/default.json.
2. Load a prepared source JSON file, or create a header-only empty source.
3. Validate the column layout against schemas/eix-columns.json.
4. Apply declarative source preparation and retain original row numbers.
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

An external `extensionFile` may declare `const DashboardExtension = { transformRecords(records, context) { ... } }`. It executes within the report whenever records are normalized, including after workbook refresh. Context contains `source`, `config` and `options`; `options.includeInactive` distinguishes the complete entity directory from Active financial reporting.

The hook must be deterministic, synchronous and return a record array. Preserve record IDs, sheet names, original row pointers, raw financial fields and status scope. Add flags or additional derived fields rather than changing historical source facts. Validate contract calculations with examples in the customer repository. Extensions are trusted executable code, not a sandbox, and are embedded in saved customer reports. The core performs syntax checking; extension-specific semantics require customer tests.

Contract notes are plain text rendered under Data & assumptions. They do not execute calculations. Specialized contract reports require an extension or a separately tested customer tool.

## Distribution

Customer projects should use an exact Git commit, release archive or checked dependency version. They should not track a moving branch for production reports. This repository can be consumed as a private Git dependency using the exported `exec-dashboard` command. Authentication is required to retrieve a private core; no credentials are needed to open a built report.
