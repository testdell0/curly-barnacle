import { toast } from 'sonner'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Globe, GlobeLock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useTemplates,
  useDeleteTemplate,
  usePublishTemplate,
  useUnpublishTemplate,
} from '@/hooks/useTemplates'

export function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates()
  const deleteTemplate = useDeleteTemplate()
  const publishTemplate = usePublishTemplate()
  const unpublishTemplate = useUnpublishTemplate()
  const [search, setSearch] = useState('')

  const filtered = templates?.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.daType.toLowerCase().includes(search.toLowerCase()),
  )

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return

    deleteTemplate.mutate(id, {
      onSuccess: () => {
        // toast.error(`"${name}" deleted`)
        toast.error('Template Deleted')
      },
      onError: () => {
        toast.error('Failed to delete template')
      },
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage evaluation templates with categories and judgment parameters
          </p>
        </div>
        <Link
          to="/templates/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : !filtered?.length ? (
        <div className="text-center py-12 text-gray-500">No templates found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DA Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.templateId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.daType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        t.status === 'Published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700',
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.createdByName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(t.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/templates/${t.templateId}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      {t.status === 'Draft' ? (
                        <button
                          onClick={() => publishTemplate.mutate(t.templateId, {
                            onSuccess: () => {
                              toast.success('Template Published')
                            },
                            onError: () => {
                              toast.error('Failed to publish template')
                            },}
                          )}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Publish"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => unpublishTemplate.mutate(t.templateId, {
                            onSuccess: () => {
                              toast.warning('Template Unpublished')
                            },
                            onError: () => {
                              toast.error('Failed to unpublish template')
                            },}
                          )}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                          title="Unpublish"
                        >
                          <GlobeLock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.templateId, t.name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
