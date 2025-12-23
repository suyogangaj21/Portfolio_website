import Image from 'next/image';
import {
  Target,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  Star
} from 'lucide-react';
import { LoginForm } from '@/features/auth/components/sign-in-form';

export default function LoginPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='bg-muted relative hidden lg:block'>
        <div className='absolute inset-0 flex flex-col justify-center p-12'></div>
      </div>

      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-[370px]'>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
