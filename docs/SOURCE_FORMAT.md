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
