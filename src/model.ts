export const RATE = 10_000;
export const MAX_VALUE = 1_000_000;
export const PRESETS = [
  { name: 'Shallow', reserve: 10 },
  { name: 'Balanced', reserve: 100 },
  { name: 'Deep', reserve: 1000 },
] as const;

export function parsePositive(value: string): number | null {
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0.01 && number <= MAX_VALUE ? number : null;
}

export function simulate(amount: number, reserve: number, feePercent: number, slippagePercent: number) {
  if (![amount, reserve, feePercent, slippagePercent].every(Number.isFinite)
    || amount <= 0 || reserve <= 0 || feePercent < 0 || feePercent >= 100
    || slippagePercent < 0 || slippagePercent >= 100) throw new RangeError('Use positive reserves and trade sizes, and percentages from 0 up to 100.');
  const fee = amount * feePercent / 100;
  const effectiveInput = amount - fee;
  const output = reserve * RATE * effectiveInput / (reserve + effectiveInput);
  const impact = effectiveInput / (reserve + effectiveInput) * 100;
  return { output, impact, fee, minimum: output * (1 - slippagePercent / 100), averageRate: output / amount };
}

export const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat('en-US', {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
}).format(value);

export function formatTokens(value: number) {
  return value > 0 && value < 0.01 ? '< 0.01' : formatNumber(value);
}

export const impactLabel = (impact: number) => impact < 1 ? 'Small impact' : impact < 5 ? 'Noticeable impact' : 'High impact';
