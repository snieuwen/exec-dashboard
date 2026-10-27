# Storage map

- Customer folder: original input, cleansed stage, published outputs, backups, customizations and documentation.
- External local work root: `C:/Temp/Executive Dashboards/<customer>/` (or an agreed equivalent), mirroring the customer folder names for intermediate files; also keep builders, dependencies and QA here.
- Shared unchanged core: external local work root `_core/exec-dashboard-0.8.1/`; record exact commit when installed.
- Do not put scripts, bytecode, node_modules or package caches in a synced customer folder.

The starter creates folders and a neutral configuration only. It does not import data, install the core, run customer cleansing, generate reports or implement output retention. Those remain explicit build/release steps. Back up existing reports before generating replacements, retain five numbered HTML versions and manifests, and copy the newest to an identical latest file.
