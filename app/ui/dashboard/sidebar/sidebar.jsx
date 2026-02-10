import styles from './sidebar.module.css'
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import { SiGoogleclassroom } from "react-icons/si";
import { TbReportAnalytics } from "react-icons/tb";
import { MdDashboard, MdOutlineSubject, MdLogout, } from "react-icons/md";
import MenuLink from './menuLink/menuLink';
import { getSessionUser, logout } from '@/app/lib/data'; // Import your session helper

const menuItems = [
  {
    title: "Pages",
    list: [
      // Registrar
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: <MdDashboard />,
        roles: ["registrar"] 
      },
      {
        title: "Subjects",
        path: "/dashboard/subjects",
        icon: <MdOutlineSubject />,
        roles: ["registrar"] // Only Registrar can manage subjects
      },
      {
        title: "Records",
        path: "/dashboard/records",
        icon: <HiOutlineClipboardDocumentList />,
        roles: ["registrar"] // Only Registrar handles official records
      },
      {
        title: "Classes",
        path: "/dashboard/classes",
        icon: <SiGoogleclassroom />,
        roles: ["registrar"] // Only Teachers see their specific classes
      },
      {
        title: "Class Report",
        path: "/dashboard/classreport",
        icon: <TbReportAnalytics />,
        roles: ["registrar"] 
      },
      {
        title: "Settings",
        path: "/dashboard/settings",
        icon: <IoSettingsOutline />,
        roles: ["registrar"]
      },
      // Subject Teacher
      {
        title: "Dashboard",
        path: "/dashboard/teacher",
        icon: <MdDashboard />,
        roles: ["subject teacher"] 
      },
      {
        title: "My Subjects",
        path: "/dashboard/teacher/subjects",
        icon: <MdOutlineSubject />,
        roles: ["subject teacher"]
      },
      {
        title: "Grade Entry",
        path: "/dashboard/teacher/gradeentry",
        icon: <HiOutlineClipboardDocumentList />,
        roles: ["subject teacher"]
      },
      {
        title: "Classes",
        path: "/dashboard/teacher/classes",
        icon: <SiGoogleclassroom />,
        roles: ["subject teacher"]
      },
      {
        title: "Class Reports",
        path: "/dashboard/teacher/classreports",
        icon: <TbReportAnalytics />,
        roles: ["subject teacher"] 
      },
      {
        title: "Settings",
        path: "/dashboard/teacher/settings",
        icon: <IoSettingsOutline />,
        roles: ["subject teacher"]
      },
      // Key Teacher
      {
        title: "Dashboard",
        path: "/dashboard/kteacher",
        icon: <MdDashboard />,
        roles: ["key teacher"] 
      },
      {
        title: "Assign Subjects",
        path: "/dashboard/kteacher/assignsubjects",
        icon: <MdOutlineSubject />,
        roles: ["key teacher"]
      },
      {
        title: "Submissions",
        path: "/dashboard/kteacher/submissions",
        icon: <HiOutlineClipboardDocumentList />,
        roles: ["key teacher"]
      },
      {
        title: "Reports",
        path: "/dashboard/kteacher/reports",
        icon: <SiGoogleclassroom />,
        roles: ["key teacher"]
      },
      {
        title: "Verification",
        path: "/dashboard/kteacher/verification",
        icon: <TbReportAnalytics />,
        roles: ["key teacher"] 
      },
      {
        title: "Settings",
        path: "/dashboard/kteacher/settings",
        icon: <IoSettingsOutline />,
        roles: ["key teacher"]
      },
    ] 
  }
]

const Sidebar = async () => {
  const user = await getSessionUser();
  const userRole = user?.role || "subject teacher";

  return (
    <div className={styles.container}>
      <div className={styles.user}>
      </div>
      <ul className={styles.list}>
        {menuItems.map((cat) => (
          <li key={cat.title}>
            {cat.list
              .filter(item => item.roles.includes(userRole)) // Filter based on role
              .map((item) => (
                <MenuLink item={item} key={item.title} />
            ))}
          </li>
        ))}
      </ul>
      <form action={logout}>
        <button className={styles.logout}>
        <MdLogout />
        Logout
        </button>
      </form>
    </div>
  )
}

export default Sidebar