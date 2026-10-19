# Maintainer handover

The generic dashboard starts at core version 0.1.0. The initial extraction retained the reference implementation's nine report sections and offline interaction model, separated the build from customer file paths, and replaced the customer presentation with neutral grayscale layout.

The core repository contains executable source, a header-only input schema, generic configuration, tests, documentation and public geographic assets. Historical customer release records, source datasets, outputs, exchange-rate snapshots, logos, entity exceptions and agreement-specific reporting were excluded.

The first customer adaptation should be made in an ordinary local Codex project folder using docs/CUSTOMER_SETUP.md. Download a fixed shared core release into _core/, record it in CORE_VERSION.txt and keep customer files alongside it. No customer GitHub repository or fork is required. Confirm customer financial basis before enabling hardware annual fees or support-currency assumptions. Contract notes are descriptive; specialized calculations need separately tested customer extensions.

Current scope limitations: processed EIX column layout; no consumption ingestion; no automatic shared-drive synchronization; no two-snapshot comparison; no companion Excel briefing generator. Those workflows were not part of the reference HTML feature set extracted here and require a separately scoped addition.

Start maintenance with AGENTS.md and README.md. Keep one shared core and pin versions in each customer project. Do not recreate whole customer copies of src/.
