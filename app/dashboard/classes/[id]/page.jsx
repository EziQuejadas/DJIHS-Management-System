import { fetchSectionDetails } from "@/app/lib/data";
import styles from "@/app/ui/dashboard/classes/sectiondetails.module.css";
import Link from "next/link";
import ExportButton from "@/app/ui/dashboard/classes/ExportButton";

const SectionDetailsPage = async ({ params }) => {
  const { id } = await params;
  const data = await fetchSectionDetails(id);

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
                    {/* Format: LASTNAME, Firstname M. */}
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

export default SectionDetailsPage;