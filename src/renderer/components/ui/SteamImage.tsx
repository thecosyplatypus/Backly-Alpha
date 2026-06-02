import React, { useState } from 'react'

const CDN_FORMATS = ['header.jpg', 'capsule_616x353.jpg', 'library_600x900.jpg', 'library_hero.jpg'];

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

export default function SteamImage({ src, appid: propAppid, alt, className = '', fallback }: Props) {
  const [failedCount, setFailedCount] = useState(0);

  if (!src) {
    if (fallback) return <img src={fallback} alt={alt} className={className} loading="lazy" />;
    return <Placeholder alt={alt} className={className} />;
  }

  const appid = propAppid || (typeof src === 'string' ? src.match(/\/steam\/apps\/(\d+)\//)?.[1] : null);
  const origFormat = CDN_FORMATS.find(f => src.includes(f));
  const altFormats = origFormat ? CDN_FORMATS.filter(f => f !== origFormat) : CDN_FORMATS;

  let imageSrc = src;
  if (failedCount > 0 && appid) {
    if (failedCount <= altFormats.length) {
      imageSrc = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/${altFormats[failedCount - 1]}`;
    } else {
      if (fallback) return <img src={fallback} alt={alt} className={className} loading="lazy" />;
      return <Placeholder alt={alt} className={className} />;
    }
  }

  const handleError = () => {
    console.warn('[SteamImage] Failed:', imageSrc, `(attempt ${failedCount + 1}/${CDN_FORMATS.length})`);
    setFailedCount(c => c + 1);
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  )
}
