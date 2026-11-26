import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/onboarding', '/dashboard', '/chat', '/community'];

for (const route of ROUTES) {
  test(`route ${route} passes WCAG 2.2 AA axe, zero console/CSP errors, and zero horizontal overflow`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `${route} horizontal overflow`).toBe(false);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('full user journey: onboarding -> dashboard calculators & simulator -> AI chat -> community share card', async ({
  page,
}) => {
  await page.goto('/onboarding');
  await page.getByLabel('Primary profile').selectOption('commuter');
  await page.getByLabel('Home city').fill('London');
  await page.getByRole('button', { name: /Save Profile/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Commuter');

  await page.getByLabel('Room floor area (m²)').fill('30');
  await expect(page.getByText('403 m³/h')).toBeVisible();
  await page.getByRole('button', { name: /Simulate Winter Smog Spike/i }).click();
  await expect(
    page.locator('[role="alert"]', { hasText: /Severe Smog Trapping Risk/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'AI Chat', exact: true }).click();
  await expect(page).toHaveURL(/\/chat/);
  await page.getByLabel(/Ask BreatheWise/i).fill('Should I shift my commute 30 min later?');
  await page.getByRole('button', { name: /Ask Assistant/i }).click();
  await expect(page.getByText(/Quantified Impact & Sources/i)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Community' }).click();
  await expect(page).toHaveURL(/\/community/);
  await expect(page.getByRole('link', { name: /Share on WhatsApp/i })).toBeVisible();
});
