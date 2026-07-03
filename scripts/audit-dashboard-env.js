const fs = require("fs");
const path = require("path");

const dataPath = path.resolve(__dirname, "../data/dashboard-data.json");

if (!fs.existsSync(dataPath)) {
  console.error("data/dashboard-data.json not found. Run npm run data:dashboard first.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const envStatus = data.envStatus || [];

if (envStatus.length === 0) {
  console.error("envStatus is missing from dashboard-data.json.");
  process.exit(1);
}

for (const item of envStatus) {
  console.log(`${item.key}\t${item.status}\t${item.phase}\t${item.purpose}`);
}
