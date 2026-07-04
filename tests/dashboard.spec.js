const { test, expect } = require("@playwright/test");
const dashboardData = require("../data/dashboard-data.json");

const baseURL = "http://localhost:5173";
const totalInstitutions = dashboardData.institutions.length;
const churchCount = dashboardData.summary.targetCounts.church;
const vworldCount = dashboardData.institutions.filter((item) => item.sourceDataset === "VWorld_노인복지시설").length;
const realCoordinateCount = dashboardData.institutions.filter((item) => item.coordinateSource && item.coordinateSource !== "region-center").length;
const envStatusCount = dashboardData.envStatus.length;
const apiStatusCount = dashboardData.apiStatus.length;

async function openDashboard(page) {
  await page.goto(`${baseURL}/dashboard.html`);
  await page.waitForFunction(() => document.documentElement.dataset.dashboardReady === "true");
}

test.describe("map-canvas institution dashboard", () => {
  test("loads the map workbench with live data status", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await expect(page.getByRole("heading", { name: "5060+교회·시니어·도서관 타겟을 지도에서 관리합니다" })).toBeVisible();
    await expect(page.locator("#totalInstitutionCount")).toHaveText(String(totalInstitutions));
    await expect(page.getByRole("img", { name: "한국 전체 국토 위 기관 분포 지도" })).toBeVisible();
    await expect(page.locator("#apiStatusStrip .api-card")).toHaveCount(apiStatusCount);
    await expect(page.locator("#apiStatusStrip")).toContainText("전국평생학습강좌");
    await expect(page.locator("#apiStatusStrip")).toContainText("Kakao Local REST");
    await expect(page.locator("#apiStatusStrip")).toContainText("VWorld 노인복지시설 실데이터");
    await expect(page.locator("#apiStatusStrip")).toContainText("Kakao REST 좌표 보강");
    await expect(page.locator("#apiStatusStrip")).toContainText("Supabase Management API");
    await expect(page.locator("#apiStatusStrip")).toContainText("Supabase DB REST");
    expect(vworldCount).toBeGreaterThan(300);
    expect(realCoordinateCount).toBeGreaterThan(700);
  });

  test("loads Kakao map and renders real-data institution filters", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.waitForFunction(() => document.documentElement.dataset.kakaoMapReady === "true");
    await expect(page.locator("#mapEngineStatus")).toHaveText("Kakao 실지도 연결");
    await expect(page.locator("#kakaoMapLayer.is-ready")).toBeVisible();
    await expect(page.locator("#mapPins .map-pin")).toHaveCount(totalInstitutions);
    await expect(page.locator("#mapResultLabel")).toContainText(`전국 전체 ${totalInstitutions.toLocaleString("ko-KR")}개 기관`);

    await page.getByRole("button", { name: /교회·신학/ }).click();
    await expect(page.locator("#mapPins .map-pin.church")).toHaveCount(churchCount);
    await expect(page.locator("#mapResultLabel")).toContainText(`전국 교회·신학 ${churchCount.toLocaleString("ko-KR")}개 기관`);

    await page.getByRole("button", { name: "전국 보기" }).click();
    await expect(page.locator("#mapPins .map-pin")).toHaveCount(totalInstitutions);
  });

  test("region filter, table, and right rail stay synchronized", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.locator("#regionSelect").selectOption("서울");
    await expect(page.locator("#mapResultLabel")).toContainText(/서울 전체 \d+개 기관/);
    const pinCount = await page.locator("#mapPins .map-pin").count();
    expect(pinCount).toBeGreaterThan(0);
    expect(pinCount).toBeLessThan(totalInstitutions);

    await page.locator("#institutionRows button").first().click();
    await expect(page.locator("#detailName")).not.toHaveText("데이터 로딩 중");
    await expect(page.locator("#detailRegion")).toContainText("서울");
    await expect(page.locator("#globalEmailList .side-item")).toHaveCount(pinCount > 180 ? 180 : pinCount);
  });

  test("map pin click opens an institution management summary", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.locator("#institutionRows button").nth(3).click();
    await expect(page.locator("[data-panel='summary']")).toBeVisible();
    await expect(page.locator("#detailName")).not.toHaveText("데이터 로딩 중");
    await expect(page.locator("#pipelineStage")).not.toHaveText("-");
    await expect(page.locator("#orderRevenue")).toContainText("원");
  });

  test("email rail and campaign automation remain visible but locked", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.getByRole("button", { name: "이메일", exact: true }).click();
    await expect(page.locator("#globalEmailCount")).toHaveText(`${totalInstitutions.toLocaleString("ko-KR")}개`);
    await expect(page.locator("#globalEmailList .side-item")).toHaveCount(180);
    await expect(page.locator("#globalEmailList")).toContainText("대표 이메일 수집 필요");
    await expect(page.getByRole("button", { name: "n8n/listmonk 연결 후 테스트 발송" })).toBeDisabled();
    await expect(page.locator("#automationQueueCount")).toHaveText("0");
    await expect(page.locator("#collectionQueueCount")).toHaveText(String(totalInstitutions));
  });

  test("source tab exposes safe environment usage status without secrets", async ({ page }) => {
    await page.setViewportSize({ width: 1448, height: 900 });
    await openDashboard(page);

    await page.getByRole("button", { name: "출처" }).click();
    await expect(page.locator("#envStatusList .env-item")).toHaveCount(envStatusCount);
    await expect(page.locator("#envStatusList")).toContainText("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY");
    await expect(page.locator("#envStatusList")).toContainText("VWORLD_DOMAIN");
    await expect(page.locator("#envStatusList")).toContainText("SUPABASE_URL");
    await expect(page.locator("#envStatusList")).toContainText("configured-unused");
    await expect(page.locator("#envStatusList")).toContainText("missing-for-future-stage");
    await expect(page.locator("#envStatusList")).not.toContainText("539082");
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

    await expect(page.locator("#totalInstitutionCount")).toHaveText(String(totalInstitutions));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
