import { LogoMark } from './LogoMark'

type LogoProps = {
  showWordmark?: boolean
  markSize?: number
  className?: string
  variant?: 'default' | 'inverse' | 'onBlue'
}

export function Logo({
  showWordmark = true,
  markSize = 42,
  className = '',
  variant = 'default',
}: LogoProps) {
  if (!showWordmark) {
    return (
      <span className={`logo ${className}`.trim()}>
        <LogoMark size={markSize} variant={variant} className="logo-mark" />
      </span>
    )
  }

  return (
    <span className={`logo ${className}`.trim()}>
      <span className="logo-word">null</span>
      <LogoMark size={markSize} variant={variant} spark={false} className="logo-mark" />
      <span className="logo-word">llnu</span>
    </span>
  )
}
