// This is the SERVER COMPONENT (The Parent)
import RegisterPage from "@/app/dashboard/register/register"; // Path to your client file
import { getSessionUser } from "@/app/lib/data";

const RegisterPageWrapper = async () => {
    // 1. Get the session securely on the server
    const user = await getSessionUser();
    
    // 2. Pass the role to the Client Component
    // If no user, we pass null
    const role = user?.role || null;

    return (
        <RegisterPage currentUserRole={role} />
    );
};

export default RegisterPageWrapper;