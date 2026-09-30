"use client";
import React from 'react';
import { BrainCircuit, AlertTriangle, User, Flame, AlertOctagon } from 'lucide-react';

import { useState, useRef } from 'react';
import { detectPerson, analyzeAudio, recognizeSpeech, BACKEND_URL } from '@/lib/api';

const initialDetections = [
  { id: 1, type: 'survivor', label: 'Possible Survivor Detected', conf: 91, loc: 'X: 12.4m Y: 8.2m Z: -18.1m', time: '22:34:05', color: '#ef4444', icon: User },
  { id: 2, type: 'gas',      label: 'Gas Level Rising',           conf: 87, loc: 'X: 8.1m Y: 6.3m Z: -15.2m',  time: '22:34:10', color: '#f59e0b', icon: Flame },
  { id: 3, type: 'struct',   label: 'Structural Change Detected', conf: 79, loc: 'X: 5.2m Y: 4.1m Z: -12.8m',  time: '22:33:41', color: '#f59e0b', icon: AlertTriangle },
  { id: 4, type: 'audio',    label: 'Distress Sound (Possible)',  conf: 64, loc: 'X: 11.0m Y: 7.5m Z: -17.2m', time: '22:32:18', color: '#a855f7', icon: AlertOctagon },
];

export default function AIPage() {
  const [detections, setDetections] = useState(initialDetections);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testType, setTestType] = useState<'person' | 'audio' | 'speech'>('person');

  const handleTestAPI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setApiStatus('Testing...');
    try {
      let result;
      let label = '';
      let icon = AlertOctagon;
      let color = '#3b82f6';
      let conf = 0;

      if (testType === 'person') {
        result = await detectPerson(file);
        label = `Backend: Person Detect - ${result.message}`;
        icon = User;
        color = '#ef4444';
        conf = result.confidence_threshold ? (result.confidence_threshold * 100) : 0;
      } else if (testType === 'audio') {
        result = await analyzeAudio(file);
        label = `Backend: Audio AST - ${result.message}`;
        icon = AlertOctagon;
        color = '#a855f7';
        conf = result.alert_threshold ? (result.alert_threshold * 100) : 0;
      } else if (testType === 'speech') {
        result = await recognizeSpeech(file);
        label = `Backend: Speech Vosk - ${result.message}`;
        icon = AlertTriangle;
        color = '#10b981';
        conf = result.keyword_threshold ? (result.keyword_threshold * 100) : 0;
      }

      setApiStatus(`Success: ${JSON.stringify(result)}`);
      
      const newDetection = {
        id: Date.now(),
        type: 'backend_test',
        label: label,
        conf: Math.round(conf),
        loc: 'Backend Server',
        time: new Date().toLocaleTimeString(),
        color,
        icon,
      };
      
      setDetections(prev => [newDetection, ...prev]);
    } catch (err: any) {
      setApiStatus(`Error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BrainCircuit size={22} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>AI Detections</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Real-time AI-powered analysis and anomaly detection</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Models Active</span>
        </div>
      </div>

      {/* Backend Integration Test Panel */}
      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>Backend Connection Test</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select 
            value={testType} 
            onChange={e => setTestType(e.target.value as any)}
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 12px', borderRadius: 4, fontSize: 13 }}
          >
            <option value="person">YOLOv8 Person Detection (Image)</option>
            <option value="audio">AST Audio Analysis (Raw/Wav)</option>
            <option value="speech">Vosk Speech Recognition (Raw/Wav)</option>
          </select>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Select File & Test
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleTestAPI}
            accept={testType === 'person' ? "image/*" : "audio/*,.raw"}
          />
        </div>
        {apiStatus && <div style={{ fontSize: 11, fontFamily: 'monospace', color: apiStatus.startsWith('Error') ? '#ef4444' : '#a7f3d0', wordBreak: 'break-all' }}>{apiStatus}</div>}
      </div>

      {/* Detection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {detections.map(d => {
          const Icon = d.icon;
          return (
            <div key={d.id} style={{ background: 'rgba(12,20,34,0.85)', border: `1px solid ${d.color}40`, borderLeft: `3px solid ${d.color}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={d.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{d.label}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${d.color}20`, border: `1px solid ${d.color}`, color: d.color, fontWeight: 700 }}>
                    {d.conf >= 80 ? 'HIGH CONF' : d.conf >= 65 ? 'MEDIUM CONF' : 'LOW CONF'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Confidence: <strong style={{ color: 'var(--text-main)' }}>{d.conf}%</strong></span>
                  <span>Location: <strong style={{ color: 'var(--text-main)' }}>{d.loc}</strong></span>
                  <span>Time: <strong style={{ color: 'var(--text-main)' }}>{d.time}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Status */}
      <div style={{ background: 'rgba(12,20,34,0.85)', border: '1px solid rgba(45,60,85,0.5)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Active AI Models</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[['Person Detection','YOLOv8','98.2%'],['Gas Anomaly','Custom CNN','96.7%'],['Structural Analysis','PointNet++','94.1%'],['Audio Detection','RNN + LSTM','91.3%'],['Depth Estimation','DPT-Hybrid','97.8%'],['SLAM','ORB-SLAM3','99.1%']].map(([n,m,acc]) => (
            <div key={n} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{n}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>{m}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--success)' }}>● Active</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{acc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
