'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  LoaderCircle,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Schema for password reset
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type ResetPasswordStep = 'reset' | 'success' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<ResetPasswordStep>('reset');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form instance
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Get token from URL on component mount
  useEffect(() => {
    const urlToken = searchParams.get('token');

    if (!urlToken) {
      setTokenError('Invalid or missing reset token');
      setCurrentStep('error');
    } else {
      setToken(urlToken);
    }
  }, [searchParams]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle password reset submission
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);

    try {
      const { data: resetData, error } = await authClient.resetPassword({
        newPassword: data.password,
        token
      });

      if (error) {
        console.error('Password reset failed:', error);

        // Handle specific error cases
        if (
          error.message?.includes('expired') ||
          error.message?.includes('invalid')
        ) {
          setTokenError('Reset link has expired or is invalid');
          setCurrentStep('error');
          toast.error(
            'Reset link has expired or is invalid. Please request a new one.'
          );
        } else if (
          error.message?.includes('weak') ||
          error.message?.includes('password')
        ) {
          form.setError('password', {
            type: 'manual',
            message: 'Password does not meet requirements'
          });
          toast.error('Password does not meet requirements');
        } else {
          toast.error('Failed to reset password. Please try again.');
        }
      } else {
        // Success
        setCurrentStep('success');
        toast.success(
          'Password reset successful! You can now sign in with your new password.'
        );
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking token
  if (!token && !tokenError) {
    return (
      <div className='bg-background flex min-h-screen items-center justify-center p-4'>
        <div className='flex items-center gap-2'>
          <LoaderCircle className='h-6 w-6 animate-spin' />
          <span>Validating reset link...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {currentStep === 'reset' && (
          <Card className='w-full'>
            <CardHeader className='space-y-2 text-center'>
              <CardTitle className='text-2xl'>Set New Password</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Enter your new password below
              </p>
            </CardHeader>

            <CardContent className='space-y-4'>
              <div className='mb-4 flex items-center gap-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => router.push('/auth/sign-in')}
                  className='h-auto p-0'
                >
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back to sign in
                </Button>
              </div>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <div>
                  <Label htmlFor='password'>New Password</Label>
                  <div className='relative mt-1'>
                    <Lock className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      {...form.register('password')}
                      className='pr-10 pl-10'
                      placeholder='Enter new password'
                      disabled={isLoading}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className='text-destructive mt-1 text-sm'>
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                  <div className='relative mt-1'>
                    <Lock className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                    <Input
                      id='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...form.register('confirmPassword')}
                      className='pr-10 pl-10'
                      placeholder='Confirm new password'
                      disabled={isLoading}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={toggleConfirmPasswordVisibility}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className='text-destructive mt-1 text-sm'>
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password requirements */}
                <div className='bg-muted/50 rounded-lg p-3'>
                  <p className='mb-2 text-sm font-medium'>
                    Password requirements:
                  </p>
                  <ul className='text-muted-foreground space-y-1 text-xs'>
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                  </ul>
                </div>

                <Button type='submit' disabled={isLoading} className='w-full'>
                  {isLoading ? (
                    <>
                      <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className='mr-2 h-4 w-4' />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === 'success' && (
          <Card className='w-full'>
            <CardHeader className='space-y-4 text-center'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                <CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>

              <div className='space-y-2'>
                <CardTitle className='text-2xl'>
                  Password Reset Complete
                </CardTitle>
                <p className='text-muted-foreground text-base'>
                  Your password has been successfully reset!
                </p>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              <div className='bg-muted/50 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400' />
                  <div className='space-y-2 text-sm'>
                    <p className='font-medium'>What&apos;s next:</p>
                    <ul className='text-muted-foreground space-y-1'>
                      <li>• You can now sign in with your new password</li>
                      <li>• Make sure to keep your password secure</li>
                      <li>• Consider using a password manager</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push('/auth/sign-in')}
                className='w-full'
              >
                Continue to Sign In
              </Button>

              <div className='text-center text-sm'>
                <Link
                  href='/dashboard'
                  className='hover:text-foreground underline underline-offset-4'
                >
                  Go to Dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'error' && (
          <Card className='w-full'>
            <CardHeader className='space-y-4 text-center'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                <AlertCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
              </div>

              <div className='space-y-2'>
                <CardTitle className='text-2xl'>Reset Link Invalid</CardTitle>
                <p className='text-muted-foreground text-base'>
                  {tokenError ||
                    'The password reset link is invalid or has expired.'}
                </p>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              <div className='bg-muted/50 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400' />
                  <div className='space-y-2 text-sm'>
                    <p className='font-medium'>This might happen because:</p>
                    <ul className='text-muted-foreground space-y-1'>
                      <li>
                        • The link has expired (links are valid for 24 hours)
                      </li>
                      <li>• The link has already been used</li>
                      <li>• The link was copied incorrectly</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <Button
                  onClick={() => router.push('/auth/forgot-password')}
                  className='w-full'
                >
                  Request New Reset Link
                </Button>

                <Button
                  variant='outline'
                  onClick={() => router.push('/auth/sign-in')}
                  className='w-full'
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
