import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@pure-relief/shared';
import { useAdminAuthStore } from '@/admin/lib/admin-auth-store';
import { ApiClientError } from '@/lib/api-client';
import { Lock } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAdminAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-tint px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cold-500 text-white shadow-glow">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-ink">Admin Sign In</h1>
          <p className="mt-1 text-sm text-ink-soft">Pure Relief control panel</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-surface space-y-4 p-7">
          {serverError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</div>}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input id="email" type="email" {...register('email')} className={`input-field ${errors.email ? 'input-error' : ''}`} autoComplete="username" />
            {errors.email && <p className="field-error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Password</label>
            <input id="password" type="password" {...register('password')} className={`input-field ${errors.password ? 'input-error' : ''}`} autoComplete="current-password" />
            {errors.password && <p className="field-error-text">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
