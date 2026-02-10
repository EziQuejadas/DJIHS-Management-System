"use client"
import { useRouter } from 'next/navigation';
import styles from "@/app/ui/dashboard/records/studentprofile.module.css";

export default function BackButton() {
  const router = useRouter();
  return (
    <button className={styles.backBtn} onClick={() => router.back()}>
      <span>←</span> Student Profile
    </button>
  );
}