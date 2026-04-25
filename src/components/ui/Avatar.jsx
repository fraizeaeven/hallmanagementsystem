import { getInitials } from '@/lib/helpers'

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizeClass = `avatar-${size}`
  if (src) return <img src={src} className={`avatar ${sizeClass} ${className}`} alt={name} />
  return (
    <div className={`avatar ${sizeClass} ${className}`} title={name}>
      {getInitials(name)}
    </div>
  )
}
