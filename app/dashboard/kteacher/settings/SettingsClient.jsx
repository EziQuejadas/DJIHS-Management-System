"use client";

import React, { useEffect, useActionState } from 'react';
import styles from '@/app/ui/dashboard/settings/settings.module.css';
import { updatePassword } from "@/app/lib/data";

const SettingsClient = ({ user }) => {
  // Same action state logic as your registrar example
  const [state, formAction, isPending] = useActionState(updatePassword, null);

  // Clear fields on success
  useEffect(() => {
    if (state?.success) {
      document.getElementById('passwordForm')?.reset();
    }
  }, [state?.success]);

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.settingsHeader}>
        <h2>Settings</h2>
        <div className={styles.dateInfo}>Feb. 10, 2026 | S.Y. 2025-26</div>
      </div>

      <div className={styles.settingsGrid}>
        
        {/* CARD 1: PERSONAL INFORMATION */}
        <div className={styles.settingsCard}>
          <h3>Personal Information</h3>
          
          <div className={styles.formGroup}>
            <label>First Name</label>
            <input type="text" className={styles.formInput} value={user?.first_name || ""} readOnly />
          </div>
          
          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input type="text" className={styles.formInput} value={user?.last_name || ""} readOnly />
          </div>

          <div className={styles.formGroup}>
            <label>Username</label>
            <input type="text" className={styles.formInput} value={user?.username || ""} readOnly />
          </div>

          <div className={styles.formGroup}>
            <label>Role</label>
            <input type="text" className={styles.formInput} value={user?.role?.toUpperCase() || ""} readOnly />
          </div>
          
          <p className={styles.readOnlyNotice}>* Contact IT Admin to change these details.</p>
        </div>

        {/* CARD 2: CHANGE PASSWORD (INLINE) */}
        <div className={styles.settingsCard}>
          <h3>Change Password</h3>
          <p className={styles.configDescription}>Keep your account secure by updating your password regularly.</p>
          
          <form action={formAction} id="passwordForm">
            {state?.error && <div className={styles.errorMsg} style={{color: 'red', marginBottom: '10px'}}>{state.error}</div>}
            {state?.success && <div className={styles.successMsg} style={{color: 'green', marginBottom: '10px'}}>{state.success}</div>}

            <div className={styles.formGroup}>
              <label>New Password</label>
              <input name="newPassword" type="password" className={styles.formInput} placeholder="Enter new password" required />
            </div>

            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <input name="confirmPassword" type="password" className={styles.formInput} placeholder="Confirm new password" required />
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={isPending} style={{width: '100%', marginTop: '10px'}}>
              {isPending ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SettingsClient;