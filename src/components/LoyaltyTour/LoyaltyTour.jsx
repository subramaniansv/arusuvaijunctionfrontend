/**
 * LoyaltyTour component
 * 
 * A guided tour for the new loyalty points feature with:
 * - Desktop: Modal overlay with content cards
 * - Mobile: Fullscreen experience
 * - Three pages: Introduction, How to Earn, Benefits
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Gift, ShoppingBag, Store, Coins } from 'lucide-react'
import './LoyaltyTour.css'
import welcomeImg from '../../assets/empty state/welcome.svg'
import howToEarnImg from '../../assets/empty state/howtoearn.svg'
import pointsImg from '../../assets/empty state/25points.svg'

const TOUR_PAGES = [
  {
    id: 'intro',
    title: 'Welcome to Loyalty Rewards! 🎉',
    description: 'Earn points with every purchase and store visit, then redeem them for discounts on your next order.',
    image: welcomeImg,
    color: '#2c5c1a',
  },
  {
    id: 'earn-online',
    title: 'Earn Points Online',
    description: 'Shop online and earn points automatically with every purchase.',
    image: howToEarnImg,
    color: '#e9a820',
    features: [
      {
        icon: ShoppingBag,
        label: 'Online Purchases',
        detail: 'Earn points automatically when you order online',
      },
    ],
  },
  {
    id: 'earn-offline',
    title: 'Earn Points In-Store',
    description: 'Visit our physical store and check in to earn points.',
    image: howToEarnImg,
    color: '#e9a820',
    features: [
      {
        icon: Store,
        label: 'Store Check-ins',
        detail: 'Get points for visiting our physical store',
      },
    ],
  },
  {
    id: 'gift',
    title: 'Welcome Gift! 🎁',
    description: 'Start your journey with us! Get 25 free points as a special gift for your family.',
    image: pointsImg,
    color: '#2c5c1a',
    isGiftPage: true,
  },
]

export function LoyaltyTour({ isOpen, onClose, onComplete }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleEscape)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setCurrentPage(0)
      onClose?.()
    }, 300)
  }

  const handleNext = () => {
    if (currentPage < TOUR_PAGES.length - 1) {
      setCurrentPage(currentPage + 1)
    } else {
      onComplete?.()
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (!isOpen) return null

  const page = TOUR_PAGES[currentPage]
  const IconComponent = page.icon
  const isLastPage = currentPage === TOUR_PAGES.length - 1

  return createPortal(
    <div 
      className={`loyalty-tour__overlay ${isClosing ? 'is-closing' : ''}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`loyalty-tour__container ${isClosing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >

        {/* Close button - desktop only */}
        <button
          type="button"
          className="loyalty-tour__close"
          onClick={handleClose}
          aria-label="Close tour"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="loyalty-tour__content">
          {/* Image - aspect ratio 4:3 recommended (800x600px) */}
          <div 
            className="loyalty-tour__image" 
            style={{ 
              backgroundImage: `url(${page.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
          </div>

          {/* Title */}
          <h2 className="loyalty-tour__title" id="tour-title">
            {page.title}
          </h2>

          {/* Description */}
          <p className="loyalty-tour__description">
            {page.description}
          </p>

          {/* Features (for "How to Earn" page only) */}
          {page.features && !page.isGiftPage && (
            <div className="loyalty-tour__features">
              {page.features.map((feature, idx) => {
                const FeatureIcon = feature.icon
                return (
                  <div key={idx} className="loyalty-tour__feature">
                    <div className="loyalty-tour__feature-icon">
                      <FeatureIcon size={20} />
                    </div>
                    <div className="loyalty-tour__feature-content">
                      <strong>{feature.label}</strong>
                      <p>{feature.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Highlight (for gift page) */}
          {page.highlight && page.isGiftPage && (
            <div className="loyalty-tour__highlight loyalty-tour__highlight--gift">
              {page.highlight}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="loyalty-tour__footer">
          {/* Progress dots */}
          <div className="loyalty-tour__dots">
            {TOUR_PAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`loyalty-tour__dot ${idx === currentPage ? 'is-active' : ''}`}
                onClick={() => setCurrentPage(idx)}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="loyalty-tour__nav">
            <button
              type="button"
              className="loyalty-tour__btn loyalty-tour__btn--secondary"
              onClick={handlePrev}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <button
              type="button"
              className="loyalty-tour__btn loyalty-tour__btn--primary"
              onClick={handleNext}
            >
              {isLastPage ? 'Get Started' : 'Next'}
              {!isLastPage && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
