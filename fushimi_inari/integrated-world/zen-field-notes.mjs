import {Group} from 'three';
import {SpatialCollisionWorld} from './collision.mjs';
import {FIELD_NOTE_REACH,FIELD_OBSERVATIONS,atFieldObservation} from './field-notes.mjs';

// The pond stop uses the public side of the mapped approach (way/301527750),
// with a sightline past the pavilion and rail return. At Mitsutsuji the stair (way/439990449)
// reaches this junction; looking back from the junction shows the last flight.
const stops = {
  'field-pond': {anchor: 'kumataka', label: 'Shin-ike field note', point: [535.766,-128.761], target: [546,-124]},
  'field-steps': {anchor: 'mitsu', label: 'Mitsutsuji field note', point: [556.331,-335.517], target: [552.536,-331.2255]}
};

function publicSupport(assembly,x,z) {
  return (assembly.isWalkable?.(x,z) ?? !!assembly.surfaces?.sample?.(x,z)) || !!assembly.isPublicWalkSupport?.(x,z);
}

export function planFieldNoteSites(assembly) {
  const result = {};
  for (const [id,stop] of Object.entries(stops)) {
    if (!assembly.spatial.byId[stop.anchor] || (id === 'field-pond' && !assembly.shinikeWater?.built)) continue;
    const [x,z] = stop.point;
    if (!publicSupport(assembly,x,z)) continue;
    const floor = assembly.walkHeight(x,z);
    if (!Number.isFinite(floor)) continue;
    const obstacles = new SpatialCollisionWorld(4);
    for (const {type,args} of assembly.colliders ?? []) {
      if (type === 'box' && Math.hypot(x-args[0],z-args[1]) <= Math.hypot(args[2],args[3])+.3) obstacles.addBox(...args);
      if (type === 'cylinder' && Math.hypot(x-args[0],z-args[1]) <= args[2]+.3) obstacles.addCylinder(...args);
    }
    const clear = obstacles.resolvePlayer(x,floor+1.7,z,.28);
    if (Math.hypot(clear.x-x,clear.z-z) > .005) continue;
    const [tx,tz] = stop.target;
    result[id] = {label:stop.label,point:[x,floor,z],target:[tx,id === 'field-pond' ? assembly.shinikeWater.waterLevel : assembly.walkHeight(tx,tz),tz]};
  }
  return result;
}

export function createZenFieldNotes({assembly,camera,journey,sites={},onAction,isBlocked=()=>false}) {
  let pending = null, blocked = true, mode, disposed = false;
  let state = journey?.snapshot?.();
  function cancel() {
    const wasPending = pending !== null;
    pending = null;
    return wasPending;
  }
  const unsubscribe = journey?.subscribe?.(next => {
    if (next.activeWalk !== state?.activeWalk || (pending && next.moments[pending])) cancel();
    state = next;
  });
  const position = [0,0,0];
  function available(id,site) {
    return !disposed && !blocked && mode === 'walk' && !state?.moments?.[id] && !isBlocked() &&
      atFieldObservation(camera.position.toArray(position),site.point) && publicSupport(assembly,position[0],position[2]);
  }
  const interactionRoots = [];
  for (const observation of FIELD_OBSERVATIONS) {
    const {id} = observation, site = sites[id];
    if (!site) continue;
    const root = new Group();
    root.name = site.label;
    root.position.set(...site.point);
    root.userData.fieldNote = id;
    root.userData.interactable = {
      language: 'en', title: site.label, proximity: true, reach: FIELD_NOTE_REACH+.6, requiresFacing: false, cooldownMs: 0,
      isAvailable: () => available(id,site),
      get prompt() {return pending === id ? observation.observe : observation.prompt;},
      directAction() {
        if (!available(id,site)) {cancel();return '';}
        if (pending !== id) {pending = id;return '';}
        cancel();
        return onAction({type:id,completed:true}) ? 'Field note saved.' : '';
      }
    };
    assembly.root.add(root);
    assembly.legacy.interactables.push(root);
    interactionRoots.push(root);
  }
  const stats = {sites,get pending(){return pending;}};
  return {interactionRoots,stats,cancel,update(_dt,_time,state={}) {
    blocked = !!state.blocked;
    mode = state.mode;
    if (pending && !available(pending,sites[pending])) cancel();
  },dispose() {
    if (disposed) return;
    disposed = true;
    cancel();
    unsubscribe?.();
    for (const root of interactionRoots) {
      const index = assembly.legacy.interactables.indexOf(root);
      if (index >= 0) assembly.legacy.interactables.splice(index,1);
      root.removeFromParent();
    }
  }};
}
