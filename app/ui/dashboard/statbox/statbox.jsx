import { MdPeople, MdSchool } from "react-icons/md";
import styles from "./statbox.module.css";

const StatBox = ({ type, count }) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconContainer}>
        {type === "Student" ? <MdSchool size={24} /> : <MdPeople size={24} />}
      </div>
      <div className={styles.texts}>
        <span className={styles.label}>{type}</span>
        <span className={styles.number}>{count}</span>
      </div>
    </div>
  );
};

export default StatBox;