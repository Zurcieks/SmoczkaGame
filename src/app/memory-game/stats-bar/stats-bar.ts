import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stats-bar',
  imports: [],
  templateUrl: './stats-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsBarComponent {
  readonly moves = input.required<number>();
  readonly pairsFound = input.required<number>();
  readonly totalPairs = input.required<number>();
  readonly timeElapsed = input.required<number>();

  // Helper do formatowania czasu w minutach i sekundach
  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
