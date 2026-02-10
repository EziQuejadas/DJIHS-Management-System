"use client";

import React, { useState, useEffect, useActionState } from 'react';
import styles from '@/app/ui/dashboard/settings/settings.module.css';
import { updatePassword } from "@/app/lib/data";

const SettingsClient = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Connect the form state to your updatePassword action
  const [state, formAction, isPending ] = useActionState(updatePassword, null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Automatically close modal on success after a short delay
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        closeModal();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.settingsHeader}>
        <h2>Settings</h2>
        <div className={styles.dateInfo}>Jan. 30, 2026 | S.Y. 2025-26</div>
      </div>

      <div className={styles.settingsGrid}>
        <div className={styles.settingsCard}>
          <h3>Personal Information</h3>
          {/* ... Personal Info Inputs remain the same ... */}
          <div className={styles.formGroup}>
            <label>First Name</label>
            <input type="text" className={styles.formInput} value={user?.first_name || ""} readOnly />
          </div>
          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input type="text" className={styles.formInput} value={user?.last_name || ""} readOnly />
          </div>
          <div className={styles.formGroup}>
            <label>Role</label>
            <input type="text" className={styles.formInput} value={user?.role?.toUpperCase() || ""} readOnly />
          </div>
          <div className={styles.formGroup}>
            <label>Username</label>
            <input type="text" className={styles.formInput} value={user?.username || ""} readOnly />
          </div>

          <button className={styles.btnChangePassword} onClick={openModal}>
            Change Password
          </button>
        </div>

        {user?.role === 'registrar' && (
          <div className={styles.settingsCard + " " + styles.systemConfigCard}>
            <h3>System Configuration</h3>
            <p className={styles.configDescription}>
              Manage academic calendar, deadlines, and system access controls.
            </p>
            <button className={styles.btnConfig} onClick={() => window.location.href='/dashboard/settings/configuration'}>
              Open Configuration →
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Change Password</h3>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <form action={formAction}>
              <div className={styles.modalBody}>
                {/* Feedback Messages */}
                {state?.error && <div className={styles.errorMsg} style={{color: 'red', marginBottom: '10px'}}>{state.error}</div>}
                {state?.success && <div className={styles.successMsg} style={{color: 'green', marginBottom: '10px'}}>{state.success}</div>}

                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input name="currentPassword" type="password" className={styles.formControl} placeholder="Enter current password" required />
                </div>

                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input name="newPassword" type="password" className={styles.formControl} placeholder="Enter new password" required />
                </div>

                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <input name="confirmPassword" type="password" className={styles.formControl} placeholder="Confirm new password" required />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={closeModal} disabled={isPending}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} disabled={isPending}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsClient;