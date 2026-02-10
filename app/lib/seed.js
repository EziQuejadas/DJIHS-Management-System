"use server"
import bcrypt from "bcryptjs";
import { supabase } from "./utils";

export const seedUser = async () => {
  try {
    // Check if admin exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', 'admin')
      .single();

    if (existingUser) return { message: "Admin already exists!" };

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const { error } = await supabase
      .from('users')
      .insert([
        { username: 'admin', password: hashedPassword, role: 'Registrar' }
      ]);

    if (error) throw error;
    return { success: "Admin created! User: admin, Pass: admin123" };
  } catch (err) {
    console.error(err);
    return { error: "Failed to seed" };
  }
};