/** "1 pt", "3 pts". */
export function formatPoints(points: number): string {
  return `${points} ${points === 1 ? 'pt' : 'pts'}`;
}

/** "1 point", "3 points" — for accessibility labels. */
export function spellPoints(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`;
}
