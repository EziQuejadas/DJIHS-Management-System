"use client";

import React, { useEffect, useState } from "react"; // Added React for React.use()
import { useRouter } from "next/navigation";
import Search from "@/app/ui/dashboard/search/search";
import styles from "@/app/ui/dashboard/records/records.module.css";
import { fetchStudentRecords, fetchFilterOptions } from "@/app/lib/data";
import FilterSelect from "@/app/ui/dashboard/records/filterBar/FilterSelect";

const RecordsPage = ({ searchParams }) => {
  const router = useRouter();
  
  // 1. Unwrap searchParams using React.use()
  const resolvedSearchParams = React.use(searchParams);
  
  const [data, setData] = useState({ students: [], sections: [], schoolYears: [] });
  const [loading, setLoading] = useState(true);

  // 2. Extract values from the resolved object
  const query = resolvedSearchParams?.q || "";
  const grade = resolvedSearchParams?.grade || "";
  const section = resolvedSearchParams?.section || "";
  const status = resolvedSearchParams?.status || "";
  const sy = resolvedSearchParams?.sy || "2025-2026";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const students = await fetchStudentRecords({ query, grade, section, status, sy });
      const sortedStudents = [...students].sort((a, b) => {
        const nameA = `${a.students.lastname} ${a.students.firstname}`.toLowerCase();
        const nameB = `${b.students.lastname} ${b.students.firstname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      const { sections, schoolYears } = await fetchFilterOptions();
      
      // Update data with the sorted list
      setData({ students: sortedStudents, sections, schoolYears });
      setLoading(false);
    };
    loadData();
  }, [query, grade, section, status, sy]);

  // 3. This now works because 'grade' is a string, not a Promise
  const availableSections = data.sections.filter(s => 
    !grade || s.gradelevel === parseInt(grade)
  );

  const handleRowClick = (lrn) => {
    router.push(`/dashboard/records/${lrn}`);
  };

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.recordsHeader}>
        <h2>Student Record Search</h2>
      </div>

      <div className={styles.searchFilters}>
        <div className={styles.searchBox}>
          <Search placeholder="Search by LRN/Name" />
        </div>

        <div className={styles.filterGroup}>
          <FilterSelect 
            paramName="grade" 
            placeholder="Grade" 
            options={[7, 8, 9, 10].map(g => ({ value: g, label: `Grade ${g}` }))} 
          />
          
          <FilterSelect 
            paramName="section" 
            placeholder="Section" 
            options={availableSections.map(s => ({ key: s.sectionid, value: s.sectionname, label: s.sectionname }))} 
          />

          <FilterSelect 
            paramName="status" 
            placeholder="Status" 
            options={[
              { value: "Enrolled", label: "Enrolled" },
              { value: "Dropped", label: "Dropped" },
              { value: "Inactive", label: "Inactive" }
            ]} 
          />
        </div>

        <div className={styles.schoolYearSelect}>
          <label>School Year</label>
          <FilterSelect 
            paramName="sy" 
            options={data.schoolYears.map(year => ({ value: year.yearrange, label: year.yearrange }))} 
          />
        </div>
      </div>

      <div className={styles.recordsTableContainer}>
        <table className={styles.recordsTable}>
          <thead>
            <tr>
              <th>LRN</th>
              <th>Student Name</th>
              <th>Grade & Section</th>
              <th>Status</th>
              <th>School Year</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Loading records...</td></tr>
            ) : data.students.length > 0 ? (
              data.students.map((record) => (
                <tr 
                  key={record.lrn} 
                  className={styles.clickableRow}
                  onClick={() => handleRowClick(record.lrn)}
                >
                  <td>{record.lrn}</td>
                  <td className={styles.studentName}>
                    {record.students.lastname.toUpperCase()}, {record.students.firstname}
                  </td>
                  <td>{record.gradelevel} - {record.sections?.sectionname}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[record.status.toLowerCase()]}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.schoolyears?.yearrange}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No records found matching these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordsPage;