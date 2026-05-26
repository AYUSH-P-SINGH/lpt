/* live.jsx — SSE client; exposes the same window.LPTSim API as sim.jsx */

const LPTSim = (() => {
  let planes = [], stats = {}, selectedIcao = null;
  let RECEIVER = { lat: 0, lon: 0, label: "HOME" };
  const subs = new Set();

  function notify() { subs.forEach(fn => fn()); }

  function connect() {
    const es = new EventSource("/events");
    es.onmessage = (e) => {
      const d = JSON.parse(e.data);
      RECEIVER = d.receiver;
      stats = { ...d.stats, crcFailLastSec: d.stats.crcFailLastSec ?? 0, peakSignalDb: -30 };
      planes = d.planes.map(p => ({ ...p, selected: p.icao === selectedIcao }));
      notify();
    };
    es.onerror = () => { es.close(); setTimeout(connect, 3000); };
  }
  connect();

  return {
    get planes()    { return planes;   },
    get stats()     { return stats;    },
    get RECEIVER()  { return RECEIVER; },
    subscribe(fn)       { subs.add(fn); return () => subs.delete(fn); },
    setSelected(icao)   { selectedIcao = icao; if (icao) fetch(`/select/${icao}`, { method: "POST" }); notify(); },
    getSelected()       { return planes.find(p => p.icao === selectedIcao) ?? null; },
  };
})();

window.LPTSim       = LPTSim;
window.LPT_RECEIVER = LPTSim.RECEIVER;

// Copy useLPT, makeProj, and fmt verbatim from design-files/sim.jsx below this line

const NM_PER_DEG_LAT = 60;
const nmPerDegLon = (lat) => 60 * Math.cos((lat * Math.PI) / 180);

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
