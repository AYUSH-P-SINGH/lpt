/* scope-wireframe.jsx — Variant C: minimal wireframe ATC display.
   Thin contour terrain, chevron planes, pill tags, big sortable fleet table. */

function ScopeWireframe({ w = 1280, h = 800 }) {
  const sim = useLPT(15);
  const pal = usePalette();

  const TOP_H = 38;
  const SIDE_W = 480;
  const scopeW = w - SIDE_W;
  const scopeH = h - TOP_H;

  const cx = scopeW / 2, cy = scopeH / 2;
  const RING_NM = 25, RING_COUNT = 4;
  const maxNm = RING_NM * RING_COUNT;
  const nmPerPx = maxNm / Math.min(cx - 30, cy - 30);

  const project = makeProj({
    centerLat: sim.RECEIVER.lat, centerLon: sim.RECEIVER.lon,
    w: scopeW, h: scopeH, nmPerPx,
  });

  // dense contour terrain — more levels, thin lines
  const terrain = React.useMemo(
    () => buildTerrainPaths({ peaks: sim.PEAKS, project, jitter: 0.7, levels: 9 }),
    []
  );
  const coast = React.useMemo(() => buildPolylinePath(sim.COASTLINE, project), []);
  const bay   = React.useMemo(() => buildPolylinePath(sim.BAY, project), []);
  const graticule = React.useMemo(() => buildGraticule({
    centerLat: sim.RECEIVER.lat, centerLon: sim.RECEIVER.lon,
    project, w: scopeW, h: scopeH, stepDeg: 0.25,
  }), []);

  const [selectedIcao, setSelectedIcao] = React.useState(sim.planes[5].icao);
  const selected = sim.planes.find((p) => p.icao === selectedIcao);
  const [sortKey, setSortKey] = React.useState('rng');

  return (
    <div style={{
      width: w, height: h, background: '#00100a', color: pal.fg,
      fontFamily: 'JetBrains Mono, ui-monospace, monospace', overflow: 'hidden',
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP STATUS BAR */}
      <div style={{
        height: TOP_H, borderBottom: `1px solid ${pal.faint}`,
        display: 'flex', alignItems: 'stretch', fontSize: 11,
      }}>
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 18,
          borderRight: `1px solid ${pal.faint}`, fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>
          <span>LPT</span><span style={{ color: pal.dim, fontWeight: 400 }}>v0.1 · wireframe</span>
        </div>
        {[
          ['SAMPLES', `${(2.0).toFixed(1)}MS/s`],
          ['MSG/s',   `${sim.stats.msgsLastSec.toString().padStart(3, '0')}`],
          ['CRC',     `${((sim.stats.crcFailLastSec / Math.max(1, sim.stats.msgsLastSec)) * 100).toFixed(1)}%`],
          ['PEAK',    `${sim.stats.peakSignalDb.toFixed(1)}dB`],
          ['TFC',     `${sim.planes.length}`],
          ['UPTIME',  fmt.hms(sim.stats.uptimeSec)],
          ['UTC',     new Date().toISOString().slice(11, 19) + 'Z'],
        ].map(([k, v]) => (
          <div key={k} style={{
            padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8,
            borderRight: `1px solid ${pal.faint}`,
          }}>
            <span style={{ color: pal.dim, fontSize: 9, letterSpacing: 1.5 }}>{k}</span>
            <span style={{ color: pal.fg, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* SCOPE */}
        <div style={{ width: scopeW, height: scopeH, position: 'relative' }}>
          <svg width={scopeW} height={scopeH} viewBox={`0 0 ${scopeW} ${scopeH}`}>
            {/* graticule grid */}
            <g opacity={0.12}>
              {graticule.map((d, i) => <path key={i} d={d} stroke={pal.fg} strokeWidth={0.4} fill="none" />)}
            </g>

            {/* terrain — dense thin contour lines */}
            <TerrainLayer paths={terrain} color={pal.fg} baseOpacity={0.18} mode="detail" />
            <CoastLayer d={coast} color={pal.fg} opacity={0.55} width={1.0} />
            <CoastLayer d={bay} color={pal.fg} opacity={0.40} width={0.7} />

            {/* range rings (subtle) */}
            <RangeRings cx={cx} cy={cy} ringNm={RING_NM} ringCount={RING_COUNT}
              nmPerPx={nmPerPx} color={pal.fg} dim={pal.dim} labelEvery={2} />

            {/* bearing ticks at edge (just N/E/S/W) */}
            {[
              { d: 0, label: 'N' }, { d: 90, label: 'E' }, { d: 180, label: 'S' }, { d: 270, label: 'W' },
            ].map(({ d, label }) => {
              const a = ((d - 90) * Math.PI) / 180;
              const r = Math.min(cx, cy) - 18;
              return (
                <text key={label} x={cx + Math.cos(a) * r} y={cy + Math.sin(a) * r + 4}
                  fill={pal.dim} fontSize={11} fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle" fontWeight={600}>{label}</text>
              );
            })}

            {/* planes */}
            {sim.planes.map((p) => {
              const s = project(p.lat, p.lon);
              if (s.x < 10 || s.x > scopeW - 10 || s.y < 10 || s.y > scopeH - 10) return null;
              const isSel = p.icao === selectedIcao;
              // 1-min vector
              const distNm = (p.spd / 60);
              const len = distNm / nmPerPx;
              const a = ((p.hdg - 90) * Math.PI) / 180;
              return (
                <g key={p.icao} style={{ cursor: 'pointer' }} onClick={() => setSelectedIcao(p.icao)}>
                  <line x1={s.x} y1={s.y} x2={s.x + Math.cos(a) * len} y2={s.y + Math.sin(a) * len}
                    stroke={pal.dim} strokeWidth={0.7} />
                  {isSel && (
                    <>
                      <circle cx={s.x} cy={s.y} r={14} fill="none" stroke={pal.sel} strokeWidth={0.9} />
                      <line x1={s.x - 22} y1={s.y} x2={s.x - 14} y2={s.y} stroke={pal.sel} strokeWidth={1} />
                      <line x1={s.x + 14} y1={s.y} x2={s.x + 22} y2={s.y} stroke={pal.sel} strokeWidth={1} />
                    </>
                  )}
                  <PlaneChevron x={s.x} y={s.y} hdg={p.hdg} kind={p.kind} isSelected={isSel} color={isSel ? pal.sel : pal.fg} />
                  <DataTagPill x={s.x} y={s.y} plane={p} color={isSel ? pal.sel : pal.fg} dim={pal.dim} selected={isSel} />
                </g>
              );
            })}

            {/* receiver marker */}
            <g transform={`translate(${cx} ${cy})`}>
              <rect x={-5} y={-5} width={10} height={10} fill="none" stroke={pal.fg} strokeWidth={1.2} />
              <text x={9} y={-7} fill={pal.dim} fontSize={9} fontFamily="JetBrains Mono, monospace">RX</text>
            </g>

            {/* corner overlays */}
            <g fontFamily="JetBrains Mono, monospace" fontSize={9} fill={pal.dim}>
              <text x={14} y={20}>RECEIVER · {sim.RECEIVER.label} · {sim.RECEIVER.lat.toFixed(4)}°N {Math.abs(sim.RECEIVER.lon).toFixed(4)}°W</text>
              <text x={14} y={scopeH - 14}>RNG MAX {maxNm}NM · STEP {RING_NM}NM · GRAT 0.25°</text>
              <text x={scopeW - 14} y={20} textAnchor="end">NORTH UP · ZULU</text>
              <text x={scopeW - 14} y={scopeH - 14} textAnchor="end">PROJ EQUIRECT · WGS84</text>
            </g>
          </svg>
        </div>

        {/* SIDEBAR */}
        <ScopeWireframeSidebar
          w={SIDE_W} h={scopeH} sim={sim} pal={pal}
          selected={selected} onSelect={setSelectedIcao}
          sortKey={sortKey} setSortKey={setSortKey}
          project={project} maxNm={maxNm} cx={cx} cy={cy}
        />
      </div>
    </div>
  );
}

function ScopeWireframeSidebar({ w, h, sim, pal, selected, onSelect, sortKey, setSortKey, project, maxNm, cx, cy }) {
  const rows = sim.planes.map((p) => {
    const s = project(p.lat, p.lon);
    const rng = Math.hypot(s.x - cx, s.y - cy) * (maxNm / Math.min(cx, cy));
    return { ...p, rng };
  });
  rows.sort((a, b) => {
    if (sortKey === 'cs')  return a.cs.localeCompare(b.cs);
    if (sortKey === 'alt') return b.alt - a.alt;
    if (sortKey === 'spd') return b.spd - a.spd;
    return a.rng - b.rng;
  });

  const Th = ({ k, children, w }) => (
    <span style={{ width: w, cursor: 'pointer', color: sortKey === k ? pal.fg : pal.dim,
      textDecoration: sortKey === k ? 'underline' : 'none', fontWeight: sortKey === k ? 600 : 400 }}
      onClick={() => setSortKey(k)}>{children}</span>
  );

  return (
    <div style={{ width: w, height: h, borderLeft: `1px solid ${pal.faint}`,
      display: 'flex', flexDirection: 'column', background: '#000d07' }}>

      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${pal.faint}` }}>
        <div style={{ fontSize: 10, color: pal.dim, letterSpacing: 1.8 }}>FLEET · {rows.length} CONTACTS</div>
        <div style={{ fontSize: 18, color: pal.fg, marginTop: 4, letterSpacing: 1.5, fontWeight: 600 }}>
          AIRSPACE TRAFFIC
        </div>
      </div>

      {/* COLUMN HEADERS */}
      <div style={{ display: 'flex', padding: '8px 14px', fontSize: 9, color: pal.dim,
        letterSpacing: 1.4, borderBottom: `1px solid ${pal.faint}`, gap: 0 }}>
        <Th k="cs"  w={84}>CALLSIGN</Th>
        <Th k="alt" w={62}>ALT</Th>
        <Th k="spd" w={56}>SPD</Th>
        <span style={{ width: 50, color: pal.dim }}>HDG</span>
        <Th k="rng" w={62}>RNG</Th>
        <span style={{ flex: 1, color: pal.dim, textAlign: 'right' }}>SQK</span>
      </div>

      {/* ROWS */}
      <div style={{ flex: 1, overflow: 'auto', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
        {rows.map((p) => {
          const isSel = p.icao === selected.icao;
          return (
            <div key={p.icao} onClick={() => onSelect(p.icao)}
              style={{
                display: 'flex', padding: '7px 14px',
                borderBottom: `1px solid ${pal.faint}`, cursor: 'pointer',
                color: isSel ? pal.bg : pal.fg, background: isSel ? pal.fg : 'transparent',
              }}>
              <span style={{ width: 84, fontWeight: 600 }}>{p.cs}</span>
              <span style={{ width: 62 }}>{Math.round(p.alt / 100) * 100}</span>
              <span style={{ width: 56 }}>{Math.round(p.spd)}</span>
              <span style={{ width: 50 }}>{fmt.hdg(p.hdg)}</span>
              <span style={{ width: 62 }}>{p.rng.toFixed(1)}</span>
              <span style={{ flex: 1, textAlign: 'right', color: isSel ? pal.bg : pal.dim }}>{p.squawk}</span>
            </div>
          );
        })}
      </div>

      {/* SELECTED CARD */}
      <div style={{ borderTop: `1px solid ${pal.faint}`, padding: '14px 16px', background: '#02180e' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, color: pal.dim, letterSpacing: 1.5 }}>SELECTED · {fmt.icao(selected.icao)} · {selected.model}</div>
            <div style={{ fontSize: 26, color: pal.fg, fontWeight: 700, letterSpacing: 2, marginTop: 3 }}>{selected.cs}</div>
          </div>
          <div style={{ fontSize: 10, color: pal.dim, textAlign: 'right' }}>
            <div>SQK {selected.squawk}</div>
            <div>MSGS {selected.msgsRx}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 12,
          background: pal.faint, padding: 1 }}>
          {[
            ['ALT',  `${Math.round(selected.alt).toLocaleString()}`, 'ft'],
            ['GS',   `${Math.round(selected.spd)}`, 'kt'],
            ['HDG',  `${fmt.hdg(selected.hdg)}`, '°'],
            ['V/S',  `${selected.vs > 0 ? '+' : ''}${Math.round(selected.vs / 100) * 100}`, 'fpm'],
          ].map(([k, v, u]) => (
            <div key={k} style={{ background: '#02180e', padding: '8px 10px' }}>
              <div style={{ fontSize: 8.5, color: pal.dim, letterSpacing: 1.2 }}>{k}</div>
              <div style={{ color: pal.fg, fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                {v}<span style={{ fontSize: 9, color: pal.dim, marginLeft: 2 }}>{u}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9.5, color: pal.dim, display: 'flex', justifyContent: 'space-between' }}>
          <span>{selected.lat.toFixed(4)}°N {Math.abs(selected.lon).toFixed(4)}°W</span>
          <span>LAST {((performance.now() - selected.lastSeenMs) / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

window.ScopeWireframe = ScopeWireframe;
