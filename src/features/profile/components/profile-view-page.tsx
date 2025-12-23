'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Edit,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Mail,
  LoaderCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { jwt, z } from 'zod';
import { ProfileValidation } from '@/components/interface/formschema';
import ImageCropper from '@/components/photo-uploader';
import { authClient } from '@/lib/auth-client';
import { fetchUserRole } from '@/lib/utils/fetch-roles';

type FormData = z.infer<typeof ProfileValidation>;

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetTokenSchema = z.object({
  token: z.string().length(6, 'Reset code must be 6 digits')
});

const collegeSchema = z.object({
  collegeName: z.string().min(2, 'College name is required'),
  branch: z.string().min(2, 'Branch is required'),
  currentYear: z.string().min(1, 'Current year is required')
});

// Define separate interfaces for different data types
interface UserProfileData {
  email: string;
  phoneVerified: boolean;
  image?: string | undefined;
  name?: string | undefined;
  phone?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  linkedin?: string | undefined;
}

interface CollegeData {
  collegeName: string;
  branch: string;
  currentYear: string;
}

const Profile = () => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingCollege, setEditingCollege] = useState(false);
  const [passwordView, setPasswordView] = useState<
    'menu' | 'forgot' | 'verify-token' | 'new-password' | 'reset-success'
  >('menu');
  const [showCreditsSummary, setShowCreditsSummary] = useState(false);
  const [open, setOpen] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Separate states for different data types
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    linkedin: '',
    phoneVerified: false,
    image: ''
  });

  const [collegeData, setCollegeData] = useState<CollegeData>({
    collegeName: '',
    branch: '',
    currentYear: ''
  });

  const passwordSelectionRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: profileData
  });

  const collegeForm = useForm({
    resolver: zodResolver(collegeSchema),
    defaultValues: collegeData
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: session?.user?.email || ''
    }
  });

  const resetTokenForm = useForm({
    resolver: zodResolver(resetTokenSchema),
    defaultValues: {
      token: ''
    }
  });
  console.log('Session data:', session);

  // Add new password form schema
  const newPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters long'),
      confirmPassword: z.string()
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    });

  // Add new password form
  const newPasswordForm = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (session?.user) {
        try {
          // Fixed API endpoint - NEXT_PUBLIC_BACKEND_URL already contains /api
          let jwtToken;
          const { data, error } = await authClient.token();
          if (error) {
            // handle error
          }
          if (data) {
            jwtToken = data.token;
            // Use this token for authenticated requests to external services
          }
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile`,
            {
              headers: {
                Authorization: `Bearer ${jwtToken}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Update profile data state
            const newProfileData: UserProfileData = {
              name: data.name || session.user.name || '',
              email: data.email || session.user.email || '',
              phone: data.phone || '',
              city: data.city || '',
              state: data.state || '',
              linkedin: data.linkedin || '',
              phoneVerified: data.phoneVerified || false,
              image: data.image || session.user.image || ''
            };

            setProfileData(newProfileData);
            form.reset(newProfileData);

            // // Update college data state (no hardcoded values)
            // const newCollegeData: CollegeData = {
            //   collegeName: data.collegeName || '',
            //   branch: data.branch || '',
            //   currentYear: data.currentYear || ''
            // };
            // setCollegeData(newCollegeData);
            // collegeForm.reset(newCollegeData);
          }
        } catch (error) {
          console.error('Failed to fetch profile data:', error);
          // Fallback to session data
          const fallbackData: UserProfileData = {
            email: session.user.email || '',
            phone: '',
            city: '',
            state: '',
            linkedin: '',
            phoneVerified: false,
            image: session.user.image || ''
          };
          setProfileData(fallbackData);
          form.reset(fallbackData);

          // Set empty college data as fallback
          // const fallbackCollegeData: CollegeData = {
          //   collegeName: '',
          //   branch: '',
          //   currentYear: ''
          // };
          // setCollegeData(fallbackCollegeData);
          // collegeForm.reset(fallbackCollegeData);
        }
      }
    };

    fetchProfileData();
  }, [session]);

  const handleImageSaved = async (croppedImage: string) => {
    try {
      setLoading(true);

      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'profile-image.jpg', {
        type: 'image/jpeg'
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);

      // Fixed API endpoint
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/image`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session?.session.token}`
          },
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const result = await uploadResponse.json();
      const imageUrl = result?.imageUrl || result?.user?.image || '';

      // Update local profile data
      setProfileData((prev) => ({ ...prev, image: imageUrl }));

      // Update session
      await refetch();

      toast.success('Profile image updated successfully!');
      setShowImageCropper(false);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update profile image'
      );
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      // Fixed API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.session.token}`
          },
          body: JSON.stringify(values)
        }
      );

      if (!response.ok) throw new Error('Failed to update profile');

      // Update local profile data
      setProfileData(values);

      // Update session
      await refetch();

      toast.success('Profile updated successfully!');
      setEditingProfile(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (email: { email: string }) => {
    try {
      setLoading(true);
      // Step 1: Send reset code - Fixed API endpoint
      const response = await authClient.forgetPassword({
        email: email.email
      });
      setResetEmail(email.email);
      setPasswordView('verify-token');
      toast.success('Reset code sent to your email');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyTokenSubmit = async (data: { token: string }) => {
    try {
      setLoading(true);

      // Step 2: Verify OTP - Fixed API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/verify-reset-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: resetEmail,
            otp: data.token
          })
        }
      );

      if (!response.ok) throw new Error('Invalid reset code');

      // Store the verified OTP for the next step
      setResetEmail(JSON.stringify({ email: resetEmail, otp: data.token }));
      setPasswordView('new-password');
      resetTokenForm.reset();
      toast.success('Reset code verified! Please enter your new password.');
    } catch (error) {
      console.error(error);
      toast.error('Invalid or expired reset code');
    } finally {
      setLoading(false);
    }
  };

  // Add new password submit function
  const onNewPasswordSubmit = async (data: { newPassword: string }) => {
    try {
      setLoading(true);

      const resetData = JSON.parse(resetEmail);

      // Step 3: Reset password - Using correct endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/reset-password-with-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: resetData.email,
            otp: resetData.otp,
            newPassword: data.newPassword
          })
        }
      );

      if (!response.ok) throw new Error('Failed to reset password');

      setPasswordView('reset-success');
      newPasswordForm.reset();
      resetTokenForm.reset();
      toast.success('Password reset successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Update the phone OTP functions to use correct endpoints
  // const sendPhoneOTP = async (phoneNumber: string) => {
  //   try {
  //     // Fixed API endpoint
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/phone/send-otp`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${session?.user?.backendJwt}`
  //         },
  //         body: JSON.stringify({ phoneNumber }) // Backend expects phoneNumber
  //       }
  //     );

  //     if (!response.ok) throw new Error('Failed to send OTP');

  //     const data = await response.json();
  //     return { success: true, message: data.message };
  //   } catch (error) {
  //     console.error(error);
  //     return { success: false, message: 'Failed to send OTP' };
  //   }
  // };

  // const verifyPhoneOTP = async (phoneNumber: string, otp: string) => {
  //   try {
  //     // Fixed API endpoint
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/phone/verify-otp`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${session?.user?.backendJwt}`
  //         },
  //         body: JSON.stringify({ phoneNumber, otp })
  //       }
  //     );

  //     if (!response.ok) throw new Error('Invalid OTP');

  //     const data = await response.json();
  //     return { success: true, message: data.message };
  //   } catch (error) {
  //     console.error(error);
  //     return { success: false, message: 'Invalid OTP' };
  //   }
  // };

  const getVerificationStatus = () => {
    if (profileData.phoneVerified) {
      return {
        icon: <CheckCircle className='h-4 w-4 text-green-600' />,
        text: 'Verified',
        color: 'text-green-600'
      };
    }
    return {
      icon: <AlertCircle className='h-4 w-4 text-red-500' />,
      text: 'Not Verified',
      color: 'text-red-500'
    };
  };

  // if (status === 'loading') {
  //   return (
  //     <div className='flex min-h-screen items-center justify-center'>
  //       <div className='flex items-center gap-2'>
  //         <LoaderCircle className='h-6 w-6 animate-spin' />
  //         <span>Loading profile...</span>
  //       </div>
  //     </div>
  //   );
  // }

  const verificationStatus = getVerificationStatus();
  const fullName = `${profileData.name}`.trim();

  return (
    <ScrollArea className='h-screen'>
      <div className='min-h-screen bg-[#F8F7F5] p-6'>
        <div className='mx-auto max-w-4xl space-y-8'>
          {/* Header */}
          <div>
            <h1 className='text-foreground text-3xl font-bold'>Account</h1>
            {loading && (
              <div className='text-muted-foreground mt-2 flex items-center gap-2'>
                <LoaderCircle className='h-4 w-4 animate-spin' />
                <span className='text-sm'>Updating...</span>
              </div>
            )}
          </div>

          {/* Profile Details Section */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
              <CardTitle className='text-xl font-semibold'>
                Profile Details
              </CardTitle>
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground'
                onClick={() => setEditingProfile(!editingProfile)}
                disabled={loading}
              >
                <Edit className='mr-2 h-4 w-4' />
                {editingProfile ? 'Cancel' : 'Edit Details'}
              </Button>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profile Image and Basic Info */}
              <div className='flex items-center gap-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage
                    src={profileData.image || undefined}
                    alt={fullName}
                  />
                  <AvatarFallback>
                    {session?.user?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <h3 className='text-lg font-medium'>
                    {fullName || session?.user?.name}
                  </h3>
                  <p className='text-muted-foreground'>{profileData.email}</p>
                </div>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setShowImageCropper(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                      Uploading...
                    </>
                  ) : (
                    'Edit Profile Image'
                  )}
                </Button>
              </div>

              <Separator />

              {/* Profile Fields */}
              {editingProfile ? (
                <></>
              ) : (
                // <form
                //   onSubmit={form.handleSubmit(onProfileSubmit)}
                //   className='space-y-4'
                // >
                //   <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                //     <div>
                //       <Label htmlFor='firstName'>First Name</Label>
                //       <Input
                //         id='firstName'
                //         {...form.register('firstName')}
                //         className='mt-1'
                //         disabled={loading}
                //       />
                //       {form.formState.errors.firstName && (
                //         <p className='text-destructive mt-1 text-sm'>
                //           {form.formState.errors.firstName.message}
                //         </p>
                //       )}
                //     </div>

                //     <div>
                //       <Label htmlFor='lastName'>Last Name</Label>
                //       <Input
                //         id='lastName'
                //         {...form.register('lastName')}
                //         className='mt-1'
                //         disabled={loading}
                //       />
                //       {form.formState.errors.lastName && (
                //         <p className='text-destructive mt-1 text-sm'>
                //           {form.formState.errors.lastName.message}
                //         </p>
                //       )}
                //     </div>

                //     <div>
                //       <Label htmlFor='email'>Email</Label>
                //       <Input
                //         id='email'
                //         type='email'
                //         {...form.register('email')}
                //         className='mt-1'
                //         disabled
                //       />
                //     </div>

                //     <div>
                //       <Label
                //         htmlFor='phone'
                //         className='flex items-center gap-2'
                //       >
                //         Phone Number
                //         {profileData.phone && (
                //           <span
                //             className={cn(
                //               'flex items-center gap-1 rounded-lg bg-blue-100 p-1 px-2 text-xs font-medium',
                //               verificationStatus.color
                //             )}
                //           >
                //             <Clock className='h-3 w-3' />
                //             {verificationStatus.text}
                //           </span>
                //         )}
                //       </Label>
                //       <div className='mt-1 flex gap-2'>
                //         <Input
                //           id='phone'
                //           {...form.register('phone')}
                //           placeholder='+1234567890'
                //           disabled={loading}
                //         />
                //         {profileData.phone && !profileData.phoneVerified && (
                //           <Button
                //             type='button'
                //             onClick={() => setOpen(true)}
                //             variant='outline'
                //             className='flex items-center gap-2'
                //             disabled={loading}
                //           >
                //             <AlertCircle className='h-4 w-4' />
                //             Verify
                //           </Button>
                //         )}
                //       </div>
                //       {form.formState.errors.phone && (
                //         <p className='text-destructive mt-1 text-sm'>
                //           {form.formState.errors.phone.message}
                //         </p>
                //       )}
                //     </div>

                //     <div>
                //       <Label htmlFor='city'>City</Label>
                //       <Input
                //         id='city'
                //         {...form.register('city')}
                //         className='mt-1'
                //         disabled={loading}
                //       />
                //     </div>

                //     <div>
                //       <Label htmlFor='state'>State</Label>
                //       <Input
                //         id='state'
                //         {...form.register('state')}
                //         className='mt-1'
                //         disabled={loading}
                //       />
                //     </div>

                //     <div className='sm:col-span-2'>
                //       <Label htmlFor='linkedin'>LinkedIn</Label>
                //       <Input
                //         id='linkedin'
                //         {...form.register('linkedin')}
                //         placeholder='LinkedIn Profile URL'
                //         className='mt-1'
                //         disabled={loading}
                //       />
                //     </div>
                //   </div>

                //   <div className='flex gap-2'>
                //     <Button type='submit' disabled={loading}>
                //       {loading ? (
                //         <>
                //           <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                //           Saving...
                //         </>
                //       ) : (
                //         'Save Changes'
                //       )}
                //     </Button>
                //     <Button
                //       type='button'
                //       variant='outline'
                //       onClick={() => {
                //         setEditingProfile(false);
                //         form.reset(profileData);
                //       }}
                //       disabled={loading}
                //     >
                //       Cancel
                //     </Button>
                //   </div>
                // </form>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      Name
                    </p>
                    <p className='text-base'>
                      {profileData.name || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      Email
                    </p>
                    <p className='text-base'>{profileData.email}</p>
                  </div>

                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      Phone Number
                    </p>
                    <div className='flex items-center gap-2'>
                      <p className='text-base'>
                        {profileData.phone || 'Not provided'}
                      </p>
                      {profileData.phone && verificationStatus.icon}
                    </div>
                  </div>

                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      City
                    </p>
                    <p className='text-base'>
                      {profileData.city || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      State
                    </p>
                    <p className='text-base'>
                      {profileData.state || 'Not provided'}
                    </p>
                  </div>

                  <div className='sm:col-span-2'>
                    <p className='text-muted-foreground text-sm font-medium'>
                      LinkedIn
                    </p>
                    <p className='text-base'>
                      {profileData.linkedin || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* College Details Section */}
          {/* <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
              <CardTitle className='text-xl font-semibold'>
                College Details
              </CardTitle>
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground'
                onClick={() => setEditingCollege(!editingCollege)}
                disabled={loading}
              >
                <Edit className='mr-2 h-4 w-4' />
                {editingCollege ? 'Cancel' : 'Edit Details'}
              </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              {editingCollege ? (
                <form
                  onSubmit={collegeForm.handleSubmit(onCollegeSubmit)}
                  className='space-y-4'
                >
                  <div>
                    <Label htmlFor='collegeName'>College Name</Label>
                    <Input
                      id='collegeName'
                      {...collegeForm.register('collegeName')}
                      className='mt-1'
                      disabled={loading}
                    />
                    {collegeForm.formState.errors.collegeName && (
                      <p className='text-destructive mt-1 text-sm'>
                        {collegeForm.formState.errors.collegeName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='branch'>Branch</Label>
                    <Input
                      id='branch'
                      {...collegeForm.register('branch')}
                      className='mt-1'
                      disabled={loading}
                    />
                    {collegeForm.formState.errors.branch && (
                      <p className='text-destructive mt-1 text-sm'>
                        {collegeForm.formState.errors.branch.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='currentYear'>Current Year Of Study</Label>
                    <Input
                      id='currentYear'
                      {...collegeForm.register('currentYear')}
                      className='mt-1'
                      disabled={loading}
                    />
                    {collegeForm.formState.errors.currentYear && (
                      <p className='text-destructive mt-1 text-sm'>
                        {collegeForm.formState.errors.currentYear.message}
                      </p>
                    )}
                  </div>

                  <div className='flex gap-2'>
                    <Button type='submit' disabled={loading}>
                      {loading ? (
                        <>
                          <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setEditingCollege(false);
                        collegeForm.reset(collegeData);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      College Name
                    </p>
                    <p className='text-base'>
                      {collegeData.collegeName || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      Branch
                    </p>
                    <p className='text-base'>
                      {collegeData.branch || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      Current Year Of Study
                    </p>
                    <p className='text-base'>
                      {collegeData.currentYear || 'Not provided'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card> */}

          {/* Settings Section */}
          <Card ref={passwordSelectionRef}>
            <CardHeader>
              <CardTitle className='text-xl font-semibold'>Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {showCreditsSummary ? (
                // Credits Summary View
                <div className='space-y-4'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowCreditsSummary(false)}
                    >
                      <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <h3 className='text-lg font-semibold'>Credits Summary</h3>
                  </div>

                  {/* <CreditsSummaryInline /> */}
                </div>
              ) : passwordView === 'menu' ? (
                // Main Settings Menu
                <>
                  <Button
                    variant='ghost'
                    className='h-12 w-full justify-between px-4'
                    onClick={() => setShowCreditsSummary(true)}
                  >
                    <div className='flex items-center gap-3'>
                      <Coins className='h-4 w-4' />
                      <span>Credits Summary</span>
                    </div>
                    <ChevronRight className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='ghost'
                    className='h-12 w-full justify-between px-4'
                    onClick={() => setPasswordView('forgot')}
                  >
                    <div className='flex items-center gap-3'>
                      <Lock className='h-4 w-4' />
                      <span>Password Management</span>
                    </div>
                    <ChevronRight className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='ghost'
                    className='h-12 w-full justify-between px-4'
                  >
                    <div className='flex items-center gap-3'>
                      <Bell className='h-4 w-4' />
                      <span>Notifications</span>
                    </div>
                    <ChevronRight className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='ghost'
                    className='text-destructive hover:text-destructive h-12 w-full justify-between px-4'
                    onClick={() => authClient.signOut()}
                  >
                    <div className='flex items-center gap-3'>
                      <LogOut className='h-4 w-4' />
                      <span>Log Out</span>
                    </div>
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </>
              ) : passwordView === 'forgot' ? (
                // Password Reset Form
                <div className='space-y-4'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setPasswordView('menu')}
                    >
                      <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <h3 className='text-lg font-semibold'>Reset Password</h3>
                  </div>

                  <p className='text-muted-foreground mb-4 text-sm'>
                    Enter your email address and we&apos;ll send you a reset
                    code.
                  </p>

                  <form
                    onSubmit={forgotPasswordForm.handleSubmit(
                      onForgotPasswordSubmit
                    )}
                    className='space-y-4'
                  >
                    <div>
                      <Label htmlFor='forgotEmail'>Email Address</Label>
                      <Input
                        id='forgotEmail'
                        type='email'
                        {...forgotPasswordForm.register('email')}
                        className='mt-1'
                        placeholder='Enter your email'
                        disabled={loading}
                      />
                      {/* {forgotPasswordForm.formState.errors.email && (
                        <p className='text-destructive mt-1 text-sm'>
                          {forgotPasswordForm.formState.errors.email.message}
                        </p>
                      )} */}
                    </div>

                    <div className='flex gap-2'>
                      <Button type='submit' disabled={loading}>
                        {loading ? (
                          <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                        ) : (
                          <Mail className='mr-2 h-4 w-4' />
                        )}
                        Send Reset Code
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setPasswordView('menu')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              ) : passwordView === 'new-password' ? (
                // New Password Form
                <div className='space-y-4'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setPasswordView('verify-token')}
                    >
                      <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <h3 className='text-lg font-semibold'>Set New Password</h3>
                  </div>

                  <p className='text-muted-foreground mb-4 text-sm'>
                    Please enter your new password below.
                  </p>

                  <form
                    onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)}
                    className='space-y-4'
                  >
                    <div>
                      <Label htmlFor='newPassword'>New Password</Label>
                      <Input
                        id='newPassword'
                        type='password'
                        {...newPasswordForm.register('newPassword')}
                        className='mt-1'
                        placeholder='Enter new password'
                        disabled={loading}
                      />
                      {newPasswordForm.formState.errors.newPassword && (
                        <p className='text-destructive mt-1 text-sm'>
                          {newPasswordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor='confirmPassword'>Confirm Password</Label>
                      <Input
                        id='confirmPassword'
                        type='password'
                        {...newPasswordForm.register('confirmPassword')}
                        className='mt-1'
                        placeholder='Confirm new password'
                        disabled={loading}
                      />
                      {newPasswordForm.formState.errors.confirmPassword && (
                        <p className='text-destructive mt-1 text-sm'>
                          {
                            newPasswordForm.formState.errors.confirmPassword
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <div className='flex gap-2'>
                      <Button type='submit' disabled={loading}>
                        {loading ? (
                          <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setPasswordView('verify-token')}
                        disabled={loading}
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                // Password Reset Success
                <div className='space-y-4 text-center'>
                  <div className='mb-4'>
                    <CheckCircle className='mx-auto h-12 w-12 text-green-600' />
                    <h3 className='mt-2 text-lg font-semibold'>
                      Password Reset Instructions Sent
                    </h3>
                  </div>

                  <p className='text-muted-foreground text-sm'>
                    Your reset code has been verified. Please check your email
                    for further instructions to complete the password reset
                    process.
                  </p>

                  <Button
                    onClick={() => {
                      setPasswordView('menu');
                      setResetEmail('');
                      forgotPasswordForm.reset();
                      resetTokenForm.reset();
                    }}
                    className='w-full'
                  >
                    Back to Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Updated PhoneVerifyDialog with custom functions */}
        {/* <PhoneVerifyDialog
          phone={profileData.phone || ''}
          open={open}
          setOpen={setOpen}
          onSuccess={(phoneNumber: string) => {
            setProfileData((prev) => ({
              ...prev,
              phone: phoneNumber,
              phoneVerified: true
            }));
          }}
          sendOTP={sendPhoneOTP}
          verifyOTP={verifyPhoneOTP}
        /> */}

        {showImageCropper && (
          <ImageCropper
            onImageSaved={handleImageSaved}
            onCancel={() => setShowImageCropper(false)}
          />
        )}
      </div>
    </ScrollArea>
  );
};

export default Profile;
