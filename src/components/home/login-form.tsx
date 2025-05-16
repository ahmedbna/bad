'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConvexError } from 'convex/values';
import { useAuthActions } from '@convex-dev/auth/react';
import { useToast } from '@/hooks/useToast';
import { AlertCircle, Mail } from 'lucide-react';
import { z } from 'zod';

export const LoginForm = () => {
  const { toast } = useToast();
  const { signIn } = useAuthActions();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const EmailSchema = z.string().email('Please enter a valid email address');

  const validateEmail = (email: string) => {
    try {
      EmailSchema.parse(email);
      setError('');
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      // Clear error when user starts typing again
      validateEmail(e.target.value);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);

      await signIn('resend', formData);

      // If successful, show email sent confirmation
      setEmailSent(true);
      toast({
        title: 'Magic link sent!',
        description: 'Check your email inbox to continue.',
        variant: 'default',
      });
    } catch (error) {
      if (error instanceof ConvexError) {
        setError(error.message);
      } else {
        console.error(error);
        toast({
          title: 'Could not login',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    try {
      signIn('google');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Could not login with Google',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-sm'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Welcome back</CardTitle>
          <CardDescription>Login with your account</CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className='flex flex-col items-center gap-4 py-4'>
              <div className='rounded-full bg-primary/10 p-3'>
                <Mail className='h-6 w-6 text-primary' />
              </div>
              <div className='text-center'>
                <h3 className='font-medium'>Check your email</h3>
                <p className='text-sm text-muted-foreground mt-1'>
                  {`We've sent a magic link to `}
                  <span className='font-medium'>{email}</span>
                </p>
              </div>
              <Button
                variant='outline'
                className='mt-2 w-full'
                onClick={() => setEmailSent(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className='grid gap-6'>
              <div className='flex flex-col gap-4'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg
                    className='mr-2 h-4 w-4'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                  >
                    <path
                      d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                      fill='currentColor'
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>

              <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
                <span className='relative z-10 bg-card px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>

              {error && (
                <div className='bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center'>
                  <AlertCircle className='h-4 w-4 mr-2' />
                  {error}
                </div>
              )}

              <form className='flex flex-col' onSubmit={handleSubmit}>
                <div className='grid gap-6'>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      name='email'
                      autoComplete='email'
                      placeholder='m@example.com'
                      required
                      value={email}
                      onChange={handleEmailChange}
                      className={error ? 'border-destructive' : ''}
                    />
                  </div>

                  <Button type='submit' disabled={loading} className='mt-4'>
                    {loading ? (
                      <svg
                        className='mr-2 h-4 w-4 animate-spin'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                          fill='none'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                    ) : null}
                    Login with Email
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='mt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary'>
        {`By clicking continue, you agree to our `}
        <a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>
      </div>
    </div>
  );
};
