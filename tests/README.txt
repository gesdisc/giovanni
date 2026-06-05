# Playwright E2E Tests

## Prerequisites

- Node.js v22+
- Run once after cloning:
  ```sh
  npm install
  npx playwright install
  ```

---

## Running the tests

Set `TEST_ENV` to skip the environment prompt. Valid values: `prod`, `uat`, `local`.

```sh
# PowerShell
$env:TEST_ENV="uat"; npx playwright test

# bash
TEST_ENV=uat 
npx playwright test
```

Without `TEST_ENV`, when playwrite starts you are presented with the following options:

Which Giovanni environment would you like to test?
[1] prod — https://giovanni.earthdata.nasa.gov
[2] uat — https://giovanni.uat.earthdata.gov
[3] local — http://127.0.0.1:5173
Enter 1, 2, 3, or the name:

Selecting `local` starts the Vite dev server automatically if nothing is already running on `http://127.0.0.1:5173`.

**Common flags:**

```sh
npx playwright test tests/GiCRegressionTests.spec.ts   # single file
npx playwright test -g "Plotting"                       # filter by name
npx playwright test --project=chromium                  # single browser
npx playwright test --headed                            # show the browser
npx playwright show-report                              # open last HTML report
```

---

## Configuration

| Setting | Value |
|---|---|
| Config file | `playwright.config.ts` |
| Test directory | `./tests` |
| Browsers | Chromium, Firefox, WebKit |
| Retries | 0 locally · 2 on CI |
| Workers | Unlimited locally · 1 on CI |
| Trace | On first retry |
| Report | HTML → `playwright-report/` |
| Base URL | Set at runtime by `global-setup.ts` via `GIOVANNI_BASE_URL` |
