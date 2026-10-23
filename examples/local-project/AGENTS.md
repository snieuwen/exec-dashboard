# Local customer dashboard project

- Shared core: https://github.com/snieuwen/exec-dashboard. Read CORE_VERSION.txt and docs/Storage map.md; use an unchanged pinned core outside synced storage.
- Keep original EIX in input/incoming/EIX; do not modify source workbooks. Cleaned data and exclusion audit belong in stage, with original row lineage.
- Mandatory generic cleansing removes Inactive lines and lines whose support/subscription end date is before their input export date. Unsupported perpetual licences are outside scope. Retain and flag missing/invalid dates; never use today as the cutoff.
- Keep customer configuration and all documented exceptions in customizations/customer.json and customizations/README.md. Customer-specific rules remain separate from generic policy.
- Published HTML and manifests belong in outputs. Back up before generating a replacement, use new numbered versions, retain the last five, and copy the newest to an identical latest file. Backups are recovery only.
- Put source references, financial assumptions and verification notes in docs.
- Keep executable builders, helpers, dependencies, QA, temporary files and intermediate builds outside OneDrive, under the agreed local work root with matching customer folders. Never create Python/JS scripts, bytecode or node_modules in synced customer storage.
- Do not create a customer GitHub repository or upload customer data, reports or branding to the generic core.
- Verify counts, financial totals, source evidence and customizations after each refresh. Upgrade core explicitly; compare results before publishing.
