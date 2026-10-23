# Set up a customer dashboard project

Download the generic core from [the shared repository](https://github.com/snieuwen/exec-dashboard) into an external local working directory, outside OneDrive. Use a fixed commit/archive and record its version and commit. Node.js 22 or later is required; builds work offline after download.

## Create the standard structure

From the downloaded core, run:

```sh
node scripts/init-project.cjs --output /path/to/new-customer-folder
```

The destination must not exist. The command copies [examples/local-project](../examples/local-project), including:

```text
customer-folder/
  AGENTS.md
  CORE_VERSION.txt
  input/incoming/EIX/
  stage/
  outputs/
  backups/
  customizations/customer.json
  docs/Storage map.md
```

Git tracks the README files so the folders survive archive downloads. Source input is singular `input`, matching the established dashboard setup. Put raw EIX exports in input/incoming/EIX and leave them unchanged. Put cleansed matrices, exclusion audit and original source lineage in stage. Keep customer configuration, themes, logos and documented exceptions in customizations. Optional themeFile and extensionFile paths resolve relative to customizations/customer.json; executable extensions should reference the external working location.

Keep builders, scripts, dependencies, temporary files and QA outside synced storage, for example under `C:/Temp/Executive Dashboards/<customer>/`, with matching working subfolders. Keep unchanged core copies under that local work root's `_core/`. Record the exact paths and commit in docs/Storage map.md. The starter itself installs no runtime and processes no customer data.

## Configure and build

Edit customizations/customer.json for the customer name, reporting currency and scope. Document exceptions, contract sources and dated FX separately. The mandatory generic hardware policy treats support as annual, prefers same-row support currency for acquisition with order-currency fallback, and calculates blank acquisitions as zero while preserving source blanks. Generic scope cleansing always removes Inactive and past-end rows using the export date, including unsupported perpetual licences outside scope. Extra cleansing belongs to the customer configuration.

Invoke the external core builder with explicit customer paths:

```sh
node /path/to/local-core/scripts/build.cjs --config /path/to/customer-folder/customizations/customer.json --source /path/to/customer-folder/stage/source.json --snapshot 2026-01-31 --output /path/to/customer-folder/outputs/dashboard_v1.0.0.html
```

Omit --source and --snapshot for an empty report. Raw EIX exports require preparation into the documented source layout; the initializer does not provide a raw-workbook intake pipeline. See [SOURCE_FORMAT.md](SOURCE_FORMAT.md). Browser loading supports processed workbooks in that layout.

Back up existing HTML and manifests before generating replacements. Use a fresh numbered version, verify source counts, totals, views, evidence and customizations, then copy the newest verified report to an identical latest HTML. Retain the last five numbered versions and their manifests; preserve retired copies under backups. The initializer documents this release policy; it does not automate publishing or retention. Do not use the low-level builder to overwrite a published version.

## Configuration

- schemaVersion: configuration format, currently 1.
- label/title: display text, escaped before use in HTML.
- reportCurrency: three-letter ISO code supported by the dashboard currency selector.
- scopeNote: the customer perimeter and scope caveats.
- financial.hardwareSupportAnnual: retained for compatibility; annual hardware support treatment is mandatory.
- financial.hardwarePurchaseCurrency: retained for compatibility; same-row support currency preference with order fallback is mandatory.
- financial.softwarePurchaseCurrency: order by default; support enables an explicit assumption.
- cleansing: ordered declarative source transformations, rerun on browser uploads.
- reviewEntities: exact entity names requiring review; these are flags, not exclusions.
- contractNotes: title, text, source and effectiveFrom fields.
- fxDefaults: rates, rateDates and rateOrigins maps. Rates are currency units per 1 USD; every non-USD conversion needs a positive rate and date.
- themeFile/extensionFile: optional paths relative to customer configuration.

## Update the core

Local projects do not update automatically. Download the chosen new release into a second versioned folder under the external working directory’s `_core/`, retaining the previous version. Build a candidate report with the same customer settings and inputs, using a separate output filename. Compare totals, source-row counts, affected views, exports and customer calculations. When satisfied, update CORE_VERSION.txt and use the new builder path. Retain the previous version while older reports need to be reproduced.

Reusable functionality is maintained centrally. Customer settings and extensions stay outside `_core/`, so replacing or upgrading the downloaded core does not overwrite them.

## Share or hand over the local project

Share the local project folder through the agreed OneDrive/SharePoint location or another approved file-transfer method. Include its instructions, version record, configuration, extensions and project knowledge. Source-file permissions remain separate; populated reports contain the entire loaded source, including records hidden by filters.

The recipient opens the folder as a local Codex project. They can use the included core copy or download the same fixed release with their own GitHub access. A shared folder is useful for exchanging customer files but is not required to consume the generic core.

## Mandatory inactive-row cleansing

From core v0.2.0, source preparation always removes software rows with `Support Status = Inactive` and hardware rows with `Contract Status Type = Inactive`, ignoring case and surrounding whitespace. This runs in CLI builds and browser workbook uploads, before configurable customer rules; replacement rules cannot reactivate a removed source row. A row changed to Inactive by a customer rule is also removed.

Inactive rows are absent from the embedded report source, entity directory, CSV exports and saved reports. No customer setting is required to enable this policy, and an empty `cleansing` list does not disable it. Other status values are retained only within the mandatory export-date scope; financial reporting still selects Active only. Original input workbooks remain unchanged. Preparation counts include `excludedInactive`, and original workbook row pointers are retained for surviving rows.

## ULA quantity view

Core v0.3.0 reads software License Level directly. No customer extension or configuration is needed. ULA products appear in a separate pivot above the regular quantity tables. Financial views still include all selected records using the existing monetary calculations. See FINANCIAL_BASIS.md for quantity semantics and SOURCE_FORMAT.md for supported source values.

## Mandatory export-date cleansing

From v0.6.0, shared source preparation always removes Inactive rows, then removes any remaining software/cloud row whose Support/Subscription End Date is strictly before the EIX export/snapshot date, or hardware row whose Support Expiration date is strictly before that date. This includes perpetual licences with ended support: unsupported licence rights may still be valid but are outside this dashboard scope. The rule uses the fixed date of each input export, never the execution date or today. End dates equal to the export date are retained. Blank or invalid end dates are retained for review, not guessed.

A populated source requires an explicit valid export date. CLI --snapshot supplies it; browser uploads use the selected snapshot date or an unambiguous filename date. A quarter alone is not an export date. Previous comparison snapshots use their own export dates. Mandatory rules run before and after customer transformations and cannot be disabled. Original workbooks are unchanged; excludedPastEnd is logged separately from excludedInactive and excludedCustomer, with excluded source-row references and reasons. Rows with both reasons are counted under Inactive first, without double counting. Removed records do not enter embedded data, financial or quantity pivots, directories, exports or saved reports. Rows retained at the export date are not removed merely because time later passes.
