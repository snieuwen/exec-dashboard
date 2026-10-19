# Set up a local customer project in Codex

Use the shared private GitHub repository for generic functionality and an ordinary local Codex project for each customer. Users do not need their own GitHub repository, fork, Git installation or package manager for normal dashboard use.

## What you need

- Codex and Node.js 22 or later.
- Read access to [snieuwen/exec-dashboard](https://github.com/snieuwen/exec-dashboard) to download the shared core.
- Access to the customer's source files, locally or through the agreed OneDrive/SharePoint location.

Repository access and source-file access are separate. After the core is downloaded, builds and reports work offline.

## 1. Create a local project folder

Create an ordinary customer folder on your computer and open it as a local project in Codex:

```text
customer-project/
  AGENTS.md
  CORE_VERSION.txt
  _core/
    exec-dashboard-0.1.0/
  customer.json
  customer.css             # Optional
  extension.js             # Optional
  docs/
  data/
  outputs/
```

The `_core` folder holds an unchanged copy of the generic functionality. Customer-specific work belongs outside it. The local project has no GitHub repository and no upload step.

## 2. Download a fixed core version

While signed in to GitHub, open [v0.1.0](https://github.com/snieuwen/exec-dashboard/tree/v0.1.0), choose **Code → Download ZIP**, and extract it under `_core/`. The extracted folder should be `_core/exec-dashboard-0.1.0/`.

Write `v0.1.0` in `CORE_VERSION.txt`. For additional traceability, record its commit `571fea5ff6b31bcb4afde6d231cbbd25032c89db` as well.

The repository URL alone does not install or mount the shared code. Codex needs this downloaded copy to run the builder locally. Use a fixed release rather than the moving main branch for formal reports. The instructions on main are the current setup guide; older release archives retain their original documentation.

## 3. Set up customer files

Copy `_core/exec-dashboard-0.1.0/examples/customer-config.json` to `customer.json` in the local project root. Set the customer label, title, reporting currency and source-scope statement. Keep source references and contract interpretations in `docs/`.

Document financial assumptions before enabling them. Defaults exclude unconfirmed hardware fees from annual totals and retain order currency for acquisition values. Supported cleansing actions are trim, exclude and replace. Columns use exact source header names; rules may target one sheet. Matching ignores case and surrounding spaces.

For customer presentation, create `customer.css` and set `themeFile` to `customer.css` in customer.json. CSS must be self-contained; imports and URLs are rejected. For additional logic, create `extension.js` and set `extensionFile` to `extension.js`. Paths resolve relative to customer.json. The [extension API](ARCHITECTURE.md#customer-extension-api) describes the supported hook. Contract notes are descriptive; executable contract calculations need separately tested customer extensions or tools.

Put source files in `data/`, or document their shared location. Put reports in `outputs/`. Neither belongs under `_core/`.

## 4. Give Codex local project instructions

Create `AGENTS.md` in the local project root using the text below. A reusable copy is in [the current local-project example](../examples/local-project/AGENTS.md).

```markdown
# Local customer dashboard project

- Shared core: https://github.com/snieuwen/exec-dashboard.
- Read CORE_VERSION.txt to identify the downloaded version under _core/.
- Use the downloaded core builder; keep _core/ unchanged.
- Keep customer settings in customer.json, optional presentation in customer.css,
  optional additional logic in extension.js, and project knowledge in docs/.
- Store source files in data/ or the agreed document store and reports in outputs/.
- Do not create a customer GitHub repository or upload customer files to the core.
- Document contract interpretations, source references, effective dates and assumptions.
- Check source counts, totals and supporting evidence after each source refresh.
- Upgrade the shared core only when requested; compare old and new outputs first.
```

These instructions describe the local customer workspace for new Codex chats. The downloaded core also contains its own maintenance instructions for files inside `_core/`.

## 5. Build and open the dashboard

From the local customer project root, run:

```sh
node _core/exec-dashboard-0.1.0/scripts/build.cjs --config customer.json --output outputs/dashboard.html
```

Open `outputs/dashboard.html` in Chrome or Edge. Choose **Open Source data file** to load a processed `.xlsx` workbook containing `sw-details` and `hw-details`. Use **Save report** to preserve the loaded source and settings in a new local HTML file.

For a reproducible populated build, supply a prepared JSON source and its snapshot date:

```sh
node _core/exec-dashboard-0.1.0/scripts/build.cjs --config customer.json --source data/source.json --snapshot 2026-01-31 --output outputs/dashboard.html
```

The adjacent manifest records source/configuration fingerprints and core version. Archive it with the report and the exact input file version. See the [source guide](SOURCE_FORMAT.md) for optional workbook preparation; Python is not required to build an empty report and load a processed workbook through the browser.

## Configuration

- schemaVersion: configuration format, currently 1.
- label/title: display text, escaped before use in HTML.
- reportCurrency: three-letter ISO code supported by the dashboard currency selector.
- scopeNote: the customer perimeter and scope caveats.
- financial.hardwareSupportAnnual: explicit confirmation that the hardware support field represents annual fees.
- financial.hardwarePurchaseCurrency: order by default; support enables an explicit assumption.
- financial.softwarePurchaseCurrency: order by default; support enables an explicit assumption.
- cleansing: ordered declarative source transformations, rerun on browser uploads.
- reviewEntities: exact entity names requiring review; these are flags, not exclusions.
- contractNotes: title, text, source and effectiveFrom fields.
- fxDefaults: rates, rateDates and rateOrigins maps. Rates are currency units per 1 USD; every non-USD conversion needs a positive rate and date.
- themeFile/extensionFile: optional paths relative to customer configuration.

## Update the core

Local projects do not update automatically. Download the chosen new release into a second versioned folder under `_core/`, retaining the previous version. Build a candidate report with the same customer settings and inputs, using a separate output filename. Compare totals, source-row counts, affected views, exports and customer calculations. When satisfied, update CORE_VERSION.txt and use the new builder path. Retain the previous version while older reports need to be reproduced.

Reusable functionality is maintained centrally. Customer settings and extensions stay outside `_core/`, so replacing or upgrading the downloaded core does not overwrite them.

## Share or hand over the local project

Share the local project folder through the agreed OneDrive/SharePoint location or another approved file-transfer method. Include its instructions, version record, configuration, extensions and project knowledge. Source-file permissions remain separate; populated reports contain the entire loaded source, including records hidden by filters.

The recipient opens the folder as a local Codex project. They can use the included core copy or download the same fixed release with their own GitHub access. A shared folder is useful for exchanging customer files but is not required to consume the generic core.
