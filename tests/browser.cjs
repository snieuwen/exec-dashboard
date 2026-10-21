const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const {build}=require('../scripts/build.cjs'),{fixture,workbook,ulaFixture}=require('./helpers.cjs');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'exec-dashboard-browser-')),qa=path.resolve('qa');fs.mkdirSync(qa,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.DASHBOARD_BROWSER_CHANNEL?{channel:process.env.DASHBOARD_BROWSER_CHANNEL}:{})});
 const errors=[],remote=[];
 try{
  const output=path.join(tmp,'empty.html');build({output});const page=await browser.newPage({viewport:{width:1512,height:1100}});page.on('pageerror',e=>errors.push(e.stack));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(output).href);await page.locator('.empty-start').waitFor();assert.equal(await page.locator('.nav button').count(),9);
  assert.equal(await page.locator('.brand img').count(),0);
  for(const view of ['overview','atlas','portfolio','geography','recent','aging','renewals','data','notice']){await page.locator('.nav [data-view="'+view+'"]').click();assert((await page.locator('#main').innerText()).length>100,view);}
  await page.screenshot({path:path.join(qa,'generic-empty.png'),fullPage:true});
  const source=fixture();source['hw-details'].push([...source['hw-details'][1]]);source['hw-details'][2][31]=' InAcTiVe ';source['hw-details'][2][0]='Historical hardware entity';source['sw-details'][2][31]={date:'2026-01-31'};const expiredSw=[...source['sw-details'][1]];expiredSw[4]='Expired software entity';expiredSw[31]='2026-01-30';source['sw-details'].push(expiredSw);const expiredHw=[...source['hw-details'][1]];expiredHw[0]='Expired hardware entity';expiredHw[33]='2026-01-30';source['hw-details'].push(expiredHw);const xlsx=path.join(tmp,'Example_2026-01-31.xlsx');fs.writeFileSync(xlsx,workbook(source));
  await page.locator('#quick-source-file').setInputFiles(xlsx);await page.waitForFunction(()=>/Loaded|Source not loaded/.test(document.getElementById('quick-load-status').textContent));assert.match(await page.locator('#quick-load-status').innerText(),/Loaded 3 Active records/);
  assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),600);
  await page.screenshot({path:path.join(qa,'generic-overview.png'),fullPage:true});
  await page.locator('.nav [data-view="portfolio"]').click();await page.locator('[data-portfolio-mode="quantity"]').click();await page.locator('[data-quantity-expand="all"]').click();assert.equal(await page.locator('[data-quantity-level="line"]').count(),3);
  await page.locator('[data-portfolio-mode="financial"]').click();await page.locator('[data-quantity-expand="all"]').click();assert.equal(await page.locator('[data-quantity-level="line"]').count(),3);
  await page.locator('[data-record]').first().click();await page.locator('#detail[open]').waitFor();await page.locator('#detail-body summary').click();assert.match(await page.locator('#detail-body').innerText(),/TEST-/);await page.locator('#close-detail').click();
  const [csv]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);const csvPath=path.join(tmp,'evidence.csv');await csv.saveAs(csvPath);assert.match(fs.readFileSync(csvPath,'utf8'),/Original_EIX_row/);
  await page.locator('.nav [data-view="atlas"]').click();await page.locator('.atlas-map').waitFor();assert(await page.locator('.atlas-land').count()>20);await page.locator('.atlas-rank[data-atlas-country="276"]').click();assert.match(await page.locator('.atlas-spotlight').innerText(),/Germany/);
  await page.screenshot({path:path.join(qa,'generic-atlas.png'),fullPage:true});
  await page.locator('.nav [data-view="data"]').click();assert(!(await page.locator('#main').innerText()).includes('${esc('));await page.locator('#fx-currency').selectOption('EUR');await page.locator('#rate').fill('0.8');await page.locator('#rate-date').fill('2026-01-31');await page.locator('#apply-rate').click();await page.locator('.nav [data-view="overview"]').click();await page.locator('#currency').selectOption('EUR');
  await page.locator('.nav [data-view="overview"]').click();assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),480);
  const [saved]=await Promise.all([page.waitForEvent('download'),page.locator('#save-report').click()]);const savedPath=path.join(tmp,'saved.html');await saved.saveAs(savedPath);const savedHtml=fs.readFileSync(savedPath,'utf8');const cleanedEmbedded=JSON.parse(savedHtml.match(/id="report-source" type="application\/json">(.*?)<\/script>/s)[1]);assert.equal(cleanedEmbedded['sw-details'].length,3);assert.equal(cleanedEmbedded['hw-details'].length,2);assert(!JSON.stringify(cleanedEmbedded).includes('Historical hardware entity'));assert(!JSON.stringify(cleanedEmbedded).includes('Other Example Entity'));assert(!JSON.stringify(cleanedEmbedded).includes('Expired software entity'));assert(!JSON.stringify(cleanedEmbedded).includes('Expired hardware entity'));assert.equal(cleanedEmbedded['sw-details'][2][31].date,'2026-01-31');const p2=await browser.newPage();p2.on('pageerror',e=>errors.push(e.message));await p2.goto(pathToFileURL(savedPath).href);await p2.locator('.report-notice').waitFor();assert.equal(await p2.locator('#currency').inputValue(),'EUR');await p2.close();
  await page.setViewportSize({width:390,height:844});for(const view of ['overview','atlas','data']){await page.locator('.nav [data-view="'+view+'"]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),view+' mobile overflow');}
  await page.screenshot({path:path.join(qa,'generic-mobile.png'),fullPage:true});
  // A separate customer configuration survives source refresh and saved copies.
  const config=JSON.parse(fs.readFileSync(path.resolve('config/default.json'),'utf8'));config.label='Example workspace';config.financial.hardwareSupportAnnual=true;config.cleansing=[{sheet:'sw-details',action:'exclude',column:source['sw-details'][0][11],values:['Inactive']}];config.contractNotes=[{title:'Example note',text:'<script>unexpected()</script>',source:'Example reference',effectiveFrom:'2026-01-01'}];config.extensionFile='extension.js';fs.writeFileSync(path.join(tmp,'extension.js'),'const DashboardExtension={transformRecords(records){return records.map(r=>({...r,flags:[...r.flags,"CUSTOM_TEST"]}));}};');fs.writeFileSync(path.join(tmp,'customer.json'),JSON.stringify(config));const customerOutput=path.join(tmp,'customer.html');build({config:path.join(tmp,'customer.json'),output:customerOutput});
  await page.setViewportSize({width:1512,height:1100});await page.goto(pathToFileURL(customerOutput).href);await page.locator('#quick-source-file').setInputFiles(xlsx);await page.waitForFunction(()=>/Loaded|Source not loaded/.test(document.getElementById('quick-load-status').textContent));assert.match(await page.locator('#quick-load-status').innerText(),/Loaded 3 Active records/);assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),600);await page.locator('.nav [data-view="data"]').click();assert.match(await page.locator('#main').innerText(),/CUSTOM_TEST/);assert.match(await page.locator('#main').innerText(),/<script>unexpected\(\)<\/script>/);assert.equal(await page.locator('#main script').count(),0);assert.equal(await page.locator('#main').getByText('Other Example Entity',{exact:true}).count(),0);
  const [customerSaved]=await Promise.all([page.waitForEvent('download'),page.locator('#save-report').click()]);const customerSavedPath=path.join(tmp,'customer-saved.html');await customerSaved.saveAs(customerSavedPath);await page.goto(pathToFileURL(customerSavedPath).href);await page.locator('.nav [data-view="overview"]').click();assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),600);
  // Legacy customer settings cannot disable shared hardware policy.
  config.financial.hardwareSupportAnnual=false;config.financial.hardwarePurchaseCurrency='order';
  fs.writeFileSync(path.join(tmp,'customer.json'),JSON.stringify(config));build({config:path.join(tmp,'customer.json'),output:customerOutput});
  const blankSource=fixture();blankSource['hw-details'][1][29]=null;
  const blankFile=path.join(tmp,'Blank_2026-01-31.xlsx');fs.writeFileSync(blankFile,workbook(blankSource));
  await page.goto(pathToFileURL(customerOutput).href);await page.locator('#quick-source-file').setInputFiles(blankFile);
  await page.waitForFunction(()=>/Loaded/.test(document.getElementById('quick-load-status').textContent));
  assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),600);
  await page.locator('.nav [data-view="portfolio"]').click();await page.locator('[data-quantity-expand="all"]').click();
  await page.locator('[data-record="hw-details!2"]').first().click();await page.locator('#detail[open]').waitFor();
  assert.match(await page.locator('#detail-body').innerText(),/Source purchase amount is blank; calculated as zero/);await page.locator('#close-detail').click();
  const [blankCsv]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const blankCsvPath=path.join(tmp,'blank.csv');await blankCsv.saveAs(blankCsvPath);assert.match(fs.readFileSync(blankCsvPath,'utf8'),/Hardware_purchase_blank_as_zero/);
  const [blankSaved]=await Promise.all([page.waitForEvent('download'),page.locator('#save-report').click()]);
  const blankSavedPath=path.join(tmp,'blank-saved.html');await blankSaved.saveAs(blankSavedPath);
  assert.equal(JSON.parse(fs.readFileSync(blankSavedPath,'utf8').match(/id="report-source" type="application\/json">(.*?)<\/script>/s)[1])['hw-details'][1][29],null);
  await page.goto(pathToFileURL(blankSavedPath).href);await page.locator('.nav [data-view="overview"]').click();
  assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),600);
  // Scope follows the chosen export date, not the current day or a quarter-end guess.
  const earlierFile=path.join(tmp,'Earlier_2026-01-30.xlsx');fs.writeFileSync(earlierFile,workbook(source));
  await page.goto(pathToFileURL(output).href);await page.locator('#quick-source-file').setInputFiles(earlierFile);await page.waitForFunction(()=>/Loaded/.test(document.getElementById('quick-load-status').textContent));assert.match(await page.locator('#quick-load-status').innerText(),/Loaded 5 Active records/);
  const quarterFile=path.join(tmp,'Quarter_2026-Q1.xlsx');fs.writeFileSync(quarterFile,workbook(source));
  page.once('dialog',dialog=>dialog.accept('2026-01-31'));await page.locator('#quick-source-file').setInputFiles(quarterFile);await page.waitForFunction(()=>/Loaded 3 Active/.test(document.getElementById('quick-load-status').textContent));
  // ULA and Capped ULA use the same pivot controls, evidence and source refresh path.
  const ulaSource=ulaFixture();ulaSource['sw-details'].find(row=>row[27]==='TEST-REGULAR-ONE')[27]='TEST-CAPPED-ORDER';const ulaFile=path.join(tmp,'ULA_2026-01-31.xlsx');fs.writeFileSync(ulaFile,workbook(ulaSource));
  await page.goto(pathToFileURL(output).href);await page.locator('#quick-source-file').setInputFiles(ulaFile);
  await page.waitForFunction(()=>/Loaded/.test(document.getElementById('quick-load-status').textContent));
  const baseline=Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount'));
  await page.locator('.nav [data-view="portfolio"]').click();assert.equal(await page.locator('.ula-quantity-table').count(),0);
  await page.locator('[data-portfolio-mode="quantity"]').click();assert.equal(await page.locator('.ula-quantity-table').count(),1);
  assert(await page.evaluate(()=>{const all=[...document.querySelectorAll('table.quantity-table')];return all[0].classList.contains('ula-quantity-table');}));
  assert.equal(await page.locator('[data-ula-level="order"]').count(),0);
  assert.equal(await page.locator('.ula-note').count(),0);
  await page.locator('[data-ula-level="root"] button').click();assert.equal(await page.locator('[data-ula-level="order"]').count(),3);
  assert.equal(await page.locator('[data-ula-level="product"]').count(),0);
  await page.locator('[data-ula-level="order"] [data-quantity-node]').first().click();assert(await page.locator('[data-ula-level="product"]').count()>0);
  assert.equal(await page.locator('[data-ula-level="product"] button').count(),0);
  const icon=page.getByRole('button',{name:'View all details for order TEST-CAPPED-ORDER — Example Entity',exact:true});
  const expandedBefore=await page.locator('[data-ula-level="product"]').count();await icon.click();await page.locator('#detail[open]').waitFor();
  assert.match(await page.locator('#detail-title').innerText(),/TEST-CAPPED-ORDER/);assert.match(await page.locator('#detail-body').innerText(),/Example single licence/);assert.equal(await page.locator('[data-ula-order-line]').count(),3);
  await page.locator('#detail-body details summary').first().click();assert.match(await page.locator('#detail-body').innerText(),/License Level/);await page.locator('#close-detail').click();assert.equal(await page.locator('[data-ula-level="product"]').count(),expandedBefore);

  await page.locator('[data-ula-level="root"] button').click();
  await page.locator('[data-ula-level="root"] button').click();assert.equal(await page.locator('[data-ula-level="product"]').count(),0);
  await page.locator('[data-quantity-expand="all"]').click();
  assert.equal(await page.locator('.ula-quantity-table [data-quantity-level="line"]').count(),0);
  assert.equal(await page.locator('.regular-quantity-table [data-quantity-level="line"]').count(),4);
  const ulaText=await page.locator('.ula-quantity-table').innerText();assert.match(ulaText,/∞ Unlimited/);assert.match(ulaText,/Max. 250/);assert(!ulaText.includes('Max. 500'));assert(!ulaText.includes('ULA Capped'));
  await page.screenshot({path:path.join(qa,'generic-ula.png'),fullPage:true});
  assert.equal(await page.locator('.ula-quantity-table [data-record]').count(),0);
  const [ulaCsv]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);await ulaCsv.saveAs(path.join(tmp,'ula-evidence.csv'));const evidence=fs.readFileSync(path.join(tmp,'ula-evidence.csv'),'utf8');assert.match(evidence,/License_Level_source/);assert.match(evidence,/∞ Unlimited/);assert.match(evidence,/Max. 250/);
  await page.locator('#entity').selectOption('Example Entity');assert.equal(await page.locator('.ula-quantity-table').count(),1);await page.locator('#reset').click();
  const [ulaSaved]=await Promise.all([page.waitForEvent('download'),page.locator('#save-report').click()]);await ulaSaved.saveAs(path.join(tmp,'ula-saved.html'));
  await page.goto(pathToFileURL(path.join(tmp,'ula-saved.html')).href);await page.locator('.nav [data-view="portfolio"]').click();assert.equal(await page.locator('.ula-quantity-table').count(),1);assert.equal(await page.locator('[data-ula-level="order"]').count(),0);
  await page.locator('[data-portfolio-mode="financial"]').click();assert.equal(await page.locator('.ula-quantity-table').count(),0);await page.locator('[data-quantity-expand="all"]').click();assert.equal(await page.locator('[data-quantity-level="line"]').count(),9);
  await page.locator('.nav [data-view="overview"]').click();assert.equal(Number(await page.locator('[data-kpi="annual"]').getAttribute('data-report-amount')),baseline);
  await page.locator('.nav [data-view="portfolio"]').click();await page.locator('[data-portfolio-mode="quantity"]').click();await page.locator('[data-quantity-expand="all"]').click();await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:path.join(qa,'generic-ula-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);const result={passed:true,sections:9,emptyStart:true,mandatoryInactiveCleansing:true,ulaQuantityPivot:true,sourceReload:true,financialAndQuantityPivots:true,sourceEvidence:true,map:true,fx:true,csv:true,savedReport:true,mobile:true,pageErrors:errors,networkRequests:remote.length};fs.writeFileSync(path.join(qa,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
