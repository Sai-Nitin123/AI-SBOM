'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Layers,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  Clock
} from 'lucide-react';
import { API_BASE } from '../utils/api';
import { soundEngine } from '../utils/audio';

export default function ReportsView({
  reports = [],
  onRefresh,
  onOpenSbomModal,
  onOpenExplainModal,
  audioEnabled,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const safeReports = Array.isArray(reports) ? reports : [];

  const filteredReports = safeReports.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.scan_id || '').toLowerCase().includes(term) ||
      (r.model_name || '').toLowerCase().includes(term) ||
      (r.scan_type || '').toLowerCase().includes(term) ||
      (r.action || '').toLowerCase().includes(term) ||
      (r.prompt || '').toLowerCase().includes(term) ||
      (r.explanation || '').toLowerCase().includes(term)
    );
  });

  const handleRefreshClick = () => {
    soundEngine.play('click', audioEnabled);
    if (typeof onRefresh === 'function') {
      onRefresh();
    } else if (typeof onShowToast === 'function') {
      onShowToast({
        title: 'Ledger Refreshed',
        message: `Currently tracking ${safeReports.length} audit records.`,
        type: 'info'
      });
    }
  };

  const handleDownloadPdf = (scanId) => {
    soundEngine.play('click', audioEnabled);
    const pdfUrl = `${API_BASE}/api/reports/${scanId}/pdf`;
    window.open(pdfUrl, '_blank');
    if (typeof onShowToast === 'function') {
      onShowToast({
        title: 'Report Download Initiated',
        message: `Downloading cryptographic PDF report for ${scanId}.`,
        type: 'success'
      });
    }
  };

  const handleOpenSbom = (tag) => {
    soundEngine.play('click', audioEnabled);
    if (typeof onOpenSbomModal === 'function') {
      onOpenSbomModal(tag || 'llama3.2:3b');
    }
  };

  const handleOpenInspect = (report) => {
    soundEngine.play('click', audioEnabled);
    if (typeof onOpenExplainModal === 'function') {
      onOpenExplainModal(report);
    }
  };

  return (
    <div className="page-container" id="page-reports">
      <div className="page-top-actions-bar">
        <span className="section-tagline">
          Official Model Audit Ledger • Cryptographically Signed Ed25519 Records • Binary PDF Downloads
        </span>
        <div className="page-actions-group">
          <button
            className="glass-action-btn"
            id="btn-refresh-reports"
            onClick={handleRefreshClick}
          >
            <RotateCw size={14} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      <div className="reports-table-card">
        <div className="reports-table-header">
          <input
            type="text"
            className="modern-search-input"
            placeholder="Search reports by model, scan ID, action, prompt or findings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="report-count-tag">
            {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} Available
          </span>
        </div>

        <div className="reports-table-scroll">
          <table className="reports-data-table">
            <thead>
              <tr>
                <th>AUDIT / SCAN ID</th>
                <th>TARGET MODEL</th>
                <th>SCAN DATE</th>
                <th>SECURITY SCORE</th>
                <th>VERDICT</th>
                <th>EVALUATED PROMPT / FINDINGS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-cyan)'
                      }}>
                        <FileText size={22} />
                      </div>
                      <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.92rem' }}>
                        {safeReports.length === 0 ? 'Audit Ledger is Fresh & Empty (0 Records)' : 'No Matching Reports Found'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '440px' }}>
                        {safeReports.length === 0
                          ? 'Evaluate prompts in the Threat Console or initiate an AI Model Scan to populate real-time cryptographic audit records.'
                          : 'Try changing your search query or refresh the ledger.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const score = r.security_score !== undefined ? r.security_score : 94;
                  const isBlock = r.action === 'BLOCK' || score < 60;
                  const isFlag = r.action === 'FLAG_FOR_REVIEW' || (score >= 60 && score < 90);
                  const isAllow = !isBlock && !isFlag;
                  
                  const scoreColor = isBlock ? 'var(--color-red)' : isFlag ? 'var(--color-amber)' : 'var(--color-green)';
                  const verdictText = isBlock ? 'BLOCKED' : isFlag ? 'FLAGGED' : 'ALLOWED';
                  const verdictBg = isBlock
                    ? 'rgba(244, 63, 94, 0.14)'
                    : isFlag
                    ? 'rgba(245, 158, 11, 0.14)'
                    : 'rgba(16, 185, 129, 0.14)';
                  const verdictBorder = isBlock
                    ? 'rgba(244, 63, 94, 0.35)'
                    : isFlag
                    ? 'rgba(245, 158, 11, 0.35)'
                    : 'rgba(16, 185, 129, 0.35)';

                  const promptPreview = r.prompt
                    ? (r.prompt.length > 55 ? `${r.prompt.slice(0, 55)}...` : r.prompt)
                    : (r.explanation ? (r.explanation.length > 55 ? `${r.explanation.slice(0, 55)}...` : r.explanation) : 'Automated supply-chain scan');

                  return (
                    <tr key={r.scan_id || Math.random()}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--color-cyan)' }}>
                        {r.scan_id}
                      </td>
                      <td style={{ fontWeight: '700', color: '#ffffff' }}>
                        {r.model_name}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94a3b8' }}>
                        {r.scan_date}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: scoreColor }}>
                        {score}/100
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.66rem',
                          fontWeight: '800',
                          color: scoreColor,
                          background: verdictBg,
                          border: `1px solid ${verdictBorder}`,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {isBlock ? <ShieldAlert size={11} /> : isFlag ? <AlertTriangle size={11} /> : <ShieldCheck size={11} />}
                          {verdictText}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.72rem', color: '#cbd5e1', maxWidth: '260px' }} title={r.prompt || r.explanation}>
                        {promptPreview}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                          <button
                            className="glass-action-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem' }}
                            title="Download PDF Security Report"
                            onClick={() => handleDownloadPdf(r.scan_id)}
                          >
                            <Download size={13} /> PDF
                          </button>
                          <button
                            className="glass-action-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem' }}
                            title="View CycloneDX SBOM"
                            onClick={() => handleOpenSbom(r.model_tag || 'llama3.2:3b')}
                          >
                            <Layers size={13} /> SBOM
                          </button>
                          <button
                            className="glass-action-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem' }}
                            title="Inspect 4-Tier ML Explanation"
                            onClick={() => handleOpenInspect(r)}
                          >
                            <ExternalLink size={13} /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
