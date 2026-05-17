import { Component, input, output } from '@angular/core';
import { BestScore } from '../types/memory-game.types';

@Component({
  selector: 'app-win-modal',
  imports: [],
  templateUrl: './win-modal.html',
})
export class WinModalComponent {
  readonly moves = input.required<number>();
  readonly timeElapsed = input.required<number>();
  readonly bestScore = input.required<BestScore | null>();
  readonly isNewBest = input.required<boolean>();

  readonly playAgain = output<void>();

  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
