import { test, expect, env } from './tests/fixtures';
import { loginForm, openLogin } from './tests/pages/sign-in-page';

// Seed for the Playwright Test Agents. The planner and the generator run this test first
// and continue from the page it leaves open: the Gremlin Bank dashboard, signed in.
// The user and password come from .env (GREMLIN_USER, GREMLIN_PASSWORD).

test.describe('Gremlin Bank', () => {
  test('seed', async ({ page }) => {
    await openLogin(page);
    const form = loginForm(page);
    await form.user.fill(env('GREMLIN_USER'));
    await form.password.fill(env('GREMLIN_PASSWORD'));
    await form.submit.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
  });
});
