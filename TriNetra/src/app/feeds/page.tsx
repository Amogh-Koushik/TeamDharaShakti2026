"use client";
import React from 'react';
import { MonitorPlay, Maximize2, Radio, ScanLine } from 'lucide-react';

function CamFeed({ name, type, badge }: { name: string; type: 'rgb'|'thermal'|'wide'; badge?: string }) {
  const bgs: Record<string, string> = {
    rgb:     'radial-gradient(ellipse 80% 110% at 50% 95%, #3d2e20 0%, #1e170f 25%, #0d0d0a 55%, #000 100%)',
    thermal: 'radial-gradient(ellipse 60% 80% at 45% 35%, #ff4400 0%, #cc2200 18%, #880000 38%, #330000 65%, #000 100%)',
    wide:    'radial-gradient(ellipse 90% 70% at 50% 80%, #2a2a20 0%, #111111 40%, #000 100%)',
  };
  const dots: Record<string, string> = { rgb: '#10b981', thermal: '#ef4444', wide: '#10b981' };
  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: bgs[type], height: '100%' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dots[type] }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {badge && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.3)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{badge}</span>}
          <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
      <button style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 4, padding: 6, display: 'flex', cursor: 'pointer' }}>
        <Maximize2 size={13} />
      </button>
      <div style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>2024-12-14 22:34:12</div>
    </div>
  );
}

function LidarPanel() {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#030b14',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(0,210,255,0.18)',
      boxSizing: 'border-box',
    }}>
      {/* LiDAR image — contain so full frame is always visible */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lidar.jpg"
        alt="3D LiDAR point cloud"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
        }}
      />
      {/* Header overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'linear-gradient(to bottom,rgba(3,11,20,0.9),transparent)', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d2ff', boxShadow: '0 0 6px #00d2ff' }} />
          <ScanLine size={13} color="#00d2ff" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#00d2ff', letterSpacing: '0.04em' }}>3D LiDAR</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'rgba(0,210,255,0.75)', fontFamily: 'monospace' }}>360° · 16-CH</span>
          <span style={{ fontSize: 10, background: 'rgba(0,210,255,0.15)', border: '1px solid rgba(0,210,255,0.5)', color: '#00d2ff', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
      {/* Footer stats */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'linear-gradient(to top,rgba(3,11,20,0.9),transparent)', zIndex: 2 }}>
        <span style={{ fontSize: 10, color: 'rgba(0,210,255,0.6)', fontFamily: 'monospace' }}>PTS: 420k · RANGE: 0–8 m</span>
        <button style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, padding: 5, display: 'flex', cursor: 'pointer' }}>
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function FeedsPage() {
  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <MonitorPlay size={22} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Live Feeds</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Real-time camera feeds from rover and relay nodes</p>
        </div>
      </div>

      {/* Main feed */}
      <div style={{ height: 320, background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, overflow: 'hidden' }}>
        <CamFeed name="RGB Camera (Front) – Primary View" type="rgb" />
      </div>

      {/* Grid of secondary feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, height: 200 }}>
        <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid rgba(45,60,85,0.5)', background: 'rgba(12,20,34,0.85)', minWidth: 0 }}>
          <CamFeed name="Thermal Camera" type="thermal" badge="Person 91%" />
        </div>
        <div style={{ overflow: 'hidden', borderRadius: 10, minWidth: 0 }}>
          <LidarPanel />
        </div>
      </div>

      {/* Feed settings */}
      <div style={{ background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Radio size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Feed Configuration</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, fontSize: 12 }}>
          {[
            ['Resolution','1920 × 1080',''],
            ['Frame Rate','30 fps','var(--success)'],
            ['Bitrate','4 Mbps',''],
            ['Compression','H.264',''],
          ].map(([k,v,c]) => (
            <div key={k} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
              <div style={{ fontWeight: 700, color: (c as string) || 'var(--text-main)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
