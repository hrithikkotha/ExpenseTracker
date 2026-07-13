import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { api } from '../lib/axios';
import { getErrorMessage } from '../lib/apiError';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const emailParam = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otp: '',
      password: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        otp: data.otp,
        password: data.password,
      });
      setSuccessMsg('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to reset password. Please check your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Enter the OTP sent to your email to set a new password</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-card border rounded-2xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-2">
                6-Digit OTP Code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                {...register('otp')}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-center text-xl font-mono tracking-widest"
                placeholder="123456"
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-destructive">{errors.otp.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMsg}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
