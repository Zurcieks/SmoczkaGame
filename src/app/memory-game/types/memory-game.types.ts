export type GameLevel = 'easy' | 'medium' | 'hard';
export type GameStatus = 'idle' | 'playing' | 'won';
export type GamePhase = 'waitingForFirst' | 'waitingForSecond' | 'checking';

export interface LevelConfig {
  cols: number;
  rows: number;
  pairsCount: number;
  label: string;
}

export interface Card {
  id: string;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface BestScore {
  moves: number;
  timeElapsed: number;
}

export type BestScores = Record<GameLevel, BestScore | null>;

export const LEVEL_CONFIGS: Record<GameLevel, LevelConfig> = {
  easy: { cols: 4, rows: 4, pairsCount: 8, label: 'ez' },
  medium: { cols: 6, rows: 4, pairsCount: 12, label: 'troche trudne' },
  hard: { cols: 6, rows: 6, pairsCount: 18, label: 'Trudne  w chuj' },
};

export const IMAGE_POOL = [
  'cards/1.png',
  'cards/2.png',
  'cards/3.png',
  'cards/4.png',
  'cards/5.png',
  'cards/6.png',
  'cards/7.png',
  'cards/8.png',
  'cards/9.png',
  'cards/10.png',
  'cards/11.png',
  'cards/12.png',
  'cards/13.png',
  'cards/14.png',
  'cards/15.png',
  'cards/16.png',
  'cards/17.png',
  'cards/18.png',
];
