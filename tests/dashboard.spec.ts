// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect } from './fixtures';
import { signIn } from './pages/sign-in-page';

test.describe('Authentication, dashboard, and domestic transfers: dashboard', () => {
  test('Dashboard displays account names, balances, and session code', async ({ page }) => {
    // 1. Sign in and wait for account loading to finish.
    await signIn(page);

    // Account loading has a variable delay that can exceed the default assertion timeout.
    await expect(page.getByText('Loading accounts...')).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 2, name: 'Everyday Account' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Savings Account' })).toBeVisible();
    await expect(page.getByText('1,250,000 HUF')).toBeVisible();
    await expect(page.getByText('5,400,000 HUF')).toBeVisible();
    await expect(page.getByText(/^HU\d{2}( \d{4}){6}$/)).toHaveCount(2);
    await expect(page.getByText(/^Session code: GRM-[A-Z]+-[A-Z0-9]{4}$/)).toBeVisible();
    await expect(page.getByText('Loading accounts...')).toBeHidden();
  });

  test('Dashboard lists recent transactions with dates and signed amounts', async ({ page }) => {
    // 1. Sign in and inspect the Recent transactions table.
    await signIn(page);

    const table = page.getByRole('table', { name: 'Recent transactions' });
    await expect(table.getByRole('columnheader')).toHaveText(['Date', 'Description', 'Amount']);

    const rows = table.getByRole('row');
    await expect(rows.nth(1)).toContainText('2026-09-30');
    await expect(rows.nth(1)).toContainText('-18,450 HUF');
    await expect(table.getByRole('row', { name: /Salary, Gremlin Works Ltd\./ })).toContainText('+685,000 HUF');
    await expect(table.getByRole('row', { name: /Mobile phone bill/ })).toContainText('-7,990 HUF');
  });
});
