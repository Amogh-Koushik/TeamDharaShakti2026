import React from 'react';
import styles from './ui.module.css';
import { Maximize2 } from 'lucide-react';

interface CameraFeedProps {
  name: string;
  type: 'rgb' | 'thermal' | 'ceiling' | 'probe';
  overlay?: React.ReactNode;
  timestamp?: string;
  statusColor?: string;
}

export default function CameraFeed({ name, type, overlay, timestamp, statusColor = 'var(--success)' }: CameraFeedProps) {
  return (
    <div className={styles.cameraFeed}>
      <div className={styles.cameraHeader}>
        <div className={styles.cameraName}>
          <div className={styles.statusDot} style={{ backgroundColor: statusColor }} />
          {name}
        </div>
        <div className={styles.liveBadge}>LIVE</div>
      </div>
      
      <div className={`${styles.cameraView} ${styles[type]}`}>
        {/* Placeholder for the actual video stream */}
        <div className={styles.cameraOverlay}>
          {overlay}
        </div>
        
        {timestamp && (
          <div className={styles.cameraTimestamp}>
            {timestamp}
          </div>
        )}
        
        <button className={styles.fullscreenBtn}>
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
}
