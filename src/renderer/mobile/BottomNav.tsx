import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  {
    path: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
      </svg>
    ),
  },
  {
    path: '/library',
    label: 'Library',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="4" y="3" width="4" height="18" rx="1" />
        <rect x="10" y="3" width="4" height="18" rx="1" />
        <path d="M16 4l4 1-3 16-4-1 3-16z" />
      </svg>
    ),
  },
  {
    path: '/spin-wheel',
    label: 'Wheel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 3v7M12 14v7M3 12h7M14 12h7" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0015 6l-.3-2.6h-4L10.4 6A8 8 0 009 7L6.5 6 4.5 9.5 6.6 11a7 7 0 000 2l-2.1 1.5 2 3.4L9 17a8 8 0 001.5 1l.3 2.6h4L15 18a8 8 0 001.5-1l2.4.9 2-3.4-2-1.5a7 7 0 00.1-1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const active = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
