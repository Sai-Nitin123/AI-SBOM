'use client';

import React from 'react';
import {
  Home,
  Shield,
  Box,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  audioEnabled
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'console', label: 'Threat Console', icon: Shield },
    { id: 'models', label: 'AI Models', icon: Box },
    { id: 'reports', label: 'Reports & Ledger', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNav = (id) => {
    soundEngine.play('click', audioEnabled);
    onNavigate(id);
  };

  const handleToggle = () => {
    soundEngine.play('click', audioEnabled);
    onToggleCollapse();
  };

  return (
    <aside className="platform-sidebar" id="main-sidebar">
      <div className="sidebar-brand-box">
        <div
          className="brand-logo-wrap"
          id="brand-logo-trigger"
          title="AI-SBOM - Click to toggle sidebar"
          onClick={handleToggle}
        >
          <img
            src="/AIONLYLOGO-removebg-preview.png"
            className="brand-custom-logo"
            alt="AI-SBOM Logo"
          />
        </div>
        <div className="brand-name-group">
          <h2>AI-SBOM</h2>
          <span>SECURITY PLATFORM</span>
        </div>
        <button
          className="sidebar-toggle-btn"
          id="sidebar-collapse-btn"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          onClick={handleToggle}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
      </div>

      {/* Streamlined 5 Navigation Items */}
      <nav className="sidebar-nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-menu-item ${isActive ? 'active' : ''}`}
              title={item.label}
              onClick={() => handleNav(item.id)}
            >
              <Icon size={17} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
