import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/onboarding', '/dashboard', '/chat', '/community'];

for (const route of ROUTES) {
  test(`route ${route} has zero WCAG 2.1 AA axe violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('full user journey: onboarding -> dashboard -> streaming AI chat -> community share card', async ({
  page,
}) => {
  await page.goto('/onboarding');
  await page.getByLabel('Primary profile').selectOption('commuter');
  await page.getByLabel('Home city').fill('London');
  await page.getByRole('button', { name: /Save Profile/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Commuter');

  await page.getByRole('link', { name: 'AI Chat', exact: true }).click();
  await expect(page).toHaveURL(/\/chat/);
  await page.getByLabel(/Ask BreatheWise/i).fill('Should I shift my commute 30 min later?');
  await page.getByRole('button', { name: /Ask Assistant/i }).click();
  await expect(page.getByText(/Quantified Impact & Sources/i)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Community' }).click();
  await expect(page).toHaveURL(/\/community/);
  await expect(page.getByRole('link', { name: /Share on WhatsApp/i })).toBeVisible();
});
