"use client";
import React from 'react';
import { FileText } from 'lucide-react';

const logs = [
  { time: '22:34:10', type: 'danger',  msg: 'Methane rising rapidly – 1.24% (↑ 0.12%)' },
  { time: '22:34:05', type: 'danger',  msg: 'Possible survivor detected – Confidence 91% – X:12.4m Y:8.2m Z:-18.1m' },
  { time: '22:33:58', type: 'info',    msg: 'Relay Node #4 deployed at junction. RSSI: -68 dBm' },
  { time: '22:33:41', type: 'warning', msg: 'Structural Change Detected – Tunnel width decreased by 18%' },
  { time: '22:32:20', type: 'warning', msg: 'Gas level rising – CH₄: 1.24% (↑)' },
  { time: '22:32:18', type: 'info',    msg: 'Distress sound detected (Possible) – Unusual audio pattern' },
  { time: '22:31:00', type: 'success', msg: 'Rover reached waypoint 3. Distance: 42.6m' },
  { time: '22:30:15', type: 'info',    msg: 'Relay Node #3 deployed. Network mesh updated.' },
  { time: '22:30:11', type: 'success', msg: 'Mission started – Mission #001 – Search & Rescue – Sector A' },
  { time: '22:29:45', type: 'info',    msg: 'System self-check complete. All systems nominal.' },
];

const typeColors: Record<string, string> = { danger: '#ef4444', warning: '#f59e0b', info: 'var(--primary)', success: '#10b981' };

export default function LogsPage() {
  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={22} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Mission Log</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Live event log – Mission #001 – Search & Rescue</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)' }}>● Live – {logs.length} events</div>
      </div>

      <div style={{ background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, overflow: 'hidden' }}>
        {logs.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 18px', borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined, background: i % 2 === 0 ? 'rgba(0,0,0,0.2)' : undefined }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColors[l.type], marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{l.time}</span>
            <span style={{ fontSize: 12, lineHeight: 1.5 }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
