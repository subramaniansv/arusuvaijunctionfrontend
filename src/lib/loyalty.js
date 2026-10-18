/**
 * Loyalty card (QR check-in) API hooks.
 *
 * Customer endpoints (JWT required):
 *   POST /api/loyalty/scan   -> raise a PENDING check-in for today
 *   GET  /api/loyalty        -> my card summary + visit history
 *
 * Admin endpoints (Admin JWT):
 *   GET   /api/admin/loyalty?status=&limit=&offset=
 *   PATCH /api/admin/loyalty?checkinId=&action=approve|reject[&note=]
 *
 * ApiResponse { success, message, data } is unwrapped to `data`.
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from './api'

// ---------------- customer ----------------

/** Fire a QR check-in. Returns { card, checkin, alreadyCheckedIn, message }. */
export function useLoyaltyScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/loyalty/scan')
      return res.data?.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty', 'card'] })
    },
  })
}

/** The signed-in user's card + history. */
export function useMyLoyaltyCard() {
  return useQuery({
    queryKey: ['loyalty', 'card'],
    queryFn: async () => {
      const res = await api.get('/api/loyalty')
      return res.data?.data
    },
    staleTime: 15_000,
  })
}

// ---------------- admin ----------------

export function useAdminLoyaltyCheckins({ limit = 20, offset = 0, status = '' } = {}) {
  return useQuery({
    queryKey: ['admin', 'loyalty', { limit, offset, status }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      if (status) params.set('status', status)
      const res = await api.get(`/api/admin/loyalty?${params.toString()}`)
      return res.data?.data
    },
    placeholderData: keepPreviousData,
    refetchInterval: 20_000, // keep the "is he there?" feed fresh
  })
}

export function useActionLoyaltyCheckin() {
  const qc = useQueryClient()
  return useMutation({
    // purchaseAmount (approve only): the in-store spend the admin records so the
    // visit earns points via the same order_point_rate used for online orders.
    mutationFn: async ({ checkinId, action, note, purchaseAmount }) => {
      const params = new URLSearchParams({ checkinId, action })
      const body = {}
      if (note) body.note = note
      if (purchaseAmount != null && purchaseAmount !== '') {
        body.purchaseAmount = Number(purchaseAmount)
      }
      const payload = Object.keys(body).length ? body : undefined
      const res = await api.patch(`/api/admin/loyalty?${params.toString()}`, payload)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'loyalty'] }),
  })
}

export const LOYALTY_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

/**
 * The absolute URL a loyalty QR should encode. Scanning it opens the SPA at
 * /loyalty?scan=1 which (after login if needed) fires the check-in.
 * Uses the public site origin so the printed QR works off any device.
 */
export function loyaltyScanUrl() {
  const base =
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base.replace(/\/$/, '')}/loyalty?scan=1`
}

// ---------------- redemption (points -> cash) ----------------

/** Current point->cash rate the customer sees. Returns { pointValueInr }. */
export function useLoyaltySettings() {
  return useQuery({
    queryKey: ['loyalty', 'settings'],
    queryFn: async () => {
      const res = await api.get('/api/loyalty/redeem/settings')
      return res.data?.data
    },
    staleTime: 60_000,
  })
}

/**
 * Server-side quote for spending points at online checkout. Clamps the
 * requested points to the balance + order total and returns the discount.
 * Returns { balance, pointValueInr, maxUsablePoints, pointsToUse, discount, payable }.
 */
export function useRedeemQuote({ points = 0, total = 0, enabled = true } = {}) {
  return useQuery({
    queryKey: ['loyalty', 'quote', { points, total }],
    queryFn: async () => {
      const params = new URLSearchParams({ points: String(points), total: String(total) })
      const res = await api.get(`/api/loyalty/redeem/quote?${params.toString()}`)
      return res.data?.data
    },
    enabled: enabled && total > 0,
    placeholderData: keepPreviousData,
    staleTime: 5_000,
  })
}

/** The signed-in user's redemption history. */
export function useMyRedemptions({ limit = 20, offset = 0 } = {}) {
  return useQuery({
    queryKey: ['loyalty', 'redemptions', { limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      const res = await api.get(`/api/loyalty/redeem?${params.toString()}`)
      return res.data?.data
    },
  })
}

/** Request an OFFLINE redemption (counter spend). Reserves points pending approval. */
export function useRequestOfflineRedemption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ points, note }) => {
      const res = await api.post('/api/loyalty/redeem/offline', { points, note })
      return res.data?.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty', 'card'] })
      qc.invalidateQueries({ queryKey: ['loyalty', 'redemptions'] })
    },
  })
}

// ---------------- admin: settings + redemption approvals ----------------

export function useAdminLoyaltySettings() {
  return useQuery({
    queryKey: ['admin', 'loyalty', 'settings'],
    queryFn: async () => {
      const res = await api.get('/api/admin/loyalty/redemptions/settings')
      return res.data?.data
    },
    staleTime: 30_000,
  })
}

export function useUpdateLoyaltyPointValue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pointValueInr }) => {
      const res = await api.put('/api/admin/loyalty/redemptions/settings', { pointValueInr })
      return res.data?.data
    },
    // The PUT response already echoes the saved value ({ pointValueInr }).
    // Write it straight into the cache so the admin UI reflects the new value
    // instantly, then force a refetch so every observer (incl. the customer
    // 'loyalty','settings' query) re-reads from the server rather than serving
    // its 30s-stale copy. invalidateQueries alone only marks stale — the active
    // refetch is what kills the "reads back as the old value" race.
    onSuccess: (data) => {
      if (data && data.pointValueInr != null) {
        qc.setQueryData(['admin', 'loyalty', 'settings'], data)
        qc.setQueryData(['loyalty', 'settings'], (prev) => ({
          ...(prev || {}),
          pointValueInr: data.pointValueInr,
        }))
      }
      qc.invalidateQueries({ queryKey: ['admin', 'loyalty', 'settings'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['loyalty', 'settings'], refetchType: 'all' })
      // Quotes depend on the rate — drop any cached quote so checkout re-quotes.
      qc.invalidateQueries({ queryKey: ['loyalty', 'quote'], refetchType: 'all' })
    },
  })
}

export function useAdminRedemptions({ limit = 20, offset = 0, status = '' } = {}) {
  return useQuery({
    queryKey: ['admin', 'loyalty', 'redemptions', { limit, offset, status }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      if (status) params.set('status', status)
      const res = await api.get(`/api/admin/loyalty/redemptions?${params.toString()}`)
      return res.data?.data
    },
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  })
}

export function useActionRedemption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ redemptionId, action, note }) => {
      const params = new URLSearchParams({ redemptionId, action })
      const body = note ? { note } : undefined
      const res = await api.patch(`/api/admin/loyalty/redemptions?${params.toString()}`, body)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'loyalty', 'redemptions'] }),
  })
}

export const REDEMPTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
