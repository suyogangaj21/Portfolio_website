import { de } from 'zod/v4/locales';

//api call for sending email to backend it should take purpose,email ,url
export async function sendEmail({
  purpose,
  email,
  url
}: {
  purpose: string;
  email: string;
  url?: string;
}) {
  // Example API call to your backend to send an email according to the purpose
  switch (purpose) {
    case 'email-verification':
      // Call your backend API to send a verification email
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/email-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, url })
        }
      );
      break;
    case 'forgot-password':
      // Call your backend API to send a password reset email
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, url })
        }
      );
      break;
    case 'reset-password':
      // Call your backend API to send a password reset email
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, url })
        }
      );
      break;
    default:
      throw new Error('Invalid email purpose');
  }
}
