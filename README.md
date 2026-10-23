# Executive dashboard — generic core

A reusable, customer-neutral executive dashboard for an Oracle commercial estate. Version **0.7.1** groups Exadata, Exalogic, Private Cloud Appliance and Recovery Appliance hardware under **Engineered Systems**, retaining component groups and original source evidence.

This repository contains **no customer data, logos, customer themes, contract clauses, customer-specific exclusions or exchange-rate snapshots**. Its default build opens empty. A minimal grayscale layout keeps navigation, tables, maps, mobile views and printing usable; customer presentation is supplied separately.

## Start here

For customer work, follow the [local Codex project setup](docs/CUSTOMER_SETUP.md). Each person needs a local folder and access to this shared private repository. No customer repository, fork, Git installation or package manager is required.

To try the generic core directly, install Node.js 22 or later, download a tagged release, extract it and run this from the extracted core folder:

```sh
node scripts/build.cjs
```

Open `dist/dashboard.html` in a current Chrome or Edge browser. It works as a local file with no server and no runtime package installation. Choose **Open Source data file** to load a processed `.xlsx` workbook containing `sw-details` and `hw-details`. The generic core never writes back to that workbook.

The source layout is defined in [`schemas/eix-columns.json`](schemas/eix-columns.json). Both sheets are required; either may be header-only. For raw exports and reproducible source preparation, see [the source guide](docs/SOURCE_FORMAT.md).

## Included functionality

- About/scope page and product glossary.
- Executive overview, investment versus recurring fee measures, and renewal timeline.
- Portfolio drilldowns with financial and quantity views and original source evidence.
- Separate ULA products quantity table, grouped by order, with Unlimited and Capped ULA displays based on License Level.
- Worldwide purchasing-country and entity footprint.
- Offline interactive estate atlas with world and regional focus views.
- Recent purchases, hardware aging and contract renewal grouping.
- Source-wide entity directory, data review flags and financial assumptions.
- Dated currency conversion, original-currency evidence and user-entered rates.
- Browser workbook refresh, CSV exports, current-page printing and complete saved HTML reports.
- Configurable cleansing, contract notes and external customer extensions.
- Reproducible build identifiers and source/configuration fingerprints.

Support, subscriptions and one-time purchases remain separate. Quantities are grouped only for matching product/metric/term combinations. Entitlements do not establish deployment, usage or compliance. Consumption imports, arbitrary workbook layouts and two-snapshot comparisons are not implemented by this core.

## Customer projects

Create an ordinary local folder and open it as a Codex project. Download a fixed release of this shared core into `_core/`. Keep customer settings, styling, extensions, knowledge and files alongside it. Only the generic functionality is maintained in GitHub.

```text
customer-project/
  AGENTS.md               # Local instructions for Codex
  CORE_VERSION.txt        # Exact shared core release used
  _core/
    exec-dashboard-0.3.0/ # Downloaded core; keep unchanged
  customer.json           # Settings and cleansing rules
  customer.css            # Optional customer theme
  extension.js            # Optional trusted customer code
  docs/                   # Contract interpretations and source references
  data/                   # Inputs, or references to shared source files
  outputs/                # Customer reports and manifests
```

From the local customer project folder, build using the downloaded core:

```sh
node _core/exec-dashboard-0.3.0/scripts/build.cjs --config customer.json --output outputs/dashboard.html
```

For a reproducible populated build, provide a prepared JSON source and its snapshot date:

```sh
node _core/exec-dashboard-0.3.0/scripts/build.cjs --config customer.json --source data/source.json --snapshot 2026-01-31 --output outputs/dashboard.html
```

See [customer setup](docs/CUSTOMER_SETUP.md), [architecture](docs/ARCHITECTURE.md), [financial definitions](docs/FINANCIAL_BASIS.md) and [the example configuration](examples/customer-config.json).

The repository URL identifies the shared source; it does not automatically make the code available locally. Download the chosen release once, then build and open reports offline. To upgrade, download a new version into a second folder, compare results and update `CORE_VERSION.txt` when satisfied.

## Verification

The core build and unit tests use only built-in Node.js modules:

```sh
node --test tests/core.test.cjs
node scripts/check-repository.cjs
node scripts/build.cjs
```

For the browser tests, install the development dependencies and Chromium:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:browser
```

On a computer with Edge already installed, set `DASHBOARD_BROWSER_CHANNEL=msedge` before the browser test. Tests generate fictional records in temporary files; those records and all screenshots stay out of Git.

## Before sharing

The **repository** contains no customer records. A **saved report** contains the entire loaded source, including records hidden by filters. Share populated artifacts only within the appropriate customer access boundary. No telemetry or runtime network requests are needed. `.gitignore` and the publication scan help prevent accidental inclusion of source workbooks and generated reports; review changes before publishing.

Repository access and SharePoint/OneDrive access are separate. Use stable source links and documented setup paths rather than one person's local directory.

The existing repository's GPL v3 license is retained. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Mandatory inactive-row cleansing

From core v0.2.0, source preparation always removes software rows with `Support Status = Inactive` and hardware rows with `Contract Status Type = Inactive`, ignoring case and surrounding whitespace. This runs in CLI builds and browser workbook uploads, before configurable customer rules; replacement rules cannot reactivate a removed source row. A row changed to Inactive by a customer rule is also removed.

Inactive rows are absent from the embedded report source, entity directory, CSV exports and saved reports. No customer setting is required to enable this policy, and an empty `cleansing` list does not disable it. Other status values are retained only within the mandatory export-date scope; financial reporting still selects Active only. Original input workbooks remain unchanged. Preparation counts include `excludedInactive`, and original workbook row pointers are retained for surviving rows.

## Mandatory export-date cleansing

From v0.6.0, shared source preparation always removes Inactive rows, then removes any remaining software/cloud row whose Support/Subscription End Date is strictly before the EIX export/snapshot date, or hardware row whose Support Expiration date is strictly before that date. This includes perpetual licences with ended support: unsupported licence rights may still be valid but are outside this dashboard scope. The rule uses the fixed date of each input export, never the execution date or today. End dates equal to the export date are retained. Blank or invalid end dates are retained for review, not guessed.

A populated source requires an explicit valid export date. CLI --snapshot supplies it; browser uploads use the selected snapshot date or an unambiguous filename date. A quarter alone is not an export date. Previous comparison snapshots use their own export dates. Mandatory rules run before and after customer transformations and cannot be disabled. Original workbooks are unchanged; excludedPastEnd is logged separately from excludedInactive and excludedCustomer, with excluded source-row references and reasons. Rows with both reasons are counted under Inactive first, without double counting. Removed records do not enter embedded data, financial or quantity pivots, directories, exports or saved reports. Rows retained at the export date are not removed merely because time later passes.

ULA order rows include an accessible information button after the order label. It opens all retained source lines for that order and entity, including non-ULA products on the same order, with financial values, original source fields and original row references. It does not expand the pivot; ULA product rows remain terminal.
