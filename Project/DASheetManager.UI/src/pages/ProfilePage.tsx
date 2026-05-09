import { useEffect } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, User, KeyRound, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUpdateProfile } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { ApiError } from '@/api/client'

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required').transform((v) => v.trim()),
  lastName: z.string().min(1, 'Required').transform((v) => v.trim()),
  email: z.string().email('Invalid email').transform((v) => v.trim()),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateProfile()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
      },
    })

  useEffect(() => {
    if (user) {
      const parts = user.fullName.trim().split(' ')
      reset({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
        email: user.email,
      })
    }
  }, [user, reset])

  async function onSubmit(values: ProfileFormValues) {
    setServerError(null)
    try {
      await updateProfile.mutateAsync(values)
      toast.success('Profile updated.')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update profile.'
      setServerError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Profile</h1>
      </div>

      {/* Account info chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          <User className="w-3.5 h-3.5" />
          {user?.employeeCode}
        </span>
        <span className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
          user?.role === 'Admin'
            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        )}>
          <Shield className="w-3.5 h-3.5" />
          {user?.role}
        </span>
      </div>

      {/* Profile form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
          Personal Information
        </h2>

        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <input
                {...register('firstName')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  errors.firstName
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                )}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input
                {...register('lastName')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  errors.lastName
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                )}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                errors.email
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600',
              )}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || updateProfile.isPending || !isDirty}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {(isSubmitting || updateProfile.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Password
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Change your password to keep your account secure.
        </p>
        <Link
          to="/change-password"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          Change Password
        </Link>
      </div>
    </div>
  )
}
