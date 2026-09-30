"use client";
import React from 'react';
import { RadioTower, Signal, Battery } from 'lucide-react';

const nodes = [
  { id: 'Gateway', loc: 'Base Station', rssi: -32, battery: 'Power: Mains', status: 'ONLINE', color: '#10b981' },
  { id: 'Node 1',  loc: 'Tunnel Entry', rssi: -61, battery: '74%',         status: 'ONLINE', color: '#10b981' },
  { id: 'Node 2',  loc: 'Junction A',   rssi: -65, battery: '62%',         status: 'ONLINE', color: '#10b981' },
  { id: 'Node 3',  loc: 'Passage B',    rssi: -68, battery: '58%',         status: 'ONLINE', color: '#10b981' },
  { id: 'Node 4',  loc: 'Deep Tunnel',  rssi: -72, battery: '48%',         status: 'ONLINE', color: '#10b981' },
  { id: 'Node 5',  loc: 'Not Deployed', rssi: null, battery: '100%',       status: 'STANDBY',color: '#f59e0b' },
  { id: 'Node 6',  loc: 'Not Deployed', rssi: null, battery: '100%',       status: 'STANDBY',color: '#f59e0b' },
];

export default function RelayPage() {
  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RadioTower size={22} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Relay Nodes</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Communication mesh network status</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12 }}>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>4 Online</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>·</span>
          <span style={{ color: '#f59e0b' }}>2 Standby</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {nodes.map(n => (
          <div key={n.id} style={{ background: 'rgba(12,20,34,0.85)', border: `1px solid rgba(45,60,85,0.5)`, borderTop: `2px solid ${n.color}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RadioTower size={16} color={n.color} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{n.id}</span>
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 700, border: `1px solid ${n.color}`, color: n.color }}>{n.status}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{n.loc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Signal size={11} />RSSI</span>
                <span style={{ fontWeight: 600, color: n.rssi ? '#10b981' : 'var(--text-muted)' }}>{n.rssi ? `${n.rssi} dBm` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Battery size={11} />Battery</span>
                <span style={{ fontWeight: 600 }}>{n.battery}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
