import { expect, env } from '../fixtures';
import type { Page } from '@playwright/test';

export async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(env('GREMLIN_USER'));
  await page.getByRole('textbox', { name: 'Password' }).fill(env('GREMLIN_PASSWORD'));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
}
