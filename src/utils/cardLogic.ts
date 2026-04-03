import type { CardSuit, CardRank } from '../types'

/**
 * Returns the playing card (suit + rank) that corresponds to a given date.
 * Ported from card.ts — kept identical so DB values always match.
 */
export function getCardFromDate(date: Date): { suit: CardSuit; rank: CardRank } {
  const month = date.getMonth() + 1
  const day   = date.getDate()
  const hour  = date.getHours()

  const suit: CardSuit =
    month >= 12 || month <= 2 ? '♠'
    : month >= 3 && month <= 5 ? '♥'
    : month >= 6 && month <= 8 ? '♦'
    : '♣'

  const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R']
  const rank = ranks[(day + hour) % ranks.length]

  return { suit, rank }
}
