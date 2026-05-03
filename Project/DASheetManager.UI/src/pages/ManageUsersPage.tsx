import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Search, Loader2, RotateCcw, Power, PowerOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUsers, useCreateUser, useToggleUserActive, useResetPassword, useDeleteUser } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/authStore'
import { ApiError } from '@/api/client'
import type { UserListItem } from '@/types/da-types'

// ── Add User form schema ───────────────────────────────────────────────────

const createSchema = z.object({
  employeeCode: z.string().min(1, 'Required').transform((v) => v.trim().toUpperCase()),
  firstName: z.string().min(1, 'Required').transform((v) => v.trim()),
  lastName: z.string().min(1, 'Required').transform((v) => v.trim()),
  email: z.string().email('Invalid email').transform((v) => v.trim()),
  role: z.enum(['User', 'Admin']),
  tempPassword: z.string().min(6, 'At least 6 characters'),
})

type CreateFormValues = z.infer<typeof createSchema>

// ── Reset Password form schema ─────────────────────────────────────────────

const resetSchema = z.object({
  tempPassword: z.string().min(6, 'At least 6 characters'),
})

type ResetFormValues = z.infer<typeof resetSchema>

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500',
    )}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-700',
    )}>
      {role}
    </span>
  )
}

// ── Add User Modal ─────────────────────────────────────────────────────────

function AddUserModal({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'User' },
  })

  async function onSubmit(values: CreateFormValues) {
    setServerError(null)
    try {
      await createUser.mutateAsync(values)
      toast.success('User created successfully.')
      onClose()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create user.'
      setServerError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Add New User</h2>

        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
              <input
                {...register('employeeCode')}
                placeholder="E.code"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.employeeCode ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.employeeCode && <p className="mt-1 text-xs text-red-600">{errors.employeeCode.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                {...register('firstName')}
                placeholder="First name"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.firstName ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                {...register('lastName')}
                placeholder="Last name"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.lastName ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="Email Address"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.email ? 'border-red-400' : 'border-gray-300',
              )}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
            <input
              {...register('tempPassword')}
              type="password"
              placeholder="Min. 6 characters"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.tempPassword ? 'border-red-400' : 'border-gray-300',
              )}
            />
            {errors.tempPassword && <p className="mt-1 text-xs text-red-600">{errors.tempPassword.message}</p>}
            <p className="mt-1 text-xs text-gray-400">User will be required to change on first login.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createUser.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {(isSubmitting || createUser.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset Password Modal ───────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const resetPw = useResetPassword()
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  async function onSubmit(values: ResetFormValues) {
    setServerError(null)
    try {
      await resetPw.mutateAsync({ userId: user.userId, body: values })
      toast.success('Password reset. User must change on next login.')
      setDone(true)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to reset password.'
      setServerError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-4">{user.fullName} ({user.employeeCode})</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {serverError}
          </div>
        )}
        {done && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            Password reset. User must change on next login.
          </div>
        )}

        {!done && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                {...register('tempPassword')}
                type="password"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.tempPassword ? 'border-red-400' : 'border-gray-300',
                )}
              />
              {errors.tempPassword && <p className="mt-1 text-xs text-red-600">{errors.tempPassword.message}</p>}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || resetPw.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60">
                {(isSubmitting || resetPw.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                Reset
              </button>
            </div>
          </form>
        )}

        {done && (
          <button onClick={onClose}
            className="w-full py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Close
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function ManageUsersPage() {
  const { data: users, isLoading, error } = useUsers()
  const currentUser = useAuthStore((s) => s.user)
  const toggleActive = useToggleUserActive()
  const deleteUser = useDeleteUser()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null)

  function handleToggleActive(u: UserListItem) {
    toggleActive.mutate(u.userId, {
      onSuccess: () => toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}.`),
      onError: () => toast.error('Failed to update user status.'),
    })
  }

  function handleDeleteUser(u: UserListItem) {
    if (!confirm(`Delete user "${u.fullName}"? This cannot be undone.`)) return
    deleteUser.mutate(u.userId, {
      onSuccess: () => toast.success(`User "${u.fullName}" deleted.`),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to delete user.'),
    })
  }

  const filtered = users?.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.employeeCode.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }) ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users ? `${users.length} users total` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, e.code or email"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading users…
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50">
            Failed to load users: {error instanceof ApiError ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !error && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.fullName}</div>
                    <div className="text-xs text-gray-500">{u.employeeCode}</div>
                    {u.mustChangePassword && (
                      <span className="inline-block mt-0.5 text-[10px] text-amber-600 font-medium">
                        Must change password
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Reset Password */}
                      <button
                        onClick={() => setResetTarget(u)}
                        title="Reset password"
                        className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={toggleActive.isPending}
                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          u.isActive
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50',
                        )}
                      >
                        {u.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>

                      {/* Delete (not self) */}
                      {u.userId !== currentUser?.userId && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={deleteUser.isPending}
                          title="Delete user"
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  )
}
