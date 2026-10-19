// Build-time only: geographic paths are embedded; the report needs no network or map service.
const d3=require('../vendor/d3.min.js'),topojson=require('../vendor/topojson-client.min.js');
const world=require('../vendor/countries-50m.json');
const features=topojson.feature(world,world.objects.countries).features;
const anchors={'250':[2.5,47],'840':[-100,39],'124':[-105,56],'643':[38,56],'578':[10,63],'528':[5.3,52.2],'826':[-2,54],'036':[134,-25],'554':[174,-41]};
const regions={world:{label:'World'},europe:{label:'Europe focus',bounds:[[-14,34],[47,62]]},asia:{label:'Asia Pacific',bounds:[[65,-45],[180,58]]},americas:{label:'Americas',bounds:[[-170,-56],[-30,72]]}};
const geometry={countries:features.map(f=>({id:f.id,name:f.properties.name})),regions:{}};
for(const [id,region] of Object.entries(regions)){
 const projection=id==='world'?d3.geoNaturalEarth1().fitExtent([[18,22],[902,508]],{type:'Sphere'}):d3.geoMercator().fitExtent([[25,25],[895,510]],{type:'MultiPoint',coordinates:region.bounds});
 projection.clipExtent([[1,1],[919,539]]);
 const path=d3.geoPath(projection).digits(1);
 geometry.regions[id]={label:region.label,graticule:path(d3.geoGraticule10()),countries:features.map(f=>{
  const point=anchors[f.id]||d3.geoCentroid(f),xy=projection(point);
  const inFocus=id==='world'||point[0]>=region.bounds[0][0]&&point[0]<=region.bounds[1][0]&&point[1]>=region.bounds[0][1]&&point[1]<=region.bounds[1][1];
  return {id:f.id,name:f.properties.name,path:path(f)||'',x:+xy[0].toFixed(1),y:+xy[1].toFixed(1),inFocus};
 })};
}
module.exports=geometry;
