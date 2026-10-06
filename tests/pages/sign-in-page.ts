import { expect, env } from '../fixtures';
import type { Page } from '@playwright/test';

// Release 1 labels the fields "Username"/"Sign in", Release 2 "User ID"/"Log in" and adds a cookie dialog.
export function loginForm(page: Page) {
  return {
    heading: page.getByRole('heading', { level: 1, name: /^(Sign in to Gremlin Bank|Welcome back)$/ }),
    user: page.getByRole('textbox', { name: /^(Username|User ID)$/ }),
    password: page.getByRole('textbox', { name: 'Password' }),
    submit: page.getByRole('button', { name: /^(Sign in|Log in)$/ }),
  };
}

export async function openLogin(page: Page) {
  await page.addLocatorHandler(
    page.getByRole('dialog', { name: 'Cookies' }),
    async (dialog) => {
      await dialog.getByRole('button', { name: 'Only necessary' }).click();
    },
  );
  await page.goto('/login');
  await expect(loginForm(page).heading).toBeVisible();
}

export async function signIn(page: Page) {
  await openLogin(page);
  const form = loginForm(page);
  await form.user.fill(env('GREMLIN_USER'));
  await form.password.fill(env('GREMLIN_PASSWORD'));
  await form.submit.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
}
