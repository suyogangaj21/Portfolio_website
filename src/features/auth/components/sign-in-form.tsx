'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FcGoogle } from 'react-icons/fc';
import {
  Eye,
  EyeOff,
  Mail,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { ca } from 'zod/v4/locales';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';

  const LoginValidation = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  });

  const form = useForm<z.infer<typeof LoginValidation>>({
    resolver: zodResolver(LoginValidation),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle resend verification email
  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast.error('Maximum resend attempts reached. Please try again later.');
      return;
    }

    setIsResending(true);

    try {
      const response = await authClient.sendVerificationEmail({
        email: userEmail,
        callbackURL: '/dashboard'
      });

      if (response.error) {
        toast.error('Failed to resend verification email. Please try again.');
      } else {
        toast.success('Verification email sent successfully!');
        setResendCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Google sign in
  async function signInGoogle() {
    try {
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
        errorCallbackURL: '/error',
        newUserCallbackURL: '/'
      });
      console.log(res);
    } catch (error) {
      console.log(error);
      toast.error('Google sign-in failed. Please try again.');
    }
  }

  async function onSubmit(values: z.infer<typeof LoginValidation>) {
    setIsLoading(true);
    const { email, password } = values;

    try {
      const { data, error } = await authClient.signIn.email(
        {
          email,
          password
        },
        {
          onError: (ctx: any) => {
            // Check if error is due to unverified email
            if (ctx.error.status === 403) {
              // Show email verification screen
              setUserEmail(email);
              setEmailVerificationSent(true);
              toast.error('Please verify your email before signing in.');
              return;
            }

            // Handle other errors
            // alert(ctx.error.message);
          }
        }
      );

      if (error) {
        console.error('Authentication failed:', error);

        // Check if it's an email verification error
        if (
          error.message?.toLowerCase().includes('verify') ||
          error.message?.toLowerCase().includes('unverified')
        ) {
          setUserEmail(email);
          setEmailVerificationSent(true);
          toast.error('Please verify your email before signing in.');
          return;
        }

        // Handle other login errors
        form.setError('email', {
          type: 'manual',
          message: 'Invalid credentials'
        });
        form.setError('password', {
          type: 'manual',
          message: 'Invalid credentials'
        });
        toast.error('Invalid credentials');
      }

      if (data) {
        toast.success('Login Successful');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Network error:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Email Verification Required Component
  if (emailVerificationSent) {
    return (
      <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
        <Card className='w-full'>
          <CardHeader className='space-y-4 text-center'>
            {/* Email Icon */}
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
              <Mail className='h-8 w-8 text-blue-600 dark:text-blue-400' />
            </div>

            <div className='space-y-2'>
              <CardTitle className='text-2xl'>
                Email Verification Required
              </CardTitle>
              <CardDescription className='text-base'>
                Please verify your email address to continue
              </CardDescription>
              <p className='text-foreground font-medium'>{userEmail}</p>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Instructions */}
            <div className='bg-muted/50 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <CheckCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400' />
                <div className='space-y-2 text-sm'>
                  <p className='font-medium'>To sign in, you need to:</p>
                  <ol className='text-muted-foreground list-inside list-decimal space-y-1'>
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here and try signing in again</li>
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
                    Resend Verification Email
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
                  setEmailVerificationSent(false);
                  setUserEmail('');
                  setResendCount(0);
                }}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Sign In
              </Button>
            </div>

            {/* Alternative Actions */}
            <div className='border-t pt-4'>
              <p className='text-muted-foreground mb-3 text-center text-sm'>
                Need help?
              </p>
              <div className='flex flex-col gap-2 text-sm sm:flex-row'>
                <Link
                  href='/auth/sign-up'
                  className='hover:text-foreground flex-1 text-center underline underline-offset-4'
                >
                  Create new account
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

        {/* Footer */}
        <div className='w-full text-center text-sm'>
          <div className='flex w-full flex-wrap items-center justify-center gap-1'>
            <span>Still having trouble? </span>
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCount >= 3}
              className='hover:text-foreground underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Resend verification email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original Login Form
  return (
    <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
      <Card className='w-full'>
        <CardHeader className='space-y-2'>
          <CardTitle className='text-center text-2xl'>Login</CardTitle>
          <CardDescription className='text-center'>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your email'
                        type='email'
                        autoCapitalize='none'
                        autoComplete='email'
                        autoCorrect='off'
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='mb-1 flex items-center justify-between'>
                      <FormLabel>Password</FormLabel>
                      <Link
                        href={'/auth/forgot-password'}
                        className='text-sm underline'
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          placeholder='Enter your password'
                          type={showPassword ? 'text' : 'password'}
                          autoComplete='current-password'
                          disabled={isLoading}
                          {...field}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background text-muted-foreground px-2'>
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={signInGoogle}
                disabled={isLoading}
              >
                <FcGoogle className='mr-2 h-4 w-4' />
                Sign in with Google
              </Button>

              <div className='mt-4 text-center text-sm'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/auth/sign-up'
                  className='underline underline-offset-4'
                >
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className='w-full text-center text-sm'>
        <div className='mt-1 flex w-full flex-wrap items-center justify-center'>
          <span>By signing in, you agree to our </span>
          <Link
            href='/terms&conditions'
            target='_blank'
            className='mx-1 flex items-center gap-x-1 font-medium underline-offset-2 hover:underline'
          >
            <span>Terms of Service</span>
          </Link>
          <span>and </span>
          <Link
            href='/privacy-policy'
            target='_blank'
            className='mx-1 flex items-center gap-x-1 font-medium underline-offset-2 hover:underline'
          >
            <span>Privacy Policy</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
