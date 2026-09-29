"use client";

import { useState, useEffect } from 'react';
import { Sun, Clock, AlertTriangle, User } from 'lucide-react';
import styles from './layout.module.css';

export default function Header() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      // Client-only: avoids server/client mismatch on time strings
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      
      const dateOptions: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-GB', dateOptions));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerBadge}>
          <Sun size={16} className="text-warning" />
          <div className={styles.missionInfo}>
            <h2>Mission #001</h2>
            <p>Search &amp; Rescue</p>
          </div>
        </div>

        <div className={styles.headerBadge}>
          <div className={`${styles.dot} bg-success animate-pulse`} />
          <div className={styles.missionInfo}>
            <h2 className="text-success">CONNECTED</h2>
            <p>Mesh Network Active</p>
          </div>
        </div>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.headerBadge}>
          <Clock size={16} className="text-muted" />
          <div className={styles.missionInfo}>
            <h2 suppressHydrationWarning>{currentDate || '\u00a0'}</h2>
            {/*
              suppressHydrationWarning is intentional here:
              Phone-number-linking browser extensions (e.g. Skype, Click-to-Call)
              reformat HH:MM:SS text nodes into "HH (MM:SS)" on the client side,
              causing React text-node mismatches. Since this is client-only state
              anyway, suppressing is safe.
            */}
            <p suppressHydrationWarning>{currentTime || '\u00a0'}</p>
          </div>
        </div>
      </div>

      <div className={styles.headerRight}>
        <button className={styles.emergencyBtn}>
          <AlertTriangle size={16} />
          EMERGENCY STOP
        </button>

        <div className={styles.operatorInfo}>
          <div className={styles.operatorAvatar}>
            <User size={18} className="text-muted" />
          </div>
          <div className={styles.operatorDetails}>
            <h3>Team</h3>
            <p>DharaShakti</p>
          </div>
        </div>
      </div>
    </header>
  );
}
