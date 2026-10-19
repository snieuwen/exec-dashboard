# Working with the generic dashboard core

- Read README.md and the relevant documents in docs/ before changing affected behavior.
- This is a customer-neutral reusable core. Customer names, logos, data, contract text, private source paths, populated reports, snapshots and customer-specific exceptions do not belong here.
- Customer users work in ordinary local Codex project folders with a fixed core release under _core/. They do not need their own repository or fork. Keep customer configuration, CSS, extension code, knowledge and data outside the unchanged core copy.
- Maintain src/model.js as the shared financial model. Browser and build-time processing must use identical source preparation rules in src/rules.js.
- Preserve raw source values and source-row lineage. Distinguish missing values from zero and require dated exchange rates for conversion.
- Do not infer hardware annual support or purchase currency from another customer's assumptions. See docs/FINANCIAL_BASIS.md.
- Preserve offline use. Do not add telemetry, runtime CDN dependencies or remote calls.
- Build from config/default.json to produce an empty, neutral report. Keep generated artifacts in ignored dist/ and qa/.
- Verify meaningful changes with node --test tests/core.test.cjs, node scripts/check-repository.cjs and node scripts/build.cjs. Run the browser suite for interaction, workbook-loader, rendering and export changes.
- Update documentation and CHANGELOG.md when behavior changes. Use independent semantic core versions; a customer data refresh is not a core release.
- No customer dataset is needed for verification: tests generate fictional examples at runtime.
