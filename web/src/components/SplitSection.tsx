import type { ReactNode } from 'react'

type SplitSectionProps = {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}

export function SplitSection({
  eyebrow,
  title,
  lead,
  children,
  className = '',
  id,
}: SplitSectionProps) {
  return (
    <section id={id} className={`split-section ${className}`.trim()}>
      <div className="split-rail">
        <p className="split-eyebrow">/{eyebrow}</p>
        <h2 className="split-title">{title}</h2>
        {lead && <div className="split-lead">{lead}</div>}
      </div>
      <div className="split-body">{children}</div>
    </section>
  )
}
