import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, RefreshCw, BookOpenCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogin } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { ApiError } from '@/api/client'

const schema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').toUpperCase(),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const login = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  const [captchaImage,   setCaptchaImage]   = useState<string>('')
  const [captchaToken,   setCaptchaToken]   = useState<string>('')
  const [captchaAnswer,  setCaptchaAnswer]  = useState<string>('')
  const [captchaError,   setCaptchaError]   = useState<string | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const fetchCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const data = await authApi.getCaptcha()
      setCaptchaImage(data.imageData)
      setCaptchaToken(data.token)
      setCaptchaAnswer('')
      setCaptchaError(null)
    } catch {
      // silently ignore; image stays blank — user can click refresh
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => { fetchCaptcha() }, [])

  async function onSubmit(values: FormValues) {
    setServerError(null)

    if (!captchaAnswer.trim()) {
      setCaptchaError('Please enter the characters shown above')
      return
    }

    try {
      await login.mutateAsync({
        ...values,
        captchaToken,
        captchaAnswer: captchaAnswer.trim().toUpperCase(),
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
        if (err.message.toLowerCase().includes('captcha')) {
          fetchCaptcha()
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Geometric diamond grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="iso-grid" x="0" y="0" width="60" height="34.64" patternUnits="userSpaceOnUse">
            <path d="M30 0 L60 17.32 L30 34.64 L0 17.32 Z" fill="none" stroke="#3b82f6" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#iso-grid)" opacity="0.15" />
      </svg>

      {/* Soft blue glow top-left */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-200/40 dark:bg-blue-900/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md px-4">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30">
              <BookOpenCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">DA Sheet Manager</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
          </div>

          {/* Error banner */}
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee Code
              </label>
              <input
                {...register('employeeCode')}
                placeholder="Employee Code"
                autoComplete="username"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm transition-colors',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.employeeCode
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                )}
              />
              {errors.employeeCode && (
                <p className="mt-1 text-xs text-red-600">{errors.employeeCode.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm transition-colors',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.password
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Security check
              </label>
              <div className="flex items-center gap-2 mb-2">
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 select-none">
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="CAPTCHA"
                      className="h-[60px] w-[200px] block"
                      draggable={false}
                    />
                  ) : (
                    <div className="h-[60px] w-[200px] animate-pulse bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  title="Get new image"
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={cn('w-4 h-4', captchaLoading && 'animate-spin')} />
                </button>
              </div>
              <input
                value={captchaAnswer}
                onChange={e => { setCaptchaAnswer(e.target.value); setCaptchaError(null) }}
                placeholder="Enter the characters above"
                autoComplete="off"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm tracking-widest uppercase transition-colors',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  captchaError
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                )}
              />
              {captchaError && (
                <p className="mt-1 text-xs text-red-600">{captchaError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || login.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {(isSubmitting || login.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-blue-200/60 mt-4">
          DA Sheet Manager &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
