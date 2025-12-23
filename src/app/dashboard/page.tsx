import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
  });
  if (!session?.user.id) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
