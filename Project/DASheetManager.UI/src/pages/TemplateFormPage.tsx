import { toast } from 'sonner'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray, Controller, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ArrowLeft, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '@/hooks/useTemplates'

const WEIGHTAGE_OPTIONS = [5, 10, 15, 20, 25, 30]
const DA_TYPES = ['License', 'Custom Development', 'SaaS', 'Consulting', 'Other']


const paramSchema = z.object({
  paramId: z.number().optional(),
  name: z.string().min(1, 'Parameter name is required'),
  weightage: z.number().min(5).max(30),
  sortOrder: z.number(),
})

const categorySchema = z.object({
  categoryId: z.number().optional(),
  name: z.string().min(1, 'Category name is required'),
  sortOrder: z.number(),
  parameters: z.array(paramSchema).min(1, 'At least one parameter required'),
})

const formSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  daType: z.string().min(1, 'DA Type is required'),
  description: z.string().optional(),
  categories: z.array(categorySchema).min(1, 'At least one category required'),
})

type FormData = z.infer<typeof formSchema>

export function TemplateFormPage() {
  // const [formError, setFormError] = useState<string | null>(null)
  const { id } = useParams<{ id: string }>()
  const templateId = id ? Number(id) : undefined
  const isEdit = !!templateId
  const navigate = useNavigate()

  const { data: existing, isLoading: loadingExisting } = useTemplate(templateId)
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      daType: '',
      description: '',
      categories: [
        {
          name: '',
          sortOrder: 0,
          parameters: [{ name: '', weightage: 10, sortOrder: 0 }],
        },
      ],
    },
  })

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({ control, name: 'categories' })

  // Watch ALL categories to compute total weightage across the whole template
  const allCategories = watch('categories')
  const totalWeightage = allCategories?.reduce(
    (sum, cat) => sum + (cat.parameters?.reduce((s, p) => s + (p.weightage || 0), 0) ?? 0),
    0,
  ) ?? 0

  // Populate form when editing
  useEffect(() => {
    if (existing && isEdit) {
      reset({
        name: existing.name,
        daType: existing.daType,
        description: existing.description ?? '',
        categories: existing.categories.map((c) => ({
          categoryId: c.categoryId,
          name: c.name,
          sortOrder: c.sortOrder,
          parameters: c.parameters.map((p) => ({
            paramId: p.paramId,
            name: p.name,
            weightage: p.weightage,
            sortOrder: p.sortOrder,
          })),
        })),
      })
    }
  }, [existing, isEdit, reset])

  function onSubmitError(errors: FieldErrors<FormData>) {
    if (totalWeightage !== 100) {
      toast.error('Total template weightage must be exactly 100%', {
        description: `Current total is ${totalWeightage}%`,
      })
    }
  }
  async function onSubmit(data: FormData) {
    if (totalWeightage !== 100) {
      toast.error('Total template weightage must be exactly 100%', {
        description: `Current total is ${totalWeightage}%`,
      })
      return
    }

    const payload = {
      ...data,
      categories: data.categories.map((c, ci) => ({
        ...c,
        sortOrder: ci,
        parameters: c.parameters.map((p, pi) => ({ ...p, sortOrder: pi })),
      })),
    }

    try {
      if (isEdit && templateId) {
        await updateTemplate.mutateAsync({ id: templateId, body: payload })
      } else {
        await createTemplate.mutateAsync(payload)
      }

    toast.success(isEdit ? 'Template updated' : 'Template created')
    navigate('/templates')
  } catch (err: any) {
    toast.error('Failed to save template', {
      description:
          err?.response?.data?.error ??
          'An unexpected error occurred',
      })
    }
  }

  if (isEdit && loadingExisting) {
    return <div className="p-6 text-center text-gray-500">Loading template...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/templates')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Edit Template' : 'Create Template'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onSubmitError)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                // placeholder="e.g. SaaS Vendor Evaluation"
                placeholder="Enter Template Name"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DA Type</label>
              <select
                {...register('daType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                {DA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.daType && (
                <p className="text-xs text-red-600 mt-1">{errors.daType.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional description..."
            />
          </div>
        </div>

        {/* Total Weightage Banner */}
        {/* <div
          className={cn(
            'px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between',
            totalWeightage === 100
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200',
          )}
        >
          <span>Total Template Weightage</span>
          <span>
            {totalWeightage}%{totalWeightage !== 100 && ' — must equal 100%'}
          </span>
        </div> */}

{/* {formError && (
  <div className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
    {formError}
  </div>
)} */}

        {/* Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Categories & Parameters
            </h2>
            <button
              type="button"
              onClick={() =>
                appendCategory({
                  name: '',
                  sortOrder: categoryFields.length,
                  parameters: [{ name: '', weightage: 10, sortOrder: 0 }],
                })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {categoryFields.map((catField, catIndex) => (
            <CategoryCard
              key={catField.id}
              catIndex={catIndex}
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              onRemove={() => removeCategory(catIndex)}
              canRemove={categoryFields.length > 1}
            />
          ))}

          {errors.categories?.message && (
            <p className="text-xs text-red-600">{errors.categories.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            // disabled={isSubmitting || totalWeightage !== 100}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function CategoryCard({
  catIndex,
  control,
  register,
  errors,
  watch,
  onRemove,
  canRemove,
}: {
  catIndex: number
  control: ReturnType<typeof useForm<FormData>>['control']
  register: ReturnType<typeof useForm<FormData>>['register']
  errors: ReturnType<typeof useForm<FormData>>['formState']['errors']
  watch: ReturnType<typeof useForm<FormData>>['watch']
  onRemove: () => void
  canRemove: boolean
}) {
  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({ control, name: `categories.${catIndex}.parameters` })

  const params = watch(`categories.${catIndex}.parameters`)
  const categoryWeightage = params?.reduce((sum, p) => sum + (p.weightage || 0), 0) ?? 0
  const catErrors = errors.categories?.[catIndex]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-300" />
          <input
            {...register(`categories.${catIndex}.name`)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Category name (e.g. Quality)"
          />
          {catErrors?.name && (
            <p className="text-xs text-red-600">{catErrors.name.message}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Category: {categoryWeightage}%
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-2">
        {paramFields.map((paramField, paramIndex) => (
          <div key={paramField.id} className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-gray-200 flex-shrink-0" />
            <input
              {...register(`categories.${catIndex}.parameters.${paramIndex}.name`)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Parameter name"
            />
            {catErrors?.parameters?.[paramIndex]?.name && (
              <p className="text-xs text-red-600 mt-1">
                {catErrors.parameters[paramIndex].name?.message}
              </p>
            )}

            <Controller
              control={control}
              name={`categories.${catIndex}.parameters.${paramIndex}.weightage`}
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WEIGHTAGE_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}%
                    </option>
                  ))}
                </select>
              )}
            />
            {paramFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeParam(paramIndex)}
                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {catErrors?.parameters?.message && (
          <p className="text-xs text-red-600">{catErrors.parameters.message}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          appendParam({ name: '', weightage: 10, sortOrder: paramFields.length })
        }
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Parameter
      </button>
    </div>
  )
}
