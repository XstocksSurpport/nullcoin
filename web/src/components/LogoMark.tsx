type LogoMarkProps = {
  size?: number
  className?: string
  variant?: 'default' | 'inverse' | 'onBlue'
  spark?: boolean
}

export function LogoMark({
  size = 42,
  className,
  variant = 'default',
  spark = false,
}: LogoMarkProps) {
  const ink = variant === 'default' ? '#0a0a0a' : '#ffffff'
  const sparkColor = variant === 'onBlue' ? '#b8ff3c' : '#2f4bff'
  const height = Math.round(size * 0.4)

  return (
    <svg
      className={className}
      width={size}
      height={height}
      viewBox="0 0 40 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="8" cy="8" r="5.25" fill={ink} />
      <line x1="13.5" y1="8" x2="26.5" y2="8" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      {spark && (
        <>
          <circle cx="20" cy="8" r="2" fill={sparkColor} />
          <circle cx="20" cy="8" r="3.5" fill={sparkColor} opacity="0.22" />
        </>
      )}
      <circle cx="32" cy="8" r="5.25" stroke={ink} strokeWidth="1.5" fill="none" />
    </svg>
  )
}
