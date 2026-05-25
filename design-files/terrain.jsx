/* terrain.jsx — topographic contour + coastline SVG generators.
   Renders concentric blob-ish contour rings around each PEAK + a coastline.
   Outputs <g> nodes parameterized by stroke style. */

function _peakContours(peak, levels, jitter) {
  // Each level is a fraction (0..1) of peak.r — produces a noisy closed path.
  const out = [];
  for (let i = 0; i < levels; i++) {
    const r = peak.r * (0.15 + 0.95 * (i / (levels - 1 || 1)));
    const pts = [];
    const N = 48;
    // deterministic noise: hash peak + level + step
    const seed = (peak.lat * 1000 + peak.lon * 100 + i * 7) | 0;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      // pseudo-random radial perturbation
      const n =
        Math.sin(a * 3 + seed) * 0.10 +
        Math.sin(a * 5 + seed * 1.7) * 0.06 +
        Math.sin(a * 7 + seed * 0.3) * 0.04;
      const rr = r * (1 + n * jitter);
      pts.push([peak.lon + rr * Math.cos(a) * 0.85, peak.lat + rr * Math.sin(a)]);
    }
    out.push({ pts, level: i, peak });
  }
  return out;
}

function buildTerrainPaths({ peaks, project, jitter = 1.0, levels = 6 }) {
  // returns array of { d, level, peak } sorted outermost first so inner draws on top
  const all = [];
  for (const p of peaks) {
    for (const c of _peakContours(p, levels, jitter)) {
      const screen = c.pts.map(([lon, lat]) => project(lat, lon));
      // close path
      let d = `M ${screen[0].x.toFixed(1)} ${screen[0].y.toFixed(1)}`;
      for (let i = 1; i < screen.length; i++) d += ` L ${screen[i].x.toFixed(1)} ${screen[i].y.toFixed(1)}`;
      d += ' Z';
      all.push({ d, level: c.level, peak: p, maxLevel: levels - 1 });
    }
  }
  // outer first
  all.sort((a, b) => a.level - b.level);
  return all;
}

function buildPolylinePath(points, project) {
  if (!points.length) return '';
  const screen = points.map(([lat, lon]) => project(lat, lon));
  let d = `M ${screen[0].x.toFixed(1)} ${screen[0].y.toFixed(1)}`;
  for (let i = 1; i < screen.length; i++) d += ` L ${screen[i].x.toFixed(1)} ${screen[i].y.toFixed(1)}`;
  return d;
}

// Grid of small geographic ticks — lat/lon meridians within view, dimly drawn
function buildGraticule({ centerLat, centerLon, project, w, h, stepDeg = 0.25 }) {
  // returns paths
  const out = [];
  const halfLat = (h / 2) * 0; // unused; we'll just span ±2deg from center
  const latMin = centerLat - 1.5, latMax = centerLat + 1.5;
  const lonMin = centerLon - 1.8, lonMax = centerLon + 1.8;
  // longitudes
  for (let lon = Math.ceil(lonMin / stepDeg) * stepDeg; lon <= lonMax; lon += stepDeg) {
    const a = project(latMin, lon), b = project(latMax, lon);
    out.push(`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  for (let lat = Math.ceil(latMin / stepDeg) * stepDeg; lat <= latMax; lat += stepDeg) {
    const a = project(lat, lonMin), b = project(lat, lonMax);
    out.push(`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  return out;
}

Object.assign(window, { buildTerrainPaths, buildPolylinePath, buildGraticule });
