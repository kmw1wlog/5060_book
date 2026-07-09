const { test, expect } = require("@playwright/test");

test("Adash loads, filters academies, and renders Kakao map", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("http://localhost:5173/adash.html");
  await page.evaluate(() => localStorage.removeItem("adash-pre-api-state"));
  await page.reload();
  await expect(page).toHaveTitle(/Adash/);
  await expect(page.getByRole("heading", { name: /어느 학원권부터/ })).toBeVisible();
  await expect(page.locator("#kpiAcademies")).toHaveText("13");

  await page.getByLabel("대시보드 보기").getByRole("button", { name: "실지도" }).click();
  await expect(page.locator("#mapHealth")).toContainText(/Kakao 지도 연결|정적 지도 사용/);
  await page.waitForFunction(() => document.documentElement.dataset.adashKakaoReady === "true", null, { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.adashMarkerCount)).toBe("13");

  await page.locator("#regionFilter").selectOption("서울");
  await expect(page.locator("#mapListCount")).toContainText("4개 학원");

  await page.getByLabel("대시보드 보기").getByRole("button", { name: "목록·검수" }).click();
  await page.locator("#searchInput").fill("수학");
  await expect(page.locator("#reviewRows tr")).toHaveCount(1);
  await expect(page.locator("#detailName")).toContainText("대치 더프라임");

  await page.getByLabel("상세 탭").getByRole("button", { name: "연락처" }).click();
  await page.getByRole("button", { name: "제외" }).click();
  await expect(page.locator("#contactStatus")).toHaveText("제외");

  await page.getByLabel("상세 탭").getByRole("button", { name: "영업" }).click();
  await page.locator("#detailStageSelect").selectOption("quote_sent");
  await page.locator("#detailOwnerInput").fill("테스트담당");
  await page.locator("#detailFollowupInput").fill("2026-07-20");
  await page.getByRole("button", { name: "영업 저장" }).click();
  await expect(page.locator("#detailLeadStage")).toHaveText("견적");
  await expect(page.locator("#detailOwner")).toHaveText("테스트담당");

  await page.getByLabel("상세 탭").getByRole("button", { name: "주문" }).click();
  await page.getByRole("button", { name: "주문 생성" }).click();
  await expect(page.locator("#detailOrderStatus")).toContainText(/주문접수|견적|납품대기/);

  await page.getByLabel("대시보드 보기").getByRole("button", { name: "주문" }).click();
  await expect(page.locator("#orderRows tr").first()).toBeVisible();

  expect(errors).toEqual([]);
});
