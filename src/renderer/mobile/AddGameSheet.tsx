import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameStatus } from '../../shared/types';
import { useGameStore } from '../store/gameStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const statusOptions = [
  { value: GameStatus.BACKLOG, label: 'Backlog' },
  { value: GameStatus.STARTED, label: 'Started' },
  { value: GameStatus.PLAYING, label: 'Playing' },
  { value: GameStatus.ALMOST_COMPLETED, label: 'Almost completed' },
  { value: GameStatus.COMPLETED, label: 'Completed' },
  { value: GameStatus.PAUSED, label: 'Paused' },
  { value: GameStatus.DROPPED, label: 'Dropped' },
  { value: GameStatus.WISHLIST, label: 'Wishlist' },
];

const emptyForm = {
  title: '',
  platform: '',
  genre: '',
  developer: '',
  publisher: '',
  releaseDate: '',
  status: GameStatus.BACKLOG,
  hoursPlayed: '0',
  estimatedHours: '',
  userRating: '',
  coverArt: '',
  tags: '',
  notes: '',
};

export default function AddGameSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const createGame = useGameStore((s) => s.createGame);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError('');
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const set = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Enter a game title.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const game = await window.backly.createGame({
        ...form,
        title: form.title.trim(),
        hoursPlayed: Number(form.hoursPlayed) || 0,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
        userRating: form.userRating ? Number(form.userRating) : null,
      });
      await useGameStore.getState().fetchStats();
      onClose();
      navigate(`/game/${game.id}`);
    } catch (err: any) {
      setError(err?.message || 'Could not save this game.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close add game form"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-gold-500/20 bg-surface-900 px-5 pt-4 shadow-2xl mobile-sheet"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-600" />
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Add a game</h2>
            <p className="mt-1 text-xs text-gray-500">Saved on this device, no account needed.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-2xl text-gray-500" aria-label="Close">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <label className="mobile-field">
            <span>Title *</span>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="input w-full"
              placeholder="e.g. Hollow Knight"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="mobile-field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input w-full">
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="mobile-field">
              <span>Platform</span>
              <input value={form.platform} onChange={(e) => set('platform', e.target.value)} className="input w-full" placeholder="PC, PS5…" />
            </label>
            <label className="mobile-field">
              <span>Genre</span>
              <input value={form.genre} onChange={(e) => set('genre', e.target.value)} className="input w-full" placeholder="RPG" />
            </label>
            <label className="mobile-field">
              <span>Release date</span>
              <input type="date" value={form.releaseDate} onChange={(e) => set('releaseDate', e.target.value)} className="input w-full" />
            </label>
            <label className="mobile-field">
              <span>Hours played</span>
              <input type="number" inputMode="decimal" min="0" step="0.1" value={form.hoursPlayed} onChange={(e) => set('hoursPlayed', e.target.value)} className="input w-full" />
            </label>
            <label className="mobile-field">
              <span>Est. total hours</span>
              <input type="number" inputMode="decimal" min="0" step="1" value={form.estimatedHours} onChange={(e) => set('estimatedHours', e.target.value)} className="input w-full" placeholder="Optional" />
            </label>
          </div>

          <label className="mobile-field">
            <span>Developer</span>
            <input value={form.developer} onChange={(e) => set('developer', e.target.value)} className="input w-full" />
          </label>
          <label className="mobile-field">
            <span>Cover image URL</span>
            <input type="url" inputMode="url" value={form.coverArt} onChange={(e) => set('coverArt', e.target.value)} className="input w-full" placeholder="https://… (optional)" />
          </label>
          <label className="mobile-field">
            <span>Rating (0–10)</span>
            <input type="number" inputMode="numeric" min="0" max="10" step="1" value={form.userRating} onChange={(e) => set('userRating', e.target.value)} className="input w-full" placeholder="Optional" />
          </label>
          <label className="mobile-field">
            <span>Tags</span>
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input w-full" placeholder="co-op, story-rich" />
          </label>
          <label className="mobile-field">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input h-20 w-full resize-none" placeholder="Optional" />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">{error}</p>}

        <div className="sticky bottom-0 -mx-5 mt-5 flex gap-3 border-t border-white/[0.05] bg-surface-900/95 px-5 py-4 backdrop-blur-xl">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-[2] py-3 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add game'}
          </button>
        </div>
      </form>
    </div>
  );
}
