import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTokens, parsePositive, simulate } from '../src/model.ts';

test('zero-fee equal-reserve trade returns half the token pool', () => {
  const quote = simulate(100, 100, 0, 0);
  assert.equal(quote.output, 500_000);
  assert.equal(quote.impact, 50);
  assert.equal(quote.minimum, quote.output);
});

test('default quote matches independently calculated constant-product result', () => {
  const quote = simulate(5, 100, 0.3, 0.5);
  assert.ok(Math.abs(quote.output - (1_000_000 - 100_000_000 / 104.985)) < 1e-8);
  assert.ok(Math.abs(quote.fee - 0.015) < 1e-12);
  assert.ok(Math.abs(quote.minimum - quote.output * 0.995) < 1e-8);
});

test('more liquidity improves output and reduces impact without changing spot price', () => {
  const a = simulate(5, 100, 0.3, 0.5), b = simulate(5, 200, 0.3, 0.5);
  assert.ok(b.output > a.output);
  assert.ok(b.impact < a.impact);
  assert.equal(b.fee, a.fee);
});

test('slippage only changes minimum; higher fees reduce output', () => {
  const a = simulate(5, 100, 0.3, 0.5), b = simulate(5, 100, 0.3, 3);
  assert.equal(b.output, a.output);
  assert.equal(b.impact, a.impact);
  assert.ok(b.minimum < a.minimum);
  assert.ok(simulate(5, 100, 1, 0.5).output < a.output);
});

test('boundary inputs stay finite, positive and below pool reserves', () => {
  for (const reserve of [0.01, 10, 100, 1000, 1_000_000]) {
    for (const amount of [0.01, 5, 1_000_000]) {
      const result = simulate(amount, reserve, 1, 3);
      assert.ok(Number.isFinite(result.output) && result.output > 0 && result.output < reserve * 10_000);
      assert.ok(result.impact > 0 && result.impact < 100);
      assert.ok(result.minimum < result.output);
    }
  }
});

test('invalid and ambiguous inputs are rejected; small estimates remain meaningful', () => {
  for (const invalid of ['', ' ', '0', '-1', 'NaN', 'Infinity', '1e5', '1,000', '1.2.3', '1000001', '0.001']) assert.equal(parsePositive(invalid), null);
  assert.equal(parsePositive('0.01'), 0.01);
  assert.equal(parsePositive('1000000'), 1_000_000);
  assert.equal(parsePositive(' 10.50 '), 10.5);
  assert.equal(parsePositive('.5'), 0.5);
  assert.equal(formatTokens(0.001), '< 0.01');
  assert.throws(() => simulate(0, 100, 0.3, 1), RangeError);
  assert.throws(() => simulate(1, 100, 100, 1), RangeError);
});
