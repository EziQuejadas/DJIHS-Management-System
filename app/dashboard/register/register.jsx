"use client"

import { useActionState } from 'react';
import { registerUser } from '@/app/lib/data';
import styles from "@/app/ui/dashboard/register/register.module.css";

const RegisterPage = ({ currentUserRole }) => {
  // state will catch the { error: "..." } returned from registerUser
  const [state, formAction, isPending] = useActionState(registerUser, undefined);

  // Role Guard
  if (currentUserRole !== "registrar") {
    return (
      <div className={styles.container}>
        <p>Unauthorized. Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Register New Staff</h2>
      
      {/* Display error banner if the server action returns an error */}
      {state?.error && <div className={styles.errorBanner}>{state.error}</div>}
      
      <form action={formAction} className={styles.form}>
        <div className={styles.row}>
          <input type="text" name="firstName" placeholder="First Name" required />
          <input type="text" name="lastName" placeholder="Last Name" required />
        </div>
        
        <input type="email" name="email" placeholder="Email Address" required />
        <input type="tel" name="phone" placeholder="Phone Number" required />
        <input type="password" name="password" placeholder="Password" required />
        
        <select name="role" required defaultValue="subject teacher">
          <option value="subject teacher">Subject Teacher</option>
          <option value="registrar">Registrar</option>
          <option value="key teacher">Key Teacher</option>
        </select>
        
        <button type="submit" disabled={isPending}>
          {isPending ? "Registering..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;