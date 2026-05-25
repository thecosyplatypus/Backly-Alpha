import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M4 6h16M4 12h16M4 18h12" />
    </svg>
  );
}

function BacklogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function PlayingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CompletedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function WheelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function AchievementsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="8" r="3" />
      <path d="M12 11v6M8 21h8" />
      <path d="M7 5l-2 2M17 5l2 2" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

const navItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/library', label: 'Library', icon: LibraryIcon },
  { path: '/recommendations', label: 'Suggestions', icon: PlayingIcon },
  { path: '/spin-wheel', label: 'Spin Wheel', icon: WheelIcon },
  { path: '/wrapped', label: 'Wrapped', icon: StatsIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

interface Props {
  mode: 'expanded' | 'icon-only' | 'overlay';
  overlayOpen: boolean;
  onToggleOverlay: () => void;
  onCloseOverlay: () => void;
}

export default function Sidebar({ mode, overlayOpen, onToggleOverlay, onCloseOverlay }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const isExpanded = mode === 'expanded';
  const showLabels = isExpanded;
  const sidebarWidth = isExpanded ? 'w-[220px]' : 'w-[68px]';

  const activeIndex = navItems.findIndex((item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  });

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`mb-6 flex ${showLabels ? 'px-4' : 'flex-col items-center'}`}>
        <div className={`flex items-center gap-3 ${showLabels ? '' : 'flex-col'}`}>
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-gold-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-gold-500/20 transition-transform duration-200 hover:scale-105">
            <span className="text-black font-bold text-base">B</span>
          </div>
          {showLabels && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white whitespace-nowrap">Backly</p>
              <p className="text-[8px] text-gray-500 tracking-wider uppercase whitespace-nowrap">Backlog Tracker</p>
            </div>
          )}
        </div>
      </div>

      {/* Active indicator */}
      {activeIndex >= 0 && (
        <div
          className="absolute left-0 w-[3px] h-9 rounded-r-full bg-gradient-to-b from-gold-400 to-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-400 ease-out sidebar-transition"
          style={{
            top: `${isExpanded ? 100 + activeIndex * 48 : 88 + activeIndex * 48}px`,
            opacity: activeIndex >= 0 ? 1 : 0,
          }}
        />
      )}

      {/* Nav items */}
      <nav className={`flex flex-col ${showLabels ? 'px-3' : 'items-center'} gap-0.5 w-full`}>
        {navItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (mode === 'overlay') onCloseOverlay();
              }}
              className={`group relative flex items-center w-full py-2.5 rounded-xl transition-all duration-200 sidebar-transition ${
                showLabels ? 'px-3 gap-3' : 'flex-col px-2.5'
              } ${
                isActive
                  ? 'text-gold-400 bg-gold-500/[0.06]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
              }`}
              title={!showLabels ? item.label : undefined}
            >
              <span className={`shrink-0 transition-all duration-200 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                <Icon />
              </span>
              {showLabels ? (
                <span className={`text-xs font-semibold tracking-wider transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'text-gold-400' : 'text-gray-500 group-hover:text-gray-400'
                }`}>
                  {item.label}
                </span>
              ) : (
                <>
                  <span className={`text-[7px] mt-1 font-semibold tracking-widest uppercase transition-all duration-200 ${
                    isActive ? 'text-gold-400' : 'text-gray-500 group-hover:text-gray-400'
                  }`}>
                    {item.label.slice(0, 4)}
                  </span>
                  <div className="sidebar-tooltip">
                    {item.label}
                  </div>
                </>
              )}
              {isActive && !showLabels && (
                <>
                  <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
                  <div className="absolute inset-0 rounded-xl bg-gold-500/[0.03]" />
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={`mt-auto ${showLabels ? 'px-3' : 'px-2.5'} w-full`}>
        <div className="h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent mb-2" />
        <button className={`group flex items-center w-full py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/[0.04] transition-all duration-200 sidebar-transition ${
          showLabels ? 'px-3 gap-3' : 'flex-col px-2.5'
        }`}>
          <span className="shrink-0 transition-all duration-200 group-hover:scale-110">
            <LogoutIcon />
          </span>
          {showLabels ? (
            <span className="text-xs font-semibold tracking-wider whitespace-nowrap">Logout</span>
          ) : (
            <span className="text-[7px] mt-1 font-semibold tracking-widest uppercase">Exit</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`${sidebarWidth} flex-shrink-0 bg-surface-950/95 backdrop-blur-xl border-r border-white/[0.04] flex flex-col py-5 relative z-10 sidebar-transition overflow-hidden ${
          isExpanded ? '' : 'items-center'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {mode === 'overlay' && (
        <>
          <button
            onClick={onToggleOverlay}
            className="fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-surface-800 border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white sidebar-transition lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div
            className={`sidebar-overlay ${overlayOpen ? 'open' : ''}`}
            onClick={onCloseOverlay}
          >
            <aside
              className={`w-[220px] h-full bg-surface-950 border-r border-white/[0.04] flex flex-col py-5 relative z-10 overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: overlayOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {sidebarContent}
            </aside>
          </div>
        </>
      )}
    </>
  );
}
