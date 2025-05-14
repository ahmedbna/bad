'use client';

import Globe from './globe';
import Particles from './particles';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { useAuthActions } from '@convex-dev/auth/react';

export const LandingPage = () => {
  const { resolvedTheme } = useTheme();
  const { signIn } = useAuthActions();

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-center'>
      <section className='w-full min-h-screen flex flex-col justify-center items-center'>
        <div className='w-full flex flex-col items-center justify-center gap-4 mx-auto text-center mb-1'>
          <h1 className='pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-4xl md:text-6xl font-black leading-none text-transparent dark:from-white dark:to-slate-900/10'>
            AI CAD
          </h1>
        </div>

        <div className='relative flex h-full w-full max-w-full items-center justify-center overflow-hidden rounded-lg  pb-40 md:pb-60'>
          <span className='pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-5xl md:text-8xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10'>
            Design Smarter, Faster, Together
          </span>

          <Globe className='top-6' />

          <div className='pointer-events-none absolute inset-0 h-full ' />
        </div>

        <Button
          size='lg'
          className='w-full max-w-lg mt-4'
          onClick={() => void signIn('google')}
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
            <path
              d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
              fill='currentColor'
            />
          </svg>
          Login with Google
        </Button>

        <a
          href='https://www.producthunt.com/posts/ai-cad?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-ai&#0045;cad'
          target='_blank'
        >
          <img
            src='https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=965110&theme=light&t=1747189820030'
            alt='AI&#0032;CAD - AI&#0032;CAD&#0032;in&#0032;the&#0032;Cloud&#0032;with&#0032;Realtime&#0032;Collaboration | Product Hunt'
            className='w-[250px] h-[54px] mt-6'
            width='250'
            height='54'
          />
        </a>

        <Particles
          className='absolute inset-0 -z-10'
          quantity={80}
          color={resolvedTheme === 'light' ? '#000000' : '#FFFFFF'}
        />
      </section>
    </div>
  );
};
