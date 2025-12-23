'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Mail,
  LoaderCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

// Schema for email step
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

type ForgotPasswordStep = 'email' | 'email-sent';

interface ForgotPasswordProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function ForgotPassword({
  onBack,
  onSuccess
}: ForgotPasswordProps) {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  // Form instance for email step
  const emailForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  // Handle password reset request using Better Auth
  async function onForgotPassword(email: string) {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.forgetPassword({
        email,
        redirectTo: '/auth/reset-password' // URL where user will be redirected to reset password
      });

      if (error) {
        console.error('Password reset failed:', error);

        // Handle specific error cases
        if (
          error.message?.includes('not found') ||
          error.message?.includes('exist')
        ) {
          emailForm.setError('email', {
            type: 'manual',
            message: 'No account found with this email address'
          });
          toast.error('No account found with this email address.');
        } else {
          toast.error('Failed to send password reset email. Please try again.');
        }
      } else {
        // Success - show email sent step
        setResetEmail(email);
        setCurrentStep('email-sent');
        toast.success('Password reset link sent to your email!');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 1: Request reset email
  const onEmailSubmit = async (data: { email: string }) => {
    await onForgotPassword(data.email);
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast.error('Maximum resend attempts reached. Please try again later.');
      return;
    }

    setIsResending(true);

    try {
      const { data, error } = await authClient.forgetPassword({
        email: resetEmail,
        redirectTo: '/auth/reset-password'
      });

      if (error) {
        toast.error('Failed to resend reset email. Please try again.');
      } else {
        toast.success('Reset email sent successfully!');
        setResendCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend reset email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className='flex min-h-screen w-full items-center justify-center'>
      <div className='w-full max-w-md'>
        {currentStep === 'email' && (
          <Card className='w-full'>
            <CardHeader className='space-y-2 text-center'>
              <CardTitle className='text-2xl'>Reset Password</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Enter your email address and we&apos;ll send you a password
                reset link.
              </p>
            </CardHeader>

            <CardContent className='space-y-4'>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className='space-y-4'
              >
                <div>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    id='email'
                    type='email'
                    {...emailForm.register('email')}
                    className='mt-1'
                    placeholder='Enter your email address'
                    disabled={isLoading}
                  />
                  {emailForm.formState.errors.email && (
                    <p className='text-destructive mt-1 text-sm'>
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button type='submit' disabled={isLoading} className='w-full'>
                  {isLoading ? (
                    <>
                      <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className='mr-2 h-4 w-4' />
                      Send Reset Link
                    </>
                  )}
                </Button>
                <div className='mb-4 flex w-full items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => window.history.back()}
                    className='h-auto w-full p-2'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Back to login
                  </Button>
                </div>
              </form>

              <div className='text-center text-sm'>
                Remember your password?{' '}
                <Link
                  href='/auth/sign-in'
                  className='hover:text-foreground underline underline-offset-4'
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'email-sent' && (
          <Card className='w-full'>
            <CardHeader className='space-y-4 text-center'>
              {/* Email Icon */}
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
                <Mail className='h-8 w-8 text-blue-600 dark:text-blue-400' />
              </div>

              <div className='space-y-2'>
                <CardTitle className='text-2xl'>Check Your Email</CardTitle>
                <p className='text-muted-foreground text-base'>
                  We&apos;ve sent a password reset link to
                </p>
                <p className='text-foreground font-medium'>{resetEmail}</p>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Instructions */}
              <div className='bg-muted/50 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400' />
                  <div className='space-y-2 text-sm'>
                    <p className='font-medium'>Next steps:</p>
                    <ol className='text-muted-foreground list-inside list-decimal space-y-1'>
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the password reset link in the email</li>
                      <li>Follow the instructions to create a new password</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='space-y-3'>
                <Button
                  type='button'
                  variant='outline'
                  className='w-full'
                  onClick={handleResendEmail}
                  disabled={isResending || resendCount >= 3}
                >
                  {isResending ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className='mr-2 h-4 w-4' />
                      Resend Reset Link
                    </>
                  )}
                </Button>

                {resendCount > 0 && (
                  <p className='text-muted-foreground text-center text-xs'>
                    Email sent {resendCount} time{resendCount > 1 ? 's' : ''}
                    {resendCount >= 3 && ' (Maximum reached)'}
                  </p>
                )}

                <Button
                  type='button'
                  variant='ghost'
                  className='w-full'
                  onClick={() => {
                    setCurrentStep('email');
                    setResetEmail('');
                    setResendCount(0);
                  }}
                >
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Try Different Email
                </Button>
              </div>

              {/* Alternative Actions */}
              <div className='border-t pt-4'>
                <p className='text-muted-foreground mb-3 text-center text-sm'>
                  Having trouble?
                </p>
                <div className='flex flex-col gap-2 text-sm sm:flex-row'>
                  <Link
                    href='/auth/sign-in'
                    className='hover:text-foreground flex-1 text-center underline underline-offset-4'
                  >
                    Back to sign in
                  </Link>
                  <Link
                    href='/support'
                    className='hover:text-foreground flex-1 text-center underline underline-offset-4'
                  >
                    Contact support
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className='mt-6 w-full text-center text-sm'>
          <div className='flex w-full flex-wrap items-center justify-center gap-1'>
            <span>
              Didn&apos;t receive the email? Check your spam folder or{' '}
            </span>
            {currentStep === 'email-sent' && (
              <button
                onClick={handleResendEmail}
                disabled={isResending || resendCount >= 3}
                className='hover:text-foreground underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50'
              >
                try again
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
