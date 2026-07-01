const { test, expect } = require("@playwright/test");

const baseURL = "http://127.0.0.1:5173";

test.describe("geojangmungo static site", () => {
  test("desktop home shows the brand offer, product image, and next content", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await page.goto(baseURL);

    await expect(page.getByRole("heading", { name: "거장문고", level: 1 })).toBeVisible();
    await expect(page.getByText("거장의 원전을 오늘의 한국어로")).toBeVisible();
    await expect(page.getByText("평균 권당 5천원대", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /대표 컬렉션 보기/ })).toBeVisible();

    const heroBackground = await page.locator(".hero").evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(heroBackground).toContain("03_00_04%20AM%20(1).png");

    const firstEntryImageLoaded = await page
      .locator(".entry-card img")
      .first()
      .evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(firstEntryImageLoaded).toBe(true);

    const valueTop = await page.locator(".value-strip").evaluate((el) => el.getBoundingClientRect().top);
    expect(valueTop).toBeLessThan(900);
  });

  test("all planned sections are reachable in order", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await page.goto(baseURL);

    const ids = ["start", "collections", "product", "translation", "community", "checkout", "guide"];
    let previousTop = 0;
    for (const id of ids) {
      const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      expect(top).toBeGreaterThan(previousTop);
      previousTop = top;
    }

    await expect(page.getByRole("heading", { name: "질문별로 묶어 읽는 5060 맞춤 고전 세트" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "국부론" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "왜 거장문고의 번역은 믿을 수 있을까요?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "혼자 읽지 않아도 됩니다" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "장바구니와 결제를 한 화면에서 확인합니다" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "거장문고와 함께 천천히, 깊게 읽어보세요" })).toBeVisible();
  });

  test("mobile layout does not horizontally overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL);

    await expect(page.getByRole("heading", { name: "거장문고", level: 1 })).toBeVisible();
    await expect(page.getByText("무료 독서지도 받기").first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
