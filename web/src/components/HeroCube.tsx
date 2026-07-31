export function HeroCube() {
  return (
    <div className="hero-cube-scene" aria-hidden>
      <div className="hero-cube">
        <div className="hero-cube-face hero-cube-face--front" />
        <div className="hero-cube-face hero-cube-face--back" />
        <div className="hero-cube-face hero-cube-face--right" />
        <div className="hero-cube-face hero-cube-face--left" />
        <div className="hero-cube-face hero-cube-face--top" />
        <div className="hero-cube-face hero-cube-face--bottom" />
      </div>
      <div className="hero-cube-glow" />
    </div>
  )
}
