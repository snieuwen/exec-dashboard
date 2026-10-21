# Financial basis and explicit assumptions

The core is an estate interpretation tool. It does not establish actual use, entitlement compliance, renewal pricing or future payment obligations.

- Financial reporting selects Active source status. The entity directory may also show other statuses.
- Original software acquisition, annual software support, subscriptions and hardware acquisition are separate measures. Historical purchases are not added to annual recurring fees.
- Software support uses the source Annualized Support Fee - USD column. Cloud and Java SE subscriptions use the subscription basis represented by that source field.
- Hardware Support Fees (USD) is not automatically annual. By default it remains visible in original evidence and is excluded from annual hardware/recurring totals. Set hardwareSupportAnnual only with a documented customer confirmation; this setting applies to the entire supplied hardware population. Mixed-period inputs require preparation or an extension with separate tests.
- Purchase currency defaults to the source order/purchase currency. Support currency can be preferred only through an explicit customer setting. Original source fields remain unchanged.
- A blank hardware acquisition is unavailable, not zero. Any selected missing acquisition amount makes the combined hardware investment total unavailable. Source blanks are flagged.
- Original-currency amounts are used directly when they match reporting currency. Otherwise a source USD equivalent may be used; further conversion needs positive dated rates. Missing rates remain visible.
- OCI CURRENCY UNIT quantities become an annual commitment only with a supported annual term and an unambiguous source currency or exact confirmation. A commitment is not measured consumption.
- Quantities combine only matching product/metric/term units; component quantities are not counts of complete hardware systems.
- End-date calendars allocate current fee baselines once to the recorded ending date. They are not renewal quotations or cash-flow forecasts. Perpetual licence rights do not necessarily expire with support.
- Entity names and purchasing countries describe the source population; they do not prove legal ownership, deployment location or a complete customer perimeter.

Customer contract exceptions must record source clause, effective dates, interpretation and expected examples in the customer project. Avoid importing any assumption merely because it worked for a different customer.

## ULA and Capped ULA quantities

- Software License Level, not License Type, drives the quantity classification. A quantity of 1 alone never establishes ULA rights.
- A recognized ULA level with the expected source placeholder quantity 1 displays as `∞ Unlimited`. A different or missing quantity is flagged for review; original values remain unchanged.
- Capped ULA displays a positive source quantity as `Max. N`. Missing, zero or negative limits are flagged for review. Capped ULA with quantity 1 displays Max. 1, never Unlimited.
- Quantity views place one ULA products pivot above regular quantity pivots: ULA products -> order number and source entity -> product/part/metric/term/licence form -> original rows. A single order opens by default; multiple orders can be expanded individually. Missing order numbers stay separate by source record.
- ULA and Capped ULA rows never enter regular quantity totals. Unlimited values are not summed; equal repeated capped values are displayed once at product level, while differing values require expansion. No caps are summed across orders or entities. No deduplication or independent entitlement calculation is implied.
- Raw quantities and both original licence fields remain in evidence. CSV exports add the licence form, display quantity, quantity-table section, capped limit and review explanation without replacing raw Quantity.
- The change applies to quantity presentation only. Acquisition values, support fees, subscription fees, currencies and financial pivots are unchanged. Recorded rights and limits do not measure deployment, remaining capacity or compliance. Support dates do not establish a ULA deployment term.
