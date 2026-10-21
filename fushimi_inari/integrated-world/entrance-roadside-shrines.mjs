import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const entranceRoadsideShrineIds=Object.freeze(['node/10236496678','node/10236503541','node/10236503542']);
// POI positions are mapped; small architectural dimensions are photo estimates.
// Railings and retaining walls belong to entrance-shrine-enclosures.mjs.
export function buildEntranceRoadsideShrines(root,features,surfaces,materials,colliders){
  const group=new THREE.Group();group.name='Kumano Fujio and Reikon roadside shrines';
  const red=new THREE.MeshStandardMaterial({color:'#a83e29',roughness:.86});
  const white=new THREE.MeshStandardMaterial({color:'#ddd9c9',roughness:.97,side:THREE.DoubleSide});
  const wood=new THREE.MeshStandardMaterial({color:'#4b382b',roughness:.96});
  const bark=new THREE.MeshStandardMaterial({color:'#494137',roughness:.99,side:THREE.DoubleSide});
  const gold=new THREE.MeshStandardMaterial({color:'#a68c4d',roughness:.6,metalness:.38});
  const stone=materials.entryStoneMat??materials.stoneMat??white,batches=new Map(),records=[];
  const put=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>put(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const geo=new THREE.CylinderGeometry(r,r,delta.length(),7);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));geo.translate(...av.add(bv).multiplyScalar(.5).toArray());put(geo,mat);};
  const specs=[
    {id:entranceRoadsideShrineIds[0],name:'Kumano',x:-81.190,z:-16.820,w:1.34,d:.92,plinth:.56,wall:1.05,rise:.52,roofW:1.86,curved:true},
    {id:entranceRoadsideShrineIds[1],name:'Fujio',x:-77.139,z:-16.676,w:1.18,d:.90,plinth:.56,wall:1.17,rise:.57,roofW:1.65},
    {id:entranceRoadsideShrineIds[2],name:'Reikon',x:-72.487,z:-16.587,w:1.45,d:1.04,plinth:.5,wall:1.45,rise:.78,roofW:2.30,dark:true}
  ];
  for(const spec of specs){
    const poi=features.pois?.find(p=>p.id===spec.id),x=poi?.point?.[0]??spec.x,z=poi?.point?.[2]??spec.z;
    const base=surfaces.height(x,z);if(!Number.isFinite(base))throw Error('Nonfinite roadside shrine surface');
    const {w,d,plinth,wall,rise,roofW}=spec,body=spec.dark?wood:red,front=z+d/2;
    // Reikon already has an exact mapped stone retaining rectangle; add only
    // its thin cap, never a second full platform or a new retaining perimeter.
    if(spec.dark)box(1.67,.10,1.40,-72.3365,base+plinth+.02,-16.6145,stone);
    else{
      box(w+.24,plinth-.08,d+.20,x,base+(plinth-.08)/2,z,white);
      box(w+.38,.10,d+.34,x,base+plinth-.03,z,stone);
      box(w+.25,.055,d+.23,x,base+.06,z,stone);
    }
    const y=base+plinth;
    colliders.push({type:'box',args:[x,z,(w+.38)/2,(d+.34)/2,0,base,y+wall,'roadside_shrine_body']});
    box(w,wall,d,x,y+wall/2,z,spec.dark?wood:white);
    box(w+.17,.12,d+.16,x,y+.06,z,body);
    box(w+.20,.12,d+.18,x,y+wall-.045,z,body);
    for(const side of [-1,1])for(const end of [-1,1])box(.10,wall+.08,.10,x+side*(w/2-.03),y+wall/2,z+end*(d/2+.012),body);
    // Closed unlettered paired doors, small hinges and modest horizontal rails.
    const doorW=w*.60,doorH=wall*.76;
    box(doorW,doorH,.045,x,y+wall*.49,front+.025,spec.dark?wood:gold);
    box(.035,doorH,.035,x,y+wall*.49,front+.06,body);
    for(const side of [-1,1]){
      for(const level of [.28,.66])box(.08,.035,.025,x+side*doorW*.44,y+wall*level,front+.065,gold);
      box(.028,.075,.025,x+side*.055,y+wall*.48,front+.07,gold);
    }
    for(const level of [.15,.87])box(w+.05,.07,.09,x,y+wall*level,front+.05,body);
    // Bark roofs use real thickness and short exposed rafter tails. Their
    // silhouettes are based on the supplied 2021 photo, not a measured survey.
    const roofBatchStarts=new Map([...batches].map(([mat,parts])=>[mat,parts.length]));
    const eave=y+wall+.05,roofD=d+.53,half=roofW/2;
    const profile=t=>eave+rise*(1-t)+(spec.curved ? .11*t*t : 0);
    const verts=[],uv=[],strips=spec.curved?8:1;
    for(const side of [-1,1])for(let i=0;i<strips;i++){
      const t0=i/strips,t1=(i+1)/strips,xa=x+side*half*t0,xb=x+side*half*t1;
      for(const zz of [-1,1])beam([xa,profile(t0),z+zz*roofD/2],[xb,profile(t1),z+zz*roofD/2],.045,wood);
      for(const p of [[xa,profile(t0),z-roofD/2],[xb,profile(t1),z-roofD/2],[xa,profile(t0),z+roofD/2],[xb,profile(t1),z-roofD/2],[xb,profile(t1),z+roofD/2],[xa,profile(t0),z+roofD/2]]){verts.push(...p);uv.push(p[0],p[2]);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();put(geo,bark);
    for(const side of [-1,1]){
      box(.075,.09,roofD,x+side*half,profile(1)-.025,z,wood);
      for(let zz=z-roofD/2+.09;zz<z+roofD/2;zz+=.18)box(.18,.045,.045,x+side*(half-.07),profile(1)-.065,zz,wood);
    }
    // Fine parallel bark courses give thickness at the eave without tile ribs.
    for(let i=1;i<5;i++){const t=.80+i*.04;for(const side of [-1,1])box(.025,.018,roofD,x+side*half*t,profile(t)+.012,z,bark);}
    box(.13,.11,roofD+.10,x,eave+rise+.025,z,wood);
    for(const zz of [z-d/2-.015,z+d/2+.015]){
      const gable=new THREE.BufferGeometry();gable.setAttribute('position',new THREE.Float32BufferAttribute([x-w/2,eave,zz,x,eave+rise-.06,zz,x+w/2,eave,zz],3));gable.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,.5,1,1,0],2));gable.computeVertexNormals();put(gable,spec.dark?bark:white);
      box(w,.07,.08,x,eave-.015,zz,body);
      box(.07,rise*.75,.08,x,eave+rise*.37,zz,body);
    }
    if(spec.id===entranceRoadsideShrineIds[1]){
      // Fujio presents a roof pitch to the front: rotate roof and gables only.
      for(const [mat,parts]of batches)for(let i=roofBatchStarts.get(mat)??0;i<parts.length;i++)parts[i].translate(-x,0,-z).rotateY(Math.PI/2).translate(x,0,z);
    }
    if(spec.dark){
      // Chigi cross finials at the two ridge ends, without invented emblems.
      for(const zz of [z-roofD*.37,z+roofD*.37])for(const side of [-1,1])beam([x-side*.22,eave+rise-.16,zz],[x+side*.31,eave+rise+.40,zz],.035,wood);
      // Three compact treads fit inside the mapped rail's open front.
      const treads=[];
      for(let i=0;i<3;i++){
        const zc=-15.52-i*.16,top=base+.16*(i+1);
        box(1.10,.16*(i+1),.16,x,base+.08*(i+1),zc,stone);
        treads.push({zc,top});
      }
      const previousHeight=surfaces.height.bind(surfaces);
      surfaces.height=(px,pz)=>{
        const tread=Math.abs(px-x)<=.55?treads.find(t=>Math.abs(pz-t.zc)<=.08):null;
        return tread?Math.max(previousHeight(px,pz),tread.top):previousHeight(px,pz);
      };
      const tz=-15.40,toriiBase=surfaces.height(x,tz);
      for(const side of [-1,1]){
        beam([x+side*.60,toriiBase,tz],[x+side*.57,toriiBase+1.77,tz],.065,stone);
        colliders.push({type:'cylinder',args:[x+side*.60,tz,.10,toriiBase,toriiBase+1.77,'roadside_stone_torii']});
        box(.20,.12,.20,x+side*.60,toriiBase+.04,tz,stone);
      }
      box(1.68,.13,.19,x,toriiBase+1.82,tz,stone);
      box(1.54,.09,.13,x,toriiBase+1.44,tz,stone);
      box(.09,.30,.10,x,toriiBase+1.62,tz,stone);
    }
    records.push({id:spec.id,name:spec.name,position:[x,base,z],estimatedBody:[w,wall,d],estimatedPlinth:plinth,front:'+Z',estimatedRoofWidth:roofW,roofRidgeAxis:spec.id===entranceRoadsideShrineIds[1]?"X":"Z"});
  }
  for(const [mat,parts]of batches){const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!merged)throw Error('Roadside shrine material merge failed');const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  group.userData={sourceIds:entranceRoadsideShrineIds,records,photo:'https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg',provenance:'Exact OSM POI centres; estimated photo-based dimensions, closed unlettered doors, bark roofs; existing mapped enclosures retain ownership of fences, retaining walls and collisions'};
  root.add(group);return {group,records};
}
export const builder=buildEntranceRoadsideShrines;

