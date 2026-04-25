export enum SessionMode {
  SOLO = 'solo',
  MULTI = 'multi',
}

export enum SessionStatus {
  IN_LOBBY = 'IN_LOBBY',
  IN_GAME = 'IN_GAME',
  FINISHED = 'FINISHED',
}

export enum GameStatus {
  STARTING = 'STARTING',
  IN_GAME = 'IN_GAME',
  IN_RESULTS = 'IN_RESULTS',
  FINISHED = 'FINISHED',
}

export enum RoundStatus {
  GUESSING = 'GUESSING',
  SHOWING_RESULTS = 'SHOWING_RESULTS',
}

export enum ScoreType {
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  BAD = 'BAD',
}
