// The existing four-culm cluster keeps its footprint and maximum height.
// These are botanical modelling dimensions, not measurements of Inariyama.
export const bambooCulms = Object.freeze([
  { x: -.26, z: -.18, height: 7.60, radius: .062, leanX: -.10, leanZ: -.035 },
  { x:  .24, z: -.14, height: 7.18, radius: .055, leanX:  .09, leanZ: -.055 },
  { x:  .00, z:  .24, height: 7.42, radius: .059, leanX:  .035, leanZ: .10 },
  { x: -.18, z:  .20, height: 6.94, radius: .052, leanX: -.065, leanZ: .065 },
]);

// Internodes are shorter at the foot and crown. All culms share normalized
// stations, so a single small texture stays registered with every raised node.
const intervals = Array.from({ length: 19 }, (_, i) => .72 + .34 * Math.sin(i / 18 * Math.PI));
const total = intervals.reduce((sum, n) => sum + n, 0);
let accumulated = 0;
export const bambooNodeStations = Object.freeze(intervals.slice(0, -1).map(n => {
  accumulated += n;
  return accumulated / total;
}));

export function bambooRadius(culm, t, relief = 1) {
  return culm.radius * (1 - .27 * t) * relief;
}

// Every leaf spray grows from a real node on one of the four culms. Branches
// share their stations at both LODs, so the distant crown never detaches.
export function bambooBranches() {
  return bambooCulms.flatMap((culm, index) => [11, 13, 15, 17].map((node, level) => {
    const t = bambooNodeStations[node], angle = index * 1.83 + level * 2.4;
    const dx = Math.cos(angle), dz = Math.sin(angle), radius = bambooRadius(culm, t);
    return { culm: index, node, t, dx, dz, length: .86 + .17 * Math.sin(level + index * 1.5),
      start: [culm.x + culm.leanX * t * t + dx * (radius - .004), t * culm.height, culm.z + culm.leanZ * t * t + dz * (radius - .004)] };
  }));
}

export function bambooBranchPoint(branch, t) {
  return [branch.start[0] + branch.dx * branch.length * t,
    branch.start[1] + .10 * Math.sin(t * Math.PI) - .07 * t,
    branch.start[2] + branch.dz * branch.length * t];
}

export function bambooProfile(detail = 'near') {
  if (detail === 'far') return [0, .25, .5, .75, 1].map(t => ({ t, relief: 1 }));
  const rows = [{ t: 0, relief: 1 }];
  for (const t of bambooNodeStations) rows.push(
    { t: t - .0017, relief: 1 },
    { t: t - .0007, relief: 1.11 },
    { t: t + .0007, relief: 1.11 },
    { t: t + .0017, relief: 1 },
  );
  rows.push({ t: 1, relief: 1 });
  return rows;
}

// A single indexed geometry contains the culms and their rings. No per-node
// objects, materials or draw calls are created. The far version keeps the same
// taper, gentle bend and texture coordinates while dropping raised rings.
export function bambooGeometryData(detail = 'near') {
  const positions = [], normals = [], uv = [], indices = [];
  const rows = bambooProfile(detail), radial = 8;
  for (const culm of bambooCulms) {
    const start = positions.length / 3;
    rows.forEach(({ t, relief }, row) => {
      const previous = rows[Math.max(0, row - 1)], next = rows[Math.min(rows.length - 1, row + 1)];
      const drdy = (bambooRadius(culm, next.t, next.relief) - bambooRadius(culm, previous.t, previous.relief)) / ((next.t - previous.t) * culm.height);
      const radius = bambooRadius(culm, t, relief), bend = t * t;
      for (let side = 0; side <= radial; side++) {
        const angle = side / radial * Math.PI * 2, x = Math.cos(angle), z = Math.sin(angle);
        positions.push(culm.x + culm.leanX * bend + x * radius, t * culm.height, culm.z + culm.leanZ * bend + z * radius);
        const ny = -drdy - 2 * t * (culm.leanX * x + culm.leanZ * z) / culm.height;
        const length = Math.hypot(x, ny, z);
        normals.push(x / length, ny / length, z / length);
        uv.push(side / radial, t);
        if (row < rows.length - 1 && side < radial) {
          const a = start + row * (radial + 1) + side, b = a + radial + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    });
    // Caps have their own normals; they do not soften the vertical culm skin.
    for (const top of [false, true]) {
      const t = top ? 1 : 0, radius = bambooRadius(culm, t), center = positions.length / 3;
      const cx = culm.x + culm.leanX * t, cz = culm.z + culm.leanZ * t;
      positions.push(cx, t * culm.height, cz); normals.push(0, top ? 1 : -1, 0); uv.push(.5, t);
      for (let side = 0; side <= radial; side++) {
        const angle = side / radial * Math.PI * 2;
        positions.push(cx + Math.cos(angle) * radius, t * culm.height, cz + Math.sin(angle) * radius);
        normals.push(0, top ? 1 : -1, 0); uv.push(side / radial, t);
        if (side < radial) {
          const a = center + side + 1, b = a + 1;
          indices.push(...(top ? [center, b, a] : [center, a, b]));
        }
      }
    }
  }
  // Thin connected twigs reuse the culm material and draw call. Two segments
  // preserve the same mild droop as the leaf cards instead of floating sprays.
  const twigSides = detail === 'near' ? 4 : 3;
  for (const branch of bambooBranches()) {
    const start = positions.length / 3;
    for (let row = 0; row <= 2; row++) {
      const t = row / 2, point = bambooBranchPoint(branch, t), radius = .007 - .004 * t;
      const dy = .10 * Math.PI * Math.cos(t * Math.PI) - .07;
      const length = Math.hypot(branch.length, dy);
      const ax = branch.dx * branch.length / length, ay = dy / length, az = branch.dz * branch.length / length;
      const side = [-branch.dz, 0, branch.dx];
      const across = [-side[2] * ay, side[2] * ax - side[0] * az, side[0] * ay];
      for (let i = 0; i <= twigSides; i++) {
        const angle = i / twigSides * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle);
        const normal = side.map((n, j) => n * c + across[j] * s);
        positions.push(...point.map((n, j) => n + normal[j] * radius));
        normals.push(...normal); uv.push(i / twigSides, .025);
        if (row < 2 && i < twigSides) {
          const a = start + row * (twigSides + 1) + i, b = a + twigSides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
  }
  return { positions, normals, uv, indices };
}
