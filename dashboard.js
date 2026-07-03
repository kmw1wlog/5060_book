let institutions = [];
let contacts = [];
let apiStatus = [];
let activeTarget = "all";
let activeRegion = "all";
let selectedId = "";

const qs = (selector) => document.querySelector(selector);

const rows = qs("#institutionRows");
const typeToggles = qs("#typeToggles");
const regionSelect = qs("#regionSelect");
const resetMap = qs("#resetMap");
const exportCsv = qs("#exportCsv");
const mapPins = qs("#mapPins");
const mapResultLabel = qs("#mapResultLabel");
const totalInstitutionCount = qs("#totalInstitutionCount");
const resultCount = qs("#resultCount");
const pendingInstitutionCount = qs("#pendingInstitutionCount");
const approvedContactCount = qs("#approvedContactCount");
const suppressedContactCount = qs("#suppressedContactCount");
const sendableContactCount = qs("#sendableContactCount");
const apiStatusStrip = qs("#apiStatusStrip");
const apiStatusList = qs("#apiStatusList");

const detailName = qs("#detailName");
const detailCategory = qs("#detailCategory");
const detailRegion = qs("#detailRegion");
const detailStatus = qs("#detailStatus");
const detailScore = qs("#detailScore");
const detailNote = qs("#detailNote");
const detailContacts = qs("#detailContacts");
const detailSourceDataset = qs("#detailSourceDataset");
const detailSourceLicense = qs("#detailSourceLicense");
const globalEmailCount = qs("#globalEmailCount");
const globalEmailList = qs("#globalEmailList");

const pipelineStage = qs("#pipelineStage");
const pipelineOwner = qs("#pipelineOwner");
const pipelineInterest = qs("#pipelineInterest");
const pipelineAction = qs("#pipelineAction");
const orderType = qs("#orderType");
const orderQuantity = qs("#orderQuantity");
const orderRevenue = qs("#orderRevenue");
const orderBooks = qs("#orderBooks");

const downloadCsv = qs("#downloadCsv");
const csvInput = qs("#csvInput");
const csvStatus = qs("#csvStatus");
const campaignSegment = qs("#campaignSegment");
const campaignSendableCount = qs("#campaignSendableCount");
const campaignSuppressedCount = qs("#campaignSuppressedCount");
const automationQueueCount = qs("#automationQueueCount");
const collectionQueueCount = qs("#collectionQueueCount");

const TARGET_LABELS = {
  all: "전체",
  senior: "시니어",
  church: "교회·신학",
  library: "도서관",
  lifelong: "평생교육",
};

function createTextElement(tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function getBadgeClass(status = "") {
  if (["ok", "승인 후보", "승인", "검수중"].includes(status)) return "status-badge good";
  if (["failed", "대표 문의 확인", "보류", "검수 대기", "수집 필요", "미접촉"].includes(status)) return "status-badge caution";
  return "status-badge";
}

function createBadge(text, className = "status-badge") {
  const badge = document.createElement("span");
  badge.className = className;
  badge.textContent = text;
  return badge;
}

function isSendableContact(contact) {
  return (
    contact.reviewStatus === "승인" &&
    contact.isRoleAccount &&
    Boolean(contact.email) &&
    !contact.isPersonalEmailSuspected &&
    !contact.optOut &&
    !contact.bounced
  );
}

function isSuppressedContact(contact) {
  return contact.optOut || contact.bounced || contact.isPersonalEmailSuspected || contact.reviewStatus === "제외";
}

function matchesCampaignSegment(contact, segment) {
  if (segment === "all") return true;
  const institution = institutions.find((item) => item.id === contact.institutionId);
  if (!institution) return false;
  if (segment === "senior") return institution.targetGroup === "senior";
  if (segment === "library") return ["library", "lifelong"].includes(institution.targetGroup);
  if (segment === "church") return institution.targetGroup === "church";
  return true;
}

function filteredInstitutions() {
  return institutions.filter((institution) => {
    const targetMatch = activeTarget === "all" || institution.targetGroup === activeTarget;
    const regionMatch = activeRegion === "all" || institution.sido === activeRegion;
    return targetMatch && regionMatch;
  });
}

function xyFromLatLng(lat, lng) {
  const rawX = ((Number(lng) - 124) / 8) * 100;
  const rawY = ((39 - Number(lat)) / 6) * 100;
  return {
    x: Math.max(5, Math.min(95, rawX)),
    y: Math.max(5, Math.min(95, rawY)),
  };
}

function hashText(text) {
  return [...String(text)].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 7);
}

function getPinPosition(institution, siblingIndex) {
  const { x, y } = xyFromLatLng(institution.lat, institution.lng);
  const hash = hashText(institution.id);
  const angle = (siblingIndex * 137.5 + (hash % 29)) * (Math.PI / 180);
  const radius = siblingIndex === 0 ? 0 : 1.5 + Math.sqrt(siblingIndex) * 1.55;
  return {
    x: Math.max(5, Math.min(95, x + Math.cos(angle) * radius)),
    y: Math.max(5, Math.min(95, y + Math.sin(angle) * radius)),
  };
}

function selectInstitution(id, tab = null) {
  const institution = institutions.find((item) => item.id === id);
  if (!institution) return;
  selectedId = institution.id;
  updateDetail(institution);
  renderRows();
  renderMap();
  renderGlobalEmailList();
  if (tab) activateTab(tab);
}

function updateKpis() {
  const sendable = contacts.filter(isSendableContact).length;
  const suppressed = contacts.filter(isSuppressedContact).length;
  const collectionNeeded = contacts.filter((contact) => !contact.email && !isSuppressedContact(contact)).length;
  totalInstitutionCount.textContent = String(institutions.length);
  pendingInstitutionCount.textContent = String(institutions.filter((item) => item.reviewStatus === "검수 대기").length);
  approvedContactCount.textContent = String(contacts.filter((contact) => contact.reviewStatus === "승인").length);
  suppressedContactCount.textContent = String(suppressed);
  sendableContactCount.textContent = String(sendable);
  automationQueueCount.textContent = String(sendable);
  collectionQueueCount.textContent = String(collectionNeeded);
}

function renderTypeToggles() {
  const counts = institutions.reduce(
    (acc, item) => {
      acc.all += 1;
      acc[item.targetGroup] = (acc[item.targetGroup] || 0) + 1;
      return acc;
    },
    { all: 0 },
  );
  typeToggles.querySelectorAll("[data-target]").forEach((button) => {
    const target = button.dataset.target;
    button.classList.toggle("is-active", target === activeTarget);
    const count = button.querySelector("b");
    if (count) count.textContent = String(counts[target] || 0);
  });
}

function renderRegionSelect() {
  const current = activeRegion;
  const regions = [...new Set(institutions.map((item) => item.sido).filter(Boolean))].sort();
  const options = [createTextElement("option", "전국")];
  options[0].value = "all";
  regions.forEach((region) => {
    const option = createTextElement("option", region);
    option.value = region;
    options.push(option);
  });
  regionSelect.replaceChildren(...options);
  regionSelect.value = regions.includes(current) ? current : "all";
}

function renderApiStatus() {
  const strip = document.createDocumentFragment();
  const list = document.createDocumentFragment();
  apiStatus.forEach((status) => {
    const card = document.createElement("article");
    card.className = "api-card";
    card.append(createTextElement("strong", status.name));
    card.append(createBadge(status.status === "ok" ? "정상" : "확인 필요", getBadgeClass(status.status)));
    card.append(createTextElement("p", status.total ? `총 ${Number(status.total).toLocaleString("ko-KR")}건` : status.safeMessage || "-"));
    strip.append(card);

    const item = document.createElement("div");
    item.className = "side-item";
    item.append(createTextElement("strong", `${status.name} · ${status.status === "ok" ? "정상" : "확인 필요"}`));
    item.append(createTextElement("p", status.safeMessage || "-"));
    if (status.operatorAction) item.append(createTextElement("p", status.operatorAction));
    list.append(item);
  });
  apiStatusStrip.replaceChildren(strip);
  apiStatusList.replaceChildren(list);
}

function renderMap() {
  const visible = filteredInstitutions();
  const fragment = document.createDocumentFragment();
  const siblingIndexes = {};
  mapResultLabel.textContent = `${activeRegion === "all" ? "전국" : activeRegion} ${TARGET_LABELS[activeTarget]} ${visible.length.toLocaleString("ko-KR")}개 기관`;

  visible.forEach((institution, index) => {
    const key = `${institution.sido}-${institution.targetGroup}`;
    siblingIndexes[key] = siblingIndexes[key] || 0;
    const { x, y } = getPinPosition(institution, siblingIndexes[key]);
    siblingIndexes[key] += 1;
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `map-pin ${institution.targetGroup}${institution.id === selectedId ? " is-selected" : ""}`;
    pin.style.left = `${x}%`;
    pin.style.top = `${y}%`;
    pin.dataset.id = institution.id;
    pin.style.zIndex = String(2 + (index % 40));
    pin.title = `${institution.name} · ${institution.sido} ${institution.sigungu}`;
    pin.setAttribute("aria-label", pin.title);
    fragment.append(pin);
  });
  mapPins.replaceChildren(fragment);
}

function updateDetail(institution) {
  detailName.textContent = institution.name;
  detailCategory.textContent = `${institution.category} · ${TARGET_LABELS[institution.targetGroup] || institution.targetGroup}`;
  detailRegion.textContent = `${institution.sido} ${institution.sigungu}`.trim();
  detailStatus.textContent = institution.leadStage;
  detailStatus.className = getBadgeClass(institution.leadStage);
  detailScore.textContent = String(institution.priorityScore);
  detailNote.textContent = institution.followupReason || institution.notes || "대표 이메일, 담당자, 도입 가능성을 검수해야 합니다.";
  detailSourceDataset.textContent = institution.sourceDataset;
  detailSourceLicense.textContent = `${institution.sourceLicenseType} · ${institution.sourceUrl}`;
  pipelineStage.textContent = institution.leadStage;
  pipelineOwner.textContent = institution.owner;
  pipelineInterest.textContent = institution.interestLevel;
  pipelineAction.textContent = institution.followupReason || institution.lastAction;
  orderType.textContent = institution.expectedOrderType;
  orderQuantity.textContent = `${institution.expectedQuantity}권`;
  orderRevenue.textContent = formatCurrency(institution.expectedRevenue);
  orderBooks.textContent = (institution.booksInterested || []).join(", ");
  renderDetailContacts(institution.id);
}

function renderDetailContacts(institutionId) {
  const related = contacts.filter((contact) => contact.institutionId === institutionId);
  const fragment = document.createDocumentFragment();
  if (related.length === 0) {
    fragment.append(createTextElement("p", "연락처 후보가 없습니다.", "source-note"));
  }
  related.forEach((contact) => {
    const item = document.createElement("div");
    item.className = "side-item selected-email";
    item.append(createTextElement("strong", contact.email || "대표 이메일 수집 필요"));
    item.append(createTextElement("p", contact.email ? `상태: ${contact.reviewStatus}` : "실제 발송 전 홈페이지 대표 이메일 확인 필요"));
    item.append(createTextElement("p", contact.website || contact.phone || contact.sourceUrl || "확인 채널 없음"));
    fragment.append(item);
  });
  detailContacts.replaceChildren(fragment);
}

function renderGlobalEmailList() {
  globalEmailCount.textContent = `${contacts.length.toLocaleString("ko-KR")}개`;
  const visibleIds = new Set(filteredInstitutions().map((item) => item.id));
  const fragment = document.createDocumentFragment();
  contacts
    .filter((contact) => visibleIds.has(contact.institutionId))
    .slice(0, 180)
    .forEach((contact) => {
      const institution = institutions.find((item) => item.id === contact.institutionId);
      const item = document.createElement("button");
      item.type = "button";
      item.className = `side-item institution-button${contact.institutionId === selectedId ? " is-selected" : ""}`;
      item.dataset.id = contact.institutionId;
      item.append(createTextElement("strong", contact.email || "대표 이메일 수집 필요"));
      item.append(createTextElement("p", contact.institutionName));
      item.append(createTextElement("p", `${institution?.sido || ""} · ${contact.website || contact.phone || "홈페이지 확인"}`));
      fragment.append(item);
    });
  globalEmailList.replaceChildren(fragment);
}

function renderRows() {
  const visible = filteredInstitutions();
  resultCount.textContent = String(visible.length);
  const fragment = document.createDocumentFragment();

  if (visible.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = createTextElement("td", "조건에 맞는 기관이 없습니다.");
    cell.colSpan = 5;
    row.append(cell);
    rows.replaceChildren(row);
    return;
  }

  if (!visible.some((institution) => institution.id === selectedId)) {
    selectedId = visible[0].id;
    updateDetail(visible[0]);
  }

  visible.slice(0, 140).forEach((institution) => {
    const row = document.createElement("tr");
    if (institution.id === selectedId) row.classList.add("is-selected");

    const nameCell = document.createElement("td");
    const button = document.createElement("button");
    button.className = "institution-button";
    button.type = "button";
    button.dataset.id = institution.id;
    button.textContent = institution.name;
    nameCell.append(button);

    const statusCell = document.createElement("td");
    statusCell.append(createBadge(institution.leadStage, getBadgeClass(institution.leadStage)));

    row.append(
      nameCell,
      createTextElement("td", TARGET_LABELS[institution.targetGroup] || institution.targetGroup),
      createTextElement("td", `${institution.sido} ${institution.sigungu}`.trim()),
      statusCell,
      createTextElement("td", String(institution.priorityScore)),
    );
    fragment.append(row);
  });
  rows.replaceChildren(fragment);
}

function renderCampaign() {
  const segment = campaignSegment.value;
  const matching = contacts.filter((contact) => matchesCampaignSegment(contact, segment));
  campaignSendableCount.textContent = String(matching.filter(isSendableContact).length);
  campaignSuppressedCount.textContent = String(matching.filter(isSuppressedContact).length);
}

function activateTab(name) {
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === name));
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildInstitutionCsv(items) {
  const columns = ["name", "target_group", "category", "sido", "sigungu", "address", "phone", "website", "source_url", "source_license_type", "email", "email_type", "lead_stage", "priority_score"];
  const dataRows = items.map((institution) => {
    const contact = contacts.find((item) => item.institutionId === institution.id);
    return [institution.name, institution.targetGroup, institution.category, institution.sido, institution.sigungu, institution.address, institution.phone, institution.website, institution.sourceUrl, institution.sourceLicenseType, contact?.email || "", contact?.emailType || "", institution.leadStage, institution.priorityScore];
  });
  return [columns, ...dataRows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function renderAll() {
  renderTypeToggles();
  renderMap();
  renderRows();
  renderGlobalEmailList();
  renderCampaign();
}

function bindEvents() {
  typeToggles.addEventListener("click", (event) => {
    const button = event.target.closest("[data-target]");
    if (!button) return;
    activeTarget = button.dataset.target;
    renderAll();
  });
  regionSelect.addEventListener("change", () => {
    activeRegion = regionSelect.value;
    renderAll();
  });
  resetMap.addEventListener("click", () => {
    activeTarget = "all";
    activeRegion = "all";
    regionSelect.value = "all";
    renderAll();
  });
  mapPins.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (button) selectInstitution(button.dataset.id, "summary");
  });
  rows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (button) selectInstitution(button.dataset.id, "summary");
  });
  globalEmailList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (button) selectInstitution(button.dataset.id, "contacts");
  });
  document.querySelector(".tab-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) activateTab(button.dataset.tab);
  });
  campaignSegment.addEventListener("change", renderCampaign);
  const startDownload = () => {
    const csv = buildInstitutionCsv(filteredInstitutions());
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "geojangmungo-institutions.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  downloadCsv.addEventListener("click", startDownload);
  exportCsv.addEventListener("click", startDownload);
  csvInput.addEventListener("change", () => {
    const file = csvInput.files?.[0];
    csvStatus.textContent = file ? `${file.name} 선택됨. 서버 저장 없이 사람이 먼저 검수합니다.` : "선택된 파일 없음";
  });
}

async function boot() {
  bindEvents();
  try {
    const response = await fetch("./data/dashboard-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error("dashboard-data.json not found");
    const data = await response.json();
    institutions = data.institutions || [];
    contacts = data.contacts || [];
    apiStatus = data.apiStatus || [];
    selectedId = institutions[0]?.id || "";
    renderRegionSelect();
    updateKpis();
    renderApiStatus();
    if (institutions[0]) updateDetail(institutions[0]);
    renderAll();
    document.documentElement.dataset.dashboardReady = "true";
  } catch (error) {
    detailName.textContent = "데이터 로딩 실패";
    detailNote.textContent = "npm run data:dashboard 실행 후 다시 열어주세요.";
    document.documentElement.dataset.dashboardReady = "false";
  }
}

boot();
