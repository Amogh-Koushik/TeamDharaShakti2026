"use client";
import React from 'react';
import { Plus, Minus, Layers, Crosshair } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Settings } from 'lucide-react';

// ─── Reusable Panel ───────────────────────────────────────────────────────
function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(12,20,34,0.85)',
      border: '1px solid rgba(45,60,85,0.5)',
      borderRadius: 10, padding: '14px 16px', ...style,
    }}>{children}</div>
  );
}

// ─── SVG Tunnel Map ────────────────────────────────────────────────────────
function TunnelMapSVG() {
  // Deterministic pseudo-random point cloud
  const dots = Array.from({ length: 280 }, (_, i) => {
    const h = ((i * 2654435761) >>> 0) % 10000 / 10000;
    const v = ((i * 1234567891) >>> 0) % 10000 / 10000;
    const t = i / 280;
    const bx = 70 + t * 460;
    const by = 305 - t * 215;
    return { x: bx + (h - 0.5) * 70, y: by + (v - 0.5) * 55, a: 0.2 + h * 0.5 };
  });
  return (
    <svg width="100%" height="100%" viewBox="0 0 620 350" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <radialGradient id="mapBg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#030810" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="620" height="350" fill="url(#mapBg)" />

      {/* Point cloud */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.1}
          fill={`rgba(${80 + (i % 60)},${130 + (i % 80)},${200 + (i % 55)},${d.a})`} />
      ))}

      {/* Explored tunnel fill */}
      <path d="M 70 305 C 130 280, 190 250, 240 225 C 290 200, 330 178, 375 155 C 420 132, 460 118, 510 95"
        fill="none" stroke="rgba(59,130,246,0.13)" strokeWidth="55" strokeLinecap="round" />

      {/* Rover path (dashed) */}
      <path d="M 70 305 C 130 280, 190 250, 240 225"
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="7 4" />
      <path d="M 240 225 C 290 200, 330 178, 375 155 C 420 132, 460 118, 510 95"
        fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 5" />

      {/* Gas hazard zone */}
      <circle cx="315" cy="190" r="22" fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5" />
      <text x="303" y="187" fill="#f59e0b" fontSize="13">⚠</text>
      <text x="298" y="199" fill="#f59e0b" fontSize="7.5" fontFamily="Inter,sans-serif">CH₄ 1.8%</text>

      {/* Narrow passage */}
      <rect x="295" y="210" width="50" height="16" rx="3" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
      <text x="300" y="222" fill="#f59e0b" fontSize="7">Narrow Passage</text>

      {/* Nodes */}
      {[
        { x: 70,  y: 305, label: 'RVR-01', color: '#10b981', r: 10, isRover: true },
        { x: 150, y: 268, label: 'Node 1', color: '#3a82f6', r: 6, sub: '-68 dBm' },
        { x: 240, y: 225, label: 'Node 2', color: '#3a82f6', r: 6, sub: '-65 dBm' },
        { x: 375, y: 155, label: 'Node 3', color: '#3a82f6', r: 6, sub: '-61 dBm' },
        { x: 510, y: 95,  label: 'Survivor', color: '#ef4444', r: 8, sub: 'Possible' },
      ].map((n, i) => (
        <g key={i} filter="url(#glow)">
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} stroke="rgba(255,255,255,0.6)" strokeWidth={n.isRover ? 2 : 1.5} />
          <text x={n.x + 12} y={n.y - 4} fill={n.color} fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600">{n.label}</text>
          {n.sub && <text x={n.x + 12} y={n.y + 7} fill={n.color} fontSize={8} fontFamily="Inter,sans-serif" opacity="0.8">{n.sub}</text>}
        </g>
      ))}

      {/* Compass */}
      <g transform="translate(580,28)">
        <circle cx="0" cy="0" r="14" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <text x="0" y="-4" fill="rgba(255,255,255,0.8)" fontSize="8" fontFamily="Inter" textAnchor="middle">N</text>
        <text x="0" y="12" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="Inter" textAnchor="middle">S</text>
        <text x="-10" y="4" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="Inter" textAnchor="middle">W</text>
        <text x="10" y="4" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="Inter" textAnchor="middle">E</text>
      </g>

      {/* Scale bar */}
      <g transform="translate(20,330)">
        <line x1="0" y1="0" x2="80" y2="0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1="80" y1="-4" x2="80" y2="4" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <text x="0" y="13" fill="rgba(255,255,255,0.5)" fontSize="8">0</text>
        <text x="55" y="13" fill="rgba(255,255,255,0.5)" fontSize="8">10  20  30 m</text>
      </g>
    </svg>
  );
}

// ─── Elevation Data ────────────────────────────────────────────────────────
const elevData = [
  { d: 0, e: -12 }, { d: 10, e: -13 }, { d: 20, e: -14 }, { d: 30, e: -15.5 },
  { d: 40, e: -16 }, { d: 50, e: -17 }, { d: 60, e: -17.8 }, { d: 70, e: -18.2 },
  { d: 80, e: -18.5 }, { d: 90, e: -18.3 }, { d: 100, e: -18 },
];

export default function MapPage() {
  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 100px)', paddingBottom: 16 }}>

      {/* ── Main Map + Sidebar ──────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 14 }}>

        {/* Map Panel */}
        <P style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>3D Tunnel Map</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live SLAM Reconstruction</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['3D View','Top View','Side View','First Person'].map((v) => (
                <button key={v} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', background: v === '3D View' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: v === '3D View' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', color: v === '3D View' ? '#fff' : 'var(--text-muted)' }}>{v}</button>
              ))}
            </div>
          </div>

          {/* SVG Map */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0, minWidth: 0 }}>
            <TunnelMapSVG />

            {/* Legend overlay */}
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.75)', padding: '10px 12px', borderRadius: 8, fontSize: 11, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6, fontWeight: 600 }}>Legend</div>
              {[['#10b981','Rover (Current)'],['rgba(255,255,255,0.5)','Rover Path'],['#3a82f6','Relay Node'],['#ef4444','Detected Survivor'],['#f59e0b','Gas Hazard'],['rgba(59,130,246,0.5)','Explored Area']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Zoom controls */}
            <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[Plus, Minus, Layers, Settings].map((Icon, i) => (
                  <button key={i} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon size={14}/></button>
              ))}
            </div>
          </div>
        </P>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4 }}>
          {/* Rover Position */}
          <P>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600 }}>
                <Crosshair size={14} color="var(--text-muted)" /> Rover Position
              </div>
              <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                <span style={{ color: 'var(--success)' }}>Live</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['X','12.4 m'],['Y','8.2 m'],['Z','-18.1 m'],['Heading','124° (SE)'],['Speed','0.4 m/s','#10b981']].map(([k,v,c]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c || 'var(--text-main)' }}>{v}</div>
                </div>
              ))}
            </div>
          </P>

          {/* Map Layers */}
          <P>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Layers size={14} color="var(--text-muted)" /> Map Layers
            </div>
            {[['Point Cloud (LiDAR)', true],['Rover Path', true],['Relay Nodes', true],['Gas Heatmap', true],['Structural Analysis', true],['Tunnel Mesh', false],['Grid', false]].map(([label, checked]) => (
              <label key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={checked as boolean} style={{ accentColor: 'var(--primary)', width: 14, height: 14 }} />
                {label as string}
              </label>
            ))}
          </P>

          {/* Cross Section */}
          <P style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Cross Section View</div>
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden', height: 110 }}>
              <svg width="100%" height="100%" viewBox="0 0 200 110">
                <rect width="200" height="110" fill="#040c18" />
                <path d="M 30 90 Q 100 10 170 90" fill="none" stroke="#00d2ff" strokeWidth="2.5" />
                <path d="M 30 90 L 170 90" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <text x="85" y="58" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle">2.8 m</text>
                <line x1="100" y1="52" x2="100" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 2" />
                <text x="100" y="104" fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="middle">3.4 m</text>
              </svg>
            </div>
          </P>
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14, flexShrink: 0 }}>

        {/* Elevation Profile */}
        <P>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Elevation Profile</div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={elevData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--text-muted)" fontSize={9} axisLine={false} tickLine={false} label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis stroke="var(--text-muted)" fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0d1a2b', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 6, fontSize: 10 }} />
                <Area type="monotone" dataKey="e" stroke="#00d2ff" strokeWidth={2} fill="url(#elevGrad)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </P>

        {/* Tunnel Metrics */}
        <P>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Tunnel Metrics</div>
          {[
            ['Distance Travelled','42.6 m'],['Explored Area','312 m²'],['Est. Tunnel Length','128 m'],
            ['Average Width','2.4 m'],['Minimum Width','1.2 m','#ef4444'],['Maximum Height','3.6 m'],
            ['Incline (Current)','-8°'],['Total Relay Nodes','3'],
          ].map(([k,v,c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, color: 'var(--text-muted)' }}>
              <span>{k}</span><span style={{ color: (c as string) || 'var(--text-main)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </P>

        {/* Hazards & Survivors */}
        <P>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Detected Hazards</div>
          {[
            ['🔥','Gas Anomalies',2,'#f59e0b'],['⚠️','Structural Changes',1,'#f59e0b'],
            ['🪨','Rubble / Obstacles',3,'var(--text-muted)'],['💧','Water / Moisture',0,'var(--text-muted)'],
          ].map(([ico,l,n,c]) => (
            <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11 }}>{ico as string} {l as string}</span>
              <span style={{ fontWeight: 700, color: c as string }}>{n as number}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 8, paddingTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Detected Survivors</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Potential Survivors</span><span style={{ color: '#ef4444', fontWeight: 700 }}>1</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}><span>Last Detection</span><span>22:31:05</span></div>
          </div>
        </P>

        {/* Mini Map */}
        <P style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            Mini Map (Top View)
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>⛶</button>
          </div>
          <div style={{ background: '#040c18', height: 160 }}>
            <svg width="100%" height="100%" viewBox="0 0 200 160">
              {Array.from({length:80},(_,i)=>{const h=((i*2654435761)>>>0)%10000/10000,t=i/80;return(<circle key={i} cx={20+t*160} cy={140-t*120} r={1} fill={`rgba(100,150,200,${0.2+h*0.4})`} />);})}
              <path d="M 20 140 Q 60 115 90 95 Q 120 75 150 60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 3" />
              <circle cx="20" cy="140" r="5" fill="#10b981" />
              <circle cx="90" cy="95" r="3" fill="#3a82f6" />
              <circle cx="150" cy="60" r="3" fill="#3a82f6" />
              <circle cx="165" cy="48" r="4" fill="#ef4444" />
              <text x="5" y="158" fill="rgba(255,255,255,0.4)" fontSize="7">0</text>
              <line x1="5" y1="153" x2="45" y2="153" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <text x="40" y="158" fill="rgba(255,255,255,0.4)" fontSize="7">100m</text>
            </svg>
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', gap: 10, fontSize: 10 }}>
            {[['#10b981','Rover'],['#3a82f6','Relay Node'],['#ef4444','Survivor']].map(([c,l])=>(
              <span key={l} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:6,height:6,borderRadius:'50%',background:c}}/>{l}</span>
            ))}
          </div>
        </P>
      </div>
    </div>
  );
}
