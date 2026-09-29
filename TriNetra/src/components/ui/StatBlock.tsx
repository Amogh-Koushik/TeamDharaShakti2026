import React from 'react';
import styles from './ui.module.css';

interface StatBlockProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  valueColor?: string;
}

export default function StatBlock({ icon, label, value, unit, subValue, valueColor }: StatBlockProps) {
  return (
    <div className={styles.statBlock}>
      <div className={styles.statHeader}>
        {icon && <div className={styles.statIcon}>{icon}</div>}
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue} style={{ color: valueColor }}>
          {value}
          {unit && <span className={styles.statUnit}>{unit}</span>}
        </div>
        {subValue && <div className={styles.statSubValue}>{subValue}</div>}
      </div>
    </div>
  );
}
