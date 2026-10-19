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
