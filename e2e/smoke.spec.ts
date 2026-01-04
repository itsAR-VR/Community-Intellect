import { test, expect, type Page } from "@playwright/test"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

async function login(page: Page) {
  const email = mustGetEnv("SEED_ADMIN_EMAIL")
  const password = mustGetEnv("SEED_ADMIN_PASSWORD")

  await page.goto("/login")
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole("button", { name: /continue to dashboard/i }).click()
  await page.waitForURL(/\/app\/overview/, { timeout: 30_000 })
}

test("smoke: login + key pages render", async ({ page }) => {
  await login(page)

  const routes = [
    "overview",
    "members",
    "drafts",
    "intros",
    "opportunities",
    "perks",
    "resources",
    "pods",
    "surveys",
    "programming",
    "forced-success",
    "attention",
    "audit",
    "analytics/market-signals",
    "analytics/segmentation",
    "analytics/velocity",
    "analytics/wrapped",
    "ai-chat",
    "settings",
  ] as const

  for (const route of routes) {
    await page.goto(`/app/${route}`)
    await expect(page.getByRole("heading").first()).toBeVisible()
    await expect(page.getByText("Application error")).toHaveCount(0)
  }

  // Spot-check: Settings has the Automation tab (non-destructive)
  await page.goto("/app/settings")
  await expect(page.getByRole("tab", { name: /automation/i })).toBeVisible()
})

test("smoke: create flows open (optional)", async ({ page }) => {
  test.skip(process.env.E2E_CHECK_CREATE_DIALOGS !== "1", "Set E2E_CHECK_CREATE_DIALOGS=1 to validate edit dialogs.")

  await login(page)

  await page.goto("/app/members")
  const addMember = page.getByRole("button", { name: /add member/i })
  if (await addMember.count()) {
    const btn = addMember.first()
    if (await btn.isEnabled()) {
      await btn.click()
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()
      await page.keyboard.press("Escape")
    }
  }

  await page.goto("/app/pods")
  const createPod = page.getByRole("button", { name: /create pod/i })
  if (await createPod.count()) {
    const btn = createPod.first()
    if (await btn.isEnabled()) {
      await btn.click()
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()
      await page.keyboard.press("Escape")
    }
  }

  await page.goto("/app/surveys")
  const sendSurvey = page.getByRole("button", { name: /send survey/i })
  if (await sendSurvey.count()) {
    const btn = sendSurvey.first()
    if (await btn.isEnabled()) {
      await btn.click()
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()
      await page.keyboard.press("Escape")
    }
  }

  await page.goto("/app/programming")
  const createMastermind = page.getByRole("button", { name: /create mastermind group/i })
  if (await createMastermind.count()) {
    const btn = createMastermind.first()
    if (await btn.isEnabled()) {
      await btn.click()
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()
      await page.keyboard.press("Escape")
    }
  }
})
