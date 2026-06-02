import React from 'react';

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-lg md:max-w-2xl group">
      <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-gold-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center">
        <svg className="absolute left-3 md:left-5 w-4 md:w-5 h-4 md:h-5 text-gray-500 group-focus-within:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-surface-800/50 backdrop-blur-sm border border-white/[0.06] rounded-xl md:rounded-2xl pl-9 md:pl-12 pr-3 md:pr-5 py-2.5 md:py-3.5 text-[11px] md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/30 focus:shadow-[0_0_20px_rgba(234,179,8,0.08)] transition-all duration-300"
        />
        <div className="absolute right-2 md:right-3 flex items-center gap-2">
          <kbd className="hidden sm:inline-flex px-1.5 md:px-2 py-0.5 md:py-1 text-[8px] md:text-[10px] font-medium text-gray-500 bg-surface-700/50 rounded-md border border-white/5">Ctrl+K</kbd>
        </div>
      </div>
    </div>
  );
}
