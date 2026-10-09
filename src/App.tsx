import { useEffect, useState } from 'react';
import { formatNumber, formatTokens, impactLabel, parsePositive, PRESETS, RATE, simulate } from './model';

function Icon({ name, className = '' }: { name: 'pool' | 'arrow' | 'reset' | 'plus' | 'info'; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'pool' && <><ellipse cx="12" cy="6" rx="9" ry="4" /><path d="M3 12c0 2.2 4 4 9 4s9-1.8 9-4M3 18c0 2.2 4 4 9 4s9-1.8 9-4" /></>}
    {name === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
    {name === 'reset' && <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>}
    {name === 'plus' && <path d="M12 5v14M5 12h14" />}
    {name === 'info' && <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>}
  </svg>;
}

function ImpactChart({ amount, reserve, fee, compare }: { amount: number; reserve: number; fee: number; compare: boolean }) {
  const maxX = Math.max(10, amount * 2);
  const maxY = Math.max(1, Math.ceil(simulate(maxX, reserve, fee, 0).impact / 5) * 5);
  const left = 6, right = 554, top = 12, bottom = 202;
  const x = (n: number) => left + n / maxX * (right - left);
  const y = (n: number) => bottom - n / maxY * (bottom - top);
  const path = (liquidity: number) => Array.from({ length: 81 }, (_, i) => {
    const a = maxX * i / 80;
    const impact = a === 0 ? 0 : simulate(a, liquidity, fee, 0).impact;
    return `${i === 0 ? 'M' : 'L'}${x(a).toFixed(2)},${y(impact).toFixed(2)}`;
  }).join(' ');
  const current = simulate(amount, reserve, fee, 0).impact;
  const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  return <div className="chart-wrap">
    <div className="chart-axis-label">Price impact (%)</div>
    <div className="chart-axes"><div className="chart-y-labels" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <span key={i}>{compact(maxY * i / 4)}</span>)}</div>
    <svg className="impact-chart" viewBox="0 0 560 214" role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">Trade size and price impact</title>
      <desc id="chart-desc">At {formatNumber(amount)} ETH, price impact is {formatNumber(current)} percent. Bigger swaps have more impact. {compare ? `With twice the liquidity, impact falls to ${formatNumber(simulate(amount, reserve * 2, fee, 0).impact)} percent.` : ''}</desc>
      {[0, 1, 2, 3, 4].map(i => <g key={i}>
        <line x1={left} x2={right} y1={y(maxY * i / 4)} y2={y(maxY * i / 4)} className="chart-grid" />
      </g>)}
      <path d={`${path(reserve)} L${right},${bottom} L${left},${bottom} Z`} className="chart-fill" />
      <path d={path(reserve)} className="chart-line" />
      {compare && <path d={path(reserve * 2)} className="chart-compare" />}
      <line x1={x(amount)} x2={x(amount)} y1={y(current)} y2={bottom} className="chart-guide" />
      <circle cx={x(amount)} cy={y(current)} r="6" className="chart-dot" />
      {compare && <circle cx={x(amount)} cy={y(simulate(amount, reserve * 2, fee, 0).impact)} r="4" className="compare-dot" />}
    </svg><div className="chart-x-labels" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <span key={i}>{compact(maxX * i / 4)}</span>)}</div></div>
    <div className="chart-bottom"><span><i className="legend-dot" />Your pool{compare && <span className="compare-legend"><i />2× liquidity</span>}</span><span>Trade size (ETH)</span></div>
  </div>;
}

export default function App() {
  const [amountText, setAmountText] = useState('5');
  const [reserveText, setReserveText] = useState('100');
  const [fee, setFee] = useState(0.3);
  const [slippage, setSlippage] = useState(0.5);
  const [compare, setCompare] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const amount = parsePositive(amountText);
  const reserve = parsePositive(reserveText);
  const result = amount !== null && reserve !== null ? simulate(amount, reserve, fee, slippage) : null;
  const doubled = result && amount !== null && reserve !== null ? simulate(amount, reserve * 2, fee, slippage) : null;
  const error = 'Enter a number from 0.01 to 1,000,000. Use a decimal point and no commas.';
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(result
      ? `Estimated output ${formatTokens(result.output)} UNIT. Price impact ${formatNumber(result.impact)} percent.${compare && doubled ? ` With twice the liquidity: ${formatTokens(doubled.output)} UNIT.` : ''}`
      : 'Check the highlighted fields to see your swap estimate.'), 450);
    return () => clearTimeout(timer);
  }, [amountText, reserveText, fee, slippage, compare]); // Values are derived from these five inputs.

  function reset() {
    setAmountText('5'); setReserveText('100'); setFee(0.3); setSlippage(0.5); setCompare(false);
    setAnnouncement('Example reset.');
  }

  return <div className="page-shell">
    <a className="skip-link" href="#sandbox">Skip to swap sandbox</a>
    <header className="site-header">
      <div className="wordmark"><span className="brand-icon"><Icon name="pool" /></span><span>pool<span className="wordmark-light">lab</span><span className="brand-period">.</span></span></div>
      <div className="header-caption">A little clarity before the swap.</div>
      <span className="offline-badge"><span aria-hidden="true" />Runs offline</span>
    </header>

    <main>
      <section className="intro" aria-labelledby="page-title">
        <div><p className="eyebrow"><span className="eyebrow-line" />The Ethereum swap sandbox</p><h1 id="page-title">Small swap.<br /> <span>Big ripple.</span></h1></div>
        <div className="intro-copy"><p>Every swap moves a pool.<br /> See how size, liquidity and fees shape what you receive.</p><span className="simulation-label"><span aria-hidden="true">◇</span> Simulated tokens. Real math.</span></div>
      </section>

      <div className="workspace" id="sandbox" tabIndex={-1}>
        <section className="setup-panel" aria-labelledby="setup-title">
          <div className="panel-heading"><h2 id="setup-title">Set up your swap</h2><span className="section-number">01</span></div>
          <fieldset className="presets"><legend>Choose a pool</legend><div className="preset-grid">{PRESETS.map(p => <button type="button" key={p.name} aria-pressed={reserve === p.reserve} onClick={() => setReserveText(String(p.reserve))}><span>{p.name}</span><small>{formatNumber(p.reserve, 0)} ETH</small></button>)}</div></fieldset>
          <div className="field pool-field"><label htmlFor="reserve">Pool’s ETH reserve</label><div className={`input-shell ${reserve === null ? 'invalid' : ''}`}><input id="reserve" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={reserveText} onChange={e => setReserveText(e.target.value)} aria-invalid={reserve === null} aria-describedby={reserve === null ? 'reserve-error' : 'reserve-hint'} /><span>ETH</span></div>{reserve === null ? <p className="field-error" id="reserve-error">{error}</p> : <p className="field-hint" id="reserve-hint">Paired with {formatNumber(reserve * RATE, 0)} UNIT</p>}</div>
          <div className="field trade-field"><label htmlFor="amount">You swap</label><div className={`input-shell trade-input ${amount === null ? 'invalid' : ''}`}><input id="amount" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={amountText} onChange={e => setAmountText(e.target.value)} aria-invalid={amount === null} aria-describedby={amount === null ? 'amount-error' : 'amount-hint'} /><span className="asset-label"><span className="eth-gem" aria-hidden="true">◆</span> ETH</span></div>
            {amount === null && <p className="field-error" id="amount-error">{error}</p>}
            <label htmlFor="amount-range" className="sr-only">Adjust trade size in ETH</label><input id="amount-range" type="range" min="0.01" max={Math.max(25, amount ?? 25)} step="0.01" value={amount ?? 0.01} aria-valuetext={`${amount ?? 0.01} ETH`} onChange={e => setAmountText(e.target.value)} />
            <div className="range-labels" id="amount-hint"><span>0.01 ETH</span><span>{formatNumber(Math.max(25, amount ?? 25), 0)} ETH</span></div>
          </div>
          <div className="settings-grid"><div className="field"><label htmlFor="fee">Pool fee</label><select id="fee" value={fee} onChange={e => setFee(Number(e.target.value))}><option value="0">0%</option><option value="0.05">0.05%</option><option value="0.3">0.3%</option><option value="1">1%</option></select></div><div className="field"><label htmlFor="slippage">Slippage buffer</label><select id="slippage" value={slippage} onChange={e => setSlippage(Number(e.target.value))}><option value="0.1">0.1%</option><option value="0.5">0.5%</option><option value="1">1%</option><option value="3">3%</option></select></div></div>
          <div className="setup-footer"><span><Icon name="info" />Updates as you explore</span><button type="button" className="reset-button" onClick={reset}><Icon name="reset" />Reset</button></div>
        </section>

        <section className="results-panel" aria-labelledby="result-title">
          <div className="panel-heading"><h2 id="result-title">The ripple effect</h2><span className="model-badge">Constant-product model</span></div>
          {result && amount !== null && reserve !== null ? <>
            <div className="quote"><p className="quote-label">Estimated tokens received <Icon name="arrow" /></p><div className="quote-amount"><span data-testid="output">{formatTokens(result.output)}</span><span className="token-unit">UNIT</span></div><p className="quote-caption">Example token · Starting price: 10,000 UNIT per ETH</p></div>
            <div className="metrics"><div><span className="metric-label">Price impact</span><strong data-testid="impact">{formatNumber(result.impact)}%</strong><span className={`impact-tag ${result.impact >= 5 ? 'high' : result.impact >= 1 ? 'medium' : 'small'}`}>{impactLabel(result.impact)}</span></div><div><span className="metric-label">Minimum after buffer</span><strong data-testid="minimum">{formatTokens(result.minimum)}<small> UNIT</small></strong><span className="metric-note">At {slippage}% slippage</span></div></div>
            <ImpactChart amount={amount} reserve={reserve} fee={fee} compare={compare} />
            {compare && doubled && <div className="comparison" data-testid="comparison"><div><span className="eyebrow">With 2× liquidity</span><strong>{formatTokens(doubled.output)} <small>UNIT</small></strong></div><p><b>+{formatTokens(doubled.output - result.output)} UNIT</b><span>{formatNumber(doubled.impact)}% price impact</span></p></div>}
            <button type="button" className="compare-button" aria-pressed={compare} onClick={() => setCompare(!compare)}><Icon name={compare ? 'pool' : 'plus'} />{compare ? 'Hide liquidity comparison' : 'Compare with 2× liquidity'}<span className="button-arrow"><Icon name="arrow" /></span></button>
            <div className="quote-details"><span>Pool fee: <b data-testid="fee">{formatNumber(result.fee, 6)} ETH</b></span><span>Gas not included</span></div>
          </> : <div className="empty-state"><Icon name="pool" /><h3>A few numbers, then a little clarity.</h3><p>Enter a valid trade size and pool reserve to see the estimated output and price impact.</p><button type="button" className="compare-button" onClick={reset}>Restore example</button></div>}
        </section>
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      <section className="learning-strip" aria-label="Understanding your swap">
        <article><span className="lesson-number">01 / Size</span><h3>Bigger trades move more.</h3><p>The larger your swap relative to the pool, the more the price moves against it.</p></article>
        <article><span className="lesson-number">02 / Depth</span><h3>More liquidity softens it.</h3><p>A deeper pool can absorb the same trade with a smaller change in price.</p></article>
        <article><span className="lesson-number">03 / Buffer</span><h3>Slippage is a separate setting.</h3><p>Your buffer lowers the minimum you would accept. It doesn’t reduce price impact.</p></article>
      </section>
      <details className="model-details"><summary>What’s behind the numbers?<span aria-hidden="true">+</span></summary><div className="model-explanation"><p>This is a single constant-product pool with a fictional token called UNIT. Every example starts at 10,000 UNIT per ETH. Changing liquidity scales both reserves equally, keeping that starting price fixed.</p><p><code>tokens out = token reserve × net ETH / (ETH reserve + net ETH)</code><br />Net ETH is your trade minus the pool fee. Price impact compares the average price after that fee with the starting price. The minimum is tokens out × (1 − slippage buffer).</p><p>This model excludes gas, other trades, routing, concentrated liquidity, token taxes and integer rounding. It is a learning tool, not a live quote. A real swap’s result can differ.</p></div></details>
      <footer className="site-footer"><div className="footer-mark"><Icon name="pool" /><span>A small tool for<br /> <b>curious holders.</b></span></div><p>Pool Lab is a swap impact sandbox built for the BluePrint and IMD community. It makes the relationship between trade size and pool liquidity visible, so holders can explore the mechanics in under a minute. All examples run locally, with no wallet or live market data.</p><span className="footer-index">Explore. Understand.<br />Then decide.</span></footer>
    </main>
  </div>;
}
