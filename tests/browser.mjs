import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const artifacts = resolve('artifacts');
await mkdir(artifacts, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/frame.html') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html lang="en"><title>Iframe check</title><body style="margin:0"><iframe title="Pool Lab" src="./preview/" sandbox="allow-scripts" style="border:0;width:100%;height:900px"></iframe></body></html>');
      return;
    }
    if (!pathname.startsWith('/preview/')) { res.writeHead(404); res.end(); return; }
    const file = resolve(root, decodeURIComponent(pathname.slice('/preview/'.length)) || 'index.html');
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const report = { checks: [], layouts: [], consoleErrors: [], failedRequests: [], externalRequests: [], accessibility: [], contrast: [], screenshots: [] };
const check = (name) => { report.checks.push(name); console.log(`PASS ${name}`); };
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', e => report.consoleErrors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push(msg.text()); });
  page.on('requestfailed', req => report.failedRequests.push({ url: req.url(), failure: req.failure() }));
  page.on('response', res => { if (res.status() >= 400) report.failedRequests.push({ url: res.url(), status: res.status() }); });
  page.on('request', req => { if (!req.url().startsWith(origin + '/')) report.externalRequests.push(req.url()); });
  await page.goto(origin + '/preview/');
  await page.getByRole('heading', { name: /Small swap.*Big ripple/ }).waitFor();
  assert.equal(await page.getByTestId('output').innerText(), '47,482.97');
  assert.equal(await page.getByTestId('impact').innerText(), '4.75%');
  assert.equal(await page.getByTestId('fee').innerText(), '0.015000 ETH');
  check('Relative subpath export loads and default quote matches model');

  async function layout(width, label = String(width)) {
    await page.setViewportSize({ width, height: 1000 });
    const info = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('main *')].filter(e => {
      const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
    }).map(e => e.tagName + '.' + e.className).slice(0, 10) }));
    assert.ok(info.document <= width, JSON.stringify(info));
    assert.deepEqual(info.overflowing, []);
    report.layouts.push({ label, ...info });
  }
  for (const width of [1200, 900, 752, 600, 360, 320]) await layout(width);
  check('No horizontal overflow at 1200, 900, 752, 600, 360 and 320 CSS pixels');

  await layout(1200);
  await page.screenshot({ path: resolve(artifacts, 'desktop.png'), fullPage: true });
  report.screenshots.push('artifacts/desktop.png');
  await layout(360);
  await page.screenshot({ path: resolve(artifacts, 'mobile.png'), fullPage: true });
  report.screenshots.push('artifacts/mobile.png');

  await page.getByRole('button', { name: 'Shallow 10 ETH' }).click();
  assert.equal(await page.getByLabel('Pool’s ETH reserve').inputValue(), '10');
  assert.equal(await page.getByTestId('impact').innerText(), '33.27%');
  await page.getByRole('button', { name: 'Deep 1,000 ETH' }).click();
  assert.equal(await page.getByTestId('impact').innerText(), '0.50%');
  await page.getByRole('button', { name: 'Balanced 100 ETH' }).click();
  check('All liquidity presets update reserve, output and impact');

  const initialOutput = await page.getByTestId('output').innerText();
  const initialMinimum = await page.getByTestId('minimum').innerText();
  await page.getByLabel('Slippage buffer').selectOption('3');
  assert.equal(await page.getByTestId('output').innerText(), initialOutput);
  assert.notEqual(await page.getByTestId('minimum').innerText(), initialMinimum);
  await page.getByLabel('Pool fee', { exact: true }).selectOption('1');
  assert.notEqual(await page.getByTestId('output').innerText(), initialOutput);
  assert.equal(await page.getByTestId('fee').innerText(), '0.050000 ETH');
  check('Slippage changes only minimum; fee changes quote and charged fee');

  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Compare with 2× liquidity' }).click();
  assert.match(await page.getByTestId('comparison').innerText(), /48,637.71/);
  assert.equal(await page.locator('.chart-compare').count(), 1);
  await page.screenshot({ path: resolve(artifacts, 'comparison.png'), fullPage: true });
  report.screenshots.push('artifacts/comparison.png');
  await page.getByRole('button', { name: 'Hide liquidity comparison' }).click();
  assert.equal(await page.getByTestId('comparison').count(), 0);
  check('Comparison exposes higher output and a second chart line, then hides');

  for (const field of ['You swap', 'Pool’s ETH reserve']) {
    for (const value of ['', '-1', '0', '1,000', '1000001', '1e3']) {
      await page.getByLabel(field, { exact: true }).fill(value);
      assert.equal(await page.getByLabel(field, { exact: true }).getAttribute('aria-invalid'), 'true');
      assert.equal(await page.getByTestId('output').count(), 0);
      assert.ok(await page.getByRole('button', { name: 'Restore example' }).isVisible());
      if (field === 'You swap' && value === '') {
        await page.screenshot({ path: resolve(artifacts, 'invalid-input.png'), fullPage: true });
        report.screenshots.push('artifacts/invalid-input.png');
      }
      await page.getByRole('button', { name: 'Restore example' }).click();
    }
  }
  check('Empty, negative, zero, comma, oversized and exponent inputs get recoverable errors; stale quote removed');

  for (const [amount, reserve] of [['1000000', '1000000'], ['1000000', '0.01'], ['0.01', '1000000']]) {
    await page.getByLabel('You swap', { exact: true }).fill(amount);
    await page.getByLabel('Pool’s ETH reserve').fill(reserve);
    await page.getByRole('button', { name: 'Compare with 2× liquidity' }).click();
    await layout(320, `320: amount ${amount}, reserve ${reserve}`);
    assert.doesNotMatch(await page.locator('main').innerText(), /NaN|Infinity/);
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
  }
  check('Minimum and maximum supported inputs remain finite and fit at 320px, including comparison');

  await page.goto(origin + '/preview/');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(), 'Skip to swap sandbox');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  assert.match(await page.locator(':focus').innerText(), /Shallow/);
  await page.keyboard.press('Enter');
  assert.equal(await page.getByLabel('Pool’s ETH reserve').inputValue(), '10');
  await page.screenshot({ path: resolve(artifacts, 'keyboard-focus.png'), fullPage: true });
  report.screenshots.push('artifacts/keyboard-focus.png');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'amount-range');
  const previousAmount = Number(await page.getByLabel('You swap', { exact: true }).inputValue());
  await page.keyboard.press('ArrowRight');
  assert.ok(Number(await page.getByLabel('You swap', { exact: true }).inputValue()) > previousAmount);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'fee');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'slippage');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.getByLabel('You swap', { exact: true }).inputValue(), '5');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.getByTestId('comparison').count(), 1);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').evaluate(e => e.tagName), 'SUMMARY');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('details').getAttribute('open'), '');
  check('Keyboard skip link, presets, native slider, selects, reset, comparison and disclosure work in order');

  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.locator('summary').click();
  for (const width of [1200, 360]) {
    await layout(width);
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    report.accessibility.push({ width, violations: scan.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })) });
    assert.equal(scan.violations.length, 0, JSON.stringify(report.accessibility));
  }
  check('Axe WCAG A/AA scans at 1200px and 360px report zero violations');

  report.contrast = await page.evaluate(() => {
    const rgb = text => (text.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = values => values.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
    return ['.intro-copy p', '.quote-caption', '.compare-button', '.impact-tag', '.metric-label', '.offline-badge'].map(selector => {
      const element = document.querySelector(selector), fg = getComputedStyle(element).color;
      let ancestor = element, bg;
      while (ancestor) { bg = getComputedStyle(ancestor).backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') break; ancestor = ancestor.parentElement; }
      const a = luminance(rgb(fg)), b = luminance(rgb(bg));
      return { selector, foreground: fg, background: bg, ratio: Number(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2)) };
    });
  });
  assert.ok(report.contrast.every(pair => pair.ratio >= 4.5));
  check('Computed rendered text/background pairs meet 4.5:1 contrast');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.compare-button').evaluate(e => getComputedStyle(e).transitionDuration), '0s');
  check('Reduced motion removes button transitions');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.locator('#slippage').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.match(await page.locator(':focus').innerText(), /Compare with/);
  await page.screenshot({ path: resolve(artifacts, 'forced-colors.png'), fullPage: true });
  report.screenshots.push('artifacts/forced-colors.png');
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await layout(1200, '1200: 200% text enlargement');
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  check('200% text enlargement at desktop reflows without overflow (not native browser zoom)');

  await page.goto(origin + '/frame.html');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('heading', { name: /Small swap.*Big ripple/ }).waitFor();
  await frame.getByRole('button', { name: 'Compare with 2× liquidity' }).click();
  assert.equal(await frame.getByTestId('comparison').count(), 1);
  await page.setViewportSize({ width: 360, height: 900 });
  assert.equal(await frame.locator('html').evaluate(e => e.scrollWidth <= window.innerWidth), true);
  await frame.getByRole('button', { name: 'Reset', exact: true }).click();
  assert.equal(await frame.getByTestId('comparison').count(), 0);
  check('Production export operates in an opaque-origin iframe with sandbox="allow-scripts" at 1200px and 360px');
  await context.setOffline(true);
  await frame.getByLabel('You swap', { exact: true }).fill('.5');
  assert.equal(await frame.getByTestId('output').innerText(), '4,960.27');
  await frame.getByRole('button', { name: 'Compare with 2× liquidity' }).click();
  assert.equal(await frame.getByTestId('comparison').count(), 1);
  check('Loaded iframe continues calculating with network offline, including fractional input .5');
  assert.deepEqual(report.externalRequests, []);
  assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(report.consoleErrors, []);
  check('No external requests, failed resources or browser console errors');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = String(error); throw error;
} finally {
  await writeFile(resolve(artifacts, 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
