'use client';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import React from 'react';

const SignOutButton = () => {
  const router = useRouter();
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/auth/sign-in'); // redirect to login page
        }
      }
    });
  };
  return <div onClick={handleSignOut}>Sign Out</div>;
};

export default SignOutButton;
