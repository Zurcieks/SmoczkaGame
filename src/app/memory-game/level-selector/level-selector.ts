import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GameLevel, LEVEL_CONFIGS } from '../types/memory-game.types';

@Component({
  selector: 'app-level-selector',
  imports: [],
  templateUrl: './level-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelSelectorComponent {
  readonly currentLevel = input.required<GameLevel>();
  readonly levelChange = output<GameLevel>();

  protected readonly levels: GameLevel[] = ['easy', 'medium', 'hard'];
  protected readonly levelConfigs = LEVEL_CONFIGS;
}
