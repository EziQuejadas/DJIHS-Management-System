"use client"
import { useState } from 'react';
import styles from '@/app/ui/dashboard/records/grademodal.module.css';

export default function GradeModal({ student }) {
  const [isOpen, setIsOpen] = useState(false);

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
            </div>
            <div className={styles.modalBody}>
              <p><strong>LRN:</strong> {student.lrn}</p>
              <p><strong>Name:</strong> {student.students.lastname}, {student.students.firstname}</p>
              <label>Purpose:</label>
              <select className={styles.formControl}>
                <option>Scholarship</option>
                <option>Transfer</option>
              </select>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button className={styles.btnSubmit}>Log & Generate</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}