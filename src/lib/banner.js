/**
 * Festival Banner hooks (React Query) — "spotlight" model.
 *
 * Only ONE festival is live at a time. Admin flips the spotlight; the active
 * festival's images power the public /festival page where visitors pick an
 * image, write a message and share a link.
 *
 * PUBLIC  — no token needed
 *   GET  /api/banner/festival                   → active festival + its images
 *   GET  /api/banner/festivals                  → active festival list (compat)
 *   GET  /api/banner/festivals/<slug>/images    → images for one festival
 *   GET  /api/banner/festivals/all/images       → all active images (home hero)
 *   GET  /api/banner/share/<slug>               → message + chosen bg image
 *   POST /api/banner/admin/messages             → create greeting → share slug
 *
 * ADMIN  — Bearer JWT + Admin role
 *   GET    /api/banner/admin/festivals          → all festivals (incl. inactive)
 *   POST   /api/banner/admin/festivals          → create festival (starts off)
 *   PUT    /api/banner/admin/festivals          → spotlight on / turn off
 *   GET    /api/banner/admin/images             → list images by festivalId
 *   POST   /api/banner/admin/images             → upload image (same bucket as products)
 *   DELETE /api/banner/admin/images             → disable image + purge from storage
 *   GET    /api/banner/admin/messages           → list all messages
 *   PUT    /api/banner/admin/messages           → toggle active
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import toast from 'react-hot-toast'

/* ─── PUBLIC ─────────────────────────────────────────────────────── */

/**
 * The spotlight: the single active festival + its images.
 * Returns { festival: {...}|null, images: [...] }.
 * festival === null means admin has nothing live right now.
 */
export function useActiveFestival() {
  return useQuery({
    queryKey: ['festival', 'active'],
    queryFn:  async () =>
      (await api.get('/api/banner/festival')).data?.data ?? { festival: null, images: [] },
    staleTime: 60_000,
  })
}

/** All active festival categories (compat — list form). */
export function useFestivals() {
  return useQuery({
    queryKey: ['festivals'],
    queryFn:  async () => (await api.get('/api/banner/festivals')).data?.data ?? [],
    staleTime: 10 * 60_000,
  })
}

/** ALL active images across ALL active festivals — home hero carousel. */
export function useAllFestivalImages() {
  return useQuery({
    queryKey: ['festival-images-all'],
    queryFn:  async () =>
      (await api.get('/api/banner/festivals/all/images')).data?.data ?? [],
    staleTime: 5 * 60_000,
  })
}

/** All active images for one festival slug. */
export function useFestivalImages(slug) {
  return useQuery({
    queryKey: ['festival-images', slug],
    queryFn:  async () =>
      (await api.get(`/api/banner/festivals/${slug}/images`)).data?.data ?? [],
    enabled:   !!slug,
    staleTime: 5 * 60_000,
  })
}

/** Resolve a share slug → message + background image. */
export function useShareMessage(slug) {
  return useQuery({
    queryKey: ['share-message', slug],
    queryFn:  async () => (await api.get(`/api/banner/share/${slug}`)).data?.data ?? null,
    enabled:   !!slug,
    retry:     false,
  })
}

/* ─── ADMIN — FESTIVALS ──────────────────────────────────────────── */

export function useAdminFestivals() {
  return useQuery({
    queryKey: ['admin', 'festivals'],
    queryFn:  async () =>
      (await api.get('/api/banner/admin/festivals')).data?.data ?? [],
    staleTime: 30_000,
  })
}

export function useCreateFestival() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) =>
      (await api.post('/api/banner/admin/festivals', body)).data?.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'festivals'] })
      qc.invalidateQueries({ queryKey: ['festivals'] })
      qc.invalidateQueries({ queryKey: ['festival', 'active'] })
    },
  })
}

/**
 * Spotlight toggle.
 *  active=true  → this festival goes live, all others turn off automatically.
 *  active=false → this festival turns off (nothing live after).
 * Optimistic: when enabling, flip this one on and every other one off.
 */
export function useSpotlightFestival() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ festivalId, active }) => {
      const qs = new URLSearchParams({ festivalId, active: String(active) })
      return (await api.put(`/api/banner/admin/festivals?${qs}`)).data
    },
    onMutate: async ({ festivalId, active }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'festivals'] })
      const prev = qc.getQueryData(['admin', 'festivals'])
      qc.setQueryData(['admin', 'festivals'], (old = []) =>
        old.map(f => {
          if (f.festivalId === festivalId) return { ...f, isActive: active }
          // Enabling one disables all others (mutually-exclusive spotlight)
          return active ? { ...f, isActive: false } : f
        })
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'festivals'], ctx.prev)
      toast.error('Could not update spotlight')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'festivals'] })
      qc.invalidateQueries({ queryKey: ['festivals'] })
      qc.invalidateQueries({ queryKey: ['festival', 'active'] })
    },
  })
}

/* ─── ADMIN — IMAGES ─────────────────────────────────────────────── */

export function useAdminFestivalImages(festivalId) {
  return useQuery({
    queryKey: ['admin', 'festival-images', festivalId],
    queryFn:  async () => {
      const res = await api.get(`/api/banner/admin/images?festivalId=${festivalId}`)
      return res.data?.data ?? []
    },
    enabled:   !!festivalId,
    staleTime: 15_000,
  })
}

export function useUploadFestivalImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ festivalId, file, label, displayOrder = 0 }) => {
      const form = new FormData()
      form.append('image', file)
      form.append('festivalId', festivalId)
      if (label) form.append('label', label)
      form.append('displayOrder', String(displayOrder))
      return (await api.post('/api/banner/admin/images', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data?.data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'festival-images', vars.festivalId] })
      qc.invalidateQueries({ queryKey: ['festival-images'] })
      qc.invalidateQueries({ queryKey: ['festival', 'active'] })
    },
  })
}

export function useDeleteFestivalImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ imageId }) =>
      (await api.delete(`/api/banner/admin/images?imageId=${imageId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'festival-images'] })
      qc.invalidateQueries({ queryKey: ['festival-images'] })
      qc.invalidateQueries({ queryKey: ['festival', 'active'] })
    },
  })
}

/* ─── ADMIN — MESSAGES ───────────────────────────────────────────── */

export function useAdminMessages() {
  return useQuery({
    queryKey: ['admin', 'messages'],
    queryFn:  async () =>
      (await api.get('/api/banner/admin/messages')).data?.data ?? [],
    staleTime: 15_000,
  })
}

export function useToggleMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ messageId, active }) => {
      const qs = new URLSearchParams({ messageId, active: String(active) })
      return (await api.put(`/api/banner/admin/messages?${qs}`)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'messages'] }),
  })
}
