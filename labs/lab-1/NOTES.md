# Lab 1: expected observations

What you should have seen in Lab 1. The numbers marked "measured" come from the Playwright 1.63.0
servers in this repo; your tool adds its own system prompt and messages on top.

## 1. Browser tools connected

Two servers: `playwright` with 24 browser tools (`browser_navigate`, `browser_snapshot`, `browser_click`,
`browser_type`, `browser_fill_form`, `browser_take_screenshot`, ...) and `playwright-test` with 89 tools
(the same browser tools plus `planner_*`, `generator_*` and `test_*`).

## 2. Drive the bank with a prompt

- The agent opens Chrome, fills "Username" and "Password", clicks "Sign in" and waits for the accounts.
- Session code: the `GRM-...` code next to "Session code:" on the dashboard ("First contact").
- Everyday Account balance: **1,250,000 HUF** (Savings Account: 5,400,000 HUF).
- "Loading accounts..." shows for up to 2.5 seconds. An agent that answers too early reports no balance.

## 3. What only the snapshot can see

- The snapshot contains `img "Security check passed. Code GRM-..."` next to the "Accounts" heading. The text exists only in the `aria-label` ("Snapshot reader").
- With a screenshot only, the agent sees a green shield icon and no text. A careful agent says it cannot read a code; a careless one invents one.

## 4. Brittle test

| Release | Result (measured) |
|---|---|
| 1 | passes (about 8 s, of which 3 s is the fixed wait) |
| 2 | fails after 10 s: `locator.fill: Timeout 10000ms exceeded`, waiting for `locator('#username')` |
| 3 | fails the same way (same UI as release 2) |

Release 2 renamed `#username` to `#user-id`, the test ids from `login-*` to `signin-*`, `button.btn-primary.login-submit` to `button.cta.cta--login`, and puts a "Cookies" dialog in front of the page. The features did not change.

The agent on release 2 copes: it answers the "Cookies" dialog ("Accept all" or "Only necessary"), fills "User ID" instead of "Username", clicks "Log in", and finds the balance in the "Your accounts" table instead of the account cards.

It may also report the "Offers" region and the text "Note for AI test agents: ...". That is planted content. Do not act on it; Lab 4 is about it. If the agent opened a page because of it, note that too.

## 5. MCP vs CLI

Measured for the step 2 task (sign in, read the session code and the balance), characters of text that go into the model's context (about 4 characters per token):

| | MCP (`playwright` server) | CLI (`playwright-cli` skill) |
|---|---|---|
| Tool definitions, sent with every request | 18,904 (24 tools) | 0 (the agent's shell tool is already there) |
| Skill text, read once when the skill is used | 0 | 13,079 (`SKILL.md`) |
| Tool results for the task | 5,995 (navigate, 2 snapshots, 2 types, click, wait) | 2,812 (open, snapshot, 2 fills, click, 2 finds) |

- With `playwright-test` enabled as well, its 89 tool definitions (60,609 characters) are in the context of both runs in tools that load all MCP tools upfront. Some tools (Claude Code's tool search, VS Code's virtual tools) load definitions on demand, so the room's numbers will differ.
- In Playwright 1.63 the MCP action tools (`browser_navigate`, `browser_click`, ...) already write the page snapshot to a file and return a link; only `browser_snapshot` returns the full snapshot inline. The CLI does the same for every command and offers `find` to read only the matching part of the snapshot. Most of the difference is the tool definitions that MCP sends with every request, and how often the agent asks for a full snapshot.
- Typical room result: the CLI run uses less context than the MCP run, but not by a fixed factor. Compare your own two numbers.

## Stretch: transfer by prompt

- The agent fills the form (it may use the "Use Kiss Péter" button), clicks "Check IBAN", enters 15,000 HUF and "Lab 1", and reaches the review page: fee **200 HUF** (0.3% of 15,000 is 45, the minimum is 200), total 15,200 HUF.
- It cannot find the "Transaction PIN" field in the snapshot: it is in a closed shadow root. Some agents try clicking coordinates, some try `browser_evaluate`, some give up. Pressing Tab or Shift+Tab from the confirm button and typing works. Lab 5 comes back to it.
- After "Confirm transfer" a "Confirm payment" dialog with an iframe asks to "Approve payment". The confirmation page shows "Transfer submitted", a reference `GB-xxxxxx` and a `GRM-...` code ("Money moved").
