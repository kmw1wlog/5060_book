const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "dashboard-data.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=");
  }
}

function cleanDate(value) {
  return value ? value : null;
}

function mapInstitution(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category || null,
    sub_category: item.subCategory || null,
    target_group: item.targetGroup,
    sido: item.sido || null,
    sigungu: item.sigungu || null,
    address: item.address || null,
    lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
    lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : null,
    phone: item.phone || null,
    website: item.website || null,
    source_dataset: item.sourceDataset || null,
    source_url: item.sourceUrl || null,
    source_license_type: item.sourceLicenseType || null,
    source_collected_at: cleanDate(item.sourceCollectedAt),
    data_confidence: item.dataConfidence || null,
    coordinate_source: item.coordinateSource || null,
    review_status: item.reviewStatus || null,
    notes: item.notes || null,
    program_fit: item.programFit || null,
    age_fit_score: item.ageFitScore || null,
    classics_fit_score: item.classicsFitScore || null,
    purchase_potential_score: item.purchasePotentialScore || null,
    priority_score: item.priorityScore || null,
    lead_stage: item.leadStage || null,
    owner: item.owner || null,
    last_contacted_at: cleanDate(item.lastContactedAt),
    next_followup_at: cleanDate(item.nextFollowupAt),
    followup_reason: item.followupReason || null,
    interest_level: item.interestLevel || null,
    decision_maker_known: Boolean(item.decisionMakerKnown),
    last_action: item.lastAction || null,
    expected_order_type: item.expectedOrderType || null,
    expected_quantity: item.expectedQuantity || null,
    expected_revenue: item.expectedRevenue || null,
    budget_cycle: item.budgetCycle || null,
    proposal_status: item.proposalStatus || null,
    sample_sent_at: cleanDate(item.sampleSentAt),
    quote_sent_at: cleanDate(item.quoteSentAt),
    order_status: item.orderStatus || null,
    order_amount: item.orderAmount || 0,
    books_interested: item.booksInterested || [],
    raw: {
      sourceDataset: item.sourceDataset,
      dataConfidence: item.dataConfidence,
      coordinateSource: item.coordinateSource,
    },
  };
}

function mapContact(item) {
  return {
    id: item.id,
    institution_id: item.institutionId,
    institution_name: item.institutionName,
    email: item.email || null,
    email_type: item.emailType || null,
    source_url: item.sourceUrl || null,
    is_role_account: Boolean(item.isRoleAccount),
    is_personal_email_suspected: Boolean(item.isPersonalEmailSuspected),
    validation_status: item.validationStatus || null,
    review_status: item.reviewStatus || null,
    opt_out: Boolean(item.optOut),
    bounced: Boolean(item.bounced),
    suppression_reason: item.suppressionReason || null,
    phone: item.phone || null,
    website: item.website || null,
    raw: {
      sourceUrl: item.sourceUrl,
      validationStatus: item.validationStatus,
    },
  };
}

async function upsert(table, rows) {
  const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("on_conflict", "id");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} upsert failed: ${response.status} ${text.slice(0, 400)}`);
  }
}

async function upsertBatches(table, rows, size = 100) {
  for (let index = 0; index < rows.length; index += size) {
    await upsert(table, rows.slice(index, index + size));
  }
}

async function main() {
  loadEnvFile(path.join(ROOT, ".env.local"));
  loadEnvFile(path.join(ROOT, ".env"));
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const institutions = (data.institutions || []).map(mapInstitution);
  const contacts = (data.contacts || []).map(mapContact);
  await upsertBatches("institutions", institutions);
  await upsertBatches("contacts", contacts);
  console.log(`supabase sync complete: ${institutions.length} institutions, ${contacts.length} contacts`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
