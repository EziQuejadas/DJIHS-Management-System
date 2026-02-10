"use client";

import { useState, useEffect } from "react";
import { fetchSystemConfig, updateSystemConfig } from "@/app/lib/data";
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

  useEffect(() => {
    async function loadConfig() {
      const data = await fetchSystemConfig();
      if (data) setConfig(data);
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateSystemConfig(config);
    setIsSaving(false);
    if (result.success) alert("✅ Configuration updated!");
    else alert("❌ Error: " + result.error);
  };

  if (loading) return <div className={styles.contentWrapper}>Loading Settings...</div>;

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.configHeader}>
        <h2 className={styles.pageTitle}>System Configuration</h2>
        <div className={styles.dateInfo}>Feb. 10, 2026 | S.Y. {config.active_sy}</div>
      </div>

      <div className={styles.configContainer}>
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

        <section className={styles.configSection}>
          <div className={styles.sectionHeader}><h3>Quarterly Deadlines</h3></div>
          <div className={styles.sectionContent}>
            {[1, 2, 3, 4].map((q) => (
              <div key={q} className={styles.deadlineGroup}>
                <label>Quarter {q} Deadline</label>
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
      </div>
    </div>
  );
};

export default SystemConfigPage;