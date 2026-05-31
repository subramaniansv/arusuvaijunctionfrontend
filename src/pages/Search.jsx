/**
 * Search page - dedicated full-text product search results.
 *
 * Reads `q` from the URL (?q=...) and renders matching products with
 * the same card grid + infinite scroll used on the catalogue. A
 * prominent search field at the top lets users refine without leaving
 * the page. An empty query shows a friendly prompt instead of results.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {  X, ArrowLeft } from 'lucide-react'

import {
  Container,
  Button,
  ProductCard,
  Skeleton,
  Alert,
  EmptyState,
} from '../components'
import { useProducts } from '../lib/products'
import { useAddToCart } from '../lib/cart'
import Seo from '../components/Seo'
import { breadcrumbLd } from '../lib/seo'
import { useAuthStore } from '../stores/authStore'
import noSearchImg from '../assets/empty state/no search.svg'
import './Search.css'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = (searchParams.get('q') || '').trim()
  const [term, setTerm] = useState(searchParams.get('q') || '')
  const inputRef = useRef(null)

  // Keep the field in sync when the URL query changes (e.g. the header
  // search drives navigation here).
  useEffect(() => {
    setTerm(searchParams.get('q') || '')
  }, [searchParams])

  // Focus the field when the page opens without a query.
  useEffect(() => {
    if (!q) inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    products,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useProducts({ q })

  /* ---- infinite scroll ---- */
  const sentinelRef = useRef(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return undefined
    if (typeof IntersectionObserver === 'undefined') return undefined
    if (!hasNextPage) return undefined

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length])

  /* ---- add to cart ---- */
  const addToCart = useAddToCart()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const navigate = useNavigate()
  const handleAddToCart = (productId) => {
    if (!isAuthed) {
      navigate('/login', { state: { from: { pathname: '/search' } } })
      return
    }
    const product = products.find((p) => (p.productId || p.id) === productId)
    addToCart.mutate({ productId, quantity: 1, product })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const next = term.trim()
    setSearchParams(next ? { q: next } : {})
  }

  return (
    <div className="search">
      <Seo
        title={q ? `Search results for “${q}”` : 'Search'}
        description="Search Arusuvai Junction\u2019s range of traditional Indian snacks: murukku, laddoos, mixture, sweets and more."
        path="/search"
        noindex
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Search', path: '/search' },
        ])}
      />

      <Container size="xl">
        <header className="search__head">
          <form className="search__form" role="search" onSubmit={onSubmit}>
            <button
              type="button"
              className="search__back"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <input
              ref={inputRef}
              type="search"
              className="search__input"
              placeholder="Search pickles, nuts, mix…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Search products"
            />
            {term && (
              <button
                type="button"
                className="search__clear"
                aria-label="Clear search"
                onClick={() => {
                  setTerm('')
                  inputRef.current?.focus()
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </form>

          {q && !isLoading && !isError && (
            <p className="search__count">
              {products.length === 0
                ? 'No products found'
                : `${products.length} result${products.length === 1 ? '' : 's'}`}
            </p>
          )}
        </header>

        {!q && (
          <EmptyState
            image={noSearchImg}
            imageAlt="Search"
            title="What are you craving?"
            description="Search by product name, category or flavour to find your favourite snacks."
          />
        )}

        {q && isError && (
          <Alert
            variant="danger"
            title="Couldn't run your search"
            action={<Button onClick={() => refetch()} size="sm">Retry</Button>}
          >
            Please check your connection and try again.
          </Alert>
        )}

        {q && isLoading && <SearchGridSkeleton />}

        {q && !isLoading && !isError && products.length === 0 && (
          <EmptyState
            image={noSearchImg}
            imageAlt="No results"
            title={`No matches for “${q}”`}
            description="Try a different spelling or browse the full catalogue."
            action={
              <Button as={Link} to="/products" variant="secondary">
                Browse all products
              </Button>
            }
          />
        )}

        {q && !isLoading && !isError && products.length > 0 && (
          <>
            <div className="search__grid">
              {products.map((p) => (
                <ProductCard
                  key={p.productId || p.id}
                  product={{ ...p, productId: p.productId || p.id }}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            {hasNextPage && (
              <>
                <div ref={sentinelRef} className="search__sentinel" aria-hidden="true" />
                <div className="search__more">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    loading={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading more' : 'Load more'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </Container>
    </div>
  )
}

function SearchGridSkeleton() {
  return (
    <div className="search__grid" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="search__skel" key={i}>
          <Skeleton width="100%" height={0} style={{ aspectRatio: '1 / 1' }} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="40%" height={20} />
        </div>
      ))}
    </div>
  )
}
