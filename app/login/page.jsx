"use client"

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import styles from "@/app/ui/login/login.module.css"
import { login } from "@/app/lib/data";

const Login = () => {
  // state will hold { success, role, error } from our server action
  const [state, formAction, isPending] = useActionState(login, undefined);
  const router = useRouter();

  useEffect(() => {
    // If login is successful, redirect based on the role returned from the DB
    if (state?.success) {
      if (state.role === 'registrar') {
        router.push("/dashboard");
      } else if (state.role === 'subject teacher') {
        router.push("/dashboard/teacher");
      } else if (state.role === 'key teacher') {
        router.push("/dashboard/kteacher")
      }
      else {
        // Fallback for any other roles
        router.push("/dashboard");
      }
    }
  }, [state, router]);

  return (
    <div className={styles.container}>
        <div className={styles.login_header}>
            <img 
              src="/DJIHS_Logo.png" 
              className={styles.top_logo} 
              alt="School Logo" />
            <h2>Don Jose Integrated High School</h2>
        </div>

        <form action={formAction} className={styles.form}>
            <h1 className={styles.login_title}>Login</h1>
            
            <div className={styles.input_box}>
              <input 
                type="text" 
                name="username" 
                placeholder="Username" 
                required 
                disabled={isPending}
              />
              <FaUser className={styles.Icon} />
            </div>

            <div className={styles.input_box}>
              <input 
                type="password" 
                name="password" 
                placeholder="Password" 
                required 
                disabled={isPending}
              />
              <FaLock className={styles.Icon} />
            </div>

            {/* ERROR FEEDBACK */}
            {state?.error && (
              <p className={styles.error_message}>{state.error}</p>
            )}
            
            <button type="submit" disabled={isPending}>
              {isPending ? "Authenticating..." : "Login"}
            </button>
        </form>
    </div>
  )
}

export default Login