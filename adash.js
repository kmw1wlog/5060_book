let academies = [];
let orders = [];
let activeMode = "region";
let activeRegion = "all";
let activeGrade = "all";
let activeStage = "all";
let searchTerm = "";
let selectedId = "";
let kakaoMap = null;
let kakaoClusterer = null;
let kakaoMarkers = [];
const storageKey = "adash-pre-api-state";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const stageLabels = {
  unqualified_raw: "원천데이터",
  needs_contact_review: "미검수",
  contact_verified: "검수완료",
  campaign_candidate: "캠페인후보",
  sample_offered: "샘플제안",
  sample_sent: "샘플발송",
  followup_needed: "후속필요",
  meeting_scheduled: "상담예정",
  quote_sent: "견적",
  ordered: "주문완료",
  excluded: "제외",
};

const modePanels = {
  region: "#regionView",
  map: "#mapView",
  review: "#reviewView",
  orders: "#ordersView",
};

function text(tag, value, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function link(url, label = url) {
  if (!url) return text("span", "수집 필요");
  const element = document.createElement("a");
  element.href = url;
  element.target = "_blank";
  element.rel = "noopener noreferrer";
  element.textContent = label || url;
  return element;
}

function won(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function dateText(value) {
  return value || "미정";
}

function stageClass(stage) {
  if (stage === "ordered" || stage === "quote_sent") return "stage order";
  if (["campaign_candidate", "sample_sent", "meeting_scheduled"].includes(stage)) return "stage good";
  if (["needs_contact_review", "unqualified_raw", "followup_needed"].includes(stage)) return "stage warn";
  return "stage";
}

function visibleStageEntries() {
  const seen = new Set(academies.map((academy) => academy.leadStage).filter(Boolean));
  return Object.entries(stageLabels).filter(([value]) => seen.has(value));
}

function emailBadgeClass(status) {
  if (status === "승인") return "badge good";
  if (status === "검수필요") return "badge warn";
  return "badge";
}

function currentAcademies() {
  const normalized = searchTerm.trim().toLowerCase();
  return academies.filter((academy) => {
    const regionOk = activeRegion === "all" || academy.sido === activeRegion || academy.sigungu === activeRegion;
    const gradeOk = activeGrade === "all" || academy.targetGrade === activeGrade;
    const stageOk = activeStage === "all" || academy.leadStage === activeStage;
    const searchOk =
      !normalized ||
      [academy.name, academy.sido, academy.sigungu, academy.dong, academy.teachingCourse, academy.fieldName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    return regionOk && gradeOk && stageOk && searchOk;
  });
}

function selectAcademy(id, tab = null) {
  const academy = academies.find((item) => item.id === id);
  if (!academy) return;
  selectedId = academy.id;
  renderDetail(academy);
  renderLeadQueue();
  renderMapList();
  renderReviewRows();
  if (tab) activateDetailTab(tab);
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({ academies, orders }));
}

function applySavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (Array.isArray(saved.academies) && saved.academies.length) {
      const byId = new Map(academies.map((academy) => [academy.id, academy]));
      academies = saved.academies.map((academy) => ({ ...(byId.get(academy.id) || {}), ...academy }));
    }
    if (Array.isArray(saved.orders)) orders = saved.orders;
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function setMode(mode) {
  activeMode = mode;
  $$(".mode-switch [data-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === mode));
  Object.entries(modePanels).forEach(([name, selector]) => {
    const panel = $(selector);
    if (panel) panel.classList.toggle("is-active", name === mode);
  });
  if (mode === "map") {
    setTimeout(() => {
      if (kakaoMap && window.kakao?.maps) {
        kakaoMap.relayout();
        window.kakao.maps.event.trigger(kakaoMap, "resize");
      }
      renderMapMarkers({ fit: true });
    }, 80);
  }
}

function activateDetailTab(tab) {
  $$("[data-detail-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.detailTab === tab));
  $$("[data-detail-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.detailPanel === tab));
}

function renderFilters() {
  const regions = [...new Set(academies.map((item) => item.sido).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  const regionFilter = $("#regionFilter");
  regionFilter.replaceChildren(text("option", "전국"));
  regionFilter.firstChild.value = "all";
  regions.forEach((region) => {
    const option = text("option", region);
    option.value = region;
    regionFilter.append(option);
  });
  regionFilter.value = activeRegion;
  const stageFilter = $("#stageFilter");
  const selected = activeStage;
  stageFilter.replaceChildren(text("option", "전체"));
  stageFilter.firstChild.value = "all";
  visibleStageEntries().forEach(([value, label]) => {
    const option = text("option", label);
    option.value = value;
    stageFilter.append(option);
  });
  stageFilter.value = [...stageFilter.options].some((option) => option.value === selected) ? selected : "all";
  activeStage = stageFilter.value;
}

function renderKpis() {
  const visible = currentAcademies();
  const approved = visible.filter((item) => item.emailStatus === "승인").length;
  const campaign = visible.filter((item) => item.campaignReady).length;
  const pipeline = visible.filter((item) => ["견적", "상담", "납품대기"].includes(item.orderStatus)).length;
  const revenue = visible.reduce((sum, item) => sum + Number(item.expectedRevenue || 0), 0);
  $("#kpiAcademies").textContent = visible.length.toLocaleString("ko-KR");
  $("#kpiApprovedEmails").textContent = approved.toLocaleString("ko-KR");
  $("#kpiCampaignReady").textContent = campaign.toLocaleString("ko-KR");
  $("#kpiOrderPipeline").textContent = pipeline.toLocaleString("ko-KR");
  $("#kpiRevenue").textContent = won(revenue);
}

function getRegionItems() {
  const source = academies.filter((item) => {
    const gradeOk = activeGrade === "all" || item.targetGrade === activeGrade;
    const stageOk = activeStage === "all" || item.leadStage === activeStage;
    return gradeOk && stageOk;
  });
  const grouped = source.reduce((acc, item) => {
    const key = item.sido || "미분류";
    acc[key] ||= {
      region: key,
      total: 0,
      highSchool: 0,
      middleSchool: 0,
      approvedEmail: 0,
      campaign: 0,
      orderPipeline: 0,
      score: 0,
      revenue: 0,
    };
    acc[key].total += 1;
    acc[key].highSchool += item.targetGrade === "고등" ? 1 : 0;
    acc[key].middleSchool += item.targetGrade === "중등" ? 1 : 0;
    acc[key].approvedEmail += item.emailStatus === "승인" ? 1 : 0;
    acc[key].campaign += item.campaignReady ? 1 : 0;
    acc[key].orderPipeline += ["견적", "상담", "납품대기"].includes(item.orderStatus) ? 1 : 0;
    acc[key].score += Number(item.priorityScore || 0);
    acc[key].revenue += Number(item.expectedRevenue || 0);
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => b.total - a.total || a.region.localeCompare(b.region, "ko"));
}

function renderRegions() {
  const items = getRegionItems();
  const max = Math.max(1, ...items.map((item) => item.total));
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = `region-card${activeRegion === item.region ? " is-selected" : ""}`;
    const head = document.createElement("div");
    head.className = "region-head";
    head.append(text("strong", item.region));
    head.append(text("span", `${item.total}개 학원`, "badge"));
    const meter = document.createElement("div");
    meter.className = "meter";
    meter.style.setProperty("--value", `${Math.max(8, Math.round((item.total / max) * 100))}%`);
    const metrics = document.createElement("div");
    metrics.className = "region-metrics";
    metrics.append(text("span", `고등 ${item.highSchool}`));
    metrics.append(text("span", `이메일 ${item.approvedEmail}`));
    metrics.append(text("span", `주문권 ${item.orderPipeline}`));
    const actions = document.createElement("div");
    actions.className = "region-actions";
    actions.append(text("span", `평균 ${Math.round(item.score / item.total)} · 예상 ${won(item.revenue)}`, "eyebrow"));
    const button = text("button", "지도에서 보기", "ghost-button");
    button.type = "button";
    button.dataset.region = item.region;
    actions.append(button);
    card.append(head, meter, metrics, actions);
    fragment.append(card);
  });
  $("#regionGrid").replaceChildren(fragment);
}

function academyButton(academy, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${className}${academy.id === selectedId ? " is-selected" : ""}`;
  button.dataset.id = academy.id;
  button.append(text("strong", academy.name));
  button.append(text("p", `${academy.sido} ${academy.sigungu} · ${academy.targetGrade} · ${academy.teachingCourse}`));
  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.append(text("span", stageLabels[academy.leadStage] || academy.leadStage, stageClass(academy.leadStage)));
  meta.append(text("span", academy.emailStatus, emailBadgeClass(academy.emailStatus)));
  meta.append(text("span", `우선 ${academy.priorityScore}`, "badge"));
  button.append(meta);
  return button;
}

function renderLeadQueue() {
  const queue = currentAcademies()
    .slice()
    .sort((a, b) => Number(b.priorityScore || 0) - Number(a.priorityScore || 0))
    .slice(0, 18);
  $("#queueCount").textContent = `${queue.length}`;
  $("#leadQueue").replaceChildren(...queue.map((academy) => academyButton(academy, "queue-card")));
}

function renderMapList() {
  const visible = currentAcademies().slice().sort((a, b) => Number(b.priorityScore || 0) - Number(a.priorityScore || 0));
  $("#mapListCount").textContent = `${visible.length}개 학원`;
  $("#mapAcademyList").replaceChildren(...visible.map((academy) => academyButton(academy, "academy-card")));
  $("#mapTitle").textContent = `${activeRegion === "all" ? "전국" : activeRegion} 학원 지도`;
}

function renderReviewRows() {
  const rows = currentAcademies().map((academy) => {
    const row = document.createElement("tr");
    if (academy.id === selectedId) row.classList.add("is-selected");
    const nameCell = document.createElement("td");
    const button = text("button", academy.name);
    button.type = "button";
    button.dataset.id = academy.id;
    nameCell.append(button, text("p", academy.address || "주소 확인 필요"));
    const contactCell = document.createElement("td");
    contactCell.append(text("span", academy.emailStatus, emailBadgeClass(academy.emailStatus)));
    contactCell.append(text("p", academy.email || academy.website || "대표 이메일 수집 필요"));
    contactCell.append(text("p", academy.emailSourceUrl ? "출처 있음" : "출처 필요"));
    const stageCell = document.createElement("td");
    stageCell.append(text("span", stageLabels[academy.leadStage] || academy.leadStage, stageClass(academy.leadStage)));
    stageCell.append(text("p", academy.owner || "미배정"));
    row.append(
      nameCell,
      text("td", `${academy.sido} ${academy.sigungu}`),
      text("td", `${academy.targetGrade} · ${academy.teachingCourse}`),
      text("td", `${academy.estimatedStudentCount || "-"}명 추정 · ${academy.studentCountConfidence}`),
      contactCell,
      stageCell,
      text("td", academy.nextAction || "다음 액션 지정"),
    );
    return row;
  });
  if (rows.length === 0) {
    const row = document.createElement("tr");
    const cell = text("td", "조건에 맞는 학원이 없습니다.");
    cell.colSpan = 7;
    row.append(cell);
    $("#reviewRows").replaceChildren(row);
    return;
  }
  $("#reviewRows").replaceChildren(...rows);
}

function renderOrders() {
  const visibleIds = new Set(currentAcademies().map((academy) => academy.id));
  const visibleOrders = orders.filter((order) => visibleIds.has(order.academyId));
  $("#orderSummary").textContent = `${visibleOrders.length}건`;
  const rows = visibleOrders.map((order) => {
    const academy = academies.find((item) => item.id === order.academyId);
    const row = document.createElement("tr");
    const academyCell = document.createElement("td");
    const button = text("button", academy?.name || order.academyId);
    button.type = "button";
    button.dataset.id = order.academyId;
    academyCell.append(button, text("p", academy ? `${academy.sido} ${academy.sigungu}` : ""));
    row.append(
      text("td", order.orderNo),
      academyCell,
      text("td", `${order.productName} · ${order.examRound}`),
      text("td", `${order.quantity.toLocaleString("ko-KR")}부`),
      text("td", won(order.totalAmount)),
      text("td", `${order.orderStatus} · ${order.paymentStatus}`),
      text("td", `${dateText(order.deliveryDueAt)} 납품 · ${dateText(order.examScheduledAt)} 시행`),
    );
    return row;
  });
  $("#orderRows").replaceChildren(...rows);
}

function renderDetail(academy) {
  const relatedOrders = orders.filter((order) => order.academyId === academy.id);
  $("#detailName").textContent = academy.name;
  $("#detailRegion").textContent = `${academy.sido} ${academy.sigungu} ${academy.dong}`.trim();
  $("#detailGrade").textContent = academy.targetGrade;
  $("#detailCourse").textContent = `${academy.fieldName} · ${academy.teachingCourse}`;
  $("#detailScale").textContent = `${academy.estimatedStudentCount || "-"}명 추정 · 정원 ${academy.capacity || "-"}명`;
  $("#detailScore").textContent = `${academy.priorityScore}점`;
  $("#detailNotes").textContent = academy.notes || "";
  $("#contactStatus").textContent = academy.emailStatus;
  $("#detailPhone").textContent = academy.phone || "확인 필요";
  $("#detailWebsite").replaceChildren(link(academy.website, academy.website ? "홈페이지 열기" : ""));
  $("#detailEmail").textContent = academy.email || "대표 이메일 수집 필요";
  $("#detailEmailSource").replaceChildren(link(academy.emailSourceUrl, academy.emailSourceUrl ? "출처 열기" : ""));
  $("#detailLeadStage").textContent = stageLabels[academy.leadStage] || academy.leadStage;
  $("#detailOwner").textContent = academy.owner || "미배정";
  $("#detailLastContacted").textContent = dateText(academy.lastContactedAt);
  $("#detailNextFollowup").textContent = dateText(academy.nextFollowupAt);
  $("#detailNextAction").textContent = academy.nextAction || "다음 액션 지정";
  $("#detailOrderStatus").textContent = academy.orderStatus || "미주문";
  $("#detailExpectedQty").textContent = `${academy.expectedQuantity || 0}부`;
  $("#detailExpectedRevenue").textContent = won(academy.expectedRevenue);
  $("#detailOrderHistory").textContent = relatedOrders.length ? `${relatedOrders.length}건 · ${won(relatedOrders.reduce((sum, order) => sum + order.totalAmount, 0))}` : "주문 없음";
  $("#detailRenewal").textContent = relatedOrders[0]?.renewalExpectedAt || "주문 후 산정";
  $("#detailStageSelect").value = academy.leadStage;
  $("#detailOwnerInput").value = academy.owner || "";
  $("#detailFollowupInput").value = academy.nextFollowupAt || "";
  $("#detailOrderStatusSelect").value = [...$("#detailOrderStatusSelect").options].some((option) => option.value === academy.orderStatus) ? academy.orderStatus : "미주문";
  $("#detailPaymentStatusSelect").value = relatedOrders[0]?.paymentStatus || "미정";
}

function xyFromLatLng(lat, lng) {
  const x = ((Number(lng) - 124) / 8) * 100;
  const y = ((39 - Number(lat)) / 6) * 100;
  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
  };
}

function renderFallbackPins() {
  const pins = currentAcademies().map((academy) => {
    const pin = document.createElement("button");
    const pos = xyFromLatLng(academy.lat, academy.lng);
    pin.type = "button";
    pin.className = "fallback-pin";
    pin.style.left = `${pos.x}%`;
    pin.style.top = `${pos.y}%`;
    pin.title = academy.name;
    pin.dataset.id = academy.id;
    return pin;
  });
  $("#fallbackMap").replaceChildren(...pins);
}

function clearKakaoMarkers() {
  if (kakaoClusterer) kakaoClusterer.clear();
  kakaoMarkers.forEach((marker) => marker.setMap(null));
  kakaoMarkers = [];
}

function renderMapMarkers(options = {}) {
  renderFallbackPins();
  const visible = currentAcademies();
  if (!kakaoMap || !window.kakao?.maps) return;
  clearKakaoMarkers();
  const bounds = new window.kakao.maps.LatLngBounds();
  const markers = [];
  visible.forEach((academy) => {
    const position = new window.kakao.maps.LatLng(academy.lat, academy.lng);
    const marker = new window.kakao.maps.Marker({ position, title: academy.name });
    window.kakao.maps.event.addListener(marker, "click", () => selectAcademy(academy.id, "summary"));
    markers.push(marker);
    bounds.extend(position);
  });
  kakaoMarkers = markers;
  if (kakaoClusterer) {
    kakaoClusterer.addMarkers(markers);
  } else {
    markers.forEach((marker) => marker.setMap(kakaoMap));
  }
  document.documentElement.dataset.adashMarkerCount = String(markers.length);
  if (options.fit && markers.length > 1) kakaoMap.setBounds(bounds);
  if (options.fit && markers.length === 1) kakaoMap.setCenter(markers[0].getPosition());
}

function loadKakaoSdk(appKey) {
  return new Promise((resolve, reject) => {
    if (!appKey) {
      reject(new Error("Kakao JavaScript key missing"));
      return;
    }
    if (window.kakao?.maps?.Map) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=clusterer,services`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error("Kakao Map SDK load failed"));
    document.head.append(script);
  });
}

async function initKakao() {
  try {
    await loadKakaoSdk(window.ADASH_CONFIG?.kakaoJavaScriptKey || "");
    kakaoMap = new window.kakao.maps.Map($("#kakaoMap"), {
      center: new window.kakao.maps.LatLng(36.45, 127.85),
      level: 13,
    });
    if (window.kakao.maps.MarkerClusterer) {
      kakaoClusterer = new window.kakao.maps.MarkerClusterer({
        map: kakaoMap,
        averageCenter: true,
        minLevel: 8,
        gridSize: 72,
      });
      document.documentElement.dataset.adashClusterReady = "true";
    }
    document.documentElement.dataset.adashKakaoReady = "true";
    $("#mapHealth").textContent = "Kakao 지도 연결";
    $("#mapHealth").className = "health-pill good";
    $("#fallbackMap").classList.remove("is-active");
    renderMapMarkers({ fit: true });
  } catch (error) {
    document.documentElement.dataset.adashKakaoReady = "false";
    $("#mapHealth").textContent = "정적 지도 사용";
    $("#mapHealth").className = "health-pill warn";
    $("#fallbackMap").classList.add("is-active");
    renderFallbackPins();
  }
}

function exportCsv(filename = "adash-academies.csv") {
  const headers = [
    "name",
    "sido",
    "sigungu",
    "targetGrade",
    "teachingCourse",
    "phone",
    "website",
    "contactPageUrl",
    "emailStatus",
    "email",
    "emailSourceUrl",
    "owner",
    "leadStage",
    "lastContactedAt",
    "nextFollowupAt",
    "nextAction",
    "orderStatus",
    "expectedQuantity",
    "expectedRevenue",
    "notes",
  ];
  const lines = currentAcademies().map((academy) =>
    headers.map((key) => `"${String(academy[key] ?? "").replaceAll('"', '""')}"`).join(","),
  );
  const blob = new Blob([`\ufeff${[headers.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportCampaignCsv() {
  const candidates = currentAcademies().filter((academy) => academy.emailStatus === "승인" && academy.email && academy.emailSourceUrl && academy.campaignReady);
  const headers = ["name", "sido", "sigungu", "email", "emailType", "emailSourceUrl", "website", "targetGrade", "teachingCourse", "owner", "nextAction"];
  const lines = candidates.map((academy) => headers.map((key) => `"${String(academy[key] ?? "").replaceAll('"', '""')}"`).join(","));
  const blob = new Blob([`\ufeff${[headers.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
  const element = document.createElement("a");
  element.href = URL.createObjectURL(blob);
  element.download = "adash-campaign-candidates.csv";
  element.click();
  URL.revokeObjectURL(element.href);
}

function updateSelectedAcademy(patch) {
  const index = academies.findIndex((academy) => academy.id === selectedId);
  if (index < 0) return;
  academies[index] = { ...academies[index], ...patch };
  saveState();
  renderFilters();
  rerender();
  selectAcademy(selectedId);
}

function createOrderForSelected() {
  const academy = academies.find((item) => item.id === selectedId);
  if (!academy) return;
  const existing = orders.find((order) => order.academyId === academy.id);
  if (existing) {
    updateSelectedAcademy({ orderStatus: existing.orderStatus, leadStage: "ordered" });
    return;
  }
  const orderNo = `AD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, "0")}`;
  orders.unshift({
    id: `ord-${Date.now()}`,
    academyId: academy.id,
    orderNo,
    productName: `${academy.targetGrade} ${academy.teachingCourse} 모의고사`,
    examRound: "pre-api",
    subject: academy.teachingCourse,
    targetGrade: academy.targetGrade,
    quantity: academy.expectedQuantity || 50,
    unitPrice: 6000,
    totalAmount: Number(academy.expectedQuantity || 50) * 6000,
    orderStatus: "주문접수",
    paymentStatus: "결제대기",
    deliveryMethod: "PDF",
    deliveryDueAt: "",
    examScheduledAt: "",
    gradingStatus: "미신청",
    renewalExpectedAt: "",
  });
  updateSelectedAcademy({ orderStatus: "주문접수", leadStage: "ordered" });
  saveState();
}

function rerender(options = {}) {
  renderKpis();
  renderRegions();
  renderLeadQueue();
  renderMapList();
  renderReviewRows();
  renderOrders();
  renderMapMarkers({ fit: options.fitMap });
  if (!currentAcademies().some((item) => item.id === selectedId) && currentAcademies()[0]) {
    selectAcademy(currentAcademies()[0].id);
  }
}

function bindEvents() {
  $(".mode-switch").addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    setMode(button.dataset.mode);
  });
  $(".detail-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail-tab]");
    if (button) activateDetailTab(button.dataset.detailTab);
  });
  $("#regionFilter").addEventListener("change", (event) => {
    activeRegion = event.target.value;
    rerender();
  });
  $("#gradeFilter").addEventListener("change", (event) => {
    activeGrade = event.target.value;
    rerender();
  });
  $("#stageFilter").addEventListener("change", (event) => {
    activeStage = event.target.value;
    rerender();
  });
  $("#searchInput").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    rerender();
  });
  document.body.addEventListener("click", (event) => {
    const academyButton = event.target.closest("[data-id]");
    if (academyButton) selectAcademy(academyButton.dataset.id);
    const regionButton = event.target.closest("[data-region]");
    if (regionButton) {
      activeRegion = regionButton.dataset.region;
      $("#regionFilter").value = activeRegion;
      setMode("map");
      rerender({ fitMap: true });
    }
  });
  $("#showAllOnMap").addEventListener("click", () => {
    activeRegion = "all";
    $("#regionFilter").value = "all";
    setMode("map");
    rerender({ fitMap: true });
  });
  $("#fitMap").addEventListener("click", () => renderMapMarkers({ fit: true }));
  $("#resetMap").addEventListener("click", () => {
    activeRegion = "all";
    $("#regionFilter").value = "all";
    setMode("map");
    rerender({ fitMap: true });
  });
  $("#downloadCsv").addEventListener("click", () => exportCsv());
  $("#exportReview").addEventListener("click", () => exportCsv("adash-review.csv"));
  $("#lockCampaign").addEventListener("click", () => {
    activeStage = "campaign_candidate";
    $("#stageFilter").value = activeStage;
    setMode("review");
    rerender();
  });
  $("#exportCampaign").addEventListener("click", exportCampaignCsv);
  document.body.addEventListener("click", (event) => {
    const statusButton = event.target.closest("[data-email-status]");
    if (!statusButton) return;
    const emailStatus = statusButton.dataset.emailStatus;
    updateSelectedAcademy({
      emailStatus,
      campaignReady: emailStatus === "승인" && Boolean(academies.find((item) => item.id === selectedId)?.emailSourceUrl),
    });
    activateDetailTab("contact");
  });
  $("#saveSalesState").addEventListener("click", () => {
    updateSelectedAcademy({
      leadStage: $("#detailStageSelect").value,
      owner: $("#detailOwnerInput").value.trim() || "미배정",
      nextFollowupAt: $("#detailFollowupInput").value,
      lastContactedAt: new Date().toISOString().slice(0, 10),
    });
    activateDetailTab("sales");
  });
  $("#createMockOrder").addEventListener("click", () => {
    createOrderForSelected();
    activateDetailTab("order");
  });
  $("#saveOrderState").addEventListener("click", () => {
    const order = orders.find((item) => item.academyId === selectedId);
    if (order) {
      order.orderStatus = $("#detailOrderStatusSelect").value;
      order.paymentStatus = $("#detailPaymentStatusSelect").value;
    }
    updateSelectedAcademy({
      orderStatus: $("#detailOrderStatusSelect").value,
      leadStage: $("#detailOrderStatusSelect").value === "미주문" ? "campaign_candidate" : "ordered",
    });
    saveState();
    activateDetailTab("order");
  });
}

async function init() {
  bindEvents();
  const response = await fetch("./data/adash-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error("adash-data.json not found");
  const payload = await response.json();
  academies = payload.academies || [];
  orders = payload.orders || [];
  applySavedState();
  selectedId = academies[0]?.id || "";
  renderFilters();
  const salesOptions = Object.entries(stageLabels).map(([value, label]) => {
    const option = text("option", label);
    option.value = value;
    return option;
  });
  $("#detailStageSelect").replaceChildren(...salesOptions);
  rerender();
  if (selectedId) selectAcademy(selectedId);
  await initKakao();
}

init().catch((error) => {
  console.error(error);
  $("#mapHealth").textContent = "데이터 로딩 실패";
  $("#mapHealth").className = "health-pill warn";
});
