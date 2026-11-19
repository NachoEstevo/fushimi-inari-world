import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Group,PerspectiveCamera} from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {createProximityInteractions} from './proximity-interaction.mjs';
import {createZenJourney} from './zen-journey-state.mjs';
import {createZenFieldNotes,planFieldNoteSites} from './zen-field-notes.mjs';

function fixture() {
  const read = path => JSON.parse(readFileSync(new URL(path,import.meta.url)));
  const terrain = read('../geography/terrain.json'), features = read('../geography/features.json');
  const surfaces = makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
  const root = new Group(), camera = new PerspectiveCamera();
  const assembly = {root,surfaces,colliders:[],spatial:{byId:{kumataka:{},mitsu:{}}},shinikeWater:{built:true,waterLevel:65.3},legacy:{interactables:[]},walkHeight:surfaces.height};
  const sites = planFieldNoteSites(assembly), locations = Object.fromEntries(Object.entries(sites).map(([id,site])=>[id,site.point]));
  let raw = null, otherActivity = false, onActionCalls = 0;
  const storage = {getItem:()=>raw,setItem:(_,value)=>{raw=value;}};
  const journey = createZenJourney({storage,locations});
  const notes = createZenFieldNotes({assembly,camera,journey,sites,isBlocked:()=>otherActivity,onAction(event) {
    assert.equal(event.completed,true);
    onActionCalls++;
    return journey.recordMoment(event.type,{position:camera.position.toArray(),mode:'walk',intent:'interact'});
  }});
  const walking = createProximityInteractions({targets:assembly.legacy.interactables,camera});
  function move(site) {
    camera.position.fromArray(site.point);
    camera.position.y += 1.7;
    camera.lookAt(...site.target);
    notes.update(0,0,{mode:'walk'});
  }
  return {assembly,camera,sites,journey,notes,walking,move,storage,locations,block(value){otherActivity=value;},get actions(){return onActionCalls;}};
}

test('the two observation stops use actual public path surfaces and do not add drawables',()=>{
  const f = fixture();
  const pond = f.sites['field-pond'], steps = f.sites['field-steps'];
  assert.equal(f.assembly.surfaces.sample(pond.point[0],pond.point[2]).segment.id,'way/301527750');
  assert.equal(f.assembly.surfaces.sample(steps.point[0],steps.point[2]).segment.stair,true);
  assert.ok(f.notes.interactionRoots.every(root=>!root.children.length));
  f.assembly.colliders.push({type:'box',args:[pond.point[0],pond.point[2],1,1,0,pond.point[1],pond.point[1]+2,'temporarily blocked']});
  assert.equal(planFieldNoteSites(f.assembly)['field-pond'],undefined);
  f.notes.dispose();
  assert.equal(f.assembly.legacy.interactables.length,0);
  f.journey.dispose();
});

test('one press observes, the second saves, and looking around never steals the confirmation',()=>{
  const f = fixture();
  const site = f.sites['field-steps'];
  f.move(site);
  assert.match(f.walking.find().userData.interactable.prompt,/Observe the stone steps/);
  const first = f.walking.run();
  assert.equal(first.message,'');
  assert.equal(f.actions,0);
  assert.equal(f.journey.snapshot().fieldSheet,null);
  assert.match(first.object.userData.interactable.prompt,/Save note/);
  f.camera.lookAt(site.point[0]+15,site.point[1]+12,site.point[2]-10);
  assert.equal(f.walking.run().message,'Field note saved.');
  assert.equal(f.journey.snapshot().fieldSheet.notes[0].id,'field-steps');
  assert.equal(f.walking.run(),null);
  assert.equal(f.actions,1);
  f.notes.dispose();f.journey.dispose();
});

test('leaving, another activity, disabled walking or reload drops pending and keeps saved notes',()=>{
  const f = fixture();
  f.move(f.sites['field-pond']);
  f.walking.run();f.walking.run();
  const steps = f.sites['field-steps'];
  for (const cancel of [
    ()=>{f.camera.position.x+=5;f.notes.update(0,1,{mode:'walk'});},
    ()=>{f.block(true);f.notes.update(0,1,{mode:'walk'});f.block(false);},
    ()=>f.notes.update(0,1,{blocked:true,mode:'walk'}),
    ()=>f.notes.update(0,1,{mode:'fly'}),
    ()=>f.journey.setActiveWalk('gates'),
    ()=>f.notes.cancel()
  ]) {
    f.move(steps);f.walking.run();
    assert.equal(f.notes.stats.pending,'field-steps');
    cancel();
    assert.equal(f.notes.stats.pending,null);
    assert.deepEqual(f.journey.snapshot().fieldSheet.notes.map(n=>n.id),['field-pond']);
  }
  f.move(steps);f.walking.run();
  f.notes.dispose();f.journey.dispose();
  const next = createZenJourney({storage:f.storage,locations:f.locations});
  assert.deepEqual(next.snapshot().fieldSheet.notes.map(n=>n.id),['field-pond']);
  next.dispose();
});
