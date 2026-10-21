import * as THREE from 'three';
import { bambooGeometryData, bambooNodeStations, bambooBranches, bambooBranchPoint } from './bamboo-profile.mjs';

let culmMap;
const geometries = new Map();

function culmTexture() {
  if (culmMap) return culmMap;
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, '#6b713d');
  gradient.addColorStop(.22, '#687c48');
  gradient.addColorStop(.72, '#617940');
  gradient.addColorStop(1, '#6f844a');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Quiet longitudinal fibres. Periodic values make the cylinder seam continuous.
  for (let x = 0; x < canvas.width; x++) {
    const fibre = Math.sin(x / 128 * Math.PI * 22) * Math.sin(x / 128 * Math.PI * 6);
    ctx.fillStyle = fibre > 0 ? `rgba(205,211,161,${Math.abs(fibre) * .13})` : `rgba(38,55,24,${Math.abs(fibre) * .12})`;
    ctx.fillRect(x, 0, 1, canvas.height);
  }
  for (const station of bambooNodeStations) {
    const y = (1 - station) * canvas.height;
    // Pale raised node with a narrow shadow/sheath scar immediately beneath it.
    ctx.fillStyle = '#3d522d'; ctx.fillRect(0, y + .8, canvas.width, 1.25);
    ctx.fillStyle = '#a0ad7d'; ctx.fillRect(0, y - .75, canvas.width, 1.55);
    ctx.fillStyle = 'rgba(196,205,157,.65)'; ctx.fillRect(0, y - 1.1, canvas.width, .55);
  }
  culmMap = new THREE.CanvasTexture(canvas);
  culmMap.colorSpace = THREE.SRGBColorSpace;
  culmMap.wrapS = THREE.RepeatWrapping;
  culmMap.anisotropy = 4;
  return culmMap;
}

function culmGeometry(detail) {
  const key = `culms-${detail}`;
  if (geometries.has(key)) return geometries.get(key);
  const data = bambooGeometryData(detail), geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
  geometry.setIndex(data.indices);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometries.set(key, geometry);
  return geometry;
}

function leafGeometry(detail) {
  const key = `leaves-${detail}`;
  if (geometries.has(key)) return geometries.get(key);
  const positions = [], uv = [], indices = [];
  const cards = 2, sections = detail === 'near' ? 3 : 1;
  for (const branch of bambooBranches()) for (let card = 0; card < cards; card++) {
    const roll = .22 + card * .83, width = .22 + .035 * Math.sin(branch.node + branch.culm);
    const across = [-branch.dz * Math.cos(roll), Math.sin(roll), branch.dx * Math.cos(roll)];
    const start = positions.length / 3;
    for (let section = 0; section <= sections; section++) {
      const u = section / sections, point = bambooBranchPoint(branch, u);
      for (const side of [-1, 1]) {
        const w = width * (1 - .34 * u) * side;
        positions.push(...point.map((n, axis) => n + across[axis] * w));
        uv.push((side + 1) / 2, u);
      }
      if (section < sections) {
        const a = start + section * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometries.set(key, geometry);
  return geometry;
}

/** Refine the existing mapped instances; no new groves or species are invented. */
export function refineBamboo(legacy) {
  const culms = legacy.foliage[4], leaves = legacy.foliage[5];
  if (!culms?.isInstancedMesh || !leaves?.isInstancedMesh) return { clumps: 0 };
  culms.geometry.dispose(); leaves.geometry.dispose();
  culms.geometry = culmGeometry('near'); leaves.geometry = leafGeometry('near');
  culms.name = 'Bamboo · jointed culms'; leaves.name = 'Bamboo · narrow foliage sprays';
  culms.material.map = culmTexture(); culms.material.color.set('#ffffff');
  culms.material.roughness = .68; culms.material.needsUpdate = true;
  // Keep the project's existing bamboo atlas and normal map.
  leaves.material.color.set('#b4bf9c'); leaves.material.roughness = .76;
  leaves.material.normalScale.set(.35, .35); leaves.material.alphaTest = .30;
  leaves.material.alphaToCoverage = true; leaves.material.needsUpdate = true;
  const tint = new THREE.Color();
  const culmTransform = new THREE.Matrix4();
  for (let i = 0; i < culms.count; i++) {
    const variation = (Math.sin(i * 78.233 + 6.51) * 43758.5453) % 1;
    tint.setHSL(.20 + Math.abs(variation) * .018, .065, .82 + Math.abs(variation) * .15);
    culms.setColorAt(i, tint);
    if (i < leaves.count) {
      // The old crown had a different yaw and an independent +6.8 m offset.
      // Shared botanical coordinates now keep twigs, nodes and leaves attached.
      culms.getMatrixAt(i, culmTransform); leaves.setMatrixAt(i, culmTransform);
      leaves.setColorAt(i, tint);
    }
  }
  leaves.instanceMatrix.needsUpdate = true;
  for (const mesh of [culms, leaves]) {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingBox(); mesh.computeBoundingSphere();
  }
  return {
    clumps: culms.count, culms: culms.count * 4, nodesPerCulm: bambooNodeStations.length, branchesPerClump: bambooBranches().length,
    nearTrianglesPerClump: culms.geometry.index.count / 3 + leaves.geometry.index.count / 3,
    farTrianglesPerClump: culmGeometry('far').index.count / 3 + leafGeometry('far').index.count / 3,
    placement: 'Preserved legacy instances; individual plants and dimensions remain interpretive',
  };
}

/** Apply after partitionInstances. Only one geometry per cell and LOD is drawn. */
export function bambooLOD(chunks, kind) {
  const farGeometry = kind === 'culms' ? culmGeometry('far') : leafGeometry('far');
  for (const near of [...chunks.children]) {
    const far = new THREE.InstancedMesh(farGeometry, near.material, near.count);
    const matrix = new THREE.Matrix4(), color = new THREE.Color();
    for (let i = 0; i < near.count; i++) {
      near.getMatrixAt(i, matrix); far.setMatrixAt(i, matrix);
      if (near.instanceColor) { near.getColorAt(i, color); far.setColorAt(i, color); }
    }
    far.castShadow = near.castShadow; far.receiveShadow = near.receiveShadow;
    far.computeBoundingSphere();
    const lod = new THREE.LOD(), center = near.boundingSphere.center.clone();
    lod.name = `Bamboo ${kind} · spatial LOD`;
    lod.position.copy(center); near.position.copy(center).negate(); far.position.copy(near.position);
    // Radius padding prevents a nearby clump at the edge of a cell switching
    // early just because its cell centre is farther from the camera.
    lod.addLevel(near, 0); lod.addLevel(far, 32 + near.boundingSphere.radius, .14);
    lod.userData.nearForest = true;
    chunks.add(lod);
  }
  return chunks;
}
