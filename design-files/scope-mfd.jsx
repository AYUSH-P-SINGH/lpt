/* scope-mfd.jsx — Variant B: glass-cockpit MFD style.
   Compass rose, banded contour terrain, white-boxed data tags, side menu. */

function ScopeMFD({ w = 1280, h = 800 }) {
  const sim = useLPT(15);
  const pal = usePalette();

  const TOP_H = 44;
  const MENU_W = 90;
  const BOT_H = 110;
  const scopeW = w - MENU_W;
  const scopeH = h - TOP_H - BOT_H;

  // compass rose lives inside the scope; planes project around center
  const cx = scopeW / 2, cy = scopeH * 0.58;
  const RING_NM = 30, RING_COUNT = 3;
  const maxNm = RING_NM * RING_COUNT;
  const roseR = Math.min(cx, cy) - 30;
  const nmPerPx = maxNm / (roseR - 10);

  const project = makeProj({
    centerLat: sim.RECEIVER.lat, centerLon: sim.RECEIVER.lon,
    w: scopeW, h: scopeH, nmPerPx,
  });

  const terrain = React.useMemo(
    () => buildTerrainPaths({ peaks: sim.PEAKS, project, jitter: 0.9, levels: 6 }),
    []
  );
  const coast = React.useMemo(() => buildPolylinePath(sim.COASTLINE, project), []);
  const bay   = React.useMemo(() => buildPolylinePath(sim.BAY, project), []);

  const [selectedIcao, setSelectedIcao] = React.useState(sim.planes[2].icao);
  const selected = sim.planes.find((p) => p.icao === selectedIcao);

  const visible = sim.planes.filter((p) => {
    const s = project(p.lat, p.lon);
    return Math.hypot(s.x - cx, s.y - cy) < roseR;
  });

  return (
    <div style={{
      width: w, height: h, background: '#02110a', color: pal.fg, position: 'relative',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace', overflow: 'hidden',
      boxShadow: `inset 0 0 80px rgba(0,0,0,0.6)`,
    }}>
      {/* subtle glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 65%, rgba(0,0,0,0.5) 100%)` }} />

      {/* TOP BAR */}
      <div style={{ height: TOP_H, display: 'flex', alignItems: 'center',
        padding: '0 16px', borderBottom: `1px solid ${pal.faint}`,
        background: 'linear-gradient(180deg, #061a10, #02110a)', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, fontWeight: 700, color: pal.fg }}>LPT/MFD</div>
        <div style={{ marginLeft: 20, fontSize: 10, color: pal.dim, letterSpacing: 1.5 }}>
          AIR TRAFFIC · MOVING MAP · NORTH UP
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['GPS · LOCK', 'RX 1090.0', 'IF −18dB', `AC ${sim.planes.length}`, `MSG ${sim.stats.msgsLastSec}/s`].map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: '4px 9px', border: `1px solid ${pal.dim}`,
              color: pal.fg, letterSpacing: 1,
            }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', height: h - TOP_H }}>

        {/* SCOPE */}
        <div style={{ width: scopeW, position: 'relative' }}>
          <svg width={scopeW} height={scopeH + BOT_H} viewBox={`0 0 ${scopeW} ${scopeH + BOT_H}`} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <clipPath id="mfd-clip">
                <circle cx={cx} cy={cy} r={roseR} />
              </clipPath>
              <radialGradient id="mfd-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={pal.fg} stopOpacity={0.04} />
                <stop offset="100%" stopColor={pal.fg} stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* outer disc fill */}
            <circle cx={cx} cy={cy} r={roseR + 1} fill="#031309" />
            <circle cx={cx} cy={cy} r={roseR} fill="url(#mfd-glow)" />

            <g clipPath="url(#mfd-clip)">
              {/* terrain banded */}
              <TerrainLayer paths={terrain} color={pal.fg} baseOpacity={0.10} mode="banded" />
              {/* coast */}
              <CoastLayer d={coast} color={pal.fg} opacity={0.6} width={1.2} />
              <CoastLayer d={bay} color={pal.fg} opacity={0.45} width={0.9} />

              {/* range rings (concentric arcs) */}
              <RangeRings cx={cx} cy={cy} ringNm={RING_NM} ringCount={RING_COUNT}
                nmPerPx={nmPerPx} color={pal.fg} dim={pal.dim} />

              {/* trail dots */}
              {visible.flatMap((p) =>
                p.trail.slice(-10).map((t, i, arr) => {
                  const s = project(t.lat, t.lon);
                  return <circle key={p.icao + i} cx={s.x} cy={s.y} r={1.3} fill={pal.fg} opacity={0.15 + (i / arr.length) * 0.4} />;
                })
              )}

              {/* planes */}
              {visible.map((p) => {
                const s = project(p.lat, p.lon);
                const isSel = p.icao === selectedIcao;
                const distNm = (p.spd / 60) * 1; // 1 min
                const len = distNm / nmPerPx;
                const a = ((p.hdg - 90) * Math.PI) / 180;
                return (
                  <g key={p.icao} style={{ cursor: 'pointer' }} onClick={() => setSelectedIcao(p.icao)}>
                    <line x1={s.x} y1={s.y} x2={s.x + Math.cos(a) * len} y2={s.y + Math.sin(a) * len}
                      stroke={isSel ? pal.sel : pal.fg} strokeWidth={isSel ? 1.2 : 0.7} opacity={isSel ? 0.85 : 0.55} strokeDasharray={isSel ? 'none' : '4 3'} />
                    {isSel && <circle cx={s.x} cy={s.y} r={13} fill="none" stroke={pal.sel} strokeWidth={0.8} />}
                    <PlaneSilhouette x={s.x} y={s.y} hdg={p.hdg} kind={p.kind} isSelected={isSel} color={isSel ? pal.sel : pal.fg} />
                    <DataTagFull x={s.x} y={s.y} plane={p} color={isSel ? pal.sel : pal.fg} dim={pal.dim} selected={isSel} />
                  </g>
                );
              })}

              {/* receiver */}
              <g transform={`translate(${cx} ${cy})`}>
                <circle r={8} fill="none" stroke={pal.fg} strokeWidth={1.4} />
                <line x1={-4} y1={0} x2={4} y2={0} stroke={pal.fg} strokeWidth={1.4} />
                <line x1={0} y1={-4} x2={0} y2={4} stroke={pal.fg} strokeWidth={1.4} />
              </g>
            </g>

            {/* compass rose */}
            <CompassRose cx={cx} cy={cy} r={roseR + 18} color={pal.fg} dim={pal.dim} dense={true} />
            <circle cx={cx} cy={cy} r={roseR + 22} fill="none" stroke={pal.dim} strokeWidth={0.7} />
            <circle cx={cx} cy={cy} r={roseR} fill="none" stroke={pal.fg} strokeWidth={1.2} />

            {/* range labels above rose */}
            <g>
              <text x={cx} y={cy - roseR - 30} fill={pal.fg} fontSize={11} fontFamily="JetBrains Mono, monospace"
                textAnchor="middle" fontWeight={700} letterSpacing={2}>N · HDG 360°</text>
            </g>

            {/* MFD corner readouts */}
            <g fontFamily="JetBrains Mono, monospace" fontSize={10}>
              <text x={16} y={20} fill={pal.dim}>RNG</text>
              <text x={16} y={36} fill={pal.fg} fontSize={20} fontWeight={700}>{maxNm}<tspan fontSize={11} fill={pal.dim}> NM</tspan></text>

              <text x={16} y={68} fill={pal.dim}>POS</text>
              <text x={16} y={84} fill={pal.fg} fontSize={12}>{sim.RECEIVER.lat.toFixed(4)}°N</text>
              <text x={16} y={98} fill={pal.fg} fontSize={12}>{Math.abs(sim.RECEIVER.lon).toFixed(4)}°W</text>

              <text x={scopeW - 100} y={20} fill={pal.dim}>UTC</text>
              <text x={scopeW - 100} y={36} fill={pal.fg} fontSize={20} fontWeight={700}>
                {new Date().toISOString().slice(11, 16)}<tspan fontSize={11} fill={pal.dim}>Z</tspan>
              </text>

              <text x={scopeW - 100} y={68} fill={pal.dim}>TFC</text>
              <text x={scopeW - 100} y={84} fill={pal.fg} fontSize={12}>{sim.planes.length} CONTACTS</text>
              <text x={scopeW - 100} y={98} fill={pal.fg} fontSize={12}>{visible.length} IN RANGE</text>
            </g>
          </svg>

          {/* bottom selected-aircraft strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: BOT_H,
            background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.6))',
            borderTop: `1px solid ${pal.faint}`,
            display: 'flex', padding: '12px 18px', gap: 22,
          }}>
            <div style={{ flex: '0 0 220px' }}>
              <div style={{ fontSize: 10, color: pal.dim, letterSpacing: 1.5 }}>SELECTED · ICAO {fmt.icao(selected.icao)}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: pal.sel, letterSpacing: 2, marginTop: 4 }}>{selected.cs}</div>
              <div style={{ fontSize: 10.5, color: pal.dim, marginTop: 2 }}>{selected.model} · {selected.kind.toUpperCase()} · SQK {selected.squawk}</div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {[
                ['ALT', `${Math.round(selected.alt).toLocaleString()}`, 'ft'],
                ['GS',  `${Math.round(selected.spd)}`, 'kt'],
                ['HDG', `${fmt.hdg(selected.hdg)}`, '°'],
                ['V/S', `${selected.vs > 0 ? '+' : ''}${Math.round(selected.vs / 100) * 100}`, 'fpm'],
                ['LAT', `${selected.lat.toFixed(3)}`, '°N'],
                ['LON', `${Math.abs(selected.lon).toFixed(3)}`, '°W'],
              ].map(([k, v, u]) => (
                <div key={k} style={{ padding: '4px 6px', borderLeft: `1px solid ${pal.faint}` }}>
                  <div style={{ fontSize: 9, color: pal.dim, letterSpacing: 1 }}>{k}</div>
                  <div style={{ fontSize: 18, color: pal.fg, fontWeight: 600, marginTop: 2 }}>
                    {v}<span style={{ fontSize: 10, color: pal.dim, marginLeft: 3 }}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT MENU STRIP */}
        <div style={{
          width: MENU_W, borderLeft: `1px solid ${pal.faint}`,
          display: 'flex', flexDirection: 'column', background: '#02110a',
        }}>
          {['MAP', 'TFC', 'WX', 'TER', 'NRST', 'RNG +', 'RNG −', 'BRG', 'MENU'].map((label, i) => (
            <div key={label} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderBottom: `1px solid ${pal.faint}`,
              color: i < 3 ? pal.fg : pal.dim, fontSize: 11, letterSpacing: 1.5, fontWeight: 600,
              background: i === 1 ? `${pal.fg}18` : 'transparent', // TFC active
              cursor: 'pointer',
            }}>{label}</div>
          ))}
        </div>

      </div>
    </div>
  );
}

window.ScopeMFD = ScopeMFD;
