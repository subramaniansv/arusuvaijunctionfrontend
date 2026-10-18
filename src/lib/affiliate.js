/**
 * Affiliate / referral (Share & Earn) API hooks.
 *
 * Customer endpoints (JWT required):
 *   POST /api/affiliate/links            -> create a shareable link
 *                                           body: { productId?, targetPath? }
 *   GET  /api/affiliate/links            -> my links + aggregate summary
 *
 * Public (no JWT):
 *   GET  /api/affiliate/track?ref=CODE   -> sets the 15-day aj_ref cookie and
 *                                           302-redirects. We never call this
 *                                           from JS; the shared URL points here
 *                                           so a visitor's browser carries the
 *                                           cookie through to register/login.
 *
 * Admin endpoints (Admin JWT):
 *   GET /api/admin/affiliate/settings
 *   PUT /api/admin/affiliate/settings    body (subset): {
 *       orderPointRate, referralPointRate, referralFlatPoints, referralWindowDays }
 *
 * ApiResponse { success, message, data } is unwrapped to `data`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

// ---------------- customer ----------------

/**
 * The signed-in user's affiliate links + rolled-up stats.
 * Returns { links: [...], totalClicks, totalConversions, totalPointsEarned }.
 * Each link carries { code, shareUrl, clicks, conversions, pointsEarned, ... }.
 */
export function useMyAffiliateLinks() {
  return useQuery({
    queryKey: ['affiliate', 'links'],
    queryFn: async () => {
      const res = await api.get('/api/affiliate/links')
      return res.data?.data
    },
    staleTime: 30_000,
  })
}

/**
 * Create a shareable referral link. `productId`/`targetPath` optional —
 * omit both for a generic site link. Returns { link: { shareUrl, ... } }.
 */
export function useCreateAffiliateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, targetPath } = {}) => {
      const body = {}
      if (productId) body.productId = productId
      if (targetPath) body.targetPath = targetPath
      const res = await api.post('/api/affiliate/links', body)
      return res.data?.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate', 'links'] })
    },
  })
}

/**
 * Convenience: return the user's first link, creating one lazily if they
 * have none yet. The Share & Earn card calls this so a brand-new customer
 * sees a ready-to-share link without an explicit "create" step.
 */
export function useEnsureAffiliateLink() {
  const { data, isLoading, isError, refetch } = useMyAffiliateLinks()
  const create = useCreateAffiliateLink()

  const links = data?.links || []
  const primary = links[0] || null

  const ensure = async () => {
    if (primary) return primary
    const out = await create.mutateAsync({ targetPath: '/' })
    return out?.link || null
  }

  return {
    summary: data,
    links,
    primary,
    isLoading,
    isError,
    refetch,
    ensure,
    creating: create.isPending,
  }
}

// ---------------- admin ----------------

export function useAdminAffiliateSettings() {
  return useQuery({
    queryKey: ['admin', 'affiliate', 'settings'],
    queryFn: async () => {
      const res = await api.get('/api/admin/affiliate/settings')
      return res.data?.data
    },
    staleTime: 30_000,
  })
}

/**
 * Update any subset of the rate config:
 *   { orderPointRate, referralPointRate, referralFlatPoints, referralWindowDays }
 */
export function useUpdateAffiliateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch) => {
      const res = await api.put('/api/admin/affiliate/settings', patch)
      return res.data?.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'affiliate', 'settings'] })
    },
  })
}
