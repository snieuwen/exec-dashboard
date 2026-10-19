# Create a customer project

1. Create a separate private customer repository and copy examples/customer-config.json into it as customer.json.
2. Choose an exact core commit or version. Record it in the customer package manifest and run manifest; update it deliberately after regression checks.
3. Set the display label, title, reporting currency and source-scope statement.
4. Document financial assumptions before enabling them. Defaults exclude unconfirmed hardware fees from annual totals and retain order currency for acquisition values.
5. Add ordered cleansing rules where needed. Supported actions are trim, exclude and replace. Columns use exact source header names. Rules may target one sheet. Matching ignores case and surrounding spaces.
6. Add contract notes with source references and effective dates. Put executable contract logic in the customer's extension and test it there.
7. Optionally add customer.css and set themeFile. Relative paths resolve from customer.json. CSS must be self-contained; imports and URLs are rejected.
8. Keep the source workbooks and outputs outside the core repository, with separate customer document-store permissions.
9. Build, review totals and evidence, and archive the output with its manifest and exact input file version.

## Pin the core dependency

After the maintainer publishes a core release tag, a customer package can reference it:

```json
{
  "name": "customer-dashboard",
  "private": true,
  "dependencies": {
    "@snieuwen/exec-dashboard": "git+https://github.com/snieuwen/exec-dashboard.git#v0.1.0"
  },
  "scripts": {
    "build": "exec-dashboard --config customer.json --output outputs/dashboard.html"
  }
}
```

Use the tag only once it exists; an immutable commit SHA is also suitable. Keep a dependency lockfile in each customer repository. Access to both the customer repository and the private core is required.

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

Create a customer test branch, change the pinned core version, rebuild using the same inputs, compare financial totals and source-row counts, and review the affected views and exports. Approve the customer release only after any contract-specific regressions pass. Data refreshes and customer releases do not force every other customer to update.
