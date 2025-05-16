'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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
import { Password } from '@convex-dev/auth/providers/Password';

import { z } from 'zod';
import { ZodError } from 'zod';
import { AlertCircle } from 'lucide-react';

// Enhanced schema with more detailed error messages
const EmailSchema = z.string().email('Please enter a valid email address');

const PasswordSchema = z.string().refine(
  (password) => {
    return (
      password.length >= 8 &&
      /\d/.test(password) &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password)
    );
  },
  {
    message:
      'Password must be at least 8 characters with uppercase, lowercase, and a number',
  }
);

const ParamsSchema = z.object({
  email: EmailSchema,
});

export default Password({
  profile(params) {
    try {
      const { email } = ParamsSchema.parse(params);
      return { email };
    } catch (error) {
      if (error instanceof ZodError) {
        // Format errors in a user-friendly way
        const formattedError = error.errors
          .map((err) => `${err.path}: ${err.message}`)
          .join(', ');
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: formattedError,
        });
      }
      throw new ConvexError({
        code: 'UNKNOWN_ERROR',
        message: 'An error occurred with your request',
      });
    }
  },
  validatePasswordRequirements: (password: string) => {
    try {
      PasswordSchema.parse(password);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ConvexError({
          code: 'INVALID_PASSWORD',
          message: error.errors[0].message,
        });
      }
      throw new ConvexError({
        code: 'INVALID_PASSWORD',
        message: 'Password does not meet requirements',
      });
    }
  },
});

export const LoginForm = () => {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validateForm = (formData: FormData): boolean => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const errors: {
      email?: string;
      password?: string;
    } = {};

    try {
      EmailSchema.parse(email);
    } catch (error) {
      if (error instanceof ZodError) {
        errors.email = error.errors[0].message;
      }
    }

    // Only validate password requirements on signup
    if (flow === 'signUp') {
      try {
        PasswordSchema.parse(password);
      } catch (error) {
        if (error instanceof ZodError) {
          errors.password = error.errors[0].message;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordReset = () => {
    // Implement password reset functionality
    toast.info('Password reset functionality will be implemented soon.');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFormErrors({});

    const formData = new FormData(event.currentTarget);

    // Client-side validation
    if (!validateForm(formData)) {
      setLoading(false);
      return;
    }

    try {
      if (flow === 'signIn') {
        // Sign in with email/password
        void signIn('password', formData);
        toast.success('Signed in successfully!');
      } else {
        // Sign up with email/password
        void signIn('password', formData);
        toast.success('Account created and signed in successfully!');
      }
    } catch (error) {
      console.error('Auth error:', error);

      if (error instanceof ConvexError) {
        const errorData = error.data as
          | { code?: string; message?: string }
          | string;
        let generalError = '';
        let emailError = '';
        let passwordError = '';

        if (typeof errorData === 'object' && errorData !== null) {
          // Handle structured error data
          const { code, message } = errorData;

          switch (code) {
            case 'INVALID_PASSWORD':
              passwordError =
                message || 'Invalid password - check requirements';
              break;
            case 'VALIDATION_ERROR':
              if (message?.includes('email')) {
                emailError = 'Please enter a valid email address';
              }
              break;
            case 'USER_ALREADY_EXISTS':
              emailError =
                'This email is already registered. Try signing in instead.';
              break;
            case 'USER_NOT_FOUND':
              generalError = 'Account not found. Did you mean to sign up?';
              break;
            default:
              generalError =
                message || 'Authentication error. Please try again.';
          }
        } else if (typeof errorData === 'string') {
          // Handle string error data
          switch (errorData) {
            case 'INVALID_PASSWORD':
              passwordError = 'Invalid password - check requirements';
              break;
            case 'INVALID_EMAIL':
              emailError = 'Invalid email address. Please check and try again.';
              break;
            case 'USER_ALREADY_EXISTS':
              emailError =
                'This email is already registered. Try signing in instead.';
              break;
            case 'USER_NOT_FOUND':
              generalError = 'Account not found. Did you mean to sign up?';
              break;
            default:
              generalError = 'Authentication error. Please try again.';
          }
        } else {
          generalError =
            flow === 'signIn'
              ? 'Could not sign in, did you mean to sign up?'
              : 'Could not sign up, did you mean to sign in?';
        }

        setFormErrors({
          email: emailError || undefined,
          password: passwordError || undefined,
          general: generalError || undefined,
        });
      } else {
        setFormErrors({
          general:
            flow === 'signIn'
              ? 'Could not sign in, please try again.'
              : 'Could not sign up, please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-sm'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>
            {flow === 'signIn' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            {flow === 'signIn'
              ? 'Login with your account'
              : 'Sign up to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            <div className='flex flex-col gap-4'>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => void signIn('google')}
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
                {flow === 'signIn'
                  ? 'Login with Google'
                  : 'Sign up with Google'}
              </Button>
            </div>

            <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
              <span className='relative z-10 bg-card px-2 text-muted-foreground'>
                Or continue with
              </span>
            </div>

            {formErrors.general && (
              <div className='bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center'>
                <AlertCircle className='h-4 w-4 mr-2' />
                {formErrors.general}
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
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className='text-destructive text-xs mt-1'>
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className='grid gap-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='password'>Password</Label>
                    {flow === 'signIn' && (
                      <Button
                        className='p-0 h-auto'
                        type='button'
                        variant='link'
                        onClick={handlePasswordReset}
                      >
                        Forgot password?
                      </Button>
                    )}
                  </div>
                  <Input
                    id='password'
                    type='password'
                    name='password'
                    autoComplete={
                      flow === 'signIn' ? 'current-password' : 'new-password'
                    }
                    required
                    className={formErrors.password ? 'border-destructive' : ''}
                  />
                  {formErrors.password && (
                    <p className='text-destructive text-xs mt-1'>
                      {formErrors.password}
                    </p>
                  )}

                  <input name='flow' type='hidden' value={flow} />

                  {flow === 'signUp' && !formErrors.password && (
                    <span className='text-muted-foreground text-xs'>
                      Password must be at least 8 characters with uppercase,
                      lowercase, and a number
                    </span>
                  )}
                </div>

                <Button type='submit' disabled={loading} className='mt-4'>
                  {loading && (
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
                  )}
                  {flow === 'signIn' ? 'Sign in' : 'Sign up'}
                </Button>
              </div>
            </form>
            <Button
              variant='link'
              type='button'
              onClick={() => {
                setFlow(flow === 'signIn' ? 'signUp' : 'signIn');
                setFormErrors({});
              }}
            >
              {flow === 'signIn'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='mt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a>{' '}
        and <a href='#'>Privacy Policy</a>.
      </div>
    </div>
  );
};
