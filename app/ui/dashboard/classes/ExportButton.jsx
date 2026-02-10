"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./sectiondetails.module.css";

const ExportButton = ({ sectionName, students }) => {
  const exportPDF = () => {
    const doc = jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text(`Class List: ${sectionName}`, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare table data
    const tableRows = students.map((s) => [
      s.lrn,
      `${s.students.lastname.toUpperCase()}, ${s.students.firstname}`,
      s.status.toUpperCase(),
    ]);

    // Generate Table
    autoTable(doc, {
      startY: 35,
      head: [["LRN", "Student Name", "Remarks"]],
      body: tableRows,
      headStyles: { fillColor: [79, 185, 169] }, // Matches your #4FB9A9 brand color
      theme: "striped",
    });

    doc.save(`ClassList_${sectionName}.pdf`);
  };

  return (
    <button className={styles.exportBtn} onClick={exportPDF}>
      <span className={styles.exportIcon}>📄</span>
      Export Class List (PDF)
    </button>
  );
};

export default ExportButton;