"use client"; // Required for onClick events

import styles from "@/app/ui/dashboard/classes/classes.module.css";
import { fetchClasses } from "@/app/lib/data";
import { useRouter } from "next/navigation"; // Use the Next.js router
import FilterSelect from "@/app/ui/dashboard/records/filterBar/FilterSelect";
import { useEffect, useState } from "react";

const ClassesPage = ({ searchParams }) => {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  
  // Since we are now a Client Component, we fetch data inside useEffect 
  // or pass it as a prop from a parent Server Component.
  useEffect(() => {
    const getData = async () => {
      const params = await searchParams;
      const gradeFilter = params?.grade || "";
      const data = await fetchClasses(gradeFilter);
      setClasses(data);
    };
    getData();
  }, [searchParams]);

  const handleRowClick = (id) => {
    router.push(`/dashboard/classes/${id}`);
  };

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.classesHeader}>
        <h2>Classes</h2>
        <div className={styles.filterSection}>
          <FilterSelect 
            paramName="grade" 
            placeholder="Filter by: Grade Level" 
            options={[7, 8, 9, 10].map(g => ({ value: g, label: `Grade ${g}` }))} 
          />
        </div>
      </div>

      <div className={styles.classesTableContainer}>
        <table className={styles.classesTable}>
          <thead>
            <tr>
              <th>Section Name</th>
              <th>Grade Level</th>
              <th>Adviser</th>
              <th>Student Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr 
                key={cls.sectionid} 
                className={styles.clickableRow} 
                onClick={() => handleRowClick(cls.sectionid)}
              >
                <td className={styles.sectionName}>
                  {cls.sectionname}
                </td>
                <td>Grade {cls.gradelevel}</td>
                <td>
                  {cls.adviser 
                    ? `${cls.adviser.firstname} ${cls.adviser.lastname}` 
                    : "Not Assigned"}
                </td>
                <td>{cls.enrollments?.[0]?.count || 0}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[cls.status?.toLowerCase() || 'active']}`}>
                    {cls.status || 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassesPage;