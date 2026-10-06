// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';

test.describe('Authentication, dashboard, and domestic transfers: sign in', () => {
  test('User signs in with valid credentials', async ({ page }) => {
    // 1. Open the Gremlin Bank sign-in page.
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Gremlin Bank' })).toBeVisible();

    // 2. Enter GREMLIN_USER and GREMLIN_PASSWORD and submit.
    await page.getByRole('textbox', { name: 'Username' }).fill(env('GREMLIN_USER'));
    await page.getByRole('textbox', { name: 'Password' }).fill(env('GREMLIN_PASSWORD'));
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
    await expect(page.getByText('Signed in as')).toContainText(env('GREMLIN_USER'));
  });

  test('Invalid credentials do not sign in', async ({ page }) => {
    // 1. Enter the valid test username with an incorrect password and submit.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(env('GREMLIN_USER'));
    await page.getByRole('textbox', { name: 'Password' }).fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
    await expect(page).toHaveURL(/\/login$/);

    // The dashboard is not accessible without a session.
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeHidden();
  });
});
