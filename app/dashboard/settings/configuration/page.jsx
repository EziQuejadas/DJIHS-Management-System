"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  fetchSystemConfig, 
  updateSystemConfig, 
  fetchAuditLogs, 
  clearAuditLogs 
} from "@/app/lib/data";
import styles from "@/app/ui/dashboard/settings/configuration.module.css";

const SystemConfigPage = () => {
  const [config, setConfig] = useState({
    active_sy: "2025-26",
    q1_deadline: "",
    q2_deadline: "",
    q3_deadline: "",
    q4_deadline: "",
    is_editing_enabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState([]);

  const refreshAllData = useCallback(async () => {
    const [configData, logData] = await Promise.all([
      fetchSystemConfig(),
      fetchAuditLogs()
    ]);
    
    if (configData) setConfig(configData);
    if (logData) setLogs([...logData]);
  }, []);

  useEffect(() => {
    refreshAllData().then(() => setLoading(false));
  }, [refreshAllData]);

  const handleExportCSV = () => {
    if (logs.length === 0) return alert("No logs available to export.");

    const headers = ["Date", "Admin User", "Action", "Details"];
    const csvRows = logs.map(log => [
      `"${new Date(log.created_at).toLocaleString()}"`,
      `"${log.performed_by_name}"`,
      `"${log.action}"`,
      `"${log.details?.replace(/"/g, '""')}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateSystemConfig(config);
    
    if (result.success) {
      setTimeout(async () => {
        await refreshAllData();
        setIsSaving(false);
        alert("✅ Configuration updated!");
      }, 500);
    } else {
      setIsSaving(false);
      alert("❌ Error: " + result.error);
    }
  };

  const handleClearLogs = async () => {
    if (confirm("⚠️ Are you sure? This will permanently delete all audit logs.")) {
      setIsSaving(true);
      const result = await clearAuditLogs();
      
      if (result.success) {
        setTimeout(async () => {
          await refreshAllData();
          setIsSaving(false);
          alert("🗑️ Audit logs cleared.");
        }, 500);
      } else {
        setIsSaving(false);
        alert("❌ Error clearing logs: " + result.error);
      }
    }
  };

  if (loading) return <div className={styles.contentWrapper}>Loading Settings...</div>;

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.configHeader}>
        <h2 className={styles.pageTitle}>System Configuration</h2>
        <div className={styles.dateInfo}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | S.Y. {config.active_sy}
        </div>
      </div>

      <div className={styles.configContainer}>
        {/* Section 1: Academic Year & Global Lock */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}><h3>Academic Year & Global Lock</h3></div>
          <div className={styles.sectionContent}>
            <label>Active School Year</label>
            <select 
              className={styles.configSelect} 
              value={config.active_sy}
              onChange={(e) => setConfig({...config, active_sy: e.target.value})}
            >
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
            </select>

            <div className={styles.accessControlBox}>
              <div className={styles.statusText}>
                <strong>Grade Editing: {config.is_editing_enabled ? "OPEN" : "LOCKED"}</strong>
                <p>Manual override to lock all teachers out immediately.</p>
              </div>
              <button 
                className={config.is_editing_enabled ? styles.btnDisable : styles.btnEnable}
                onClick={() => setConfig({...config, is_editing_enabled: !config.is_editing_enabled})}
              >
                {config.is_editing_enabled ? "Disable All Editing" : "Enable Editing"}
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Individual Submission Management (Updated Message) */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}><h3>Individual Submission Override</h3></div>
          <div className={styles.sectionContent}>
            <div style={{ 
              padding: '15px', 
              background: '#f0f7ff', 
              border: '1px border #bae7ff', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>ℹ️</span>
              <p style={{ margin: 0, color: '#0050b3', fontWeight: '500' }}>
                Individual subject unlocking is restricted. For manual grade entry overrides after the deadline, please contact the <strong>IT Administrator</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Quarterly Deadlines */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}><h3>Quarterly Deadlines</h3></div>
          <div className={styles.sectionContent}>
            {[1, 2, 3, 4].map((q) => (
              <div key={q} className={styles.deadlineGroup}>
                <label>Quarter {q} Deadline  </label>
                <input 
                  type="date" 
                  className={styles.dateInput} 
                  value={config[`q${q}_deadline`] || ""} 
                  onChange={(e) => setConfig({...config, [`q${q}_deadline`]: e.target.value})}
                />
              </div>
            ))}
          </div>
        </section>

        <div className={styles.configActions}>
          <button className={styles.btnSave} onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "💾 Save All Settings"}
          </button>
        </div>

        {/* Section 4: Audit Log Table */}
        <section className={styles.configSection} style={{ marginTop: '40px' }}>
          <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Audit Log (Recent Activity)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleExportCSV}
                style={{ 
                  background: '#f6ffed', border: '1px solid #b7eb8f', color: '#389e0d', 
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                }}
              >
                📥 Export CSV
              </button>
              <button 
                onClick={handleClearLogs}
                style={{ 
                  background: '#fff1f0', border: '1px solid #ffa39e', color: '#cf1322', 
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                }}
              >
                🗑️ Clear History
              </button>
            </div>
          </div>
          <div className={styles.sectionContent} style={{ overflowX: 'auto' }}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left', color: '#666' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Admin User</th>
                    <th style={{ padding: '12px 8px' }}>Action</th>
                    <th style={{ padding: '12px 8px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 8px', fontSize: '13px' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 8px', fontWeight: '500' }}>
                          {log.performed_by_name}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            background: '#eef2ff', 
                            color: '#4338ca', 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', fontSize: '13px', color: '#444' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemConfigPage;