interface SteamAPI {
  authenticate: () => Promise<any>;
  library: () => Promise<any>;
  achievements: (gameId: string) => Promise<any>;
}

interface RawgAPI {
  enrich: (gameId: string) => Promise<any>;
}

interface DbAPI {
  games: () => Promise<{ success: boolean; games: any[] }>;
  add: (gameData: any) => Promise<{ success: boolean; id: number }>;
}

interface CompletionAPI {
  refresh: () => Promise<{ success: boolean }>;
}

interface WheelAPI {
  spin: () => Promise<{ success: boolean; result: any[] }>;
}

interface SettingsAPI {
  get: () => Promise<{ success: boolean; settings: any }>;
  set: (settings: any) => Promise<{ success: boolean }>;
}

interface ActivityAPI {
  get: () => Promise<{ success: boolean; activities: any[] }>;
}

interface UserAPI {
  profile: () => Promise<{ success: boolean; user: any }>;
}

interface WindowAPI {
  getState: () => Promise<any>;
  setState: (state: any) => Promise<{ success: boolean }>;
}

interface EnvAPI {
  NODE_ENV: string;
  VERSION: string;
}

interface ElectronAPI {
  steam: SteamAPI;
  rawg: RawgAPI;
  db: DbAPI;
  completion: CompletionAPI;
  wheel: WheelAPI;
  settings: SettingsAPI;
  activity: ActivityAPI;
  user: UserAPI;
  window: WindowAPI;
  env: EnvAPI;
}

interface Window {
  electron: ElectronAPI;
}
