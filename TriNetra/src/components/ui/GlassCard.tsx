import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './ui.module.css';

interface GlassCardProps {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
  headerRight?: React.ReactNode;
}

export default function GlassCard({ 
  title, 
  icon: Icon, 
  children, 
  className = '',
  style,
  noPadding = false,
  headerRight
}: GlassCardProps) {
  return (
    <div className={`${styles.glassCard} ${className}`} style={style}>
      {title && (
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            {Icon && <Icon size={16} className={styles.cardIcon} />}
            <span>{title}</span>
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className={`${styles.cardContent} ${noPadding ? styles.noPadding : ''}`}>
        {children}
      </div>
    </div>
  );
}
