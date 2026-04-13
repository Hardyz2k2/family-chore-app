export const DIFFICULTY_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  easy: { label: 'Rookie', color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { label: 'Pro', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  hard: { label: 'Legend', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function getDifficultyLabel(difficulty: string): string {
  return DIFFICULTY_LABELS[difficulty]?.label || difficulty;
}

export function getDifficultyStyle(difficulty: string): string {
  const d = DIFFICULTY_LABELS[difficulty];
  return d ? `${d.bgColor} ${d.color}` : 'bg-gray-100 text-gray-700';
}
