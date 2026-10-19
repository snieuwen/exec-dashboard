/* Copy to a customer project. Do not add actual customer rules to the core. */
const DashboardExtension={
 transformRecords(records,{config,options}){
  // Add deterministic customer-specific flags/derived fields here.
  // Respect options.includeInactive and preserve source IDs and amounts.
  return records;
 }
};
