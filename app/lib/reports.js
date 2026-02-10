import { supabase } from './utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { fetchSubmissionStatuses } from './data'; 

export const generateTeacherLoadReport = async () => {
  try {
    // Check if names match your Supabase columns (e.g., first_name vs firstname)
    const { data, error } = await supabase
      .from('classes')
      .select(`
        subjects (subjectname),
        teachers (firstname, lastname),
        sections (sectionname)
      `);

    if (error) {
      console.error("Supabase Query Error:", error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      alert("No data found in the 'classes' table.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Teacher Load Summary", 14, 15);
    
    const rows = data.map(item => [
      `${item.teachers?.firstname || 'N/A'} ${item.teachers?.lastname || ''}`,
      item.subjects?.subjectname || 'N/A',
      item.sections?.sectionname || 'N/A'
    ]);

    doc.autoTable({
      head: [['Teacher', 'Subject', 'Section']],
      body: rows,
      startY: 25,
    });

    doc.save("Teacher_Load.pdf");
  } catch (err) {
    console.error("Full Error Object:", err);
    throw err; // Pass it to the page.jsx alert
  }
};

export const generatePendingReport = async () => {
  try {
    const data = await fetchSubmissionStatuses(1);
    if (!data) throw new Error("Could not fetch submission data");

    const pending = data.filter(item => item.status !== 'completed');

    if (pending.length === 0) {
      alert("No pending submissions found.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Pending Submissions", 14, 15);
    
    const rows = pending.map(item => [
      item.teacher,
      item.subject,
      item.section,
      item.pendingCount
    ]);

    doc.autoTable({
      head: [['Teacher', 'Subject', 'Section', 'Remaining']],
      body: rows,
      startY: 25,
    });

    doc.save("Pending_Reports.pdf");
  } catch (err) {
    console.error("Pending Report Error:", err);
    throw err;
  }
};

export const generateSubmissionSummaryReport = async () => {
  try {
    const data = await fetchSubmissionStatuses(1);
    const doc = new jsPDF();
    doc.text("Submission Summary", 14, 15);
    
    const rows = data.map(item => [
      item.subject,
      item.teacher,
      item.status?.toUpperCase()
    ]);

    doc.autoTable({
      head: [['Subject', 'Teacher', 'Status']],
      body: rows,
      startY: 25,
    });

    doc.save("Submission_Summary.pdf");
  } catch (err) {
    console.error("Summary Report Error:", err);
    throw err;
  }
};