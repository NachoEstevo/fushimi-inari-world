import * as THREE from 'three';

export const azumamaroHouseIds = ['way/305214616', 'way/305214824'];

// The mapped polygons remain authoritative. Elevations and facade details are
// inferred from the street reference: glazed timber left, vermilion shrine rear.
export function buildAzumamaroHouses(root, features, ground, materials, colliders) {
  const timber = new THREE.MeshStandardMaterial({color:'#675846',roughness:.88});
  const trim = new THREE.MeshStandardMaterial({color:'#aa946d',roughness:.8});
  const red = new THREE.MeshStandardMaterial({color:'#b93d28',roughness:.78});
  const plaster = new THREE.MeshStandardMaterial({color:'#dfd9c8',roughness:.95});
  const glass = new THREE.MeshStandardMaterial({color:'#78847c',roughness:.25,metalness:.18});
  const dark = new THREE.MeshStandardMaterial({color:'#47443a',roughness:.95});
  const roof = materials.roofMat.clone(); roof.color.set('#535c5a'); roof.side=THREE.DoubleSide;
  const stone = materials.entryStoneMat;
  const groups=[];
  for (const id of azumamaroHouseIds) {
    const f=features.buildings.find(b=>b.id===id); if(!f)continue;
    const shrine=id===azumamaroHouseIds[1], points=f.points;
    const x0=Math.min(...points.map(p=>p[0])), x1=Math.max(...points.map(p=>p[0]));
    const z0=Math.min(...points.map(p=>p[2])), z1=Math.max(...points.map(p=>p[2]));
    const cx=(x0+x1)/2, cz=(z0+z1)/2, w=x1-x0,d=z1-z0;
    // Seat the public facade at its approach, rather than lifting it to the
    // uphill rear corner. The footing below continues to the lower terrain.
    const approachSamples=[x0+(x1-x0)*.2,cx,x0+(x1-x0)*.8].map(x=>ground(x,z0-.12)).sort((a,b)=>a-b);
    const floor=approachSamples[1]+.04;
    const low=Math.min(...points.map(p=>ground(p[0],p[2])))-.15;
    const g=new THREE.Group();g.name=shrine?'Azumamaro mapped rear worship hall':'Azumamaro mapped glazed timber enclosure';
    g.position.y=floor;g.userData={sourceFeature:id,facadeProvenance:'inferred from supplied street reference'};
    const box=(sx,sy,sz,x,y,z,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;};
    const polygon=(bottom,height,mat)=>{
      const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));
      const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);
      const mesh=new THREE.Mesh(geo,mat);mesh.position.y=bottom;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
    };
    polygon(low-floor,floor-low,stone);
    const h=shrine?2.65:2.45, eave=h+.16, ridge=eave+(shrine?1.20:1.08), over=shrine?.58:.48;
    polygon(.04,h,shrine?plaster:timber);
    // Street-facing facade, with glazed reception windows and substantial sill.
    const frontPoints=shrine?points.filter(p=>p[2]<z0+.5):points;
    const fx0=shrine?Math.min(...frontPoints.map(p=>p[0])):x0;
    const fx1=shrine?Math.max(...frontPoints.map(p=>p[0])):x1;
    const fw=fx1-fx0, fcx=(fx0+fx1)/2;
    const bays=4, bw=fw/bays;
    for(let i=0;i<bays;i++){
      const x=fx0+(i+.5)*bw;
      box(bw-.16,shrine?1.7:1.35,.065,x,shrine?1.63:1.5,z0-.045,shrine?dark:glass);
      if(shrine){
        for(let k=0;k<5;k++)box(.035,1.7,.05,x-bw*.35+k*bw*.175,1.63,z0-.10,red);
        for(let k=0;k<3;k++)box(bw-.15,.04,.055,x,1.02+k*.55,z0-.12,red);
      }else{
        for(let k=0;k<3;k++)box(.045,1.35,.07,x+(k-1)*bw*.26,1.5,z0-.10,trim);
        box(bw-.12,.08,.09,x,1.2,z0-.11,trim);
      }
    }
    for(let i=0;i<=bays;i++)box(.14,h,.16,fx0+i*bw,h/2,z0-.12,shrine?red:trim);
    for(const y of [.7,2.49])box(fw+.15,.13,.18,fcx,y,z0-.13,shrine?red:trim);
    if(!shrine){
      box(fw,.22,.07,fcx,2.31,z0-.05,plaster);
      box(fw+.08,.12,.16,fcx,2.18,z0-.12,timber);
      box(fw+.12,.20,.24,fcx,.76,z0-.15,timber);
      // White plaster side panels and dark exposed framing seen obliquely.
      box(.065,1.78,d-.12,x1+.015,1.44,cz,plaster);
      for(let i=0;i<=4;i++)box(.11,h,.12,x1+.05,h/2,z0+i*d/4,timber);
      for(const y of [.56,2.29])box(.12,.13,d,x1+.06,y,cz,timber);
      box(.12,.52,d,x1+.04,.3,cz,timber);
    }
    // The long path-facing side of the enclosure is also glazed, not shutters.
    if(!shrine){
      const n=5,depth=d/n;
      for(let i=0;i<n;i++){
        const z=z0+(i+.5)*depth;
        box(.065,1.35,depth-.17,x0-.045,1.5,z,glass);
        for(let k=0;k<3;k++)box(.075,1.35,.045,x0-.1,1.5,z+(k-1)*depth*.27,trim);
        box(.075,.08,depth-.1,x0-.1,1.2,z,trim);
      }
      for(let i=0;i<=n;i++)box(.16,h,.14,x0-.1,h/2,z0+i*depth,timber);
      for(const y of [.7,2.49])box(.18,.13,d+.15,x0-.12,y,cz,trim);
      box(.07,.22,d,x0-.05,2.31,cz,plaster);
      box(.16,.12,d+.08,x0-.12,2.18,cz,timber);
      box(.24,.20,d+.12,x0-.15,.76,cz,timber);
    }
    // Roof ridge runs back from the street. Individual round tile caps make
    // the modest gable legible from pedestrian height without a texture trick.
    // A shallow concave pitch and lifted eave match the observed tile roofs.
    // These profiles are visual estimates; the underlying OSM walls stay exact.
    const vertices=[], uv=[], strips=7;
    const pitch=(t)=>eave+(ridge-eave)*(1-t)**1.42+.075*t**7;
    for(const side of [-1,1])for(let i=0;i<strips;i++){
      const t0=i/strips,t1=(i+1)/strips;
      const xa=cx+side*(w/2+over)*t0,xb=cx+side*(w/2+over)*t1;
      for(const p of [[xa,pitch(t0),z0-over],[xb,pitch(t1),z0-over],[xa,pitch(t0),z1+over],[xb,pitch(t1),z0-over],[xb,pitch(t1),z1+over],[xa,pitch(t0),z1+over]]){vertices.push(...p);uv.push(p[0]/2,p[2]/2);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const roofMesh=new THREE.Mesh(geo,roof);roofMesh.castShadow=true;roofMesh.receiveShadow=true;g.add(roofMesh);
    const beam=(a,b,r,mat)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),v=vb.clone().sub(va);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),6),mat);mesh.position.copy(va).add(vb).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());g.add(mesh);};
    const tileMatrices=[],dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
    for(let z=z0-over;z<=z1+over;z+=.25)for(const side of [-1,1])for(let i=0;i<strips;i++){
      const t0=i/strips,t1=(i+1)/strips;
      const a=new THREE.Vector3(cx+side*(w/2+over)*t0,pitch(t0)+.04,z);
      const b=new THREE.Vector3(cx+side*(w/2+over)*t1,pitch(t1)+.04,z),delta=b.clone().sub(a);
      dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,delta.clone().normalize());dummy.scale.set(1,delta.length()+.02,1);dummy.updateMatrix();tileMatrices.push(dummy.matrix.clone());
    }
    const tiles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.045,.045,1,7),roof,tileMatrices.length);
    tileMatrices.forEach((matrix,i)=>tiles.setMatrixAt(i,matrix));tiles.castShadow=true;tiles.receiveShadow=true;tiles.name='Azumamaro individual curved tile courses';g.add(tiles);
    beam([cx,ridge+.06,z0-over-.1],[cx,ridge+.06,z1+over+.1],.13,roof);
    for(const x of [x0-over,x1+over])box(.10,.14,d+2*over,x,eave+.015,cz,timber);
    if(!shrine){
      // Exposed rafter tails stay within the existing roof overhang.
      for(let z=z0-.22;z<z1+.22;z+=.43)for(const side of [-1,1]){
        box(over+.13,.085,.075,cx+side*(w/2+over/2),eave-.055,z,timber);
      }
      for(const z of [z0-over,z1+over])box(w+2*over,.14,.11,cx,eave-.02,z,timber);
    }
    for(const z of [z0-.01,z1+.01]){
      const endVertices=[];
      for(const side of [-1,1])for(let i=0;i<strips;i++){
        const t0=i/strips*w/(w+2*over),t1=(i+1)/strips*w/(w+2*over);
        endVertices.push(cx,eave,z,cx+side*(w/2+over)*t0,pitch(t0)-.08,z,cx+side*(w/2+over)*t1,pitch(t1)-.08,z);
      }
      const end=new THREE.BufferGeometry();end.setAttribute('position',new THREE.Float32BufferAttribute(endVertices,3));end.computeVertexNormals();
      const mat=timber.clone();mat.side=THREE.DoubleSide;g.add(new THREE.Mesh(end,mat));
      // The rear shrine has a timber gable with a red collar and king post,
      // rather than the previous uninterrupted triangular red billboard.
      if(shrine){
        box(w,.12,.13,cx,eave+.06,z-.035,red);
        box(.12,ridge-eave-.08,.14,cx,(eave+ridge)/2,z-.04,red);
        for(const side of [-1,1])beam([cx,eave+.14,z-.05],[cx+side*w*.26,eave+(ridge-eave)*.47,z-.05],.045,red);
      }
      for(const side of [-1,1])for(let i=0;i<strips;i++){
        const t0=i/strips*w/(w+2*over),t1=(i+1)/strips*w/(w+2*over);
        beam([cx+side*(w/2+over)*t0,pitch(t0)-.08,z],[cx+side*(w/2+over)*t1,pitch(t1)-.08,z],.055,shrine?red:trim);
      }
    }
    if(shrine){
      box(fw*.75,.35,.5,fcx,.175,z0-.22,stone);
      box(fw*.7,.12,.75,fcx,.43,z0-.05,timber);
      for(const x of [fx0+.12,fx1-.12])box(.2,h,.2,x,h/2,z0-.25,red);
      box(fw+.05,.18,.24,fcx,2.53,z0-.25,red);
    }
    root.add(g);groups.push(g);
    colliders.push({type:'box',args:[cx,cz,w/2,d/2,0,low,floor+ridge,'azumamaro_'+id.split('/')[1]]});
  }
  return groups;
}
