    export class SpatialCollisionWorld {
      constructor(cellSize = 4.0) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.boxes = [];
      }
      _key(cx, cz) { return `${cx},${cz}`; }
      addCylinder(x, z, r, yMin = -100, yMax = 500, tag = 'col') {
        const minCx = Math.floor((x - r) / this.cellSize);
        const maxCx = Math.floor((x + r) / this.cellSize);
        const minCz = Math.floor((z - r) / this.cellSize);
        const maxCz = Math.floor((z + r) / this.cellSize);
        const col = { x, z, r, yMin, yMax, tag };
        for (let cx = minCx; cx <= maxCx; cx++) {
          for (let cz = minCz; cz <= maxCz; cz++) {
            const k = this._key(cx, cz);
            if (!this.grid.has(k)) this.grid.set(k, []);
            this.grid.get(k).push(col);
          }
        }
      }
      addBox(cx, cz, halfW, halfD, yaw = 0, yMin = -100, yMax = 500, tag = 'box') {
        this.boxes.push({
          cx, cz, halfW, halfD,
          cos: Math.cos(yaw), sin: Math.sin(yaw),
          cosF: Math.cos(-yaw), sinF: Math.sin(-yaw),
          yMin, yMax, tag
        });
      }
      resolvePlayer(px, py, pz, playerRadius = 0.28) {
        let x = px, z = pz;
        const footY = py - 1.55;
        const headY = py + 0.15;

        for (let iter = 0; iter < 3; iter++) {
          const gcx = Math.floor(x / this.cellSize);
          const gcz = Math.floor(z / this.cellSize);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              const bucket = this.grid.get(this._key(gcx + dx, gcz + dz));
              if (!bucket) continue;
              for (let i = 0; i < bucket.length; i++) {
                const c = bucket[i];
                if (headY < c.yMin || footY > c.yMax) continue;
                const vx = x - c.x;
                const vz = z - c.z;
                const distSq = vx * vx + vz * vz;
                const minDist = playerRadius + c.r;
                if (distSq < minDist * minDist && distSq > 1e-8) {
                  const dist = Math.sqrt(distSq);
                  const push = (minDist - dist);
                  x += (vx / dist) * push;
                  z += (vz / dist) * push;
                }
              }
            }
          }

          for (let i = 0; i < this.boxes.length; i++) {
            const b = this.boxes[i];
            if (headY < b.yMin || footY > b.yMax) continue;
            const relX = x - b.cx;
            const relZ = z - b.cz;
            const lx = relX * b.cos - relZ * b.sin;
            const lz = relX * b.sin + relZ * b.cos;
            const clampX = Math.max(-b.halfW, Math.min(b.halfW, lx));
            const clampZ = Math.max(-b.halfD, Math.min(b.halfD, lz));
            const dx = lx - clampX;
            const dz = lz - clampZ;
            const distSq = dx * dx + dz * dz;
            if (distSq < playerRadius * playerRadius) {
              let nLx = 0, nLz = 0;
              if (distSq > 1e-7) {
                const dist = Math.sqrt(distSq);
                const push = playerRadius - dist;
                nLx = lx + (dx / dist) * push;
                nLz = lz + (dz / dist) * push;
              } else {
                const penX = b.halfW - Math.abs(lx);
                const penZ = b.halfD - Math.abs(lz);
                if (penX < penZ) {
                  nLx = (lx >= 0 ? 1 : -1) * (b.halfW + playerRadius);
                  nLz = lz;
                } else {
                  nLx = lx;
                  nLz = (lz >= 0 ? 1 : -1) * (b.halfD + playerRadius);
                }
              }
              x = b.cx + nLx * b.cosF - nLz * b.sinF;
              z = b.cz + nLx * b.sinF + nLz * b.cosF;
            }
          }
        }
        return { x, z };
      }
    }

