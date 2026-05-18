export default function GeometricPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M20 0 L40 20 L20 40 L0 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.4"
          />
          <circle cx="20" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
          <path
            d="M20 0 L20 40 M0 20 L40 20"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.2"
          />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#geo)" />
    </svg>
  )
}
