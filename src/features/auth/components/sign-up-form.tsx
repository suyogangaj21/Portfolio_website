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
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FcGoogle } from 'react-icons/fc';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Add email verification states
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const SignUpValidation = z
    .object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string()
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    });

  const form = useForm<z.infer<typeof SignUpValidation>>({
    resolver: zodResolver(SignUpValidation),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast.error('Maximum resend attempts reached. Please try again later.');
      return;
    }

    setIsResending(true);

    try {
      // Call your resend verification email API
      const response = await authClient.sendVerificationEmail({
        email: userEmail,
        callbackURL: '/auth/verify-email'
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

  async function signUpGoogle() {
    try {
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
        errorCallbackURL: '/error'
      });
      console.log(res);
    } catch (error) {
      console.log(error);
      toast.error('Google sign-up failed. Please try again.');
    }
  }

  async function onSubmit(values: z.infer<typeof SignUpValidation>) {
    setIsLoading(true);
    const { firstName, lastName, email, password } = values;

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`,
        callbackURL: '/dashboard'
      });

      if (error) {
        console.error('Registration failed:', error);

        // Handle specific error types
        if (error.message?.includes('email')) {
          form.setError('email', {
            type: 'manual',
            message: 'This email is already registered'
          });
          toast.error('This email is already registered');
        } else {
          toast.error('Registration failed. Please try again.');
        }
      }

      if (data) {
        // Show email verification component instead of redirecting
        setUserEmail(email);
        setEmailSent(true);
        toast.success('Account created! Please check your email to verify.');
      }
    } catch (error: any) {
      console.error('Network error:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Email Verification Sent Component (inline)
  if (emailSent) {
    return (
      <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
        <Card className='w-full'>
          <CardHeader className='space-y-4 text-center'>
            {/* Email Icon */}
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
              <Mail className='h-8 w-8 text-green-600 dark:text-green-400' />
            </div>

            <div className='space-y-2'>
              <CardTitle className='text-2xl'>Check Your Email</CardTitle>
              <CardDescription className='text-base'>
                We&apos;ve sent a verification link to
              </CardDescription>
              <p className='text-foreground font-medium'>{userEmail}</p>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Instructions */}
            <div className='bg-muted/50 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <CheckCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400' />
                <div className='space-y-2 text-sm'>
                  <p className='font-medium'>Next steps:</p>
                  <ol className='text-muted-foreground list-inside list-decimal space-y-1'>
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>You&apos;ll be automatically signed in</li>
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
                  setEmailSent(false);
                  setUserEmail('');
                  setResendCount(0);
                }}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Sign Up
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
                  Try signing in instead
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
            <span>
              Didn&apos;t receive the email? Check your spam folder or{' '}
            </span>
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCount >= 3}
              className='hover:text-foreground underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50'
            >
              try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original Sign Up Form
  return (
    <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
      <Card className='w-full'>
        <CardHeader className='space-y-2'>
          <CardTitle className='text-center text-2xl'>Create Account</CardTitle>
          <CardDescription className='text-center'>
            Please fill in your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <User className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                          <Input
                            placeholder='John'
                            className='pl-10'
                            autoComplete='given-name'
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <User className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                          <Input
                            placeholder='Doe'
                            className='pl-10'
                            autoComplete='family-name'
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Mail className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                        <Input
                          placeholder='suyogangaj21@gmail.com'
                          type='email'
                          className='pl-10'
                          autoCapitalize='none'
                          autoComplete='email'
                          autoCorrect='off'
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Lock className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                        <Input
                          placeholder='Suyog@2132'
                          type={showPassword ? 'text' : 'password'}
                          className='pr-10 pl-10'
                          autoComplete='new-password'
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

              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Lock className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                        <Input
                          placeholder='••••••••'
                          type={showConfirmPassword ? 'text' : 'password'}
                          className='pr-10 pl-10'
                          autoComplete='new-password'
                          disabled={isLoading}
                          {...field}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Continue'}
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
                onClick={signUpGoogle}
                disabled={isLoading}
              >
                <FcGoogle className='mr-2 h-4 w-4' />
                Sign up with Google
              </Button>

              <div className='mt-4 text-center text-sm'>
                Already have an account?{' '}
                <Link
                  href='/auth/sign-in'
                  className='underline underline-offset-4'
                >
                  Sign in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className='w-full text-center text-sm'>
        <div className='mt-1 flex w-full flex-wrap items-center justify-center'>
          <span>By joining, you agree to our </span>
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
