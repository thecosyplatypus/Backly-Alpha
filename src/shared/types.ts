export enum GameStatus {
  BACKLOG = 'BACKLOG',
  STARTED = 'STARTED',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  DROPPED = 'DROPPED',
  WISHLIST = 'WISHLIST',
}

export interface GameData {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  banner: string | null;
  platform: string | null;
  genre: string | null;
  developer: string | null;
  publisher: string | null;
  releaseDate: string | null;
  steamAppId: string | null;
  steamData: string | null;
  status: GameStatus;
  userRating: number | null;
  notes: string | null;
  tags: string | null;
  isFavourite: boolean;
  hoursPlayed: number;
  completionDate: string | null;
  createdAt: string;
  updatedAt: string;
  hltbMain: number | null;
  hltbMainExtra: number | null;
  hltbCompletionist: number | null;
  hltbData: string | null;
  hltbLastSync: string | null;
  achievementsData: string | null;
  lastPlayed: string | null;
  profileId: string;
}

export interface ProfileData {
  id: string;
  name: string;
  avatarUrl: string | null;
  steamId: string | null;
  steamUsername: string | null;
  steamAvatar: string | null;
  steamData: string | null;
  steamLastSync: string | null;
  settings: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SteamUserData {
  steamId: string;
  username: string;
  avatar: string;
  avatarFull: string;
  profileUrl: string;
}

export interface SteamGameData {
  appId: number;
  name: string;
  playtimeForever: number;
  playtime2Weeks: number;
  imgIconUrl: string;
  imgLogoUrl: string;
  hasCommunityVisibleStats: boolean;
  achievements: any[];
}

export interface HLTBData {
  gameId: number;
  name: string;
  mainStory: number;
  mainExtra: number;
  completionist: number;
  allStyles: number;
  url: string;
  imageUrl: string;
}

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  backlogCount: number;
  wishlistCount: number;
  completionPercent: number;
  totalHoursPlayed: number;
  completedThisYear: number;
  mostPlayedGenre: string;
  avgCompletionTime: number;
  isSteamSynced: boolean;
  totalBacklogEstimate: number;
  currentlyPlaying: number;
  startedCount: number;
  droppedCount: number;
  pausedCount: number;
  favouriteCount: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  imported: number;
  updated: number;
  errors: number;
}

export interface BacklogInsight {
  type: 'abandoned' | 'almostFinished' | 'shortest' | 'untouched' | 'bestUnplayed' | 'closeToCompletion';
  title: string;
  description: string;
  games: GameData[];
}

export interface Recommendation {
  game: GameData;
  reason: string;
  priority: number;
}

export interface IPCChannel {
  channel: string;
  args?: any[];
}

export type ActivityType =
  | 'game_started'
  | 'game_completed'
  | 'game_stopped'
  | 'added_to_backlog'
  | 'removed_from_backlog'
  | 'steam_import'
  | 'achievement_unlocked'
  | 'milestone_reached'
  | 'wheel_spin'
  | 'game_installed'
  | 'game_uninstalled'
  | 'game_favourited'
  | 'game_unfavourited'
  | 'challenge_completed'
  | 'long_game_finished'
  | 'backlog_cleared';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  gameId?: string | null;
  gameTitle?: string | null;
  icon: string;
  description: string;
  metadata?: string | null;
  createdAt: string;
}

export type BacklogHealthRating = 'healthy' | 'growing' | 'overloaded' | 'critical';

export interface BacklogHealth {
  rating: BacklogHealthRating;
  score: number;
  completionRate: number;
  unplayedRate: number;
  abandonedRate: number;
  startedVsFinished: number;
  totalGames: number;
  completedGames: number;
  unplayedGames: number;
  abandonedGames: number;
  message: string;
  tip: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  autoSync: boolean;
  syncInterval: number;
  notificationsEnabled: boolean;
  minimizeToTray: boolean;
  startOnBoot: boolean;
  language: string;
}
