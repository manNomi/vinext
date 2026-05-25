/**
 * Next.js Compat E2E: useRouter().bfcacheId
 * Ported from: https://github.com/vercel/next.js/blob/56d95137fd6d84f4bc1e5ef2bb31e0136d5fad9c/test/e2e/app-dir/use-router-bfcache-id/use-router-bfcache-id.test.ts
 */

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitForAppRouterHydration } from "../../helpers";

const BASE = "http://localhost:4174";
const ROUTE = "/nextjs-compat/use-router-bfcache-id";

async function revealAndClick(page: Page, href: string) {
  await page.locator(`input[data-link-accordion="${href}"]`).first().check();
  await page.locator(`a[href="${href}"]`).first().click();
}

function visibleTestId(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]:visible`).first();
}

test.describe("Next.js compat: useRouter().bfcacheId", () => {
  test("mints bfcacheIds for fresh leaf navigations and restores them on history traversal", async ({
    page,
  }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText("_b_0_");

    await revealAndClick(page, `${ROUTE}/x/2`);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    const x2BfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    expect(x2BfcacheId).toMatch(/^_b_\d+_$/);

    await revealAndClick(page, `${ROUTE}/x/1`);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/1`);
    const freshX1BfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    expect(freshX1BfcacheId).toMatch(/^_b_\d+_$/);
    expect(freshX1BfcacheId).not.toBe(x2BfcacheId);

    await page.goBack();
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(x2BfcacheId ?? "");
  });

  test("keeps restored bfcacheIds after hard reload of a history entry", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    const x1BfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    expect(x1BfcacheId).toBe("_b_0_");

    await revealAndClick(page, `${ROUTE}/x/2`);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    const x2BfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    expect(x2BfcacheId).toMatch(/^_b_\d+_$/);
    expect(x2BfcacheId).not.toBe(x1BfcacheId);

    await page.reload();
    await waitForAppRouterHydration(page);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(x2BfcacheId ?? "");

    await visibleTestId(page, "leaf-input").fill("x2-state-after-reload");
    await page.goBack();
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/1`);
    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(x1BfcacheId ?? "");
    await expect(visibleTestId(page, "leaf-input")).not.toHaveValue("x2-state-after-reload");
  });

  test("resets leaf form state when re-entering a route via fresh push", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    await visibleTestId(page, "leaf-input").fill("hello");
    await revealAndClick(page, `${ROUTE}/x/2`);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);

    await revealAndClick(page, `${ROUTE}/x/1`);
    await expect(visibleTestId(page, "leaf-input")).toHaveValue("");
  });

  test("preserves shared layout state across sibling leaf navigations", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    await visibleTestId(page, "layout-input").fill("layout");
    const xLayoutBfcacheId = await visibleTestId(page, "layout-bfcache-id").textContent();

    await revealAndClick(page, `${ROUTE}/x/2`);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    await expect(visibleTestId(page, "layout-input")).toHaveValue("layout");
    await expect(visibleTestId(page, "layout-bfcache-id")).toHaveText(xLayoutBfcacheId ?? "");
  });

  test("resets shared layout state when navigating across dynamic groups", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    await visibleTestId(page, "layout-input").fill("layout");
    const xLayoutBfcacheId = await visibleTestId(page, "layout-bfcache-id").textContent();

    await revealAndClick(page, `${ROUTE}/y/1`);
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/y/1`);
    await expect(visibleTestId(page, "layout-input")).toHaveValue("");
    const yLayoutBfcacheId = await visibleTestId(page, "layout-bfcache-id").textContent();
    expect(yLayoutBfcacheId).not.toBe(xLayoutBfcacheId);
  });

  test("preserves bfcacheId across hash/search-param navigation and refresh", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    const initialBfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    await revealAndClick(page, `${ROUTE}/x/1#section`);
    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(initialBfcacheId ?? "");

    await revealAndClick(page, `${ROUTE}/x/1?q=2`);
    await expect(visibleTestId(page, "search")).toHaveAttribute("data-value", "q=2");
    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(initialBfcacheId ?? "");

    await visibleTestId(page, "refresh").click();
    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(initialBfcacheId ?? "");
  });

  test("mints bfcacheIds for programmatic push and replace", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    const pushInitialBfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    await visibleTestId(page, "router-push-x-2").click();
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    const pushedBfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    expect(pushedBfcacheId).toMatch(/^_b_\d+_$/);
    expect(pushedBfcacheId).not.toBe(pushInitialBfcacheId);

    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    const replaceInitialBfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    await visibleTestId(page, "router-replace-x-2").click();
    await expect(visibleTestId(page, "pathname")).toHaveText(`${ROUTE}/x/2`);
    const replacedBfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    expect(replacedBfcacheId).toMatch(/^_b_\d+_$/);
    expect(replacedBfcacheId).not.toBe(replaceInitialBfcacheId);
  });

  test("preserves leaf form state across a server action refresh", async ({ page }) => {
    await page.goto(`${BASE}${ROUTE}/x/1`);
    await waitForAppRouterHydration(page);

    const initialBfcacheId = await visibleTestId(page, "leaf-bfcache-id").textContent();
    await visibleTestId(page, "leaf-input").fill("server-action-state");

    const actionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" && response.url().includes(`${ROUTE}/x/1.rsc`),
    );
    await visibleTestId(page, "server-action-refresh").click();
    await actionResponse;

    await expect(visibleTestId(page, "leaf-bfcache-id")).toHaveText(initialBfcacheId ?? "");
    await expect(visibleTestId(page, "leaf-input")).toHaveValue("server-action-state");
  });
});
