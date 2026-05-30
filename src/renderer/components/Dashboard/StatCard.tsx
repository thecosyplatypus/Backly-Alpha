import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const colorMap: Record<string, { text: string; bg: string }> = {
  backly: { text: 'text-backly-400', bg: 'bg-backly-500' },
  green: { text: 'text-green-400', bg: 'bg-green-500' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-500' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500' },
  red: { text: 'text-red-400', bg: 'bg-red-500' },
  gray: { text: 'text-gray-400', bg: 'bg-gray-500' },
};

export default function StatCard({ title, value, subtitle, icon, color = 'backly', trend }: Props) {
  const colors = colorMap[color] || colorMap.backly;
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <div className="card card-hover relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${colors.bg}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${colors.text}`}>{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1 ${trend ? trendColors[trend] : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <span className={`text-2xl ${colors.text}/50`}>{icon}</span>
      </div>
    </div>
  );
}
