import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { templatesApi } from '@/api/templates'
import type { CreateTemplateRequest, UpdateTemplateRequest } from '@/types/da-types'

const TEMPLATES_KEY = ['templates'] as const

export function useTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: () => templatesApi.list(),
  })
}

export function useTemplate(id: number | undefined) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTemplateRequest) => templatesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTemplateRequest }) =>
      templatesApi.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: TEMPLATES_KEY })
      qc.invalidateQueries({ queryKey: ['template', id] })
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => templatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })
}

export function usePublishTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => templatesApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })
}

export function useUnpublishTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => templatesApi.unpublish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })
}
