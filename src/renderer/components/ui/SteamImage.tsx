import React, { useState } from 'react'

interface Props {
  appid?: string | number | null
  src?: string | null
  alt: string
  className?: string
  fallback?: string
}

function Placeholder({ alt, className }: { alt: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-surface-800/60 text-gray-600 ${className || ''}`}
      title={alt}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M21 15l-5-5L5 21" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </svg>
    </div>
  )
}

export default function SteamImage({ src, alt, className = '', fallback }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <Placeholder alt={alt} className={className} />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}
