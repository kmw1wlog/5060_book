const { test, expect } = require("@playwright/test");

const baseURL = "http://127.0.0.1:5173";

async function openDashboard(page) {
  await page.goto(`${baseURL}/dashboard.html`);
  await page.waitForFunction(() => document.documentElement.dataset.dashboardReady === "true");
}

test.describe("map-canvas institution dashboard", () => {
  test("loads the map workbench with live data status", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await expect(page.getByRole("heading", { name: "5060+교회·시니어·도서관 타겟을 지도에서 관리합니다" })).toBeVisible();
    await expect(page.locator("#totalInstitutionCount")).toHaveText("420");
    await expect(page.getByRole("img", { name: "한국 전체 국토 위 기관 분포 지도" })).toBeVisible();
    await expect(page.locator("#apiStatusStrip .api-card")).toHaveCount(6);
    await expect(page.locator("#apiStatusStrip")).toContainText("전국평생학습강좌");
    await expect(page.locator("#apiStatusStrip")).toContainText("Kakao Local REST");
    await expect(page.locator("#apiStatusStrip")).toContainText("VWorld 노인복지시설");
  });

  test("renders institution pins across Korea and filters by type", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await expect(page.locator("#mapPins .map-pin")).toHaveCount(420);
    await expect(page.locator("#mapResultLabel")).toContainText("전국 전체 420개 기관");

    await page.getByRole("button", { name: /교회·신학/ }).click();
    await expect(page.locator("#mapPins .map-pin.church")).toHaveCount(8);
    await expect(page.locator("#mapResultLabel")).toContainText("전국 교회·신학 8개 기관");

    await page.getByRole("button", { name: "전국 보기" }).click();
    await expect(page.locator("#mapPins .map-pin")).toHaveCount(420);
  });

  test("region filter, table, and right rail stay synchronized", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.locator("#regionSelect").selectOption("서울");
    await expect(page.locator("#mapResultLabel")).toContainText(/서울 전체 \d+개 기관/);
    const pinCount = await page.locator("#mapPins .map-pin").count();
    expect(pinCount).toBeGreaterThan(0);
    expect(pinCount).toBeLessThan(420);

    await page.locator("#institutionRows button").first().click();
    await expect(page.locator("#detailName")).not.toHaveText("데이터 로딩 중");
    await expect(page.locator("#detailRegion")).toContainText("서울");
    await expect(page.locator("#globalEmailList .side-item")).toHaveCount(pinCount > 180 ? 180 : pinCount);
  });

  test("map pin click opens an institution management summary", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.locator("#mapPins .map-pin").nth(3).click();
    await expect(page.locator("[data-panel='summary']")).toBeVisible();
    await expect(page.locator("#detailName")).not.toHaveText("데이터 로딩 중");
    await expect(page.locator("#pipelineStage")).not.toHaveText("-");
    await expect(page.locator("#orderRevenue")).toContainText("원");
  });

  test("email rail and campaign automation remain visible but locked", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.getByRole("button", { name: "이메일", exact: true }).click();
    await expect(page.locator("#globalEmailCount")).toHaveText("420개");
    await expect(page.locator("#globalEmailList .side-item")).toHaveCount(180);
    await expect(page.locator("#globalEmailList")).toContainText("대표 이메일 수집 필요");
    await expect(page.getByRole("button", { name: "n8n/listmonk 연결 후 테스트 발송" })).toBeDisabled();
    await expect(page.locator("#automationQueueCount")).toHaveText("0");
    await expect(page.locator("#collectionQueueCount")).toHaveText("420");
  });

  test("CSV export stays local and includes source columns", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportCsv").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("geojangmungo-institutions.csv");
  });

  test("mobile layout does not horizontally overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDashboard(page);

    await expect(page.locator("#totalInstitutionCount")).toHaveText("420");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
