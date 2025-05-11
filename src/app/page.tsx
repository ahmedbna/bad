'use client';

import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { Spinner } from '@/components/ui/spinner';
import { HomePage } from '@/components/home/home-page';
import { LandingPage } from '@/components/home/landing-page';

export default function App() {
  return (
    <>
      <AuthLoading>
        <div className='flex h-screen w-screen items-center justify-center'>
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
      <Authenticated>
        <HomePage />
      </Authenticated>
    </>
  );
}
