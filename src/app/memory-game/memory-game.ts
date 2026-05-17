import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  BestScore,
  BestScores,
  Card,
  IMAGE_POOL,
  GameLevel,
  GamePhase,
  GameStatus,
  LEVEL_CONFIGS,
} from './types/memory-game.types';
import { CardComponent } from './card/card';
import { StatsBarComponent } from './stats-bar/stats-bar';
import { LevelSelectorComponent } from './level-selector/level-selector';
import { WinModalComponent } from './win-modal/win-modal';

const STORAGE_KEY = 'memory-game-best-scores';

@Component({
  selector: 'app-memory-game',
  imports: [CardComponent, StatsBarComponent, WinModalComponent, LevelSelectorComponent],
  templateUrl: './memory-game.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryGame {
  private readonly destroyRef = inject(DestroyRef);

  // === STAN ===
  private readonly _level = signal<GameLevel>('easy');
  private readonly _cards = signal<Card[]>([]);
  private readonly _moves = signal<number>(0);
  private readonly _timeElapsed = signal<number>(0);
  private readonly _phase = signal<GamePhase>('waitingForFirst');
  private readonly _status = signal<GameStatus>('idle');
  private readonly _bestScores = signal<BestScores>(this.loadBestScores());

  // === POMOCNICZE STANY (NIE-signal) ===
  private firstCardId: string | null = null;
  private noMatchTimeout: ReturnType<typeof setTimeout> | null = null;
  private gameTimer: ReturnType<typeof setInterval> | null = null;

  // === PUBLICZNE READ-ONLY ===
  protected readonly level = this._level.asReadonly();
  protected readonly cards = this._cards.asReadonly();
  protected readonly moves = this._moves.asReadonly();
  protected readonly timeElapsed = this._timeElapsed.asReadonly();
  protected readonly status = this._status.asReadonly();

  // === COMPUTED ===
  protected readonly levelConfig = computed(() => LEVEL_CONFIGS[this._level()]);

  protected readonly pairsFound = computed(
    () => this._cards().filter((c) => c.isMatched).length / 2,
  );

  protected readonly currentBestScore = computed(() => this._bestScores()[this._level()]);

  // Czy bieżący wynik jest nowym rekordem?
  protected readonly isNewBest = computed(() => {
    const current = this.currentBestScore();
    if (!current) return true; // brak rekordu = każde ukończenie to nowy
    return (
      this._moves() < current.moves ||
      (this._moves() === current.moves && this._timeElapsed() < current.timeElapsed)
    );
  });

  // === KONSTRUKTOR ===
  constructor() {
    this.startNewGame();

    // Auto-save best scores przy każdej zmianie
    effect(() => {
      const scores = this._bestScores();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    });

    // Cleanup przy zniszczeniu komponentu
    this.destroyRef.onDestroy(() => {
      this.stopTimer();
      this.clearNoMatchTimeout();
    });
  }

  // === AKCJE PUBLICZNE ===

  protected onCardClick(cardId: string): void {
    if (this._phase() === 'checking') return;

    const clickedCard = this._cards().find((c) => c.id === cardId);
    if (!clickedCard) return;
    if (clickedCard.isMatched || clickedCard.isFlipped) return;

    // Start timera przy pierwszym kliknięciu w grze
    if (this._status() === 'idle') {
      this._status.set('playing');
      this.startTimer();
    }

    this.flipCard(cardId);

    if (this._phase() === 'waitingForFirst') {
      this.firstCardId = cardId;
      this._phase.set('waitingForSecond');
    } else {
      this._moves.update((m) => m + 1);
      this._phase.set('checking');
      this.checkMatch(cardId);
    }
  }

  protected onLevelChange(level: GameLevel): void {
    this._level.set(level);
    this.startNewGame();
  }

  protected startNewGame(): void {
    this.clearNoMatchTimeout();
    this.stopTimer();

    this._cards.set(this.createShuffledCards());
    this._moves.set(0);
    this._timeElapsed.set(0);
    this._phase.set('waitingForFirst');
    this._status.set('idle');
    this.firstCardId = null;
  }

  // === LOGIKA WEWNĘTRZNA ===

  private flipCard(cardId: string): void {
    this._cards.update((cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, isFlipped: true } : card)),
    );
  }

  private checkMatch(secondCardId: string): void {
    const cards = this._cards();
    const first = cards.find((c) => c.id === this.firstCardId);
    const second = cards.find((c) => c.id === secondCardId);

    if (!first || !second) return;

    if (first.value === second.value) {
      this._cards.update((cards) =>
        cards.map((card) =>
          card.id === first.id || card.id === second.id ? { ...card, isMatched: true } : card,
        ),
      );
      this.resetAfterCheck();
      this.checkWinCondition();
    } else {
      this.noMatchTimeout = setTimeout(() => {
        this._cards.update((cards) =>
          cards.map((card) =>
            card.id === first.id || card.id === second.id ? { ...card, isFlipped: false } : card,
          ),
        );
        this.resetAfterCheck();
        this.noMatchTimeout = null;
      }, 1000);
    }
  }

  private resetAfterCheck(): void {
    this.firstCardId = null;
    this._phase.set('waitingForFirst');
  }

  private checkWinCondition(): void {
    const allMatched = this._cards().every((c) => c.isMatched);
    if (allMatched) {
      this._status.set('won');
      this.stopTimer();
      this.saveBestScoreIfNeeded();
    }
  }

  private saveBestScoreIfNeeded(): void {
    if (!this.isNewBest()) return;

    const newScore: BestScore = {
      moves: this._moves(),
      timeElapsed: this._timeElapsed(),
    };

    this._bestScores.update((scores) => ({
      ...scores,
      [this._level()]: newScore,
    }));
  }

  // === TIMER ===

  private startTimer(): void {
    this.stopTimer(); // safety
    this.gameTimer = setInterval(() => {
      this._timeElapsed.update((t) => t + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  private clearNoMatchTimeout(): void {
    if (this.noMatchTimeout) {
      clearTimeout(this.noMatchTimeout);
      this.noMatchTimeout = null;
    }
  }

  // === GENEROWANIE KART ===

  private createShuffledCards(): Card[] {
    const config = LEVEL_CONFIGS[this._level()];
    const emojis = IMAGE_POOL.slice(0, config.pairsCount);

    const cards: Card[] = [];
    for (const emoji of emojis) {
      cards.push(
        { id: crypto.randomUUID(), value: emoji, isFlipped: false, isMatched: false },
        { id: crypto.randomUUID(), value: emoji, isFlipped: false, isMatched: false },
      );
    }
    this.preloadImages(cards);
    return this.shuffle(cards);
  }

  private shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // === localStorage ===

  private loadBestScores(): BestScores {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.emptyBestScores();
      const parsed = JSON.parse(raw) as BestScores;
      // Walidacja minimalna — czy ma wszystkie klucze
      if (parsed.easy !== undefined && parsed.medium !== undefined && parsed.hard !== undefined) {
        return parsed;
      }
      return this.emptyBestScores();
    } catch {
      return this.emptyBestScores();
    }
  }

  private emptyBestScores(): BestScores {
    return { easy: null, medium: null, hard: null };
  }

  private preloadImages(cards: Card[]): void {
    const urls = new Set(cards.map((c) => c.value));

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }
}
