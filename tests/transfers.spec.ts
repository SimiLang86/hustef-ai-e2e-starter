// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect } from './fixtures';
import { signIn } from './pages/sign-in-page';
import type { Page } from '@playwright/test';

async function prepareTransferToKissPeter(page: Page, amount: string) {
  await page.goto('/transfer');
  await page.getByRole('button', { name: 'Use Kiss Péter' }).click();
  await page.getByLabel('Amount (HUF)').fill(amount);
  await page.getByLabel('Reference').fill('Lab 1');
}

function reviewValue(page: Page, rowHeader: string) {
  return page
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: rowHeader, exact: true }) })
    .getByRole('cell');
}

const digits = (text: string | null) => Number((text ?? '').replace(/\D/g, ''));

test.describe('Authentication, dashboard, and domestic transfers: domestic transfers', () => {
  test('Valid transfer to a saved payee reaches an accurate review page', async ({ page }) => {
    // 1. Prepare a 15,000 HUF transfer to Kiss Péter, check the IBAN, and continue.
    await signIn(page);
    await prepareTransferToKissPeter(page, '15000');
    await page.getByRole('button', { name: 'Check IBAN' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/transfer\/review$/);
    await expect(reviewValue(page, 'From')).toHaveText('Everyday Account');
    await expect(reviewValue(page, 'To')).toHaveText('Kiss Péter');
    await expect(reviewValue(page, 'IBAN')).toHaveText('HU72 9990 1017 1618 0339 8874 9892');
    await expect(reviewValue(page, 'Amount')).toHaveText('15,000 HUF');
    await expect(reviewValue(page, 'Fee')).toHaveText('200 HUF');
    await expect(reviewValue(page, 'Total')).toHaveText('15,200 HUF');
    await page.getByRole('button', { name: 'Confirm transfer' }).click();
  });

  test('Required transfer details are enforced', async ({ page }) => {
    // 1. Open New transfer and submit with all details blank.
    await signIn(page);
    await page.goto('/transfer');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/transfer$/);
    await expect(page.getByText('Enter a beneficiary name.')).toBeVisible();
    await expect(page.getByText('Check the IBAN first.')).toBeVisible();
    await expect(page.getByText('Enter an amount greater than 0.')).toBeVisible();
  });

  test('Unverified IBAN blocks review', async ({ page }) => {
    // 1. Use a saved payee with a valid amount but do not activate Check IBAN.
    await signIn(page);
    await prepareTransferToKissPeter(page, '15000');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Check the IBAN first.')).toBeVisible();
    await expect(page).toHaveURL(/\/transfer$/);
  });

  for (const amount of [1000, 15000, 100000]) {
    test(`Fee and total are correct for a ${amount.toLocaleString('en-US')} HUF transfer`, async ({ page }) => {
      // 1. Enter valid payee details, check the IBAN, and proceed to review without sending.
      await signIn(page);
      await prepareTransferToKissPeter(page, String(amount));
      await page.getByRole('button', { name: 'Check IBAN' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(reviewValue(page, 'Amount')).toHaveText(`${amount.toLocaleString('en-US')} HUF`);
      const fee = reviewValue(page, 'Fee');
      await expect(fee).toHaveText(/^\d{1,3}(,\d{3})* HUF$/);

      if (amount === 15000) {
        await expect(fee).toHaveText('200 HUF');
        await expect(reviewValue(page, 'Total')).toHaveText('15,200 HUF');
      }

      // Total equals amount plus fee.
      const expectedTotal = (amount + digits(await fee.textContent())).toLocaleString('en-US');
      await expect(reviewValue(page, 'Total')).toHaveText(`${expectedTotal} HUF`);
    });
  }
});
