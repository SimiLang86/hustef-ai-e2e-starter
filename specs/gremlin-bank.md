# Gremlin Bank Test Plan

## Application Overview

Gremlin Bank is a fictional online bank used as practice material. A signed-in customer sees two accounts (Everyday Account, Savings Account) with IBANs and balances, recent transactions, a spending chart with a data table, an exchange rate and a tip of the day, and can send a domestic transfer in HUF. A transfer goes through a form (account, beneficiary, IBAN with a check, amount, reference), a review page with the fee and the total, a 4-digit transaction PIN, an approval dialog, and a confirmation page.

Business rules observed while exploring (release 1):

- Opening balances: Everyday Account 1,250,000 HUF, Savings Account 5,400,000 HUF. Every new browser session starts with these balances.
- Fee: 0.3% of the amount, rounded to whole HUF, at least 200 HUF and at most 6,000 HUF. Total = amount + fee. The fee is shown on the review page.
- Limits: at most 10,000,000 HUF per transfer and 2,000,000 HUF per day (amounts of transfers already sent today count). The amount plus the fee must not exceed the balance of the source account.
- The amount field accepts whole numbers only.
- Five wrong sign-in attempts in a session lock the sign-in for 60 seconds.

Notes for automation:

- The dashboard shows "Loading accounts..." for a random 0.3 to 2.5 seconds before the accounts appear. Wait for the accounts, not for a fixed time.
- The tip of the day and the EUR/HUF rate change on every page load. Do not assert their values; assert that they are present and well-formed.
- The Transaction PIN on the review page is inside a closed shadow root: it is not in the accessibility snapshot and no locator reaches it. Keyboard focus works: focus "Confirm transfer", press Shift+Tab, type the PIN. Test PIN: 2468.
- The payment approval opens in a dialog "Confirm payment" with an iframe titled "Gremlin Secure".
- The IBAN field is a web component with an open shadow root; role and label locators reach it.

Risk tags: `[high]` money movement, authentication and limits; `[medium]` information the customer relies on; `[low]` convenience and cosmetics.

## Test Scenarios

### 1. Sign in and sign out

**Seed:** `seed.spec.ts`

#### 1.1. Sign in with valid credentials [high]

**File:** `tests/sign-in.spec.ts`

**Steps:**
  1. Start in a fresh browser context (signed out) and open /
    - expect: The browser is redirected to /login
    - expect: The heading "Sign in to Gremlin Bank" is shown with the fields "Username" and "Password" and the button "Sign in"
  2. Fill "Username" with the demo user and "Password" with the demo password, click "Sign in"
    - expect: The URL is /dashboard
    - expect: The heading "Accounts" is shown
    - expect: The header shows "Signed in as demo" and a "Sign out" button

#### 1.2. Wrong password is rejected [high]

**File:** `tests/sign-in.spec.ts`

**Steps:**
  1. Open /login in a fresh browser context
    - expect: The sign-in form is shown
  2. Fill "Username" with the demo user and "Password" with a wrong password, click "Sign in"
    - expect: The alert "Wrong username or password." is shown
    - expect: The URL stays /login and the user name is still filled in
  3. Open /dashboard
    - expect: The browser is redirected to /login (no session was created)

#### 1.3. Unknown user and empty fields are rejected with the same message [medium]

**File:** `tests/sign-in.spec.ts`

**Steps:**
  1. Open /login in a fresh browser context and click "Sign in" without filling anything
    - expect: The alert "Wrong username or password." is shown
  2. Fill "Username" with "no.such.user" and "Password" with the demo password, click "Sign in"
    - expect: The same alert "Wrong username or password." is shown (the message does not reveal whether the user exists)

#### 1.4. Five wrong attempts lock the sign-in [high]

**File:** `tests/sign-in.spec.ts`

**Steps:**
  1. Open /login in a fresh browser context
    - expect: The sign-in form is shown
  2. Submit the demo user with a wrong password four times
    - expect: Each time the alert "Wrong username or password." is shown
  3. Submit a wrong password a fifth time
    - expect: The alert "Too many attempts. Wait 60 seconds." is shown
  4. Submit the correct password
    - expect: The alert "Too many attempts. Wait 60 seconds." is still shown and the URL stays /login

#### 1.5. Sign out ends the session [high]

**File:** `tests/sign-in.spec.ts`

**Steps:**
  1. Start from the seed (signed in, on the dashboard) and click "Sign out"
    - expect: The URL is /login and the sign-in form is shown
  2. Open /dashboard, then /transfer
    - expect: Both redirect to /login

### 2. Dashboard

**Seed:** `seed.spec.ts`

#### 2.1. Accounts are shown with IBAN and opening balance [medium]

**File:** `tests/dashboard.spec.ts`

**Steps:**
  1. Start from the seed (signed in, on the dashboard)
    - expect: "Loading accounts..." disappears and two account regions appear
  2. Read the region "Everyday Account"
    - expect: IBAN "HU39 9992 0265 3141 5926 5358 9797"
    - expect: Balance "1,250,000 HUF"
  3. Read the region "Savings Account"
    - expect: IBAN "HU03 9992 0265 2718 2818 2845 9043"
    - expect: Balance "5,400,000 HUF"

#### 2.2. Recent transactions show the seeded history [medium]

**File:** `tests/dashboard.spec.ts`

**Steps:**
  1. Start from the seed and find the table "Recent transactions"
    - expect: Column headers Date, Description, Amount
    - expect: Five rows, newest first: 2026-09-30 "Grocery store, Budapest" -18,450 HUF; 2026-09-29 "Salary, Gremlin Works Ltd." +685,000 HUF; 2026-09-27 "Mobile phone bill" -7,990 HUF; 2026-09-25 "Card payment, bookshop" -12,300 HUF; 2026-09-24 "Transfer from Savings Account" +50,000 HUF

#### 2.3. Spending chart data is available as a table [medium]

**File:** `tests/dashboard.spec.ts`

**Steps:**
  1. Start from the seed and find the section "Spending in the last 30 days"
    - expect: The chart itself is a canvas without text; the button "Show chart data" is present
  2. Click "Show chart data"
    - expect: A table appears whose caption starts with "Spending in the last 30 days"
    - expect: The table has the columns Date and Amount and 30 data rows, one per day, amounts in "N HUF" format

#### 2.4. Session code, security indicator, rate and tip are present [low]

**File:** `tests/dashboard.spec.ts`

**Steps:**
  1. Start from the seed
    - expect: A text "Session code: GRM-..." is shown
    - expect: An image with the accessible name starting "Security check passed" is next to the heading (it has no visible text)
    - expect: The exchange rate reads "EUR/HUF" followed by a number with two decimals (do not assert the number, it changes on every load)
    - expect: "Tip of the day" has a non-empty text (do not assert which tip)

#### 2.5. New transfer opens the transfer form [medium]

**File:** `tests/dashboard.spec.ts`

**Steps:**
  1. Start from the seed and click the link "New transfer"
    - expect: The URL is /transfer and the heading "New transfer" is shown

### 3. Domestic transfer

**Seed:** `seed.spec.ts`

#### 3.1. Send 100,000 HUF from the Everyday Account [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed and open /transfer
    - expect: The heading "New transfer" with the fields From account, Beneficiary name, IBAN (with "Check IBAN"), Amount (HUF), Reference and the button "Continue"
  2. Select "Everyday Account", fill "Beneficiary name" with "Kiss Péter" and "IBAN" with "HU72 9990 1017 1618 0339 8874 9892", click "Check IBAN"
    - expect: The text "IBAN verified: GRM-..." appears inside the IBAN field
  3. Fill "Amount (HUF)" with 100000 and "Reference" with "Rent October", click "Continue"
    - expect: The heading "Review transfer" and the table "Transfer details" with From "Everyday Account", To "Kiss Péter", IBAN "HU72 9990 1017 1618 0339 8874 9892", Amount "100,000 HUF", Fee "300 HUF", Total "100,300 HUF"
  4. Enter the PIN 2468 with the keyboard (focus "Confirm transfer", Shift+Tab, type) and click "Confirm transfer"
    - expect: The dialog "Confirm payment" opens with the frame "Gremlin Secure" saying "Approve this payment of 100,300 HUF"
  5. Click "Approve payment" in the frame
    - expect: The heading "Transfer submitted", a text "Reference: GB-" followed by 6 characters, a "Code: GRM-..." text and a "PIN check passed: GRM-..." text
  6. Open the dashboard
    - expect: Everyday Account balance "1,149,700 HUF" (1,250,000 - 100,300); Savings Account unchanged "5,400,000 HUF"
    - expect: The first row of "Recent transactions" is "Transfer to Kiss Péter" with "-100,300 HUF"

#### 3.2. Saved payee fills the name and the IBAN [low]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed, open /transfer and click "Use Tóth Bence" under "Saved payees"
    - expect: "Beneficiary name" is "Tóth Bence" and "IBAN" is "HU03 9990 3033 1732 0508 0756 8879"
    - expect: The IBAN still has to be checked: clicking "Continue" with a valid amount shows "Check the IBAN first."

#### 3.3. Required fields [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed, open /transfer and click "Continue" without filling anything
    - expect: The messages "Enter a beneficiary name.", "Check the IBAN first." and "Enter an amount greater than 0." are shown next to their fields
    - expect: The page stays on /transfer

#### 3.4. IBAN check [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed, open /transfer, fill "IBAN" with "HU00 9990 1017 1618 0339 8874 9892" (wrong check digits) and click "Check IBAN"
    - expect: "Invalid IBAN" is shown
  2. Fill a valid IBAN, a beneficiary and an amount, but do not click "Check IBAN"; click "Continue"
    - expect: "Check the IBAN first." is shown
  3. Click "Check IBAN", then change one digit of the IBAN and click "Continue"
    - expect: "Check the IBAN first." is shown again (editing after the check invalidates it)

#### 3.5. Amount must be a positive whole number [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed and fill a complete, checked form with amount 0, click "Continue"
    - expect: "Enter an amount greater than 0."
  2. Repeat with -5, 12.5 and "abc"
    - expect: "Enter an amount greater than 0." each time
  3. Repeat with 1
    - expect: The review page shows Amount "1 HUF", Fee "200 HUF" (minimum), Total "201 HUF"

#### 3.6. Daily limit boundary: 2,000,000 and 2,000,001 [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed, select "Savings Account", fill a checked beneficiary and amount 2000000, click "Continue"
    - expect: The review page shows Amount "2,000,000 HUF", Fee "6,000 HUF" (maximum), Total "2,006,000 HUF"
  2. Go back to /transfer and repeat with 2000001
    - expect: "Daily limit of 2,000,000 HUF exceeded."

#### 3.7. Single transfer limit boundary: 10,000,000 and 10,000,001 [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed, select "Savings Account", fill a checked beneficiary and amount 10000001, click "Continue"
    - expect: "The maximum single transfer is 10,000,000 HUF."
  2. Repeat with 10000000
    - expect: "Daily limit of 2,000,000 HUF exceeded." (10,000,000 is allowed as a single transfer but is above the daily limit; only one message is shown per field, the single limit is checked first)

#### 3.8. Fee rule: minimum, rounding and maximum [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed and submit a checked transfer from "Savings Account" for each amount below; read the review page
    - expect: 10,000 HUF: Fee "200 HUF", Total "10,200 HUF" (0.3% is 30, the minimum applies)
    - expect: 66,833 HUF: Fee "200 HUF" (0.3% is 200.499, rounds to 200)
    - expect: 66,834 HUF: Fee "201 HUF" (0.3% is 200.502, rounds to 201, first amount above the minimum)
    - expect: 100,000 HUF: Fee "300 HUF", Total "100,300 HUF"
    - expect: 2,000,000 HUF: Fee "6,000 HUF", Total "2,006,000 HUF" (the maximum; from the Savings Account, the Everyday balance is too low)

#### 3.9. Insufficient funds boundary [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed, select "Everyday Account" (1,250,000 HUF), fill a checked beneficiary and amount 1246261, click "Continue"
    - expect: The review page shows Fee "3,739 HUF" and Total "1,250,000 HUF" (exactly the balance)
  2. Go back and repeat with 1246262
    - expect: "Insufficient funds." (amount plus fee is 1,250,001 HUF)
  3. Repeat with 1500000
    - expect: "Insufficient funds."

#### 3.10. Wrong PIN [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed and get to the review page with a valid transfer of 1,000 HUF
    - expect: The review page is shown
  2. Enter 1111 with the keyboard and click "Confirm transfer"
    - expect: The alert "Wrong PIN." is shown outside the PIN field and no "Confirm payment" dialog opens
  3. Enter 2468 and confirm, approve the payment
    - expect: "Transfer submitted"

#### 3.11. The daily limit counts transfers already sent [high]

**File:** `tests/transfer.spec.ts`

**Steps:**
  1. Start from the seed and send 1,500,000 HUF from "Savings Account" (review, PIN, approve)
    - expect: "Transfer submitted"
  2. Start a new transfer of 600,000 HUF from "Savings Account"
    - expect: "Daily limit of 2,000,000 HUF exceeded."
  3. Start a new transfer of 500,000 HUF from "Savings Account"
    - expect: The review page is shown (1,500,000 + 500,000 = 2,000,000 is allowed)
