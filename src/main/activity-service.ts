import { BrowserWindow } from 'electron';
import { getDatabase } from './database';
import { ActivityType, ActivityEvent } from '../shared/types';

let mainWindowRef: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow | null) {
  mainWindowRef = win;
}

const activityIcons: Record<string, string> = {
  game_started: 'play',
  game_completed: 'check',
  game_stopped: 'stop',
  added_to_backlog: 'plus',
  removed_from_backlog: 'trash',
  steam_import: 'sync',
  achievement_unlocked: 'trophy',
  milestone_reached: 'award',
  wheel_spin: 'dice',
  game_installed: 'download',
  game_uninstalled: 'trash',
  game_favourited: 'heart',
  game_unfavourited: 'heart-off',
  challenge_completed: 'star',
  long_game_finished: 'clock',
  backlog_cleared: 'check-circle',
};

export async function createActivity(
  type: ActivityType,
  payload: {
    gameId?: string;
    gameTitle?: string;
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<ActivityEvent> {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) throw new Error('No profile found');

  const descriptions: Record<string, (title?: string, meta?: any) => string> = {
    game_started: (t) => t ? `Started playing ${t}` : 'Started a game',
    game_completed: (t) => t ? `Completed ${t}` : 'Completed a game',
    game_stopped: (t) => t ? `Stopped playing ${t}` : 'Stopped playing a game',
    added_to_backlog: (t, meta) => {
      const count = meta?.count || 1;
      return count > 1 ? `Added ${count} games to backlog` : t ? `Added ${t} to backlog` : 'Added a game to backlog';
    },
    removed_from_backlog: (t) => t ? `Removed ${t} from backlog` : 'Removed a game from backlog',
    steam_import: (_, meta) => `Imported ${meta?.count || 0} Steam games`,
    achievement_unlocked: (t, meta) => meta?.name ? `Earned "${meta.name}" achievement` : t ? `Unlocked achievement in ${t}` : 'Unlocked an achievement',
    milestone_reached: (_, meta) => `Reached ${meta?.milestone || ''} games completed!`,
    wheel_spin: (t) => t ? `Spin Wheel selected ${t}` : `Used the Spin Wheel`,
    game_installed: (t) => t ? `Installed ${t}` : 'Installed a game',
    game_uninstalled: (t) => t ? `Uninstalled ${t}` : 'Uninstalled a game',
    game_favourited: (t) => t ? `Favourited ${t}` : 'Favourited a game',
    game_unfavourited: (t) => t ? `Unfavourited ${t}` : 'Unfavourited a game',
    challenge_completed: (_, meta) => meta?.name ? `Completed challenge: ${meta.name}` : 'Completed a challenge',
    long_game_finished: (t, meta) => t ? `Finished a ${meta?.hours || ''}hour journey in ${t}` : 'Finished a long game',
    backlog_cleared: (_, meta) => `Cleared ${meta?.count || 0} backlog games`,
  };

  const description = payload.description || descriptions[type]?.(payload.gameTitle, payload.metadata) || 'Something happened';
  const metaStr = payload.metadata ? JSON.stringify(payload.metadata) : null;

  const record = await db.activity.create({
    data: {
      type,
      gameId: payload.gameId || null,
      gameTitle: payload.gameTitle || null,
      icon: activityIcons[type] || 'default',
      description,
      metadata: metaStr,
      profileId: profile.id,
    },
  });

  const event: ActivityEvent = {
    id: record.id,
    type: record.type as ActivityType,
    gameId: record.gameId,
    gameTitle: record.gameTitle,
    icon: record.icon,
    description: record.description,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
  };

  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('activity-update', event);
  }

  return event;
}

export async function getActivities(params?: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<{ activities: ActivityEvent[]; total: number }> {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return { activities: [], total: 0 };

  const where: any = { profileId: profile.id };
  if (params?.type) where.type = params.type;

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
      skip: params?.offset || 0,
    }),
    db.activity.count({ where }),
  ]);

  return {
    activities: activities.map(a => ({
      id: a.id,
      type: a.type as ActivityType,
      gameId: a.gameId,
      gameTitle: a.gameTitle,
      icon: a.icon,
      description: a.description,
      metadata: a.metadata,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
  };
}
