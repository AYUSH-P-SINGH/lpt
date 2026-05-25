/* app.jsx — root: DesignCanvas with 3 scope artboards + Tweaks panel for palette. */

const PALETTES = {
  phosphor: { name: 'PHOSPHOR', fg: '#33ff77', dim: '#1f8a46', faint: '#0a3318', glow: 'rgba(51,255,119,0.45)', bg: '#020a05', warn: '#ffb84d', sel: '#e6fff0' },
  amber:    { name: 'AMBER',    fg: '#ffb240', dim: '#a06a18', faint: '#3a2607', glow: 'rgba(255,178,64,0.5)',  bg: '#0a0602', warn: '#ff5a3b', sel: '#fff1d6' },
  cyan:     { name: 'CYAN',     fg: '#39d8ff', dim: '#1a7693', faint: '#072a35', glow: 'rgba(57,216,255,0.45)', bg: '#02080b', warn: '#ff7a4d', sel: '#e0f7ff' },
  ice:      { name: 'ICE',      fg: '#e2e9ef', dim: '#65737f', faint: '#1a2128', glow: 'rgba(226,233,239,0.35)',bg: '#05080b', warn: '#ff8a4d', sel: '#ffffff' },
};

function applyPalette(key) {
  const p = PALETTES[key] || PALETTES.phosphor;
  const r = document.documentElement.style;
  r.setProperty('--lpt-fg',    p.fg);
  r.setProperty('--lpt-dim',   p.dim);
  r.setProperty('--lpt-faint', p.faint);
  r.setProperty('--lpt-glow',  p.glow);
  r.setProperty('--lpt-bg',    p.bg);
  r.setProperty('--lpt-warn',  p.warn);
  r.setProperty('--lpt-sel',   p.sel);
  window.dispatchEvent(new Event('lpt-palette'));
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "phosphor"
}/*EDITMODE-END*/;

function App() {
  // apply on mount
  React.useEffect(() => { applyPalette(TWEAK_DEFAULTS.palette); }, []);
  const t = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyPalette(t.palette); }, [t.palette]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="scopes" title="lpt · radar scope variants"
          subtitle="Live ADS-B sim · 17 contacts · KSFO receiver · three visual takes on the same data">
          <DCArtboard id="classic" label="A · CRT Phosphor Scope" width={1280} height={800}>
            <ScopeClassic w={1280} height={800} />
          </DCArtboard>
          <DCArtboard id="mfd" label="B · Glass-Cockpit MFD" width={1280} height={800}>
            <ScopeMFD w={1280} h={800} />
          </DCArtboard>
          <DCArtboard id="wireframe" label="C · ATC Wireframe" width={1280} height={800}>
            <ScopeWireframe w={1280} h={800} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Display">
          <TweakColor
            label="Palette"
            value={t.palette === 'phosphor' ? '#33ff77' : t.palette === 'amber' ? '#ffb240' : t.palette === 'cyan' ? '#39d8ff' : '#e2e9ef'}
            options={['#33ff77', '#ffb240', '#39d8ff', '#e2e9ef']}
            onChange={(c) => {
              const map = { '#33ff77': 'phosphor', '#ffb240': 'amber', '#39d8ff': 'cyan', '#e2e9ef': 'ice' };
              t.setTweak('palette', map[c] || 'phosphor');
            }}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.5 }}>
            Swaps the phosphor color across all three scopes. Classic CRT scope keeps its sweep + scanline overlay regardless of palette.
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
