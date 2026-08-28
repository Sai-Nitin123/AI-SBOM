'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Layers,
  RotateCw,
  Search
} from 'lucide-react';
import { API_BASE } from '../utils/api';
import { soundEngine } from '../utils/audio';

export default function ReportsView({
  reports,
  onRefresh,
  onOpenSbomModal,
  audioEnabled,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.scan_id || '').toLowerCase().includes(term) ||
      (r.model_name || '').toLowerCase().includes(term) ||
      (r.scan_type || '').toLowerCase().includes(term) ||
      (r.action || '').toLowerCase().includes(term)
    );
  });

  const handleDownloadPdf = (scanId) => {
    soundEngine.play('click', audioEnabled);
    const pdfUrl = `${API_BASE}/api/reports/${scanId}/pdf`;
    window.open(pdfUrl, '_blank');
    onShowToast({
      title: 'Report Download Initiated',
      message: `Downloading cryptographic PDF report for ${scanId}.`,
      type: 'success'
    });
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
            onClick={() => {
              soundEngine.play('click', audioEnabled);
              onRefresh();
            }}
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
            placeholder="Search reports by model, scan ID, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="report-count-tag">
            {filteredReports.length} Reports Available
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
                <th>THREATS</th>
                <th>VULNS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No reports match your search query.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const score = r.security_score ?? 94;
                  const isGood = score >= 90;
                  const isBad = score < 60;
                  const scoreColor = isBad ? 'var(--color-red)' : isGood ? 'var(--color-green)' : 'var(--color-amber)';

                  return (
                    <tr key={r.scan_id}>
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
                      <td style={{ color: r.threats_count > 0 ? 'var(--color-red)' : '#cbd5e1', fontWeight: '700' }}>
                        {r.threats_count || 0}
                      </td>
                      <td style={{ color: r.vulnerabilities_count > 0 ? 'var(--color-red)' : '#cbd5e1', fontWeight: '700' }}>
                        {r.vulnerabilities_count || 0}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <button
                            className="glass-action-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem' }}
                            title="Download PDF"
                            onClick={() => handleDownloadPdf(r.scan_id)}
                          >
                            <Download size={13} /> PDF
                          </button>
                          <button
                            className="glass-action-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem' }}
                            title="View CycloneDX SBOM"
                            onClick={() => {
                              soundEngine.play('click', audioEnabled);
                              onOpenSbomModal(r.model_tag || 'llama3.2:3b');
                            }}
                          >
                            <Layers size={13} /> SBOM
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
