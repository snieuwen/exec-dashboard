# Changelog

## 0.8.1 — 2026-10-27

- Open reports at full cleansed source scope instead of restoring temporary filters from a saved view, including renewal windows and drilldowns. Keep currency and dated exchange rates.
- Save reports with cleared selection filters without changing the current screen selection. Share opening and Reset filter defaults, and cover saved/legacy configurations and repeated openings with browser regression tests.

## 0.8.0 — 2026-10-23

- Ship a neutral customer folder starter with input/incoming/EIX, stage, outputs, backups, customizations and docs, plus version and storage instructions.
- Add init-project to copy the starter into a new folder, refusing existing destinations. Include it in distributed packages; keep executable work outside synced customer storage.
- Replace obsolete setup paths and hardware assumptions in the customer setup guide. No report calculations or customer files change.

## 0.7.1 — 2026-10-23

- Label the Servers component group as Compute Servers within Engineered Systems. Database servers, Storage servers and Servers under other hardware remain unchanged.

## 0.7.0 — 2026-10-23

- Group Exadata, Exalogic Elastic Cloud, Private Cloud Appliance and Recovery Appliance hardware under Engineered Systems using product names and detailed FPH hierarchy, preserving component groups and raw evidence.
- Align hardware aging with the combined scope and migrate saved legacy category filters. Quantities, cleansing and financial calculations are unchanged.

## 0.6.0 — 2026-10-21

- Add an accessible information button beside ULA order names to open all in-scope order/entity source details, keeping pivot expansion and terminal product rows unchanged.

- Mandatorily exclude software/cloud and hardware rows with end dates before their own EIX export date, in CLI builds and browser uploads. Keep end dates equal to the cutoff; require a valid export date for populated input.
- Include perpetual licences with ended support in the exclusion scope; document that unsupported licence rights may remain valid but are outside these reports. Keep missing/invalid end dates for review.
- Log inactive, past-end and customer removals separately with source-row reasons and preserve surviving lineage. Apply scope before and after customer transformations.
- Remove quarter-only filename date inference; retain fixed export-date behaviour, cleaned exports/saves and the collapsed ULA pivot.

## 0.5.0 — 2026-10-21

- Start ULA products and orders collapsed, including a single order. Reveal one level per click and clear descendant expansion when toggling parents.
- End the ULA pivot at plain product rows with quantity/limit and metric; remove product expansion, source-line children, extra columns and the explanatory paragraph below the table.
- List differing capped limits without summing or deeper expansion. Preserve financial pivots, evidence elsewhere and CSV exports.
- Test single/multiple orders, one-level navigation, terminal products, global expand/collapse and saved reports.

## 0.4.0 — 2026-10-21

- Make three hardware reporting rules mandatory for all customers, including legacy configurations: treat support as annual, prefer same-row support currency with order fallback, and calculate blank purchases as zero.
- Preserve source blanks, missing-value flags and original order currency. Distinguish assumed zeros from recorded zeros; invalid nonblank values and missing rates for nonzero values still block totals.
- Update financial evidence, CSV fields, documentation and regression coverage. No change to software purchase-currency policy.

## 0.3.0 â€” 2026-10-21

- Read original software License Level and License Type into the shared model; classify ULA and Capped ULA from License Level only.
- Place ULA products above regular quantity tables with the existing pivot appearance and controls: order/entity -> product -> original evidence. Single orders open by default.
- Display expected ULA quantity 1 as infinity/Unlimited and positive Capped ULA quantities as Max. N. Keep both forms out of regular quantity totals and never sum capped limits across records or orders.
- Flag unexpected ULA quantities, invalid capped limits, unknown ULA-like levels and missing order numbers for review. Preserve raw source values and existing financial calculations.
- Add licence-form and display-quantity evidence columns to CSV exports, with regression coverage for classification, quantities, grouping, controls, source upload, saved reports and mobile layout.

## 0.2.0 â€” 2026-10-21

- Always remove Inactive software and hardware rows during shared source preparation, including CLI builds and browser uploads; the policy cannot be disabled by customer cleansing configuration.
- Keep original input files and surviving source-row lineage unchanged. Record mandatory removals separately as excludedInactive.
- Remove inactive data from embedded reports, entity directories, exports and saved copies; clarify retained source scope in the UI and guides.
- Add regression tests for both sheet types, status casing/whitespace, attempted reactivation, post-rule inactivity, saved-source contents and idempotent cleansing.


- Rewrote onboarding around local Codex customer projects using a downloaded, fixed shared-core release. Removed customer repository and package-manager requirements; added local project instructions, upgrade and handover guidance. Dashboard functionality is unchanged.

## 0.1.0 â€” 2026-10-19

- Extracted a standalone, customer-neutral executive dashboard core.
- Preserved overview, financial/quantity drilldowns, geography, offline atlas, recent purchases, hardware aging, renewals, entity directory and source evidence.
- Added empty builds, independent versions and deterministic content fingerprints.
- Added shared declarative cleansing, customer contract notes and external theme/record-extension hooks.
- Made hardware annual treatment and support-currency preferences explicit customer settings; preserved missing acquisition values.
- Added source preparation, automated regression/browser checks, publication scan and private-customer setup guidance.
- Excluded customer data, logos, styles, entity exceptions, local paths and historical customer release registries.
