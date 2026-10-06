// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';
import { loginForm, openLogin } from './pages/sign-in-page';

test.describe('Authentication, dashboard, and domestic transfers: sign in', () => {
  test('User signs in with valid credentials', async ({ page }) => {
    // 1. Open the Gremlin Bank sign-in page.
    await openLogin(page);

    // 2. Enter GREMLIN_USER and GREMLIN_PASSWORD and submit.
    const form = loginForm(page);
    await form.user.fill(env('GREMLIN_USER'));
    await form.password.fill(env('GREMLIN_PASSWORD'));
    await form.submit.click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
    await expect(page.getByText('Signed in as')).toContainText(env('GREMLIN_USER'));
  });

  test('Invalid credentials do not sign in', async ({ page }) => {
    // 1. Enter the valid test username with an incorrect password and submit.
    await openLogin(page);
    const form = loginForm(page);
    await form.user.fill(env('GREMLIN_USER'));
    await form.password.fill('not-the-password');
    await form.submit.click();

    await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
    await expect(page).toHaveURL(/\/login$/);

    // The dashboard is not accessible without a session.
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeHidden();
  });
});
