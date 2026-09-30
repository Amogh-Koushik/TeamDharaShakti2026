"use client";

import React from 'react';
import { Activity, Thermometer, CheckCircle2, Heart } from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line
} from 'recharts';

// ─── Data ──────────────────────────────────────────────────────────────────
const sp = (base: number, count = 14, spread = 0.15) =>
  Array.from({ length: count }, (_, i) => ({
    i, v: parseFloat((base + Math.sin(i * 0.8) * spread + (((i * 1234567) % 100) / 100 - 0.5) * spread * 0.4).toFixed(3)),
  }));

const trendData = [
  { t: '22:24', v: 0.85 }, { t: '22:25', v: 0.90 }, { t: '22:26', v: 1.02 },
  { t: '22:27', v: 1.10 }, { t: '22:28', v: 1.08 }, { t: '22:29', v: 0.95 },
  { t: '22:30', v: 1.00 }, { t: '22:31', v: 1.15 }, { t: '22:32', v: 1.05 },
  { t: '22:33', v: 1.18 }, { t: '22:34', v: 1.24 },
];

// ─── Mini Sparkline Card ───────────────────────────────────────────────────
function MiniCard({
  label, value, unit, status = 'NORMAL', statusColor = '#10b981',
  chartColor = '#10b981', data, lastUpdate = '22:34:12',
}: {
  label: string; value: string; unit?: string;
  status?: string; statusColor?: string; chartColor?: string;
  data: { i: number; v: number }[]; lastUpdate?: string;
}) {
  const vals = data.map(d => d.v);
  const mn = Math.min(...vals), mx = Math.max(...vals), pd = (mx - mn) * 0.4 || 0.5;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8, padding: '10px 12px', minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, fontWeight: 700, border: `1px solid ${statusColor}`, color: statusColor, background: 'rgba(0,0,0,0.3)', whiteSpace: 'nowrap', marginLeft: 4 }}>{status}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      <div style={{ height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <YAxis domain={[mn - pd, mx + pd]} hide />
            <Line type="monotone" dataKey="v" stroke={chartColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5 }}>Last: {lastUpdate}</div>
    </div>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────
function Panel({ children, title, icon: Icon, style }: {
  children: React.ReactNode; title?: string; icon?: React.ElementType; style?: React.CSSProperties;
}) {
  return (
    <div style={{ background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, padding: '14px 16px', ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {Icon && <Icon size={15} color="var(--text-muted)" />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function SensorsPage() {
  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>

      {/* ── Row 1: Title + Controls + Status ────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={22} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Sensors</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>Real-time sensor data and trends</p>
          </div>
        </div>

        {/* Time range buttons */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
          {['5 min','15 min','1 hour','6 hours'].map((t, i) => (
            <button key={t} style={{ padding: '6px 14px', fontSize: 12, fontFamily: 'inherit', background: i === 0 ? 'var(--primary)' : 'transparent', color: i === 0 ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {/* Data Status */}
        <div style={{ marginLeft: 'auto', background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 8, padding: '8px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Data Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>LIVE</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last Update: 22:34:12 (2 sec ago)</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Gas Sensors (full width) + Environment ────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
        <Panel title="Gas Sensors" icon={Activity}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <MiniCard label="Methane (CH₄)"           value="1.24" unit="%" data={sp(1.24, 14, 0.3)} />
            <MiniCard label="Carbon Monoxide (CO)"     value="12"   unit="ppm" data={sp(12, 14, 5)} />
            <MiniCard label="Hydrogen Sulfide (H₂S)"  value="0"    unit="ppm" data={sp(0.05, 14, 0.04)} />
            <MiniCard label="Nitrogen Dioxide (NO₂)"  value="0.3"  unit="ppm" data={sp(0.3, 14, 0.08)} />
            <MiniCard label="Sulfur Dioxide (SO₂)"    value="0.1"  unit="ppm" data={sp(0.1, 14, 0.04)} />
          </div>
        </Panel>
        <Panel title="Environment" icon={Thermometer} style={{ width: 300 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <MiniCard label="Temperature" value="31.2" unit="°C" chartColor="#f59e0b" data={sp(31.2, 14, 0.5)} />
            <MiniCard label="Humidity"    value="68"   unit="%"  chartColor="var(--primary)" data={sp(68, 14, 2)} />
          </div>
        </Panel>
      </div>

      {/* ── Row 3: Rover Telemetry + Communication ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
        <Panel title="Rover Telemetry" icon={Activity}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <MiniCard label="Battery"       value="82"   unit="%"   data={sp(82, 14, 5)} />
            <MiniCard label="Voltage"       value="24.1" unit="V"   data={sp(24.1, 14, 0.3)} />
            <MiniCard label="Speed"         value="0.4"  unit="m/s" data={sp(0.4, 14, 0.15)} />
            <MiniCard label="Depth"         value="-18"  unit="m"   status="STABLE" statusColor="var(--primary)" chartColor="var(--primary)" data={sp(-18, 14, 1)} />
            <MiniCard label="Internal Temp" value="31.2" unit="°C"  chartColor="#f59e0b" data={sp(31.2, 14, 0.3)} />
          </div>
        </Panel>
        <Panel title="Communication" icon={Activity} style={{ width: 420 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <MiniCard label="RSSI"        value="-63"  unit="dBm" status="GOOD" data={sp(-63, 14, 5)} />
            <MiniCard label="Latency"     value="120"  unit="ms"  data={sp(120, 14, 20)} />
            <MiniCard label="Packet Loss" value="1.2"  unit="%"   data={sp(1.2, 14, 0.4)} />
          </div>
        </Panel>
      </div>

      {/* ── Row 4: Sensor Trends + Sensor Health ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
        <Panel title="Sensor Trends" icon={Activity}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -30, marginBottom: 10 }}>
            <select style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
              <option>Methane (CH₄)</option>
              <option>CO</option>
              <option>Temperature</option>
            </select>
          </div>
          <div style={{ display: 'flex', height: 195 }}>
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9, color: 'var(--text-muted)', marginRight: 6, textAlign: 'center' }}>
              Concentration (%)
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="t" stroke="var(--text-muted)" fontSize={10} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 2.0]} stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickCount={5} />
                  <Tooltip contentStyle={{ background: '#0d1a2b', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--text-muted)' }} />
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#trendGrad)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>1.24 %</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>22:34:12</span>
          </div>
        </Panel>

        <Panel icon={Heart} title="Sensor Health">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              border: '10px solid var(--success)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(16,185,129,0.3)',
            }}>
              <span style={{ fontSize: 22, fontWeight: 700 }}>100%</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Operational</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', fontSize: 12 }}>
              {[['Gas Sensors','5/5'],['Env Sensors','2/2'],['IMU','1/1']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                    {l}
                  </span>
                  <span>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                All Systems Nominal
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Row 5: Recent Readings + Alerts ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
        <Panel title="Recent Sensor Readings" icon={Activity}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Time','Sensor','Value','Unit','Status'].map(h => (
                  <th key={h} style={{ padding: '0 0 10px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { t: '22:34:12', s: 'Methane (CH₄)',         v: '1.24', u: '%'  },
                { t: '22:34:12', s: 'Carbon Monoxide (CO)',   v: '12',   u: 'ppm'},
                { t: '22:34:12', s: 'Hydrogen Sulfide (H₂S)', v: '0',   u: 'ppm'},
                { t: '22:34:12', s: 'Nitrogen Dioxide (NO₂)', v: '0.3', u: 'ppm'},
                { t: '22:34:12', s: 'Sulfur Dioxide (SO₂)',   v: '0.1', u: 'ppm'},
                { t: '22:34:12', s: 'Temperature',            v: '31.2', u: '°C' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 0', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.t}</td>
                  <td style={{ padding: '9px 0' }}>{row.s}</td>
                  <td style={{ padding: '9px 0', fontWeight: 600 }}>{row.v}</td>
                  <td style={{ padding: '9px 0', color: 'var(--text-muted)' }}>{row.u}</td>
                  <td style={{ padding: '9px 0' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', color: 'var(--success)' }}>NORMAL</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Alerts & Warnings" icon={Activity}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -30, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer' }}>View All →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 20, gap: 12, opacity: 0.65 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} color="rgba(255,255,255,0.4)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No active alerts</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>All sensor readings are within safe limits.</div>
            </div>
          </div>
        </Panel>
      </div>

    </div>
  );
}
