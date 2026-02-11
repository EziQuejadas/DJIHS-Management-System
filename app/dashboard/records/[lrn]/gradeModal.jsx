"use client";
import { useState } from 'react';
import Image from 'next/image';
import styles from '@/app/ui/dashboard/records/grademodal.module.css';

export default function GradeModal({ student, verifiedGrades = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [purpose, setPurpose] = useState('Scholarship');

  const totalVerified = verifiedGrades.reduce((acc, curr) => acc + (parseFloat(curr.total) / curr.count || 0), 0);
  const generalAvg = verifiedGrades.length > 0 ? (totalVerified / verifiedGrades.length).toFixed(0) : '';

  const handleGenerate = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <>
      <button className={styles.generateBtn} onClick={() => setIsOpen(true)}>
        Generate Report Card / Form 138
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Log Grade Request</h3>
              <button className={styles.closeX} onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.requestSummary}>
                <div className={styles.summaryItem}>
                  <label>LRN:</label>
                  <span>{student.lrn}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Name:</label>
                  <span>{student.lastname?.toUpperCase()}, {student.firstname}</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Purpose:</label>
                <select 
                  className={styles.formControl} 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option>Scholarship</option>
                  <option>Transfer</option>
                  <option>Employment</option>
                  <option>Personal Copy</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setIsOpen(false)}>Cancel</button>
              <button className={styles.btnSubmit} onClick={handleGenerate}>Log & Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* --- OFFICIAL DEPED FORM 138 PRINT TEMPLATE --- */}
      <div className={styles.printContainer}>
        <div className={styles.f138Header}>
          <div className={styles.logoWrapper}>
            <Image src="/DepEd_Logo.png" alt="DepEd" width={80} height={80} unoptimized priority/>
          </div>

          <div className={styles.headerText}>
            <p>Republic of the Philippines</p>
            <p>DEPARTMENT OF EDUCATION</p>
            <p>Region IV-A CALABARZON</p>
            <p>Division of Santa Rosa City</p>
            <h3 className={styles.schoolName}>DON JOSE INTEGRATED HIGH SCHOOL</h3>
            <p>S.Y. 2025-2026</p>
          </div>

          <div className={styles.logoWrapper}>
            <Image src="/DJIHS_Logo.png" alt="School Logo" width={80} height={80} unoptimized priority />
          </div>
        </div>

        <div className={styles.f138StudentInfo}>
           <div className={styles.infoRow}>
              <span>Name: <strong>{student.lastname?.toUpperCase()}, {student.firstname} {student.middleinitial}.</strong></span>
           </div>
           <div className={styles.infoRow}>
              <span>LRN: <strong>{student.lrn}</strong></span>
              <span>Sex: <strong>{student.sex || '__________'}</strong></span>
           </div>
           <div className={styles.infoRow}>
              <span>Grade & Section: <strong>{student.sections?.sectionname || '__________'}</strong></span>
           </div>
        </div>

        <h4 className={styles.reportTitle}>REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</h4>
        <table className={styles.f138Table}>
          <thead>
            <tr>
              <th rowSpan="2">Learning Area</th>
              <th colSpan="4">Periodic Rating</th>
              <th rowSpan="2">Final Grade</th>
              <th rowSpan="2">Remarks</th>
            </tr>
            <tr>
              <th>1</th><th>2</th><th>3</th><th>4</th>
            </tr>
          </thead>
          <tbody>
            {verifiedGrades.map((subject, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>{subject.fullName}</td>
                <td>{subject.q1 !== '-' ? subject.q1 : ''}</td>
                <td>{subject.q2 !== '-' ? subject.q2 : ''}</td>
                <td>{subject.q3 !== '-' ? subject.q3 : ''}</td>
                <td>{subject.q4 !== '-' ? subject.q4 : ''}</td>
                <td className={styles.bold}>
                    {subject.count > 0 ? (subject.total / subject.count).toFixed(0) : ''}
                </td>
                <td>{subject.remarks}</td>
              </tr>
            ))}
            <tr className={styles.bold}>
              <td style={{ textAlign: 'right' }}>General Average</td>
              <td></td><td></td><td></td><td></td>
              <td>{generalAvg}</td>
              <td>{generalAvg >= 75 ? 'Passed' : ''}</td>
            </tr>
          </tbody>
        </table>

        {/* --- UPDATED OBSERVED VALUES SECTION --- */}
        <h4 className={styles.reportTitle}>REPORT ON LEARNER'S OBSERVED VALUES</h4>
        <table className={styles.f138Table}>
          <thead>
            <tr className={styles.tableHeaderBlue}>
              <th style={{ width: '20%' }}>Core Values</th>
              <th style={{ width: '60%' }}>Behavior Statements</th>
              <th style={{ width: '5%' }}>1</th>
              <th style={{ width: '5%' }}>2</th>
              <th style={{ width: '5%' }}>3</th>
              <th style={{ width: '5%' }}>4</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. Maka-Diyos</td>
              <td className={styles.textLeft}>
                Expresses one's spiritual beliefs while respecting the spiritual beliefs of others
              </td>
              <td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td>2. Makatao</td>
              <td className={styles.textLeft}>
                Shows adherence to ethical principles by upholding truth
              </td>
              <td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td>3. Maka-kalikasan</td>
              <td className={styles.textLeft}>
                Cares for the environment and utilizes resources wisely, judiciously, and economically
              </td>
              <td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td rowSpan="2">4. Makabansa</td>
              <td className={styles.textLeft}>
                Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen
              </td>
              <td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td className={styles.textLeft}>
                Demonstrates appropriate behavior in carrying out activities in the school, community, and country
              </td>
              <td></td><td></td><td></td><td></td>
            </tr>
          </tbody>
        </table>

        {/* Marking Legend matching your image */}
        <div className={styles.legendContainer}>
          <div className={styles.legendSection}>
            <strong>Marking</strong>
            <p>AO - Always Observed</p>
            <p>SO - Sometimes Observed</p>
            <p>RO - Rarely Observed</p>
            <p>NO - Not Observed</p>
          </div>
          <div className={styles.legendSection}>
            <strong>Non-numerical Rating</strong>
            <p>Always Observed</p>
            <p>Sometimes Observed</p>
            <p>Rarely Observed</p>
            <p>Not Observed</p>
          </div>
        </div>
      </div>
    </>
  );
}