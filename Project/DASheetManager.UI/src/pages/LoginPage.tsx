import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogin } from '@/hooks/useAuth'
import { ApiError } from '@/api/client'

const schema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').toUpperCase(),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const login = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await login.mutateAsync(values)
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
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">DA Sheet Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* Error banner */}
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Code
              </label>
              <input
                {...register('employeeCode')}
                placeholder="Employee Code"
                autoComplete="username"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.employeeCode ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.employeeCode && (
                <p className="mt-1 text-xs text-red-600">{errors.employeeCode.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.password ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || login.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {(isSubmitting || login.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          DA Sheet Manager &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
