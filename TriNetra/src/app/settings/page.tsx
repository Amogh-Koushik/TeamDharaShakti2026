"use client";
import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Settings size={22} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>System configuration and preferences</p>
        </div>
      </div>

      {[
        { section: 'Communication', items: [['SSID / Mesh Network','TriNetraMesh_5G'],['Protocol','ESP-NOW + Wi-Fi'],['Encryption','WPA3'],['Max Relay Nodes','8'],['Auto-deploy Threshold','-75 dBm']] },
        { section: 'Rover', items: [['Max Speed','1.0 m/s'],['Safe Distance','0.5 m'],['Auto Stop on Obstacle','Enabled'],['Flipper Auto-Level','Enabled'],['Battery Low Threshold','20%']] },
        { section: 'AI Models', items: [['Person Detection Model','YOLOv8-nano'],['Confidence Threshold','70%'],['Detection Interval','100 ms'],['Gas Anomaly Detection','Enabled'],['Structural Analysis','Enabled']] },
        { section: 'Data & Storage', items: [['Backend URL','http://localhost:5000'],['ROS 2 Domain ID','42'],['Database','PostgreSQL'],['Log Retention','30 days'],['Auto-export on Mission End','Enabled']] },
      ].map(s => (
        <div key={s.section} style={{ background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600 }}>{s.section}</div>
          {s.items.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < s.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
