"use client";

import React from 'react';
import {
  Car, Radio, Share2, Brain, ShieldCheck, Navigation,
  Map, Layers, Plus, Minus, Maximize2, Thermometer,
  Wind, Battery, Gauge, Activity, ArrowRight, Settings, ArrowUpRight, Zap, LayoutGrid
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────
const sp = (base: number, n = 12, s = 0.1) =>
  Array.from({ length: n }, (_, i) => ({
    v: +(base + Math.sin(i * 0.9) * s + (((i * 1234567) % 100) / 100 - 0.5) * s * 0.5).toFixed(3),
  }));

// ─── Tiny sparkline ────────────────────────────────────────────────────────
function Spark({ data, color = '#10b981', h = 28 }: { data: { v: number }[]; color?: string; h?: number }) {
  const vals = data.map(d => d.v);
  const mn = Math.min(...vals), mx = Math.max(...vals), pd = (mx - mn) * 0.5 || 0.2;
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis domain={[mn - pd, mx + pd]} hide />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Status chip ───────────────────────────────────────────────────────────
function Chip({ color = '#10b981', label }: { color?: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
      border: `1px solid ${color}40`, color, background: `${color}18`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─── Card container ────────────────────────────────────────────────────────
function Card({ children, style, pad = true }: { children: React.ReactNode; style?: React.CSSProperties; pad?: boolean }) {
  return (
    <div style={{
      background: 'rgba(10,18,32,0.9)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: pad ? '14px 16px' : 0,
      backdropFilter: 'blur(8px)',
      ...style,
    }}>{children}</div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────
function STitle({ icon: Icon, text, right }: { icon: React.ElementType; text: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon size={13} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{text}</span>
      </div>
      {right}
    </div>
  );
}

// ─── Compact gas cell ──────────────────────────────────────────────────────
function GasCell({ label, val, unit, ok = true, data, color = '#10b981' }: {
  label: string; val: string; unit: string; ok?: boolean; data: { v: number }[]; color?: string;
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', border: `1px solid ${ok ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.3)'}` }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{val}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{unit}</span>
      </div>
      <Chip color={ok ? '#10b981' : '#f59e0b'} label={ok ? 'NORMAL' : 'RISING'} />
      <Spark data={data} color={color} h={24} />
    </div>
  );
}

// ─── CSS Camera Feed ──────────────────────────────────────────────────────
function CamFeed({ name, type, overlay, timestamp, style }: {
  name: string; type: 'rgb' | 'thermal' | 'ceiling' | 'probe';
  overlay?: React.ReactNode; timestamp?: string; style?: React.CSSProperties;
}) {
  const bgs: Record<string, string> = {
    rgb:     'radial-gradient(ellipse 80% 120% at 50% 100%, #3d2e20 0%, #1e170f 30%, #0a0a09 60%, #000 100%)',
    thermal: 'radial-gradient(ellipse 65% 80% at 42% 32%, #ff4400 0%, #cc2200 20%, #770000 42%, #1a0000 70%, #000 100%)',
    ceiling: 'radial-gradient(circle at 50% 50%, #181816 0%, #0a0a09 60%, #000 100%)',
    probe:   'radial-gradient(ellipse 50% 70% at 50% 60%, #121210 0%, #080808 60%, #000 100%)',
  };
  const dots: Record<string, string> = { rgb: '#10b981', thermal: '#ef4444', ceiling: '#10b981', probe: '#f59e0b' };
  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: bgs[type], ...style }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dots[type], display: 'inline-block', boxShadow: `0 0 5px ${dots[type]}` }} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', padding: '1px 5px', borderRadius: 3, background: 'rgba(16,185,129,0.1)' }}>LIVE</span>
      </div>
      {overlay}
      {timestamp && <div suppressHydrationWarning style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{timestamp}</div>}
      <button style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 4, padding: 4, display: 'flex', cursor: 'pointer' }}>
        <Maximize2 size={10} />
      </button>
    </div>
  );
}

// ─── SVG Tunnel Map ────────────────────────────────────────────────────────
function TunnelMap() {
  const dots = Array.from({ length: 250 }, (_, i) => {
    const h = ((i * 2654435761) >>> 0) % 10000 / 10000;
    const v = ((i * 1234567891) >>> 0) % 10000 / 10000;
    const t = i / 250;
    return { x: 50 + t * 460 + (h - 0.5) * 70, y: 240 - t * 170 + (v - 0.5) * 50, a: 0.2 + h * 0.5 };
  });
  return (
    <svg width="100%" height="100%" viewBox="0 0 560 280" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="mbg"><stop offset="0%" stopColor="#071220" /><stop offset="100%" stopColor="#020810" /></radialGradient>
        <filter id="glow2"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="560" height="280" fill="url(#mbg)" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.1} fill={`rgba(${70 + (i % 70)},${120 + (i % 90)},${210 + (i % 45)},${d.a})`} />
      ))}
      {/* Explored tunnel */}
      <path d="M 50 240 C 120 215, 185 188, 235 168 C 285 148, 335 130, 390 112 C 440 97, 490 82, 530 65"
        fill="none" stroke="rgba(59,130,246,0.14)" strokeWidth="55" strokeLinecap="round" />
      {/* Rover path */}
      <path d="M 50 240 C 120 215, 185 188, 235 168" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="7 4" />
      <path d="M 235 168 C 285 148, 335 130, 390 112 C 440 97, 490 82, 530 65" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 5" />
      {/* Gas hazard */}
      <circle cx="300" cy="155" r="22" fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" />
      <text x="289" y="152" fill="#f59e0b" fontSize="13">⚠</text>
      <text x="283" y="163" fill="#f59e0b" fontSize="7.5">CH₄ 1.8%</text>
      {/* Nodes */}
      {[
        { x: 50, y: 240, l: 'RVR-01', c: '#10b981', r: 9, rover: true },
        { x: 140, y: 208, l: 'N2', c: '#3a82f6', r: 5 },
        { x: 235, y: 168, l: 'N3', c: '#3a82f6', r: 5 },
        { x: 390, y: 112, l: 'N4', c: '#3a82f6', r: 5 },
        { x: 530, y: 65,  l: 'Survivor?', c: '#ef4444', r: 7 },
      ].map((n, i) => (
        <g key={i} filter="url(#glow2)">
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} stroke="rgba(255,255,255,0.5)" strokeWidth={n.rover ? 2 : 1.5} />
          {i > 0 && <text x={n.x + 9} y={n.y - 3} fill={n.c} fontSize={8} fontFamily="Inter,sans-serif" fontWeight="600">{n.l}</text>}
          {i === 0 && <text x={n.x + 12} y={n.y + 4} fill="#10b981" fontSize={8} fontFamily="Inter,sans-serif" fontWeight="700">RVR-01</text>}
        </g>
      ))}
      {/* Compass */}
      <g transform="translate(532,22)">
        <circle cx="0" cy="0" r="14" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <text fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="Inter" textAnchor="middle" x="0" y="-3">N</text>
        <text fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="Inter" textAnchor="middle" x="0" y="12">S</text>
        <text fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="Inter" textAnchor="middle" x="-10" y="5">W</text>
        <text fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="Inter" textAnchor="middle" x="10" y="5">E</text>
      </g>
      {/* Scale */}
      <g transform="translate(15,265)">
        <line x1="0" y1="0" x2="70" y2="0" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <line x1="70" y1="-4" x2="70" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <text x="0" y="13" fill="rgba(255,255,255,0.4)" fontSize="8">0</text>
        <text x="65" y="13" fill="rgba(255,255,255,0.4)" fontSize="8">50 m</text>
      </g>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function Overview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>

      {/* ══ TOP: Page title + Mission info bar ══════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Mission Overview</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><Navigation size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />RVR-01</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Underground Mine – Sector A</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <Chip color="#10b981" label="ALL SYSTEMS NOMINAL" />
          </div>
        </div>
        {/* Mission Time */}
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Mission Time</div>
          <div suppressHydrationWarning style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>01:24:36</div>
        </div>
      </div>

      {/* ══ STATUS + TELEMETRY ROW ════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr) 1fr', gap: 10 }}>
        {/* 5 Status chips */}
        {[
          { icon: Car,      title: 'Rover',        value: 'ONLINE',         sub: 'RVR-01',                    c: '#10b981' },
          { icon: Radio,    title: 'Communication', value: 'HEALTHY',        sub: 'RSSI -63 dBm',              c: '#10b981' },
          { icon: Share2,   title: 'Relay Nodes',  value: '4 / 6',          sub: 'DEPLOYED',                  c: 'var(--primary)' },
          { icon: Brain,    title: 'AI Systems',   value: 'ACTIVE',         sub: 'Survivor Detection ON',     c: '#10b981' },
          { icon: ShieldCheck,'title': 'Health',    value: 'ALL OK',         sub: 'Backend · ROS 2 · ML',      c: '#10b981' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.title} style={{ padding: '10px 14px', borderLeft: `2px solid ${s.c}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 5 }}>
                <Icon size={11} /> {s.title}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.c, letterSpacing: '0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{s.sub}</div>
            </Card>
          );
        })}

        {/* Compact Telemetry card */}
        <Card style={{ padding: '10px 14px', gridColumn: 'span 1' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rover Telemetry</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { icon: Battery, v: '82%', sub: '24.1V', c: '#10b981' },
              { icon: Gauge,   v: '0.4 m/s', sub: 'Speed', c: '#fff' },
              { icon: Navigation, v: '-18 m', sub: 'Depth', c: 'var(--primary)' },
              { icon: Thermometer, v: '31.2°C', sub: 'Temp', c: '#f59e0b' },
            ].map(t => {
              const I = t.icon;
              return (
                <div key={t.sub} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <I size={11} color={t.c} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.c, lineHeight: 1 }}>{t.v}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{t.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ══ MAIN BODY: 2 columns ════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 14 }}>

        {/* LEFT: Map */}
        <Card pad={false} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          {/* Map toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Map size={13} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Underground Map</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>LiDAR SLAM</span>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {['3D View', 'Top View', 'Follow Rover'].map((v, i) => (
                <button key={v} style={{ padding: '4px 10px', fontSize: 10, borderRadius: 5, fontFamily: 'inherit', cursor: 'pointer', background: i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: i === 0 ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>{v}</button>
              ))}
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
              {[Plus, Minus, Layers].map((Icon, i) => (
                <button key={i} style={{ width: 26, height: 26, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon size={12}/></button>
              ))}
            </div>
          </div>
          {/* Map content */}
          <div style={{ flex: 1, position: 'relative' }}>
            <TunnelMap />
            {/* Legend */}
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '9px 11px', fontSize: 10 }}>
              {[['#10b981','Rover (Current)'],['rgba(255,255,255,0.5)','Rover Path'],['#3a82f6','Relay Node'],['#ef4444','Survivor (AI)'],['#f59e0b','Gas Hazard'],['rgba(59,130,246,0.5)','Explored Area']].map(([c,l])=>(
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* RIGHT: Gas + Environment + Comms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Gas Sensors */}
          <Card>
            <STitle icon={Wind} text="Gas Sensors" right={<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Updated 2s ago</span>} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <GasCell label="CH₄"  val="1.24" unit="%" data={sp(1.24, 12, 0.2)} />
              <GasCell label="CO"   val="12"   unit="ppm" data={sp(12, 12, 4)} />
              <GasCell label="H₂S"  val="0"    unit="ppm" data={sp(0.05, 12, 0.03)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <GasCell label="NO₂" val="0.3" unit="ppm" data={sp(0.3, 12, 0.07)} />
              <GasCell label="SO₂" val="0.1" unit="ppm" data={sp(0.1, 12, 0.03)} />
            </div>
          </Card>

          {/* Environment */}
          <Card>
            <STitle icon={Thermometer} text="Environment" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Temperature</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 5 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>31.2</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>°C</span>
                </div>
                <Chip color="#10b981" label="NORMAL" />
                <Spark data={sp(31.2, 12, 0.5)} color="#f59e0b" h={26} />
              </div>
              <div style={{ background: 'rgba(0,210,255,0.07)', border: '1px solid rgba(0,210,255,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Humidity</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 5 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>68</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>%</span>
                </div>
                <Chip color="#10b981" label="NORMAL" />
                <Spark data={sp(68, 12, 1.5)} color="var(--primary)" h={26} />
              </div>
            </div>
          </Card>

          {/* Communication */}
          <Card>
            <STitle icon={Radio} text="Communication" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['RSSI','-63 dBm','#10b981'],['Latency','120 ms','#fff'],['Pkt Loss','1.2 %','#fff'],['Last Pkt','2 sec','rgba(255,255,255,0.4)']].map(([l,v,c]) => (
                <div key={l}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3, textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ══ BOTTOM ROW: Cameras + Events + Structural ═══════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 1fr 240px', gap: 12 }}>

        {/* RGB Camera */}
        <Card pad={false} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={12} color="rgba(255,255,255,0.4)" />
            Live Camera Feed
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(RGB – Front)</span>
          </div>
          <CamFeed name="RGB Camera" type="rgb" timestamp="2024-12-14 22:34:12" style={{ height: 170 }} />
        </Card>

        {/* Stacked: Thermal + Ceiling + Probe */}
        <Card pad={false} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CamFeed name="Thermal Camera" type="thermal" style={{ height: 65 }}
            overlay={<div style={{ position: 'absolute', top: '28%', left: '30%', width: '35%', height: '45%', border: '1.5px solid #ef4444', borderRadius: 2 }}><span style={{ position: 'absolute', top: 0, left: 0, background: '#ef4444', color: '#fff', fontSize: 7, padding: '1px 4px', borderRadius: '2px 0 2px 0', fontWeight: 700 }}>Person 91%</span></div>} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <CamFeed name="Ceiling Cam" type="ceiling" style={{ height: 65 }} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <CamFeed name="Probe Camera" type="probe" style={{ height: 65 }} />
        </Card>

        {/* Mission Events */}
        <Card>
          <STitle icon={Zap} text="Recent Mission Events" right={<span style={{ fontSize: 10, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>All <ArrowRight size={10} /></span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { t: '22:34:05', m: 'Possible survivor detected – Confidence 91%', c: '#ef4444', tag: 'AI ALERT' },
              { t: '22:33:58', m: 'Relay node #4 deployed – Reason: Weak RSSI', c: '#3a82f6', tag: 'NETWORK' },
              { t: '22:33:41', m: 'Tunnel width changed -18% from previous scan', c: '#f59e0b', tag: 'STRUCT' },
              { t: '22:32:20', m: 'Gas level rising CH₄: 1.24% (↑)', c: '#ef4444', tag: 'GAS' },
              { t: '22:30:11', m: 'Mission started', c: '#10b981', tag: 'SYSTEM' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.c, marginTop: 4, flexShrink: 0, boxShadow: `0 0 5px ${e.c}` }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' }}>{e.t}</span>
                    <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, border: `1px solid ${e.c}40`, color: e.c, fontWeight: 700, background: `${e.c}15` }}>{e.tag}</span>
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>{e.m}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Structural Monitoring */}
        <Card>
          <STitle icon={LayoutGrid} text="Structural (LiDAR)" />
          {/* Arch diagram */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, overflow: 'hidden', marginBottom: 10, height: 100 }}>
            <svg width="100%" height="100%" viewBox="0 0 200 100">
              <rect width="200" height="100" fill="#030c18" />
              <path d="M 22 88 Q 100 8 178 88" fill="rgba(0,210,255,0.08)" />
              <path d="M 22 88 Q 100 8 178 88" fill="none" stroke="#00d2ff" strokeWidth="2.5" />
              <path d="M 26 88 Q 100 20 174 88" fill="none" stroke="rgba(0,210,255,0.22)" strokeWidth="1" strokeDasharray="5 3" />
              <line x1="22" y1="88" x2="178" y2="88" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {/* dimension lines */}
              <line x1="100" y1="88" x2="100" y2="10" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" strokeDasharray="2 2" />
              <text x="106" y="52" fill="rgba(255,255,255,0.45)" fontSize="8">2.8 m</text>
              <text x="100" y="98" fill="rgba(255,255,255,0.35)" fontSize="7" textAnchor="middle">4.2 m</text>
            </svg>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[['Width','4.2 m',''],['Height','2.8 m',''],['Change','–18%','warn']].map(([k,v,flag]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                {flag === 'warn'
                  ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#f59e0b' }}>{v} ⚠ WARNING</span>
                  : <span style={{ fontWeight: 600 }}>{v}</span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 2, background: '#00d2ff' }} />Current</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, borderTop: '2px dashed rgba(255,255,255,0.3)' }} />Previous</span>
          </div>
        </Card>
      </div>

      {/* ══ FOOTER: System Data Pipeline ════════════════════════════════ */}
      <Card style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={12} color="rgba(255,255,255,0.35)" />
            <span style={{ fontSize: 11, fontWeight: 600 }}>System Data Pipeline</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>(Backend) · Live data flow from rover to dashboard</span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>Last: 22:34:12 · 2 sec ago</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {[
            ['Rover Sensors','LIVE'],['ESP32 (Onboard)','OK'],['ESP-NOW Mesh','OK'],
            ['Relay Nodes','4/6 ACTIVE'],['USB Gateway','OK'],['Backend','ONLINE'],
            ['ROS 2','ONLINE'],['AI / Analytics','ONLINE'],['Database','RECORDING'],['Dashboard','CONNECTED'],
          ].map(([label, status], i, arr) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 8px', flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ fontSize: 9, color: '#10b981', fontWeight: 600 }}>{status}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ height: 1, width: 12, background: 'rgba(255,255,255,0.1)' }} />
                  <ArrowUpRight size={8} color="rgba(255,255,255,0.2)" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

    </div>
  );
}
