# Changelog

## 0.2.0 — 2026-10-21

- Always remove Inactive software and hardware rows during shared source preparation, including CLI builds and browser uploads; the policy cannot be disabled by customer cleansing configuration.
- Keep original input files and surviving source-row lineage unchanged. Record mandatory removals separately as excludedInactive.
- Remove inactive data from embedded reports, entity directories, exports and saved copies; clarify retained source scope in the UI and guides.
- Add regression tests for both sheet types, status casing/whitespace, attempted reactivation, post-rule inactivity, saved-source contents and idempotent cleansing.


- Rewrote onboarding around local Codex customer projects using a downloaded, fixed shared-core release. Removed customer repository and package-manager requirements; added local project instructions, upgrade and handover guidance. Dashboard functionality is unchanged.

## 0.1.0 — 2026-10-19

- Extracted a standalone, customer-neutral executive dashboard core.
- Preserved overview, financial/quantity drilldowns, geography, offline atlas, recent purchases, hardware aging, renewals, entity directory and source evidence.
- Added empty builds, independent versions and deterministic content fingerprints.
- Added shared declarative cleansing, customer contract notes and external theme/record-extension hooks.
- Made hardware annual treatment and support-currency preferences explicit customer settings; preserved missing acquisition values.
- Added source preparation, automated regression/browser checks, publication scan and private-customer setup guidance.
- Excluded customer data, logos, styles, entity exceptions, local paths and historical customer release registries.
