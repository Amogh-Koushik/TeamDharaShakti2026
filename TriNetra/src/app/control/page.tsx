"use client";
import { useState } from 'react';
import {
  Gamepad2, Settings, Wifi, CheckCircle2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Square,
  Lightbulb, Volume2, Radio, ArrowRightToLine, ArrowLeftToLine,
  RotateCcw, Maximize2, Zap, MapPin, ScanLine
} from 'lucide-react';

// ─── Panel ────────────────────────────────────────────────────────────────
function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, ...style }}>
      {children}
    </div>
  );
}

// ─── CSS Camera Feed ──────────────────────────────────────────────────────
function CamFeed({ name, type, statusDot = '#10b981', overlay, timestamp, style }: {
  name: string; type: 'rgb' | 'thermal';
  statusDot?: string; overlay?: React.ReactNode; timestamp?: string; style?: React.CSSProperties;
}) {
  const bg: Record<string, string> = {
    rgb: 'radial-gradient(ellipse 80% 110% at 50% 95%, #3d2e20 0%, #1e170f 25%, #0d0d0a 55%, #000 100%)',
    thermal: 'radial-gradient(ellipse 60% 80% at 45% 35%, #ff4400 0%, #cc2200 18%, #880000 38%, #330000 65%, #000 100%)',
  };
  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: bg[type], ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot }} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
        </div>
        <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>LIVE</span>
      </div>
      {overlay}
      {timestamp && <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{timestamp}</div>}
      <button style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 4, padding: 4, display: 'flex', cursor: 'pointer' }}>
        <Maximize2 size={11} />
      </button>
    </div>
  );
}

// ─── 3D LiDAR Panel ──────────────────────────────────────────────────────────
function LidarPanel({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#050d18', border: '1px solid rgba(0,210,255,0.2)', ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lidar.jpg"
        alt="3D LiDAR point cloud"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'linear-gradient(to bottom,rgba(5,13,24,0.9),transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d2ff', boxShadow: '0 0 5px #00d2ff' }} />
          <ScanLine size={12} color="#00d2ff" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#00d2ff', letterSpacing: '0.04em' }}>3D LiDAR</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 8, color: 'rgba(0,210,255,0.65)', fontFamily: 'monospace' }}>360° · 16-CH</span>
          <span style={{ fontSize: 9, background: 'rgba(0,210,255,0.15)', border: '1px solid rgba(0,210,255,0.5)', color: '#00d2ff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px', background: 'linear-gradient(to top,rgba(5,13,24,0.9),transparent)' }}>
        <span style={{ fontSize: 9, color: 'rgba(0,210,255,0.5)', fontFamily: 'monospace' }}>PTS: 420k · RANGE: 0–8 m</span>
      </div>
    </div>
  );
}

// ─── D-Pad Button ─────────────────────────────────────────────────────────
function DBtn({
  children, isStop = false, isActive = false, onPress, onRelease,
}: {
  children: React.ReactNode; isStop?: boolean; isActive?: boolean;
  onPress?: () => void; onRelease?: () => void;
}) {
  return (
    <button
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={onPress}
      onTouchEnd={onRelease}
      style={{
        width: 44, height: 44,
        background: isStop ? '#ef4444' : isActive ? 'rgba(0,210,255,0.35)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${isStop ? '#ef4444' : isActive ? 'var(--primary)' : 'rgba(255,255,255,0.14)'}`,
        borderRadius: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.1s ease', fontFamily: 'inherit',
        transform: isActive ? 'scale(0.93)' : 'scale(1)',
        boxShadow: isActive ? '0 0 12px rgba(0,210,255,0.4)' : 'none',
      }}
    >{children}</button>
  );
}

// ─── Flipper Slider ────────────────────────────────────────────────────────
function FlipperControl({
  label, angle, onUp, onDown,
}: { label: string; angle: number; onUp: () => void; onDown: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>60°</div>
      <button onClick={onUp} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, color: '#fff', padding: '3px 12px', cursor: 'pointer' }}>
        <ChevronUp size={14} />
      </button>
      <div style={{ position: 'relative', width: 18, height: 80, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9 }}>
        <div style={{
          position: 'absolute',
          bottom: `${Math.min(100, (angle / 60) * 100)}%`,
          left: '50%', transform: 'translateX(-50%)',
          width: 14, height: 12, background: 'var(--primary)',
          borderRadius: 3, transition: 'bottom 0.15s ease',
          boxShadow: '0 0 8px rgba(0,210,255,0.5)',
        }} />
      </div>
      <button onClick={onDown} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, color: '#fff', padding: '3px 12px', cursor: 'pointer' }}>
        <ChevronDown size={14} />
      </button>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>0°</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>{angle}°</div>
    </div>
  );
}

// ─── Auxiliary Button ────────────────────────────────────────────────────
function AuxBtn({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '10px 6px', flex: 1, cursor: 'pointer',
      background: active ? 'rgba(0,210,255,0.18)' : 'rgba(0,210,255,0.06)',
      border: `1px solid ${active ? 'var(--primary)' : 'rgba(0,210,255,0.2)'}`,
      borderRadius: 8, color: active ? 'var(--primary)' : 'rgba(0,210,255,0.7)',
      boxShadow: active ? '0 0 12px rgba(0,210,255,0.25)' : 'none',
      transition: 'all 0.2s ease', fontFamily: 'inherit',
    }}>
      <Icon size={17} />
      <span style={{ fontSize: 9, textAlign: 'center', lineHeight: 1.4 }}>{label}</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function RoverControl() {
  // ─── State ───────────────────────────────────────────────────
  const [mode, setMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [speed, setSpeed] = useState(0.4);
  const [speedPreset, setSpeedPreset] = useState<'Slow' | 'Normal' | 'Fast'>('Normal');
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [leftFlipper, setLeftFlipper] = useState(32);
  const [rightFlipper, setRightFlipper] = useState(30);
  const [lights, setLights] = useState(false);
  const [relayDropped, setRelayDropped] = useState(false);
  const [probeExtended, setProbeExtended] = useState(false);
  const [pathProjection, setPathProjection] = useState(true);
  const [obstacleDetection, setObstacleDetection] = useState(true);
  const [safeZone, setSafeZone] = useState(false);
  const [grid, setGrid] = useState(false);

  const applySpeedPreset = (preset: 'Slow' | 'Normal' | 'Fast') => {
    setSpeedPreset(preset);
    setSpeed(preset === 'Slow' ? 0.2 : preset === 'Normal' ? 0.4 : 1.0);
  };

  const changeLeftFlipper = (delta: number) => setLeftFlipper(a => Math.max(0, Math.min(60, a + delta)));
  const changeRightFlipper = (delta: number) => setRightFlipper(a => Math.max(0, Math.min(60, a + delta)));

  const resetFlippers = () => { setLeftFlipper(0); setRightFlipper(0); };
  const stabilize = () => { setLeftFlipper(10); setRightFlipper(10); };

  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 100px)', paddingBottom: 16 }}>

      {/* ── Page Header ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Gamepad2 size={22} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Rover Control</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>Teleoperate and manage the rover in real time</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Control Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Control Mode</span>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              {(['MANUAL', 'AUTO'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '5px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                  background: mode === m ? 'var(--primary)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer',
                }}>{m}</button>
              ))}
            </div>
          </div>
          {/* Indicators */}
          {[
            { label: 'Link Quality', el: <><Wifi size={13} color="var(--success)" /><span style={{ color: 'var(--success)', fontWeight: 600 }}>-63 dBm</span></> },
            { label: 'Latency', el: <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /><span>120 ms</span></> },
            { label: 'Rover Status', el: <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} /><span style={{ color: 'var(--success)', fontWeight: 600 }}>NOMINAL</span></> },
          ].map(s => (
            <div key={s.label} style={{ fontSize: 11 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{s.el}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 275px', gap: 14 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Main RGB Camera */}
          <CamFeed name="RGB Camera (Front)" type="rgb" timestamp="2024-12-14 22:34:12" style={{ height: 240 }} />

          {/* Additional Feeds */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
              <Gamepad2 size={13} /> Additional Camera Feeds
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <CamFeed name="Thermal Camera" type="thermal" statusDot="#ef4444" style={{ height: 130 }}
                overlay={<div style={{ position: 'absolute', top: '18%', left: '35%', width: '28%', height: '56%', border: '1.5px solid red', borderRadius: 2 }}><span style={{ position: 'absolute', top: -14, left: 0, background: 'red', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>Person 91%</span></div>} />
              <div style={{ height: 130 }}><LidarPanel /></div>
            </div>
          </div>

          {/* Telemetry + IMU + Path Assist */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.8fr', gap: 10 }}>

            {/* Telemetry */}
            <P style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
                <Settings size={13} color="var(--text-muted)" /> Rover Telemetry
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                {[['Battery', '82%', '24.1 V', '#10b981'], ['Speed', `${speed.toFixed(1)} m/s`, null, '#fff'], ['Depth', '-18 m', null, 'var(--primary)'], ['Int. Temp', '31.2 °C', null, '#f59e0b']].map(([l, v, s, c]) => (
                  <div key={l as string}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>{l as string}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: c as string, lineHeight: 1 }}>{v as string}</div>
                    {s && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{s as string}</div>}
                  </div>
                ))}
              </div>
            </P>

            {/* IMU */}
            <P style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Orientation (IMU)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 36, background: 'rgba(255,255,255,0.04)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Gamepad2 size={22} color="rgba(255,255,255,0.3)" />
                </div>
                <div style={{ fontSize: 11 }}>
                  {[['Roll', '2.1°', '#10b981'], ['Pitch', '-1.8°', '#10b981'], ['Yaw', '184.2°', '#ef4444']].map(([k, v, c]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ color: c, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </P>

            {/* Path Assist */}
            <P style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                <MapPin size={13} color="var(--text-muted)" /> Path Assist
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {([
                    ['Path Projection', pathProjection, () => setPathProjection(v => !v)],
                    ['Obstacle Detection', obstacleDetection, () => setObstacleDetection(v => !v)],
                    ['Safe Zone', safeZone, () => setSafeZone(v => !v)],
                    ['Grid', grid, () => setGrid(v => !v)],
                  ] as [string, boolean, () => void][]).map(([label, checked, toggle]) => (
                    <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked} onChange={toggle} style={{ accentColor: 'var(--primary)', width: 12, height: 12 }} />
                      {label}
                    </label>
                  ))}
                </div>
                <div style={{ flex: 1, background: 'radial-gradient(ellipse at 50% 70%, #0f2010 0%, #050f08 50%, #000 100%)', borderRadius: 6, position: 'relative', minHeight: 70, overflow: 'hidden' }}>
                  <svg width="100%" height="100%" viewBox="0 0 80 70">
                    {pathProjection && <path d="M 10 65 Q 30 50 50 35 Q 65 25 72 15" fill="none" stroke="#10b981" strokeWidth="2" />}
                    {obstacleDetection && <rect x="25" y="42" width="14" height="10" rx="2" fill="none" stroke="#ef4444" strokeWidth="1.5" />}
                    {safeZone && <ellipse cx="40" cy="40" rx="30" ry="20" fill="none" stroke="rgba(0,210,255,0.3)" strokeWidth="1" strokeDasharray="3 2" />}
                    {grid && Array.from({ length: 4 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 18 + 5} x2="80" y2={i * 18 + 5} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />)}
                    {grid && Array.from({ length: 5 }, (_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />)}
                    <circle cx="10" cy="65" r="4" fill="var(--primary)" />
                  </svg>
                </div>
              </div>
            </P>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Movement Control */}
          <P style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600 }}>
                <Gamepad2 size={14} color="var(--text-muted)" /> Movement Control
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>W A S D / Arrow Keys</span>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* D-Pad */}
              <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 44px', gridTemplateRows: '44px 44px 44px', gap: 4 }}>
                <div />
                <DBtn isActive={activeDir === 'fwd'} onPress={() => setActiveDir('fwd')} onRelease={() => setActiveDir(null)}>
                  <ChevronUp size={18} />
                </DBtn>
                <div />
                <DBtn isActive={activeDir === 'left'} onPress={() => setActiveDir('left')} onRelease={() => setActiveDir(null)}>
                  <ChevronLeft size={18} />
                </DBtn>
                <DBtn isStop onPress={() => setActiveDir(null)} onRelease={() => { }}>
                  <Square size={14} />
                </DBtn>
                <DBtn isActive={activeDir === 'right'} onPress={() => setActiveDir('right')} onRelease={() => setActiveDir(null)}>
                  <ChevronRight size={18} />
                </DBtn>
                <div />
                <DBtn isActive={activeDir === 'back'} onPress={() => setActiveDir('back')} onRelease={() => setActiveDir(null)}>
                  <ChevronDown size={18} />
                </DBtn>
                <div />
              </div>
              {/* Speed */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{speed.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>m/s</span></span>
                </div>
                <input type="range" min={0} max={10} value={Math.round(speed * 10)} onChange={e => setSpeed(parseFloat(e.target.value) / 10)}
                  style={{ width: '100%', accentColor: 'var(--primary)', marginBottom: 8, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <span>0.0</span><span>1.0</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['Slow', 'Normal', 'Fast'] as const).map(s => (
                    <button key={s} onClick={() => applySpeedPreset(s)} style={{
                      flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                      background: speedPreset === s ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      border: speedPreset === s ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                      color: speedPreset === s ? '#fff' : 'var(--text-muted)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Direction indicator */}
            {activeDir && (
              <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.3)', borderRadius: 6, fontSize: 11, color: 'var(--primary)', textAlign: 'center' }}>
                Moving {activeDir === 'fwd' ? '▲ FORWARD' : activeDir === 'back' ? '▼ REVERSE' : activeDir === 'left' ? '◄ LEFT' : '► RIGHT'} at {speed.toFixed(1)} m/s
              </div>
            )}
          </P>

          {/* Flipper Control */}
          <P style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Settings size={14} color="var(--text-muted)" /> Flipper Control
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-around', marginBottom: 12 }}>
              <FlipperControl label={`Left Flipper (${leftFlipper}°)`} angle={leftFlipper} onUp={() => changeLeftFlipper(5)} onDown={() => changeLeftFlipper(-5)} />
              <FlipperControl label={`Right Flipper (${rightFlipper}°)`} angle={rightFlipper} onUp={() => changeRightFlipper(5)} onDown={() => changeRightFlipper(-5)} />
              {/* Rover diagram */}
              <div style={{ width: 65, height: 90, background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700 }}>{leftFlipper}°</div>
                <div style={{ width: 40, height: 24, border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gamepad2 size={12} color="rgba(255,255,255,0.4)" />
                </div>
                <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700 }}>{rightFlipper}°</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={resetFlippers} style={{ padding: '7px 0', fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text-main)', cursor: 'pointer', fontFamily: 'inherit' }}>Reset Flippers</button>
              <button onClick={stabilize} style={{ padding: '7px 0', fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text-main)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <RotateCcw size={11} /> Stabilize (Auto Level)
              </button>
            </div>
          </P>

          {/* Auxiliary Actions */}
          <P style={{ padding: '14px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Zap size={14} color="var(--text-muted)" /> Auxiliary Actions
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <AuxBtn icon={Lightbulb} label="Toggle Lights" active={lights} onClick={() => setLights(v => !v)} />
              <AuxBtn icon={Volume2} label="Beep" onClick={() => { }} />
              <AuxBtn icon={Radio} label="Drop Relay Node" active={relayDropped} onClick={() => setRelayDropped(v => !v)} />
              <AuxBtn icon={probeExtended ? ArrowLeftToLine : ArrowRightToLine}
                label={probeExtended ? "Retract Probe" : "Extend Probe"} active={probeExtended}
                onClick={() => setProbeExtended(v => !v)} />
            </div>

            {/* Status strip */}
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lights && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#f59e0b' }}>💡 Lights ON</span>}
              {relayDropped && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success)', color: 'var(--success)' }}>📡 Node Dropped</span>}
              {probeExtended && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,210,255,0.15)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>→ Probe Extended</span>}
            </div>
          </P>
        </div>
      </div>

      {/* ── System Status Footer ──────────────────────────────── */}
      <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(45,60,85,0.4)', borderRadius: 8, padding: '7px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={13} color="var(--success)" />
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>All Systems Operational</span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>Last Data Received: 22:34:12 (2 sec ago)</span>
        {[['Backend', 'Online'], ['ROS 2', 'Online'], ['ML Service', 'Online'], ['Database', 'Recording']].map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
            <span style={{ color: 'var(--success)' }}>{v}</span>
          </span>
        ))}
        <span style={{ color: 'var(--text-muted)' }}>v1.0.0</span>
      </div>
    </div>
  );
}
