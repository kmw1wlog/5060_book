const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=");
  }
}

async function request(pathname, key, options = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${pathname}`;
  return fetch(url, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function count(table) {
  const response = await request(`${table}?select=id`, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    method: "GET",
    headers: { Prefer: "count=exact", Range: "0-0" },
  });
  if (!response.ok) throw new Error(`${table} count failed: ${response.status}`);
  return Number(response.headers.get("content-range")?.split("/")?.[1] || 0);
}

async function main() {
  loadEnvFile(path.join(ROOT, ".env.local"));
  loadEnvFile(path.join(ROOT, ".env"));
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}`);

  const institutions = await count("institutions");
  const contacts = await count("contacts");

  const anonRead = await request("institutions?select=id,name&limit=1", process.env.SUPABASE_ANON_KEY);
  if (!anonRead.ok) throw new Error(`anon read failed: ${anonRead.status}`);

  const anonWrite = await request("institutions", process.env.SUPABASE_ANON_KEY, {
    method: "POST",
    body: JSON.stringify([{ id: "anon-write-should-fail", name: "blocked", target_group: "test" }]),
  });
  if (anonWrite.ok) throw new Error("anon write unexpectedly succeeded");

  console.log(
    JSON.stringify(
      {
        institutions,
        contacts,
        anonRead: "ok",
        anonWriteBlocked: true,
        projectRef: process.env.SUPABASE_PROJECT_REF,
        url: process.env.SUPABASE_URL,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
