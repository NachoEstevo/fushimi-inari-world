import {Vector3} from 'three';
import {compileSelectedVisuals} from './scoped-compilation.mjs';

const finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const validBounds=b=>b?.isBox3?!b.isEmpty()&&finitePoint(b.min)&&finitePoint(b.max):
 b?.isSphere&&finitePoint(b.center)&&Number.isFinite(b.radius)&&b.radius>=0;

// Run only while welcome/quality preparation owns the renderer. Exact walking
// owners, including dormant LOD levels, become ready as one finite neighborhood.
// The caller retains camera, visibility, walking and render-queue ownership.
export async function prepareWalkingNeighborhood({entries,position,camera,scene,quality,textureStreaming,service,radius,
 yieldWork=()=>globalThis.scheduler?.yield?.()??new Promise(resolve=>setTimeout(resolve,0)),getLights,
 compile=compileSelectedVisuals,onCompiled,report=()=>{},isCurrent=()=>true,now=()=>performance.now()}={}){
 if(!finitePoint(position)||!camera?.isCamera||!finitePoint(camera.position))throw new TypeError('Walking preparation requires a world position and the render camera');
 if(!Number.isFinite(radius)||radius<=0||radius>300)throw new RangeError('Walking preparation radius must be greater than zero and at most 300 metres');
 if(!entries?.[Symbol.iterator]||typeof service?.markPrepared!=='function'||!Number.isFinite(service?.stats?.generation))throw new TypeError('Walking preparation requires registered owners and their service');
 const point=new Vector3().copy(position),generation=service.stats.generation,start=now(),superseded=Error('Walking preparation superseded');
 const stats={phase:'textures',generation,radius,inspected:0,owners:0,roots:0,leaves:0,prepared:0,textures:0,textureFailures:0,elapsedMs:0};
 const current=()=>isCurrent()&&service.stats.generation===generation;
 const emit=()=>{stats.elapsedMs=Math.max(0,now()-start);report({...stats});};
 const guard=()=>{if(!current())throw superseded;};
 const yieldGuarded=async()=>{guard();await yieldWork();guard();};
 try{
  guard();emit();
  const textures=await textureStreaming.prepareAt(point);guard();
  stats.textures=textures?.textures??0;stats.textureFailures=textures?.failed??0;
  const owners=[],roots=[];
  for(const [object,bounds]of entries){
   stats.inspected++;
   if(!object?.isObject3D||!validBounds(bounds)||bounds.distanceToPoint(point)>radius)continue;
   // Compile exactly the hierarchy that the walking service would prepare.
   // Warming only leaves cannot mark a registered Group/LOD owner as ready.
   const visuals=object.isLOD?object.levels.map(level=>level.object):[object],ownerRoots=new Set(visuals),pending=[...visuals],seen=new Set();
   while(pending.length){
    const child=pending.pop();if(seen.has(child))continue;seen.add(child);if(!child.visible&&!ownerRoots.has(child))continue;
    // Some registered detail Groups own a LOD deeper in their hierarchy. Its
    // dormant levels need the same explicit-root admission as a top-level LOD.
    if(child.isLOD)for(const {object:level}of child.levels)if(!ownerRoots.has(level)){ownerRoots.add(level);pending.push(level);}
    pending.push(...child.children);
   }
   if(!ownerRoots.size)continue;owners.push(object);roots.push(...ownerRoots);
  }
  stats.owners=owners.length;stats.roots=roots.length;stats.phase='compile';emit();guard();
  if(roots.length)await compile(quality,scene,roots,camera,{batchSize:4,yieldWork:yieldGuarded,reuseRenderScene:true,includeHiddenRoots:true,getLights,
   onCompiled:batch=>{guard();stats.leaves+=batch.length;onCompiled?.(batch);}});
  guard();
  for(const object of owners){guard();service.markPrepared(object);stats.prepared++;}
  stats.phase='ready';emit();return {...stats};
 }catch(error){
  stats.phase=error===superseded?'superseded':'failed';emit();
  if(error===superseded)return {...stats};
  throw error;
 }
}
