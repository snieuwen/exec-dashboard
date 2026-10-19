# Release the core

1. Record intended behavior changes in CHANGELOG.md.
2. Increment package.json using semantic versioning. Breaking source/configuration/extension changes require a major release once the core reaches 1.0.
3. Run core tests, the privacy scan, the empty build and the browser suite. CI runs the same checks with fictional records only.
4. Review all files to ensure no customer data, branding, source paths or contract exceptions are included. Keep populated reports, screenshots and manifests outside Git.
5. Commit, push and create an immutable vMAJOR.MINOR.PATCH tag after the checks pass. The repository license remains GPL v3; third-party license notices must travel with distributions.
6. Customer maintainers upgrade their pinned core version separately and run their customer regression checks. Core release numbers are independent of report snapshots and customer revisions.

Archive the source/configuration/input versions alongside each customer artifact. CLI manifests fingerprint the original input JSON and configuration. Browser-saved reports preserve source metadata and settings but are separate artifacts; archive their hashes and originating workbook version in the customer document store when issuing a formal report.
