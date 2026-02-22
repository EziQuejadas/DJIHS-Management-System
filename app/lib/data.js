"use server"

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { supabase } from "./utils";

export const login = async (prevState, formData) => {
    const { username, password } = Object.fromEntries(formData);

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username.trim())
            .maybeSingle();

        if (error || !user) return { error: "User not found!" };

        const isMatch = await bcrypt.compare(password.trim(), user.password.trim());
        if (!isMatch) return { error: "Invalid credentials!" };

        const cookieStore = await cookies();
        cookieStore.set('user_id', user.id, { httpOnly: true, path: '/' });

        // Don't redirect here! Just return the success.
        return { success: true, role: user.role };

    } catch (err) {
        // Log the actual error to your VS Code terminal so we can see it
        console.error("LOGIN ERROR:", err); 
        return { error: "Something went wrong." };
    }
};

export const getSessionUser = async () => {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;
        
        if (!userId) return null;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
};

export const logout = async () => {
    const cookieStore = await cookies();
    // Delete the session cookie
    cookieStore.delete('user_id');
    // Redirect to login page
    redirect("/login");
};

export const updatePassword = async (prevState, formData) => {
  const { currentPassword, newPassword, confirmPassword } = Object.fromEntries(formData);

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match!" };
  }

  const user = await getSessionUser();
  if (!user) return { error: "User not authenticated!" };

  // 1. Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return { error: "Current password is incorrect!" };

  // 2. Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // 3. Update Database
  const { error } = await supabase
    .from("users")
    .update({ password: hashedNewPassword })
    .eq("id", user.id);

  if (error) return { error: "Failed to update password." };

  return { success: "Password updated successfully!" };
};

export const getSubjectPerformance = async () => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        subjectname,
        intendedgradelevel,
        classes (
          grades (
            finalgrade
          )
        )
      `);

    if (error) throw error;

    const result = data.map(subject => {
      // Flatten all grades for this specific subject
      const allGrades = subject.classes.flatMap(c => 
        c.grades.map(g => parseFloat(g.finalgrade))
      ).filter(val => !isNaN(val));
      
      const total = allGrades.reduce((sum, val) => sum + val, 0);
      const avg = allGrades.length > 0 ? Math.round(total / allGrades.length) : 0;

      return {
        name: subject.subjectname,
        level: subject.intendedgradelevel, // Matches your Chart's item.level
        score: avg,
        full: 100
      };
    });

    console.log("Total processed items:", result.length); // Should say 36
    return result;
  } catch (error) {
    console.error('Fetch Error:', error);
    return [];
  }
};

export const fetchSubjectsWithStats = async (gradeLevel = 7, query = "") => {
  try {
    // 1. Build the initial query for subjects
    let supabaseQuery = supabase
      .from('subjects')
      .select('*')
      .eq('intendedgradelevel', gradeLevel);

    // 2. Add search filter if query exists
    if (query) {
      supabaseQuery = supabaseQuery.ilike('subjectname', `%${query}%`);
    }

    const { data: subjects, error } = await supabaseQuery;
    if (error) throw error;
    if (!subjects) return [];

    // 3. RE-ADD THIS SECTION: Map through subjects to get Classes, Teachers, and Students
    const subjectsWithStats = await Promise.all(subjects.map(async (subject) => {
      
      // Count Classes
      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('subjectcode', subject.subjectcode);

      // Get Teacher and Section data for this subject
      const { data: classData } = await supabase
        .from('classes')
        .select('teacherid, sectionid')
        .eq('subjectcode', subject.subjectcode);
      
      const uniqueTeachers = classData ? new Set(classData.map(t => t.teacherid)).size : 0;
      const sectionIds = classData?.map(c => c.sectionid).filter(id => id != null) || [];

      // Count Students in those sections
      let studentCount = 0;
      if (sectionIds.length > 0) {
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in('sectionid', sectionIds);
        studentCount = count || 0;
      }

      return {
        ...subject,
        stats: {
          totalClasses: classCount || 0,
          totalTeachers: uniqueTeachers,
          totalStudents: studentCount
        }
      };
    }));

    // Now subjectsWithStats is defined and can be returned
    return subjectsWithStats;

  } catch (err) {
    console.error("Database Error:", err);
    return [];
  }
};

export const fetchStudentRecords = async ({ query, grade, section, status, sy }) => {
  try {
    // 1. Start the base query
    let request = supabase
      .from('enrollments')
      .select(`
        enrollmentid,
        lrn,
        gradelevel,
        status,
        students!inner (lastname, firstname),
        sections (sectionname),
        schoolyears!inner (yearrange)
      `);

    // 2. Apply Filters (Only if they have values)
    if (grade) {
      request = request.eq('gradelevel', parseInt(grade));
    }
    
    if (status) {
      request = request.eq('status', status);
    }

    if (sy) {
      // This filters the joined schoolyears table
      request = request.eq('schoolyears.yearrange', sy);
    }

    if (section) {
      // If 'section' is the sectionname (string), use this:
      request = request.eq('sections.sectionname', section);
    }

    if (query) {
      request = request.or(
        `lrn.ilike.%${query}%,lastname.ilike.%${query}%,firstname.ilike.%${query}%`,
      { foreignTable: 'students'});
    }

    // 3. Set a high limit and execute
    const { data, error } = await request.limit(2000);

    if (error) {
      console.error("Supabase Query Error Details:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("fetchStudentRecords Catch Error:", error);
    return [];
  }
}

export const fetchFilterOptions = async () => {
  const { data: sections } = await supabase.from('sections').select('sectionname, gradelevel');
  const { data: schoolYears } = await supabase.from('schoolyears').select('yearrange');
  return { sections: sections || [], schoolYears: schoolYears || [] };
};

export async function fetchStudentFullProfile(lrn) {
  try {
    const { data, error } = await supabase
      .from('students') // Start with students
      .select(`
        lrn,
        lastname,
        firstname,
        middleinitial,
        birthday,
        address,
        enrollments (
          gradelevel,
          sections (sectionname),
          grades (
            gradeid,
            quarter,
            finalgrade,
            remarks,
            classes (
              classid,
              subjectcode,
              q1_status, q2_status, q3_status, q4_status,
              subjects (subjectname, subjectcode)
            )
          )
        )
      `)
      .eq('lrn', lrn)
      .single();

    if (error) throw error;

    return {
      ...data,
      // Map the nested enrollment data to match your Page JSX
      sections: data.enrollments?.[0]?.sections || null,
      grades: data.enrollments?.[0]?.grades || []
    };
  } catch (error) {
    console.error("Fetcher Error:", error);
    return null;
  }
}

export const fetchClasses = async (grade) => {
  try {
    let query = supabase
      .from('sections')
      .select(`
        sectionid,
        sectionname,
        gradelevel,
        status,
        adviser:teachers!adviserid (firstname, lastname),
        enrollments(count)
      `);

    if (grade) {
      query = query.eq('gradelevel', parseInt(grade));
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching classes:", err);
    return [];
  }
};

export const fetchSectionDetails = async (sectionId) => {
  try {
    // 1. Get Section and Adviser Info
    const { data: section, error: secError } = await supabase
      .from('sections')
      .select(`
        sectionname,
        gradelevel,
        adviser:teachers!adviserid (firstname, lastname)
      `)
      .eq('sectionid', sectionId)
      .single();

    if (secError) throw secError;

    // 2. Get Students in this section via Enrollments
    const { data: students, error: studError } = await supabase
      .from('enrollments')
      .select(`
        lrn,
        status,
        students (firstname, lastname, middleinitial, email)
      `)
      .eq('sectionid', sectionId);

    if (studError) throw studError;

    return { section, students };
  } catch (err) {
    console.error("Error fetching section details:", err);
    return null;
  }
};

export const fetchReportData = async (sy_id, quarterNum) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      lrn,
      students (firstname, lastname),
      sections (sectionname),
      grades!inner (finalgrade, quarter),
      attendance (dayspresent, totalschooldays)
    `)
    .eq('sy_id', sy_id)
    .eq('grades.quarter', quarterNum);

  if (error) throw error;

  return data.map(item => {
    // 1. Calculate Attendance Rate
    const att = item.attendance || [];
    const totalPresent = att.reduce((sum, r) => sum + (r.dayspresent || 0), 0);
    const totalDays = att.reduce((sum, r) => sum + (r.totalschooldays || 0), 0);
    const rate = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

    // 2. Flatten result
    return {
      lrn: item.lrn,
      studentName: `${item.students?.lastname?.toUpperCase()}, ${item.students?.firstname}`,
      section: item.sections?.sectionname,
      final_grade: item.grades[0]?.finalgrade || 0,
      attendance_rate: Math.round(rate)
    };
  });
};

export const getTeacherDashboardStatsByEmail = async (email) => {
  try {
    if (!email) return [];

    // 1. Get Teacher ID (using 'firstname' and 'lastname' per schema)
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('teacherid')
      .eq('email', email)
      .maybeSingle();

    if (teacherError || !teacher) {
      console.warn("Teacher record not found for:", email);
      return [];
    }

    // 2. Get Classes with Joins
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select(`
        classid,
        subjectcode,
        sectionid,
        subjects (subjectname),
        sections (sectionname, gradelevel)
      `)
      .eq('teacherid', teacher.teacherid);

    if (classError) throw classError;
    if (!classes) return [];

    // 3. Fetch counts for each class
    const classStats = await Promise.all(
      classes.map(async (cls) => {
        // Count students in this section
        const { count: studentCount } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('sectionid', cls.sectionid);

        // Count pending grades (finalgrade is NULL)
        const { count: pendingCount } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .eq('classid', cls.classid)
          .is('finalgrade', null);

        let status = 'completed';
        if (!studentCount || studentCount === 0) status = 'notstarted';
        else if (pendingCount > 0) status = 'pending';

        return {
          classid: cls.classid,
          subject: cls.subjects?.subjectname || cls.subjectcode || 'Unknown',
          section: cls.sections 
            ? `G${cls.sections.gradelevel} - ${cls.sections.sectionname}` 
            : 'No Section',
          students: studentCount || 0,
          pending: pendingCount || 0,
          status: status
        };
      })
    );

    return classStats;
  } catch (err) {
    console.error("Dashboard Data Fetch Error:", err.message);
    return [];
  }
};

export const registerUser = async (prevState, formData) => {
  const { firstName, lastName, email, phone, password, role } = Object.fromEntries(formData);

  try {
    // 1. Security check: Only an active registrar can do this
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'registrar') {
      return { error: "Unauthorized: Only registrars can create accounts." };
    }

    // 2. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', email)
      .maybeSingle();

    if (existingUser) return { error: "A user with this email/username already exists." };

    // 3. Hash password using bcrypt (matching your login logic)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert into the 'users' table
    const { error } = await supabase
      .from('users')
      .insert([{
        username: email, // Assuming email is the username for login
        password: hashedPassword,
        role: role,
        first_name: firstName, // Ensure these column names match your DB exactly
        last_name: lastName,
        phone: phone,
        email: email
      }]);

    if (error) throw error;

    // Success! 
    // We don't use redirect() inside a try/catch block usually, 
    // but Next.js handles it if called at the end.
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);
    return { error: "Database error: Could not create user." };
  }

  redirect("/dashboard"); 
};

export const fetchGradeEntryData = async (classid, quarter) => {
  const cleanId = parseInt(classid);
  if (isNaN(cleanId)) return [];

  try {
    // 1. Get the section linked to this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('sectionid')
      .eq('classid', cleanId)
      .single();

    if (classError || !classData) return [];

    // 2. Get students via enrollments
    const { data: enrolledStudents, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        enrollmentid,
        lrn,
        students (firstname, lastname)
      `)
      .eq('sectionid', classData.sectionid);

    if (enrollError) throw enrollError;

    // 3. Get existing grades
    const { data: existingGrades } = await supabase
      .from('grades')
      .select('*')
      .eq('classid', cleanId)
      .eq('quarter', quarter);

    // 4. Merge and RE-CALCULATE (to ensure matching logic)
    return (enrolledStudents || []).map(enrollment => {
      const studentGrade = existingGrades?.find(g => g.enrollmentid === enrollment.enrollmentid);
      
      // Pull raw values
      const ww = parseFloat(studentGrade?.writtenwork) || 0;
      const pt = parseFloat(studentGrade?.performancetask) || 0;
      
      // RE-APPLY THE 40/60 FORMULA (Matches GradeEntryClient.jsx)
      const calculatedFinal = (ww * 0.4) + (pt * 0.6);

      return {
        gradeid: studentGrade?.gradeid || `temp-${enrollment.enrollmentid}`, 
        enrollmentid: enrollment.enrollmentid,
        lrn: enrollment.lrn?.trim(), // trim to handle 'character' type padding
        studentName: enrollment.students 
          ? `${enrollment.students.lastname}, ${enrollment.students.firstname}`
          : "Unknown Student",
        writtenwork: ww,
        performancetask: pt,
        finalgrade: calculatedFinal, // Use calculated value for consistency
        remarks: calculatedFinal >= 75 ? "PASSED" : "FAILED",
        classid: cleanId,
        quarter: parseInt(quarter)
      };
    }).sort((a, b) => a.studentName.localeCompare(b.studentName)); // Keep sorting consistent
  } catch (error) {
    console.error("fetchGradeEntryData error:", error);
    return [];
  }
};


export const saveGradesToDb = async (students) => {
  try {
    if (!students || students.length === 0) return { success: true };

    // --- 1. SERVER-SIDE LOCK VERIFICATION ---
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError) throw new Error("Could not verify system configuration.");

    // Check Global Manual Lock
    if (!config.is_editing_enabled) {
      throw new Error("Grade editing is currently disabled by the Registrar.");
    }

    // Check Quarter Deadline (using the quarter of the first student in the batch)
    const activeQuarter = students[0].quarter;
    const today = new Date();
    const deadlineStr = config[`q${activeQuarter}_deadline`];
    
    if (deadlineStr) {
      const deadline = new Date(deadlineStr);
      // Set deadline to the end of the day (23:59:59) for fairness
      deadline.setHours(23, 59, 59, 999);

      if (today > deadline) {
        throw new Error(`The deadline for Quarter ${activeQuarter} has passed.`);
      }
    }
    // --- END LOCK VERIFICATION ---

    const updates = students.map((s) => {
      const payload = {
        enrollmentid: s.enrollmentid,
        classid: parseInt(s.classid),
        quarter: parseInt(s.quarter),
        writtenwork: parseFloat(s.writtenwork) || 0,
        performancetask: parseFloat(s.performancetask) || 0,
        finalgrade: parseFloat(s.finalgrade) || 0,
        remarks: s.remarks || "PENDING",
      };

      if (typeof s.gradeid === 'number') {
        payload.gradeid = s.gradeid;
      }

      return payload;
    });

    const { error } = await supabase
      .from("grades")
      .upsert(updates, { 
        onConflict: 'enrollmentid,classid,quarter' 
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("saveGradesToDb error:", error.message);
    return { success: false, error: error.message };
  }
};

export const fetchMyClasses = async (userEmail) => {
  try {
    // 1. Get the numeric teacherid
    const { data: teacherProfile } = await supabase
      .from('teachers')
      .select('teacherid')
      .eq('email', userEmail)
      .single();

    if (!teacherProfile) return { advisory: null, subjectClasses: [] };
    const tId = teacherProfile.teacherid;

    // 2. Fetch the Advisory Section (A section where this teacher is the adviser)
    const { data: advisoryData } = await supabase
      .from('sections')
      .select('sectionid, sectionname, gradelevel, adviserid')
      .eq('adviserid', tId)
      .single();

    // 3. Fetch Subject Classes (Classes this teacher teaches)
    const { data: subjectClasses } = await supabase
      .from('classes')
      .select(`
        classid,
        schedule,
        subjects (subjectname),
        sections (sectionid, sectionname, gradelevel)
      `)
      .eq('teacherid', tId);

    // 4. Get student counts for all relevant sections
    const allSectionIds = [
      ...(advisoryData ? [advisoryData.sectionid] : []),
      ...(subjectClasses?.map(c => c.sections.sectionid) || [])
    ];

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('sectionid')
      .in('sectionid', allSectionIds);

    const getCount = (sid) => enrollments?.filter(e => e.sectionid === sid).length || 0;

    return {
      advisory: advisoryData ? {
        id: advisoryData.sectionid,
        sectionName: advisoryData.sectionname,
        gradeLevel: advisoryData.gradelevel,
        studentCount: getCount(advisoryData.sectionid),
        type: 'advisory'
      } : null,
      subjectClasses: (subjectClasses || []).map(cls => ({
        id: cls.classid,
        subject: cls.subjects?.subjectname,
        section: cls.sections?.sectionname,
        gradeLevel: cls.sections?.gradelevel,
        schedule: cls.schedule,
        studentCount: getCount(cls.sections.sectionid),
        type: 'subject'
      }))
    };
  } catch (error) {
    console.error(error);
    return { advisory: null, subjectClasses: [] };
  }
};

export const fetchClassReport = async (classId, quarter) => {
  try {
    const { data: grades, error } = await supabase
      .from('grades')
      .select(`
        finalgrade,
        remarks,
        writtenwork,
        performancetask,
        enrollmentid,
        enrollments (
          lrn,
          students (firstname, lastname)
        )
      `)
      .eq('classid', classId)
      .eq('quarter', quarter);

    if (error) throw error;

    // 1. Calculate Average
    const validGrades = grades.filter(g => g.finalgrade > 0);
    const average = validGrades.length > 0 
      ? (validGrades.reduce((acc, curr) => acc + Number(curr.finalgrade), 0) / validGrades.length).toFixed(1)
      : 0;

    // 2. Calculate Passing Rate
    const passingCount = grades.filter(g => g.remarks?.toUpperCase() === 'PASSED').length;
    const passingRate = grades.length > 0 
      ? ((passingCount / grades.length) * 100).toFixed(1)
      : 0;

    // 3. Grade Distribution
    const distribution = [
      { label: "Below 75", count: grades.filter(g => g.finalgrade < 75).length },
      { label: "75-79", count: grades.filter(g => g.finalgrade >= 75 && g.finalgrade <= 79).length },
      { label: "80-84", count: grades.filter(g => g.finalgrade >= 80 && g.finalgrade <= 84).length },
      { label: "85-89", count: grades.filter(g => g.finalgrade >= 85 && g.finalgrade <= 89).length },
      { label: "90-95", count: grades.filter(g => g.finalgrade >= 90 && g.finalgrade <= 95).length },
      { label: "96-100", count: grades.filter(g => g.finalgrade >= 96).length },
    ];

    return {
      stats: { average, passingRate, totalStudents: grades.length },
      distribution: distribution.map(d => ({
        ...d,
        // Calculate height percentage for the CSS bars
        height: grades.length > 0 ? `${(d.count / grades.length) * 200}px` : "10px"
      })),
      students: grades
        .sort((a, b) => b.finalgrade - a.finalgrade) // Rank by grade
        .map((g, index) => ({
          rank: index + 1,
          lrn: g.enrollments?.lrn,
          name: `${g.enrollments?.students?.lastname}, ${g.enrollments?.students?.firstname}`,
          ww: g.writtenwork,
          pt: g.performancetask,
          final: g.finalgrade,
          remarks: g.remarks
        }))
    };
  } catch (error) {
    console.error("Report Error:", error);
    return null;
  }
};

// Fetch teacher profile
export const fetchTeacherProfile = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('teacherid', teacherId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

// Update teacher profile
export const updateTeacherProfile = async (teacherId, updates) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('teacherid', teacherId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error };
  }
};

export async function fetchTeacherProfileByEmail(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email.trim()) // use .eq for an exact match since we verified the length
    .maybeSingle();

  if (error) {
    console.error("Database Error:", error.message);
    return null;
  }
  return data;
}

export const fetchAllAssignments = async () => {
  try {
    // 1. Fetch the classes with joined names
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        classid,
        subjectcode,
        teacherid,
        sectionid,
        subjects (subjectname),
        teachers (firstname, lastname),
        sections (sectionname)
      `);

    if (error) throw error;

    // 2. Fetch enrollment counts for each section
    // We get all enrollments and count them per sectionid
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('sectionid');

    // Helper to count occurrences of sectionid
    const studentCounts = enrollments?.reduce((acc, curr) => {
      acc[curr.sectionid] = (acc[curr.sectionid] || 0) + 1;
      return acc;
    }, {}) || {};

    // 3. Map the final data
    return classes.map(item => ({
      id: item.classid,
      teacherid: item.teacherid,
      sectionid: item.sectionid, 
      teacher: `${item.teachers?.firstname || ''} ${item.teachers?.lastname || ''}`,
      subject: item.subjects?.subjectname || item.subjectcode,
      section: item.sections?.sectionname || 'Unassigned',
      students: studentCounts[item.sectionid] || 0, // Injects real student count
      status: 'Assigned'
    }));
  } catch (err) {
    console.error('Error fetching assignments:', err);
    return [];
  }
};

// Function for the "Remove" button
export const deleteAssignment = async (id) => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('classid', id);
    return { error };
  } catch (err) {
    return { error: err };
  }
};

// Fetch Teachers from the 'teachers' table
export const fetchTeacherList = async () => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('teacherid, firstname, lastname'); // No underscores here per your schema

    if (error) throw error;
    console.log("Supabase Raw Data:", data); 
    return data || [];
  } catch (error) {
    console.error('Fetch Error:', error);
    return [];
  }
};

// Fetch Subjects from the 'subjects' table
export const fetchSubjectList = async () => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('subjectcode, subjectname');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

// Fetch Sections for the dropdown
export const fetchSectionList = async () => {
    const { data } = await supabase.from('sections').select('sectionid, sectionname');
    return data || [];
};

// Fetch counts for the Dashboard cards
export const fetchDashboardStats = async () => {
  try {
    const [teachersCount, subjectsCount, classesCount] = await Promise.all([
      // 1. Count from the 'teachers' table (not users)
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      
      // 2. Count from the 'subjects' table
      supabase.from('subjects').select('*', { count: 'exact', head: true }),
      
      // 3. Count from the 'classes' table
      supabase.from('classes').select('*', { count: 'exact', head: true }),
    ]);

    return {
      teachers: teachersCount.count || 0,
      subjects: subjectsCount.count || 0,
      pending: classesCount.count || 0, // Counting active assignments
      sections: 12 // Or fetch from sections table
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { teachers: 0, subjects: 0, pending: 0, sections: 0 };
  }
};

export const fetchGradeSummary = async () => {
  try {
    // 1. Fetch grades joined with class and subject info
    const { data, error } = await supabase
      .from('grades')
      .select(`
        finalgrade,
        remarks,
        classes (
          subjectcode,
          subjects (subjectname),
          sections (sectionname)
        )
      `);

    if (error) throw error;

    // 2. Group by class to calculate averages
    const summary = data.reduce((acc, curr) => {
      const className = `${curr.classes.subjects.subjectname} - ${curr.classes.sections.sectionname}`;
      if (!acc[className]) {
        acc[className] = { name: className, total: 0, count: 0, passing: 0 };
      }
      acc[className].total += curr.finalgrade || 0;
      acc[className].count += 1;
      if (curr.remarks === 'Passed') acc[className].passing += 1;
      return acc;
    }, {});

    return Object.values(summary).map(c => ({
      className: c.name,
      averageGrade: (c.total / c.count).toFixed(2),
      passingRate: ((c.passing / c.count) * 100).toFixed(0) + '%',
      studentCount: c.count
    }));
  } catch (err) {
    console.error('Error fetching grade summary:', err);
    return [];
  }
};

export async function fetchSubmissionStatuses(quarter) {
  try {
    const statusCol = `q${quarter}_submission_status`;
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        classid,
        ${statusCol},
        teachers (firstname, lastname),
        subjects (subjectname),
        sections (sectionname)
      `);

    if (error) throw error;

    return data.map(item => ({
      teacher: `${item.teachers?.firstname} ${item.teachers?.lastname}`,
      subject: item.subjects?.subjectname,
      section: item.sections?.sectionname,
      status: item[statusCol] || 'notstarted', // This feeds your 'isSubmitted' logic
    }));
  } catch (error) {
    console.error('Fetch Error:', error.message);
    return [];
  }
}

export const fetchVerificationData = async (quarter) => {
  try {
    const subField = `q${quarter}_submission_status`; // Teacher's Column (e.g., q1_submission_status)
    const verField = `q${quarter}_status`;            // Key Teacher's Column (e.g., q1_status)
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        classid, 
        ${subField}, 
        ${verField}, 
        last_submitted, 
        subjects(subjectname), 
        sections(sectionname), 
        teachers(firstname, lastname)
      `);

    if (error) throw error;

    return data.map(item => {
      let currentStatus = 'notstarted';

      // PRIORITY 1: Check if the Key Teacher's column explicitly says 'resubmitted'
      if (item[verField] === 'resubmitted') {
        currentStatus = 'resubmitted'; 
      } 
      // PRIORITY 2: Check if already forwarded to Registrar
      else if (item[verField] === 'completed') {
        currentStatus = 'completed'; 
      } 
      // PRIORITY 3: Check if Key Teacher is currently in the middle of verifying
      else if (item[verField] === 'review') {
        currentStatus = 'review';    
      } 
      // PRIORITY 4: If none of the above, check if the teacher just forwarded it
      else if (item[subField] === 'forwarded') {
        currentStatus = 'submitted'; 
      }

      return {
        id: item.classid,
        name: `${item.teachers.lastname}, ${item.teachers.firstname}`,
        subject: item.subjects.subjectname,
        section: item.sections.sectionname,
        status: currentStatus, 
        date: item.last_submitted 
      };
    });
  } catch (err) {
    console.error("Fetcher Error:", err);
    return [];
  }
};

// Fetch the current global configuration
export const fetchSystemConfig = async () => {
  const { data, error } = await supabase
    .from('system_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error("Error fetching config:", error);
    return null;
  }
  return data;
};

export const fetchGradeDistribution = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('gradelevel');

    if (error) throw error;

    // Count occurrences of each grade level
    const counts = data.reduce((acc, curr) => {
      const level = `Grade ${curr.gradelevel}`;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    // Format for Recharts: [{ name: 'Grade 7', value: 10 }, ...]
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Error fetching distribution:', error);
    return [];
  }
};

export const fetchEnrollmentTrends = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        sy_id,
        schoolyears (
          yearrange
        )
      `);

    if (error) throw error;

    // Group by yearrange and count
    const trends = data.reduce((acc, curr) => {
      const year = curr.schoolyears?.yearrange || "Unknown";
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    // Format for Recharts
    return Object.keys(trends).map(year => ({
      year: year,
      Students: trends[year]
    })).sort((a, b) => a.year.localeCompare(b.year));
    
  } catch (error) {
    console.error('Error fetching enrollment trends:', error);
    return [];
  }
};

// 1. Attendance Rate: Based on dayspresent / totalschooldays
export const getAttendanceRate = async () => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('dayspresent, totalschooldays');

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const totalPresent = data.reduce((sum, row) => sum + (row.dayspresent || 0), 0);
    const totalPossible = data.reduce((sum, row) => sum + (row.totalschooldays || 0), 0);

    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  } catch (error) {
    console.error('Attendance Calculation Error:', error);
    return 0;
  }
};

// 2. Retention Rate: Based on 'enrollments' table status
export const getRetentionRate = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('status');

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    // Looking for 'Enrolled' based on your default value
    const active = data.filter(e => e.status === 'Enrolled').length;
    return Math.round((active / data.length) * 100);
  } catch (error) {
    console.error('Retention Calculation Error:', error);
    return 0;
  }
};

// 3. Graduation Rate: Looking for 'Graduated' status in enrollments
export const getGraduationRate = async () => {
  try {
    // We check the highest grade level (assuming 10 or 12)
    const { data, error } = await supabase
      .from('enrollments')
      .select('status')
      .eq('gradelevel', 10); // Adjust this number if your seniors are Grade 12

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const graduated = data.filter(e => e.status === 'Graduated').length;
    return Math.round((graduated / data.length) * 100);
  } catch (error) {
    console.error('Graduation Calculation Error:', error);
    return 0;
  }
};

export const getTotalCounts = async () => {
  try {
    // Get Student Count
    const { count: studentCount, error: studentError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (studentError) throw studentError;

    // Get Teacher Count
    const { count: teacherCount, error: teacherError } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true });

    if (teacherError) throw teacherError;

    return {
      students: studentCount || 0,
      teachers: teacherCount || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard counts:', error);
    // Return zeros so the dashboard doesn't crash if the query fails
    return { students: 0, teachers: 0 };
  }
};

export async function updateClassSubmissionStatus(classid, quarter, status) {
  try {
    const subColumn = `q${quarter}_submission_status`; // Teacher's column
    const verColumn = `q${quarter}_status`;            // Key Teacher's column

    // 1. Fetch current verification status
    const { data: currentStatus } = await supabase
      .from('classes')
      .select(verColumn)
      .eq('classid', classid)
      .single();

    let verificationUpdate = {};

    // 2. Logic: If it was ALREADY completed, change it to 'resubmitted'
    // This forces the Key Teacher to see a "Red" status.
    if (currentStatus && currentStatus[verColumn] === 'completed') {
      verificationUpdate = { [verColumn]: 'resubmitted' };
    }

    // 3. Update database
    const { error } = await supabase
      .from('classes')
      .update({ 
        [subColumn]: status, // 'forwarded'
        ...verificationUpdate, 
        last_submitted: new Date().toISOString() 
      })
      .eq('classid', classid);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function unlockClassSubmission(classId, quarter) {
  try {
    const user = await getSessionUser();
    const adminName = user 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username 
      : "Unknown Admin";

    const statusColumn = `q${quarter}_status`;
    
    const { error } = await supabase
      .from('classes')
      .update({ [statusColumn]: 'submitted' }) // Revert 'completed' to 'submitted'
      .eq('classid', classId);

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      action: 'MANUAL_UNLOCK',
      performed_by_name: adminName,
      target_id: classId.toString(),
      details: `Reopened Q${quarter} for Class ID: ${classId}`
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function fetchAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
  return data;
}

// Custom log function (Reusable for other parts of the app)
export async function createAuditLog(action, details, targetId = null) {
  const user = await getSessionUser(); // Using your existing function
  
  // Format the name from your 'users' table columns
  const adminName = user 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username 
    : "System Admin";

  const { error } = await supabase.from('audit_logs').insert({
    action,
    performed_by_name: adminName,
    details,
    target_id: targetId?.toString()
  });
  
  if (error) console.error("Log failed:", error);
}

// Updated Update function
export async function updateSystemConfig(config) {
  try {
    const { error } = await supabase
      .from('system_config')
      .update({
        active_sy: config.active_sy,
        q1_deadline: config.q1_deadline,
        q2_deadline: config.q2_deadline,
        q3_deadline: config.q3_deadline,
        q4_deadline: config.q4_deadline,
        is_editing_enabled: config.is_editing_enabled
      })
      .eq('id', 1);

    if (error) throw error;

    // Call the smart log function
    await createAuditLog(
      'CONFIG_UPDATE', 
      `SY: ${config.active_sy}, Lock: ${config.is_editing_enabled}`
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function clearAuditLogs() {
  try {
    const user = await getSessionUser();
    const adminName = user 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username 
      : "System Admin";

    // Delete all logs
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', 0); // Standard way to target all rows

    if (error) throw error;

    // Immediately create a new entry recording the wipe
    await supabase.from('audit_logs').insert({
      action: 'LOGS_CLEARED',
      performed_by_name: adminName,
      details: `The audit log history was manually cleared.`
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export const fetchAdvisoryStudents = async (sectionId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        students (firstname, lastname)
      `)
      .eq('sectionid', sectionId)
      .eq('status', 'Enrolled');

    if (error) throw error;

    return data.map(item => 
      `${item.students.lastname.toUpperCase()}, ${item.students.firstname}`
    ).sort();
  } catch (error) {
    console.error("Error fetching advisory students:", error);
    return [];
  }
};

// 2. Fetch Students for a specific Subject Class
export const fetchClassStudents = async (classId) => {
  try {
    // First, find which section this class belongs to
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('sectionid')
      .eq('classid', classId)
      .single();

    if (classError) throw classError;

    // Then get students from that section
    return await fetchAdvisoryStudents(classData.sectionid);
  } catch (error) {
    console.error("Error fetching class students:", error);
    return [];
  }
};

// 1. Fetch only the classes assigned to the teacher for the Attendance Picker
export const fetchAttendanceEntryData = async (classId, month) => {
  try {
    // 1. Get the section ID first
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select('sectionid')
      .eq('classid', parseInt(classId)) // Ensure it's an integer
      .single();

    if (classError || !classInfo) throw new Error("Class not found");

    // 2. Get students and their specific monthly attendance
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        enrollmentid,
        students (lrn, lastname, firstname),
        attendance (attendanceid, month, dayspresent, totalschooldays)
      `)
      .eq('sectionid', classInfo.sectionid);

    if (enrollError) throw enrollError;

    // 3. Map the data to a flat structure for the table
    return enrollments.map(e => {
      const att = e.attendance?.find(a => a.month === month);
      return {
        enrollmentid: e.enrollmentid,
        lrn: e.students?.lrn || "N/A",
        studentName: `${e.students?.lastname || ""}, ${e.students?.firstname || ""}`,
        dayspresent: att?.dayspresent || 0,
        totalschooldays: att?.totalschooldays || 20,
        attendanceid: att?.attendanceid || null
      };
    });
  } catch (error) {
    console.error("fetchAttendanceEntryData Error:", error);
    return [];
  }
};

export async function saveDailyAttendance(records) {
  try {
    const updatePromises = records.map((rec) => {
      return supabase
        .from('attendance') // Table name from your schema
        .update({ dayspresent: rec.newTotal })
        .eq('enrollmentid', parseInt(rec.enrollmentid)) // Ensure it's an integer
        .eq('month', rec.month);
    });

    const results = await Promise.all(updatePromises);
    
    // Check if any specific update failed
    const errorResult = results.find(r => r.error);
    if (errorResult) throw errorResult.error;

    return { success: true };
  } catch (error) {
    console.error('Save Error:', error);
    throw new Error(error.message || 'Failed to update attendance values.');
  }
}

export async function fetchAttendanceLogsByDate(classid, date) {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('enrollmentid, status')
    .eq('classid', classid)
    .eq('attendance_date', date);
    
  if (error) return [];
  return data;
}

export async function saveDailyAttendanceLogs(payload) {
  // .upsert will update the status if the record exists, or create a new one if not
  const { error } = await supabase
    .from('attendance_logs')
    .upsert(payload, { onConflict: 'attendance_date, enrollmentid' });
    
  if (error) throw error;
}