import styles from './navbar.module.css'
import Image from 'next/image';
import { getSessionUser } from '@/app/lib/data';

const Navbar = async () => {
  // Fetch real user data from the session cookie
  const user = await getSessionUser();

  // Fallback values in case user isn't found (though they should be if logged in)
  const displayName = user ? `${user.first_name} ${user.last_name}` : "Guest User";
  const displayRole = user?.role || "User";

  return (
    <div className={styles.container}>
      <div className={styles.title}>Don Jose Integrated High School</div>
      
      <div className={styles.user}>
        <Image 
          className={styles.userImage} 
          src='/noavatar.png' 
          alt='User Avatar' 
          width={30} 
          height={30}
        />
        <div className={styles.userDetail}>
          <span className={styles.username}>{displayName}</span>
          <span className={styles.userTitle}>
            {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Navbar