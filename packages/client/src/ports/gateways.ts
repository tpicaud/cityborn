import type {
  ApiResult,
  CategoryTree,
  CreateSession,
  Game,
  GameRecord,
  Session,
  User,
} from '@cityborn/api';

export interface SessionGateway {
  createSession(data: CreateSession): Promise<ApiResult<Session>>;
  fetchSession(sessionID: string): Promise<ApiResult<Session>>;
  createSoloGame(session: Session): Promise<ApiResult<Game>>;
  finalizeGame(session: Session): Promise<ApiResult<void>>;
}

export interface CategoryGateway {
  fetchCategoryTrees(): Promise<ApiResult<CategoryTree[]>>;
}

export interface UserGateway {
  getGameRecords(): Promise<ApiResult<GameRecord[]>>;
}

export interface AuthGateway {
  getCurrentUser(): Promise<User | null>;
}
