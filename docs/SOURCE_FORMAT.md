# Source format and preparation

The browser accepts processed .xlsx files with `sw-details` and `hw-details`, in the exact header order defined by schemas/eix-columns.json. The full field list is the data contract; no source records are included in the schema. Both sheets are required; a header-only sheet represents an empty portfolio.

Software source fields include status at L, product at S, quantity at Y, purchase date at AC, support dates at AE/AF, purchase USD at AK and annual support USD at AO. Hardware includes product at E, quantity at R, order date at V, acquisition at AD, status at AF, support dates at AG/AH, annual-basis candidate fee at BD and order currency at BK.

## Optional preparation tool

Install Python 3.10+ and the optional workbook dependency:

```sh
python -m pip install -r requirements.txt
python tools/prepare-source.py /path/to/source.xlsx --output /path/to/source.json
```

The tool accepts already processed sheets, or raw `Primary Data` and `HW Data` / `Hardware Data` sheets when their headers match the documented schema. It locates the header row within the first 20 rows, maps columns by exact unique names and writes the generic JSON matrix format. Unknown layouts fail explicitly. Customer-specific layout adapters belong in the customer project.

Dates become `{"date":"YYYY-MM-DD"}` values; strings, numeric values, booleans and blanks remain distinct. Formula cells rely on cached workbook values; if formulas have no cached result the preparation fails rather than treating them as missing values. Recalculate and save the workbook in Excel first. Numeric financial fields must be actual numbers, not locale-formatted text.

The preparation tool never changes the input workbook or applies customer exclusions. Cleansing is configured separately and runs identically in CLI builds and browser uploads. For raw layouts the customer project must retain its extraction mapping; browser lineage points into the prepared workbook, not an assumed original raw row.

Build a report with the prepared source:

```sh
node scripts/build.cjs --source /path/to/source.json --snapshot 2026-01-31 --output /path/to/dashboard.html
```

For browser refresh, continue supplying the processed .xlsx source. A quick upload recognizes YYYY-MM-DD and quarterly dates in filenames; otherwise it asks for the snapshot date. The Data & assumptions page also offers an explicit date field.

## Limits

The embedded reader accepts unencrypted .xlsx workbooks up to 50 MB and enforces ZIP expansion/row limits. It does not calculate Excel formulas, run macros, read arbitrary file types or adapt new schemas. An encrypted workbook must be prepared separately through an authorized workflow.

## Mandatory inactive-row cleansing

From core v0.2.0, source preparation always removes software rows with `Support Status = Inactive` and hardware rows with `Contract Status Type = Inactive`, ignoring case and surrounding whitespace. This runs in CLI builds and browser workbook uploads, before configurable customer rules; replacement rules cannot reactivate a removed source row. A row changed to Inactive by a customer rule is also removed.

Inactive rows are absent from the embedded report source, entity directory, CSV exports and saved reports. No customer setting is required to enable this policy, and an empty `cleansing` list does not disable it. Other status values are retained; financial reporting still selects Active only. Original input workbooks remain unchanged. Preparation counts include `excludedInactive`, and original workbook row pointers are retained for surviving rows.

## Software licence form

Software `License Level` (column Z, zero-based index 25) drives ULA quantity interpretation. `License Type` is a separate source field retained for evidence and does not override License Level.

Recognized Unlimited aliases include `ULA`, `UNLIMITED LICENSE AGREEMENT`, `UNLIMITED LICENCE AGREEMENT`, and either full name followed by `(ULA)`. Capped aliases include `C-ULA`, `CULA`, `Capped ULA`, `ULA Capped` and the explicit capped full-name variants listed in src/model.js. Matching ignores case, repeated whitespace and dash variants. The report label is always `Capped ULA`. Unrecognized ULA-like levels are separated for review rather than added to ordinary quantities; `NO ULA`, `NON ULA` and `NOT ULA` are not ULA indicators. Source values are never rewritten.
