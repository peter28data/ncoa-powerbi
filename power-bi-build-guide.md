# Power BI Build Guide — Aging in America (NCOA)

## 1. Load the data
Import `ncoa_aging_data.xlsx` (Get Data → Excel). It has three tables:
`KPI Summary`, `Chronic Conditions`, `Falls Fear PrePost`. No relationships needed —
they're independent lookup tables, not a star schema, since this is publish-ready
aggregate data rather than transactional records.

## 2. Why DAX measures, not calculated columns
A **calculated column** computes once per row and is stored in the model. A
**measure** computes on the fly, in the context of whatever's on the visual —
so the same measure returns a different number depending on which slicer or
axis it's sitting behind. Everything below is a measure because every number
in this report needs to react to the Age Cohort slicer.

## 3. Measures

Create these in `Chronic Conditions` unless noted. Right-click the table →
**New Measure**.

```dax
Arthritis Rate =
SELECTEDVALUE ( 'Chronic Conditions'[Prevalence (decimal)] )
```
**Purpose:** drives the arthritis bar chart. Because `Prevalence (decimal)` is
one value per cohort row, `SELECTEDVALUE` returns that row's rate when the
cohort is filtered to one value, and blank if two cohorts are both selected —
which is exactly the toggle behavior the mockup's slicer fakes in JavaScript.

```dax
Selected Cohort Label =
IF (
    HASONEVALUE ( 'Chronic Conditions'[Cohort] ),
    SELECTEDVALUE ( 'Chronic Conditions'[Cohort] ) & ": " &
        FORMAT ( [Arthritis Rate], "0.0%" ) & " have arthritis.",
    "Both cohorts shown — select one in Filters to compare."
)
```
**Purpose:** feeds the readout text box under the chart. `HASONEVALUE` checks
whether the slicer has narrowed the table to a single cohort before building
the sentence — this is the standard DAX pattern for slicer-reactive text.

```dax
Fear Reduction (pts) =
SUM ( 'Falls Fear PrePost'[Change (pts)] )
```
**Purpose:** used on a KPI card for the "A lot" / "A little" rows. Reads the
pre-computed Excel column rather than re-subtracting, so the workbook and the
report always agree.

```dax
Population Growth Multiple =
DIVIDE (
    CALCULATE ( SUM ( 'KPI Summary'[Value] ), 'KPI Summary'[Metric] = "Older adults population, 2060 projection" ),
    CALCULATE ( SUM ( 'KPI Summary'[Value] ), 'KPI Summary'[Metric] = "Older adults population" )
)
```
**Purpose:** powers a "1.5x by 2060" style KPI card. `DIVIDE` is used instead
of `/` because it returns blank instead of erroring if a filter ever removes
one side of the ratio.

```dax
Falls Cost Per Capita ($) =
DIVIDE (
    CALCULATE ( SUM ( 'KPI Summary'[Value] ), 'KPI Summary'[Metric] = "Annual health care cost of non-fatal falls" ) * 1000000000,
    CALCULATE ( SUM ( 'KPI Summary'[Value] ), 'KPI Summary'[Metric] = "Adults who fall annually, count" ) * 1000000
)
```
**Purpose:** derives a stat NCOA doesn't publish directly (cost per person who
falls) from two it does. Unit conversion happens inside the measure so the
Excel source stays in the millions/billions units NCOA actually reports.

## 4. Report layout (one page, matches the HTML mockup)

| Zone | Visual type | Fields |
|---|---|---|
| Filter pane | Slicer | `Chronic Conditions[Cohort]` |
| KPI row (4 cards) | Card | `[Population Growth Multiple]`, `KPI Summary[Value]` filtered to chronic-condition and falls rows |
| Arthritis chart | Clustered column | Axis: `Cohort`, Value: `[Arthritis Rate]` |
| Falls fear chart | Clustered column | Axis: `Fear Level`, Values: `Pre-Program (%)`, `Post-Program (%)` |
| Chronic conditions table | Table/Matrix | `Condition`, `Cohort`, `Prevalence (%)` |
| Readout text box | Card (fx-bound) | `[Selected Cohort Label]` |

Set the Cohort slicer to **single-select** so `SELECTEDVALUE` and `HASONEVALUE`
behave as written above.

## 5. Data caveat to carry into the report
NCOA publishes aggregate statistics only — no row-level, state-level, or
year-by-year time series. Don't build a continuous population trend line from
this source; the workbook has exactly two population data points (current
and the 2060 projection). A card or a two-point line is honest; an
interpolated multi-year line implies data NCOA hasn't released.
