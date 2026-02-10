import { redirect } from 'next/navigation';

export default function Home() {
  // This sends the user immediately to your login page
  redirect('/login'); 
}