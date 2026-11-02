# Organisation presets and evidence search

Every dashboard has an English Organisation / source entity filter with Presets — organisations and Individual source entities (original names). With no configured presets, a disabled No organisation presets configured item stays visible. A configured organisation without mapped retained Active lines stays listed as no mapped source lines. Source names are preserved verbatim, including their original languages.

Configure organizationPresets as an array of objects with unique id, English label and description, and optional entities (exact source names) or parties (exact string party IDs). Both criteria use OR matching. Source rows can belong to multiple presets but are counted only once within a selection. A selected preset intersects with all other filters. New unrecognised names remain selectable individually; do not silently assign them to an organisation. Selecting an individual source name keeps its existing exact-match behaviour.

For each customer, research useful operating units, brands or source-name families; document references and mapping evidence in customizations. An official business division alone is insufficient to allocate a source entity. Where the source cannot establish a useful assignment, retain an empty preset and explain that no reliable mapping is available. Do not infer current ownership or deployment from historical source names. Customer names, research and mappings never belong in this repository.

Example neutral configuration:

```json
{"organizationPresets":[{"id":"operations","label":"Operations","description":"Explicitly mapped source entities.","entities":["Example Operations Ltd"],"parties":["12345"]},{"id":"research","label":"Research","description":"No reliable source mapping available.","entities":[]}]}
```

Search evidence matches all supplied terms against the same source line, across source reference, product, entity, country, order, contract, CSI, subscription ID, part, party, family, component group, metric, license level/type, agreement, instance, term, status, portfolio/segment and start/end/order dates. Different terms may occur in different fields; case and Latin accents are ignored. Use double quotes for a phrase that must occur within one field. Empty searches leave scope unchanged. It searches retained records only, without changing source values, mandatory cleansing or source lineage. Directory-name search remains separate.
