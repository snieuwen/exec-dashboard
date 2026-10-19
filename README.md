# Executive dashboard — generic core

A reusable, customer-neutral executive dashboard for an Oracle commercial estate. Version **0.1.0** is the first independent core release, extracted from the existing dashboard implementation.

This repository contains **no customer data, logos, customer themes, contract clauses, customer-specific exclusions or exchange-rate snapshots**. Its default build opens empty. A minimal grayscale layout keeps navigation, tables, maps, mobile views and printing usable; customer presentation is supplied separately.

## Start here

Install Node.js 22 or later, clone this private repository, then run:

```sh
node scripts/build.cjs
```

Open `dist/dashboard.html` in a current Chrome or Edge browser. It works as a local file with no server and no runtime package installation. Choose **Open Source data file** to load a processed `.xlsx` workbook containing `sw-details` and `hw-details`. The generic core never writes back to that workbook.

The source layout is defined in [`schemas/eix-columns.json`](schemas/eix-columns.json). Both sheets are required; either may be header-only. For raw exports and reproducible source preparation, see [the source guide](docs/SOURCE_FORMAT.md).

## Included functionality

- About/scope page and product glossary.
- Executive overview, investment versus recurring fee measures, and renewal timeline.
- Portfolio drilldowns with financial and quantity views and original source evidence.
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

Keep one small private repository per customer. Pin this core to an immutable commit or release and store only that customer's configuration, theme and extensions there. Keep source files and generated reports in the customer's controlled document store.

```text
customer-project/
  package.json            # Exact core commit or release
  customer.json           # Settings and cleansing rules
  customer.css            # Optional customer theme
  extension.js            # Optional trusted customer code
  docs/                   # Contract interpretations and source references
```

Build against an external customer configuration:

```sh
node scripts/build.cjs --config ../customer-project/customer.json --output ../customer-project/outputs/dashboard.html
```

For a reproducible populated build, provide a prepared JSON source and its snapshot date:

```sh
node scripts/build.cjs --config ../customer-project/customer.json --source ../customer-project/data/source.json --snapshot 2026-01-31 --output ../customer-project/outputs/dashboard.html
```

See [customer setup](docs/CUSTOMER_SETUP.md), [architecture](docs/ARCHITECTURE.md), [financial definitions](docs/FINANCIAL_BASIS.md) and [the example configuration](examples/customer-config.json).

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
