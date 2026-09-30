"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Box, 
  MonitorPlay, 
  Activity, 
  BrainCircuit, 
  Gamepad2, 
  RadioTower, 
  FileText, 
  Settings,
  Mountain
} from 'lucide-react';
import styles from './layout.module.css';

const navItems = [
  { name: 'Overview', path: '/', icon: Home },
  { name: '3D Map', path: '/map', icon: Box },
  { name: 'Live Feeds', path: '/feeds', icon: MonitorPlay },
  { name: 'Sensors', path: '/sensors', icon: Activity },
  { name: 'AI Detections', path: '/ai', icon: BrainCircuit },
  { name: 'Rover Control', path: '/control', icon: Gamepad2 },
  { name: 'Relay Nodes', path: '/relay', icon: RadioTower },
  { name: 'Mission Log', path: '/logs', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <Mountain size={28} className={styles.logoIcon} />
        <div className={styles.logoText}>
          <h1>TriNetra</h1>
          <p>AI-Powered Mine Rescue Rover</p>
        </div>
      </div>
      
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link 
              href={item.path} 
              key={item.name}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navItemIcon}>
                <Icon size={20} />
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerText}>
          Navigate.<br />
          Detect.<br />
          Save Lives.
        </div>
      </div>
    </aside>
  );
}
