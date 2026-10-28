import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {zenJourneyLocations} from './zen-locations.mjs';
import {createZenJourney} from './zen-journey-state.mjs';
const fixture=()=>({spatial:{byId:{inari_bridge:{checkpoint:[-200,4,-80]},yotsu:{checkpoint:[800,160,-220]},summit:{checkpoint:[1170,230,10]},senbon:{target:[100,30,-20]}},twins:[{at:t=>({point:[100+t*100,30,-20]})}]},keihanStation:{spec:{publicExit:{position:[-302,4,-140]},route:{platformDoor:[-302,4,-170]}}}});
test('actual street machine points and registered canal checkpoint allow the completed activities',()=>{
 const assembly=fixture(),locations=zenJourneyLocations(assembly,null,{machines:[{spec:{position:[-170,4,-75]}}]}),journey=createZenJourney({locations});
 assert.deepEqual(locations.canal,[-200,4,-80]);
 assert.equal(journey.recordMoment('drink',{position:[-168,5.7,-75],mode:'walk',intent:'interact'}),true);
 assert.equal(journey.recordMoment('sketch-canal',{position:[-200,5.7,-80],direction:[0,0,1],mode:'walk',fov:45,intent:'observe'}),true);journey.dispose();
});
test('Senbon photo and observation require looking along the existing passage',()=>{
 const locations=zenJourneyLocations(fixture()),journey=createZenJourney({locations}),pose={position:[104,31.7,-20],direction:[-1,0,0],mode:'walk',weather:'clear',fov:45,width:1920,height:1080,intent:'observe'};
 assert.equal(journey.recordMoment('sketch-gates',pose),false);assert.deepEqual(journey.recordPhoto(pose).promptIds,[]);
 assert.equal(journey.recordMoment('sketch-gates',{...pose,direction:[1,0,0]}),true);assert.deepEqual(journey.recordPhoto({...pose,direction:[1,0,0]}).promptIds,['gate-rhythm']);journey.dispose();
});

test('canal observations face the real canal beside the mapped bridge, rather than the street',()=>{
 const assembly=fixture();assembly.keihanApproach={bridge:{west:[-202,-80],east:[-198,-80]}};const journey=createZenJourney({locations:zenJourneyLocations(assembly)}),pose={position:[-200,5.7,-80],mode:'walk',fov:45,intent:'observe'};
 assert.equal(journey.recordMoment('sketch-canal',{...pose,direction:[1,0,0]}),false);assert.equal(journey.recordMoment('sketch-canal',{...pose,direction:[0,0,1]}),true);journey.dispose();
});

test('previously cached versioned gameplay imports resolve to their current release owners',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8'),imports=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
 for(const spec of ['./yotsutsuji-context-r95.mjs?v=95-release','./walking.mjs?v=immersion-20261025c','./proximity-interaction.mjs?v=counter-reach-3','./photo-mode.mjs?v=ultra-1','./keihan-street-commerce.mjs?v=immersion-20261025c']){
  const owner=spec.split('?')[0];assert.match(imports[owner],/\?v=/);assert.equal(imports[spec],imports[owner],spec+' must share one refreshed module');
 }
});
