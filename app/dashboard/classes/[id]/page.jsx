"use client";

import { useEffect, useState, use } from "react"; // Added 'use' to unwrap params
import { fetchSectionDetails } from "@/app/lib/data";
import styles from "@/app/ui/dashboard/classes/sectiondetails.module.css";
import Link from "next/link";
import ExportButton from "@/app/ui/dashboard/classes/ExportButton";
import RoleGuard from "@/app/components/ProtectedRoutes";

const SectionDetailsContent = ({ params }) => {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      if (!id) return;
      setLoading(true);
      const result = await fetchSectionDetails(id);
      setData(result);
      setLoading(false);
    };
    getData();
  }, [id]);

  if (loading) return <div className={styles.contentWrapper}>Loading section details...</div>;
  if (!data) return <div className={styles.contentWrapper}>Section not found.</div>;

  const { section, students } = data;

  // SORTING LOGIC: Alphabetical by Last Name, then First Name
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.students.lastname} ${a.students.firstname}`.toLowerCase();
    const nameB = `${b.students.lastname} ${b.students.firstname}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.breadcrumb}>
        <Link href="/dashboard/classes" className={styles.breadcrumbLink}>
          Classes
        </Link>
        <span className={styles.separator}>/</span>
        <span className={styles.currentPath}>{section.sectionname}</span>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.pageTitle}>Section: {section.sectionname}</h2>
        <ExportButton 
          sectionName={section.sectionname} 
          students={sortedStudents} 
        />
      </div>

      <div className={styles.sectionTableContainer}>
        <table className={styles.sectionTable}>
          <thead>
            <tr>
              <th>LRN</th>
              <th>Student Name</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length > 0 ? (
              sortedStudents.map((entry) => (
                <tr key={entry.lrn}>
                  <td>{entry.lrn}</td>
                  <td className={styles.studentName}>
                    {entry.students.lastname?.toUpperCase()}, {entry.students.firstname} {entry.students.middleinitial ? `${entry.students.middleinitial}.` : ""}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`remark${entry.status.toLowerCase().replace(/\s+/g, '')}`]}`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className={styles.emptyRow}>
                  No students found in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 2. Wrap the page with RoleGuard for the Registrar
export default function SectionDetailsPage(props) {
  return (
    <RoleGuard allowedRole="registrar">
      <SectionDetailsContent {...props} />
    </RoleGuard>
  );
}