/**
 * Ornament — a tiny, reusable gold four-petal floral ornament (inline SVG).
 *
 * Reused across the postcard frame so every festival card (Diwali, birthday,
 * thank-you, …) shares the same decoration without duplicating the SVG:
 *   • <Ornament variant="divider" /> → centred on the vertical divider; the
 *     cream backing disc "cuts" the line around it.
 *   • <Ornament variant="rule" />    → placed before/after the message text.
 *   • <Ornament />                    → bare ornament, no backing disc.
 *
 * Colours come from CSS variables (--gold / --paper) so the frame is themeable.
 */
export default function Ornament({ variant = 'bare', size = 30, className = '' }) {
  return (
    <span className={`pc-ornament pc-ornament--${variant} ${className}`.trim()} aria-hidden="true">
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="var(--gold, #B88720)">
          {/* top petal */}
          <path d="M20 20 C14 16 15 10 20 6 C25 10 26 16 20 20" />
          {/* right petal */}
          <path d="M20 20 C24 14 30 15 34 20 C30 25 24 26 20 20" />
          {/* bottom petal */}
          <path d="M20 20 C26 24 25 30 20 34 C15 30 14 24 20 20" />
          {/* left petal */}
          <path d="M20 20 C16 26 10 25 6 20 C10 15 16 14 20 20" />
          {/* centre */}
          <circle cx="20" cy="20" r="2.5" />
        </g>
      </svg>
    </span>
  )
}
