/* sim.jsx — shared fake ADS-B simulation for lpt scope mockups.
   Exposes window.LPTSim (singleton) + React hook useLPT().
   One RAF loop drives state; React subscribers re-render via tick counter. */

// ─── geography ──────────────────────────────────────────────────────────────
const RECEIVER = { lat: 37.6189, lon: -122.3750, label: 'KSFO' };
const NM_PER_DEG_LAT = 60;
const nmPerDegLon = (lat) => 60 * Math.cos((lat * Math.PI) / 180);

// pseudo-mountain peaks for topographic contours (lat, lon, peak intensity, radius°)
const PEAKS = [
  { lat: 37.88, lon: -122.55, h: 1.0, r: 0.18, name: 'MARIN' },
  { lat: 37.46, lon: -122.42, h: 0.95, r: 0.22, name: 'SANTA CRUZ MTS' },
  { lat: 37.30, lon: -121.85, h: 0.78, r: 0.20, name: 'DIABLO RANGE' },
  { lat: 38.05, lon: -122.20, h: 0.62, r: 0.16, name: 'BERKELEY HILLS' },
  { lat: 37.70, lon: -122.45, h: 0.35, r: 0.06, name: 'TWIN PEAKS' },
];

// coastline as a polyline of [lat,lon] — rough SF bay area outline
const COASTLINE = [
  [38.20, -122.95], [38.10, -122.75], [37.95, -122.65], [37.82, -122.52],
  [37.78, -122.51], [37.72, -122.50], [37.65, -122.49], [37.58, -122.50],
  [37.50, -122.47], [37.40, -122.42], [37.30, -122.40], [37.18, -122.40],
  [37.10, -122.30], [37.02, -122.10], [36.95, -121.90],
];
const BAY = [
  // inner bay shoreline (rough)
  [38.10, -122.30], [37.97, -122.36], [37.88, -122.38], [37.80, -122.36],
  [37.73, -122.38], [37.62, -122.36], [37.55, -122.27], [37.50, -122.15],
  [37.48, -122.05], [37.50, -121.95], [37.60, -121.95], [37.70, -122.05],
  [37.80, -122.15], [37.90, -122.20], [38.00, -122.25], [38.10, -122.30],
];

function elevation(lat, lon) {
  let e = 0;
  for (const p of PEAKS) {
    const dx = lon - p.lon, dy = lat - p.lat;
    e += p.h * Math.exp(-(dx * dx + dy * dy) / (p.r * p.r));
  }
  return e;
}

// ─── fleet seed (fixed so reload is deterministic) ─────────────────────────
const SEED_FLEET = [
  { icao: 'A1B2C3', cs: 'UAL245',  model: 'B738', kind: 'civ', lat: 37.10, lon: -122.85, alt: 28400, spd: 412, hdg: 75,  vs: 1800,  squawk: 2401 },
  { icao: 'A8D11F', cs: 'DAL1102', model: 'A321', kind: 'civ', lat: 37.95, lon: -121.80, alt: 33000, spd: 446, hdg: 245, vs: -100,  squawk: 4730 },
  { icao: 'AC4D52', cs: 'AAL77',   model: 'B789', kind: 'civ', lat: 38.15, lon: -122.95, alt: 36000, spd: 478, hdg: 130, vs: 0,     squawk: 5602 },
  { icao: 'A0E931', cs: 'SWA2891', model: 'B737', kind: 'civ', lat: 37.40, lon: -122.10, alt: 8200,  spd: 220, hdg: 285, vs: -1200, squawk: 1244 },
  { icao: 'A55190', cs: 'ASA482',  model: 'B739', kind: 'civ', lat: 37.62, lon: -122.92, alt: 12800, spd: 245, hdg: 75,  vs: 1500,  squawk: 3301 },
  { icao: 'A77B40', cs: 'FDX18',   model: 'B763', kind: 'cargo', lat: 37.20, lon: -121.60, alt: 24000, spd: 380, hdg: 305, vs: 900, squawk: 6011 },
  { icao: 'AAE004', cs: 'JBU991',  model: 'A320', kind: 'civ', lat: 38.30, lon: -122.40, alt: 18500, spd: 340, hdg: 195, vs: -1800, squawk: 4422 },
  { icao: 'A3F0A0', cs: 'SKW3324', model: 'E175', kind: 'civ', lat: 37.85, lon: -121.95, alt: 6400,  spd: 195, hdg: 250, vs: -900,  squawk: 1010 },
  { icao: 'AE0144', cs: 'RCH488',  model: 'C17',  kind: 'mil', lat: 36.95, lon: -122.20, alt: 21000, spd: 290, hdg: 30,  vs: 0,     squawk: 7600 },
  { icao: 'A95C81', cs: 'N521KP',  model: 'C172', kind: 'ga',  lat: 37.55, lon: -122.05, alt: 3200,  spd: 110, hdg: 180, vs: 0,     squawk: 1200 },
  { icao: 'A12440', cs: 'UPS2855', model: 'B748', kind: 'cargo', lat: 37.30, lon: -121.55, alt: 32000, spd: 460, hdg: 280, vs: 0,   squawk: 5505 },
  { icao: 'A6D2E0', cs: 'ACA755',  model: 'A333', kind: 'civ', lat: 38.40, lon: -121.95, alt: 37000, spd: 482, hdg: 220, vs: 0,     squawk: 6644 },
  { icao: 'A0B7C2', cs: 'HAL11',   model: 'A332', kind: 'civ', lat: 37.65, lon: -122.95, alt: 14500, spd: 310, hdg: 260, vs: 2200,  squawk: 5111 },
  { icao: 'ABCDEF', cs: 'N48WT',   model: 'PC12', kind: 'ga',  lat: 38.05, lon: -122.65, alt: 9500,  spd: 245, hdg: 145, vs: 0,     squawk: 4040 },
  { icao: 'A14155', cs: 'VOI901',  model: 'A320', kind: 'civ', lat: 37.05, lon: -122.40, alt: 15400, spd: 320, hdg: 20,  vs: 1700,  squawk: 3211 },
  { icao: 'A2D981', cs: 'AAY1788', model: 'A319', kind: 'civ', lat: 37.90, lon: -122.95, alt: 25600, spd: 405, hdg: 110, vs: -200,  squawk: 4501 },
  { icao: 'AD0011', cs: 'EVAC03',  model: 'EC135',kind: 'heli',lat: 37.78, lon: -122.41, alt: 1200,  spd: 85,  hdg: 330, vs: 0,     squawk: 1234 },
];

// ─── singleton sim state ───────────────────────────────────────────────────
const LPTSim = (() => {
  const planes = SEED_FLEET.map((p, i) => ({
    ...p,
    selected: false,
    firstSeenMs: performance.now() - i * 1700,
    lastSeenMs: performance.now(),
    msgsRx: Math.floor(40 + Math.random() * 200),
    // small per-aircraft "personality" — slow heading drift
    hdgDrift: (Math.random() - 0.5) * 0.6, // deg/sec
    spdJitter: 0,
    trail: [],
  }));

  const stats = {
    msgsTotal: 0,
    msgsLastSec: 0,
    crcFailLastSec: 0,
    peakSignalDb: -32,
    uptimeSec: 0,
    centerLat: RECEIVER.lat,
    centerLon: RECEIVER.lon,
  };

  let _msgsThisSec = 0, _crcThisSec = 0, _secAccum = 0;
  let _last = performance.now();
  const subs = new Set();
  let selectedIcao = null;

  function step() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - _last) / 1000); _last = now;

    for (const p of planes) {
      // heading drift
      p.hdg = (p.hdg + p.hdgDrift * dt + 360) % 360;
      // climb/descend toward a target band — flatten out at extremes
      if (p.alt > 40000) p.vs = Math.min(p.vs, -200);
      if (p.alt < 1500)  p.vs = Math.max(p.vs, +200);
      p.alt = Math.max(800, Math.min(42000, p.alt + (p.vs / 60) * dt)); // ft
      // groundspeed jitter
      p.spd = Math.max(60, p.spd + (Math.random() - 0.5) * 0.6);
      // move along heading
      const distNm = (p.spd / 3600) * dt;
      const dLat = (distNm * Math.cos((p.hdg * Math.PI) / 180)) / NM_PER_DEG_LAT;
      const dLon = (distNm * Math.sin((p.hdg * Math.PI) / 180)) / nmPerDegLon(p.lat);
      p.lat += dLat;
      p.lon += dLon;

      // wrap planes that fly off — re-enter from opposite side
      const maxDLat = 1.6, maxDLon = 1.8;
      if (Math.abs(p.lat - RECEIVER.lat) > maxDLat) p.lat = RECEIVER.lat - (p.lat - RECEIVER.lat) * 0.95;
      if (Math.abs(p.lon - RECEIVER.lon) > maxDLon) p.lon = RECEIVER.lon - (p.lon - RECEIVER.lon) * 0.95;

      // trail every ~1s
      if (!p._lastTrail || now - p._lastTrail > 1000) {
        p.trail.push({ lat: p.lat, lon: p.lon, t: now });
        if (p.trail.length > 40) p.trail.shift();
        p._lastTrail = now;
      }

      // simulate ADS-B message arrival ~ 2/sec per plane
      if (Math.random() < dt * 2.2) {
        p.msgsRx += 1;
        p.lastSeenMs = now;
        _msgsThisSec += 1;
        if (Math.random() < 0.018) _crcThisSec += 1;
      }
    }

    _secAccum += dt;
    stats.uptimeSec += dt;
    if (_secAccum >= 1) {
      stats.msgsLastSec = _msgsThisSec;
      stats.crcFailLastSec = _crcThisSec;
      stats.msgsTotal += _msgsThisSec;
      stats.peakSignalDb = -28 + (Math.random() - 0.5) * 6;
      _msgsThisSec = 0; _crcThisSec = 0; _secAccum = 0;
    }

    subs.forEach((fn) => fn());
  }

  let raf = 0;
  function start() {
    if (raf) return;
    _last = performance.now();
    const loop = () => { step(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }

  function subscribe(fn) { subs.add(fn); start(); return () => subs.delete(fn); }
  function setSelected(icao) { selectedIcao = icao; subs.forEach((fn) => fn()); }
  function getSelected() { return planes.find((p) => p.icao === selectedIcao) || null; }

  return { planes, stats, subscribe, setSelected, getSelected, RECEIVER, PEAKS, COASTLINE, BAY, elevation };
})();

window.LPTSim = LPTSim;
window.LPT_RECEIVER = LPTSim.RECEIVER;

// React hook — re-render at a throttled rate so we don't repaint every plane on every tick.
function useLPT(fps = 12) {
  const [, force] = React.useReducer((x) => (x + 1) & 0xfffffff, 0);
  React.useEffect(() => {
    let last = 0;
    return LPTSim.subscribe(() => {
      const now = performance.now();
      if (now - last >= 1000 / fps) { last = now; force(); }
    });
  }, [fps]);
  return LPTSim;
}

// projection helper — build per-render
function makeProj({ centerLat, centerLon, w, h, nmPerPx }) {
  return function project(lat, lon) {
    const dyNm = (lat - centerLat) * NM_PER_DEG_LAT;
    const dxNm = (lon - centerLon) * nmPerDegLon(centerLat);
    return { x: w / 2 + dxNm / nmPerPx, y: h / 2 - dyNm / nmPerPx };
  };
}

// utility: format helpers
const fmt = {
  alt: (a) => 'FL' + Math.round(a / 100).toString().padStart(3, '0'),
  altFt: (a) => Math.round(a).toString().padStart(5, ' ') + 'ft',
  spd: (s) => Math.round(s).toString().padStart(3, ' ') + 'kt',
  hdg: (h) => Math.round(((h % 360) + 360) % 360).toString().padStart(3, '0'),
  vs:  (v) => (v > 50 ? '↑' : v < -50 ? '↓' : '·') + Math.abs(Math.round(v / 100) * 100).toString().padStart(4, ' '),
  icao:(c) => c.toUpperCase(),
  pad: (s, n) => s.toString().padEnd(n, ' '),
  hms: (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return [h, m, sec].map((x) => x.toString().padStart(2, '0')).join(':');
  },
};

Object.assign(window, { useLPT, makeProj, fmt });
