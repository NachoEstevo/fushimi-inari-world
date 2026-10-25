import * as THREE from 'three';

// Lab-only palette adapter. keihan-station currently leaves palette materials
// unnamed; exact sRGB matches deliberately fail closed when its palette changes.
// staticParts supplies dominant-axis metric UVs (one tile per 1.5 metres).
// Existing mapped materials include signs, posters and the ramp: retain those.
const PALETTE = new Map([
  ['777b79', 'pavement'], ['b7b6ac', 'stone'], ['27323a', 'dark'],
  ['c03220', 'paint'], ['e6e3d6', 'wall'], ['9aa3a5', 'metal'],
  ['d7ae35', 'tactile'], ['245b4b', 'green'], ['42677a', 'seat'],
  ['706049', 'wood'], ['aec1be', 'glass'], ['66707c', 'wall'],
]);

function grainTexture(kind) {
  const size = 256, data = new Uint8Array(size * size * 4);
  // Seeded, periodic fields avoid random refreshes and visible tile seams.
  const hash = (x, y) => {
    let n = Math.imul((x & 255) + 173, 374761393) ^ Math.imul((y & 255) + 919, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const fine = hash(x, y) - .5;
    const broad = Math.sin(x * Math.PI / 32) * Math.cos(y * Math.PI / 64);
    let value;
    if (kind === 'mineral') {
      const aggregate = hash(x >> 2, y >> 2) - .5;
      value = .77 + fine * .15 + aggregate * .12 + broad * .025;
    } else if (kind === 'metal') {
      value = .54 + (hash(0, y) - .5) * .13 + fine * .018;
    } else if (kind === 'wood') {
      const wave = Math.sin(x * Math.PI / 8 + Math.sin(y * Math.PI / 128) * .6);
      value = .65 + wave * .09 + fine * .035;
    } else value = .66 + fine * .045 + broad * .012;
    const v = Math.round(THREE.MathUtils.clamp(value, 0, 1) * 255), i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.name = `Station study ${kind}`;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createStationMaterialStudy(station) {
  const group = station?.group ?? station;
  if (!group?.traverse) throw new TypeError('Station material study requires a station group');
  const textures = Object.fromEntries(['mineral', 'metal', 'wood', 'paint'].map(k => [k, grainTexture(k)]));
  const replacements = new Map(), bindings = [];
  const stats = { meshes: 0, materials: 0, textures: 4, textureSize: 256, skippedMaterials: 0, enabled: false };
  const skipped = new Set();
  function replacement(original) {
    if (replacements.has(original)) return replacements.get(original);
    const kind = original?.color && PALETTE.get(original.color.getHexString(THREE.SRGBColorSpace));
    if (!original?.isMeshStandardMaterial || !kind || original.map || original.userData?.label) {
      if (original) skipped.add(original);
      return original;
    }
    const material = new THREE.MeshPhysicalMaterial();
    // Copy only Standard's common state; Physical.copy expects Physical fields.
    THREE.MeshStandardMaterial.prototype.copy.call(material, original);
    material.defines = { STANDARD: '', PHYSICAL: '' };
    material.name = `Station study: ${kind}`;
    material.userData = { ...original.userData, stationMaterialStudy: kind };
    if (kind === 'green' || kind === 'paint' || kind === 'glass') material.userData.stationReflectionReceiver = true;
    material.envMapIntensity = kind === 'glass' ? 1.2 : .75;
    if (kind === 'glass') {
      material.roughness = .08; material.metalness = 0;
      material.opacity = .18; material.transparent = true; material.depthWrite = false;
      material.ior = 1.5; material.specularIntensity = 1;
    } else if (kind === 'metal') {
      material.metalness = .82; material.roughness = .43;
      material.roughnessMap = textures.metal;
      material.bumpMap = textures.metal; material.bumpScale = .00035;
    } else if (kind === 'green' || kind === 'paint') {
      material.metalness = kind === 'green' ? .18 : .08;
      material.roughness = kind === 'green' ? .46 : .62;
      material.roughnessMap = textures.paint;
      material.clearcoat = kind === 'green' ? .65 : .2;
      material.clearcoatRoughness = .22;
      // Paint varies in finish, not panel shape. Even submillimetre bump on
      // metric-UV batches can read as repeated dents under grazing reflections.
    } else {
      const mineral = kind === 'stone' || kind === 'pavement';
      const texture = kind === 'wood' ? textures.wood : mineral ? textures.mineral : textures.paint;
      material.roughness = mineral ? 1 : kind === 'wood' ? .98 : .92;
      material.roughnessMap = texture;
      if (mineral || kind === 'wood') {
        material.bumpMap = texture;
        material.bumpScale = mineral ? .003 : .0003;
      }
    }
    replacements.set(original, material);
    return material;
  }
  group.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry?.attributes.uv) return;
    const original = mesh.material;
    const upgraded = Array.isArray(original) ? original.map(replacement) : replacement(original);
    if (Array.isArray(original) ? upgraded.some((m, i) => m !== original[i]) : upgraded !== original) {
      bindings.push({ mesh, original, upgraded });
    }
  });
  stats.meshes = bindings.length; stats.materials = replacements.size; stats.skippedMaterials = skipped.size;
  let disposed = false;
  function setEnabled(value) {
    if (disposed) return;
    stats.enabled = Boolean(value);
    for (const { mesh, original, upgraded } of bindings) mesh.material = stats.enabled ? upgraded : original;
  }
  function dispose() {
    if (disposed) return;
    setEnabled(false); disposed = true;
    for (const material of replacements.values()) material.dispose();
    for (const texture of Object.values(textures)) texture.dispose();
  }
  return { setEnabled, dispose, stats };
}
