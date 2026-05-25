import { useBackgroundParticles } from '../../hooks/useDynamicBackground';

interface DynamicBackgroundProps {
  genre?: string | null;
  imageUrl?: string | null;
  children?: React.ReactNode;
}

export default function DynamicBackground({ genre, imageUrl, children }: DynamicBackgroundProps) {
  const particles = useBackgroundParticles(25);

  const genreGradients: Record<string, string> = {
    RPG: 'radial-gradient(ellipse at 20% 40%, rgba(76,29,149,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(105,10,204,0.15) 0%, transparent 50%)',
    Horror: 'radial-gradient(ellipse at 30% 40%, rgba(68,0,0,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(30,0,0,0.2) 0%, transparent 50%)',
    FPS: 'radial-gradient(ellipse at 20% 30%, rgba(200,0,0,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(255,69,0,0.1) 0%, transparent 50%)',
    Strategy: 'radial-gradient(ellipse at 25% 25%, rgba(0,0,139,0.2) 0%, transparent 50%), radial-gradient(ellipse at 75% 75%, rgba(30,60,180,0.1) 0%, transparent 50%)',
    Simulation: 'radial-gradient(ellipse at 30% 30%, rgba(139,69,19,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(160,120,60,0.1) 0%, transparent 50%)',
    Adventure: 'radial-gradient(ellipse at 20% 30%, rgba(34,139,34,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(60,179,113,0.1) 0%, transparent 50%)',
    Action: 'radial-gradient(ellipse at 40% 30%, rgba(255,69,0,0.15) 0%, transparent 50%), radial-gradient(ellipse at 60% 70%, rgba(200,50,0,0.1) 0%, transparent 50%)',
    Indie: 'radial-gradient(ellipse at 30% 40%, rgba(218,165,32,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(255,215,0,0.08) 0%, transparent 50%)',
  };

  const gradient = genre ? (genreGradients[genre] || genreGradients.RPG) : '';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base background */}
      <div className="absolute inset-0 bg-surface-950" />

      {/* Genre gradient */}
      {genre && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ background: gradient, opacity: 0.6 }}
        />
      )}

      {/* Image background */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.04]"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Ambient golden glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-600/3 rounded-full blur-[100px] animate-float-delayed" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gold-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `float ${6 + p.speed * 4}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {children}
    </div>
  );
}
