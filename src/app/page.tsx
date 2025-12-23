import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
  });
  console.log('Session on the home page:', session?.session);

  if (!session?.user.id) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
