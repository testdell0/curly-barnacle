import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, KeyRound, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChangePassword } from '@/hooks/useAuth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { getPasswordErrors } from '@/lib/passwordValidation'
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const changePw = useChangePassword()
  const user = useAuthStore((s) => s.user)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const pwContext = useMemo(() => ({
    username:  user?.employeeCode,
    email:     user?.email,
    firstName: user?.fullName?.split(' ')[0],
    lastName:  user?.fullName?.split(' ').slice(1).join(' '),
  }), [user])

  const schema = useMemo(() =>
    z.object({
      currentPassword:    z.string().min(1, 'Current password is required'),
      newPassword:        z.string().min(1, 'New password is required'),
      confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .superRefine((data, ctx) => {
      const errors = getPasswordErrors(data.newPassword, pwContext)
      if (errors.length > 0)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: errors[0], path: ['newPassword'] })
    })
    .refine((v) => v.newPassword === v.confirmNewPassword, {
      message: 'Passwords do not match',
      path: ['confirmNewPassword'],
    }),
  [pwContext])

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const newPasswordValue = watch('newPassword', '')

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await changePw.mutateAsync(values)
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="flex items-center mb-4">
            <button
              type="button"
              disabled={user?.mustChangePassword}
              onClick={() => navigate('/dashboard')}
              className={cn('p-2 rounded-lg transition',
                user?.mustChangePassword
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-gray-100'
              )}
              title='Back to dashboard'
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
            {user?.mustChangePassword && (
              <p className="text-sm text-amber-600 mt-1 font-medium">
                You must set a new password before continuing.
              </p>
            )}
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              Password changed successfully. Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                {...register('currentPassword')}
                type="password"
                autoComplete="current-password"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.currentPassword ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                {...register('newPassword')}
                type="password"
                autoComplete="new-password"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.newPassword ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
              )}
              <PasswordStrengthMeter password={newPasswordValue} context={pwContext} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                {...register('confirmNewPassword')}
                type="password"
                autoComplete="new-password"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.confirmNewPassword ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmNewPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || changePw.isPending || success}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {(isSubmitting || changePw.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
