"use client";

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import GlassCard from './GlassCard';

interface MiniChartCardProps {
  label: string;
  value: string | number;
  unit?: string;
  statusText?: string;
  statusColor?: string;
  data: number[];
  color?: string;
  lastUpdate?: string;
}

export default function MiniChartCard({
  label, value, unit, statusText, statusColor = 'var(--success)', data, color = 'var(--success)', lastUpdate
}: MiniChartCardProps) {
  // Format data for Recharts
  const chartData = data.map((val, i) => ({ val, index: i }));
  const min = Math.min(...data);
  const max = Math.max(...data);

  return (
    <GlassCard style={{ padding: '12px' }} noPadding>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
        {statusText && (
          <div style={{ 
            fontSize: '9px', padding: '2px 6px', borderRadius: '4px', 
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${statusColor}`, color: statusColor, fontWeight: 600
          }}>
            {statusText}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', fontWeight: 600 }}>{value}</span>
        {unit && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>

      <div style={{ height: '40px', width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={[min - (max-min)*0.2, max + (max-min)*0.2]} hide />
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {lastUpdate && (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Last: {lastUpdate}
        </div>
      )}
    </GlassCard>
  );
}
