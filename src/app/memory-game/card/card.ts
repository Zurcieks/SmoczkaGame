import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Card } from '../types/memory-game.types';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  // Kazdy komponent karty przyjmuje obiekt typu Card jako input, który zawiera informacje o karcie, takie jak jej wartość, czy jest odwrócona, czy jest dopasowana itp. Ten obiekt jest używany do renderowania karty w szablonie i zarządzania jej stanem podczas gry.
  readonly card = input.required<Card>();

  // Komponent karty emituje zdarzenie kliknięcia, które jest wychwytywane przez komponent nadrzędny (MemoryGame). Kiedy karta jest kliknięta, komponent karty emituje swoje ID lub inną unikalną wartość, która pozwala komponentowi nadrzędnemu zidentyfikować, która karta została kliknięta i odpowiednio zareagować (np. odwrócić kartę, sprawdzić dopasowanie itp.).
  readonly cardClick = output<string>();

  protected onClick(): void {
    const c = this.card();

    if (c.isMatched || c.isFlipped) {
      return;
    }

    this.cardClick.emit(c.id);
  }
}
