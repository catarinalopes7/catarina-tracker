const SUPABASE_URL = "COLOCA_AQUI_O_TEU_SUPABASE_URL";
const SUPABASE_KEY = "COLOCA_AQUI_O_TEU_SUPABASE_ANON_KEY";

const HUNTS_TABLE = "hunts";
const BONUSES_TABLE = "hunt_bonuses";

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function euro(value) {
  return `${safeNumber(value).toFixed(2)}€`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...supabaseHeaders(),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erro na ligação ao Supabase");
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

async function getAllHunts() {
  const url =
    `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}` +
    `?select=*` +
    `&order=created_at.desc`;

  return await apiFetch(url);
}

async function getActiveHunt() {
  const url =
    `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}` +
    `?select=*` +
    `&is_active=eq.true` +
    `&order=created_at.desc` +
    `&limit=1`;

  const data = await apiFetch(url);
  return data[0] || null;
}

async function createHunt({ name, startValue }) {
  const body = [
    {
      name: String(name || "").trim(),
      start_value: safeNumber(startValue),
      is_active: false,
      is_closed: false
    }
  ];

  const url = `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}`;
  const data = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });

  return data[0];
}

async function setAllHuntsInactive() {
  const url =
    `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}` +
    `?is_active=eq.true`;

  await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify({ is_active: false })
  });
}

async function activateHunt(huntId) {
  await setAllHuntsInactive();

  const url =
    `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}` +
    `?id=eq.${huntId}`;

  const data = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify({
      is_active: true,
      is_closed: false
    })
  });

  return data[0];
}

async function closeHunt(huntId) {
  const url =
    `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}` +
    `?id=eq.${huntId}`;

  const data = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify({
      is_active: false,
      is_closed: true
    })
  });

  return data[0];
}

async function getBonusesByHunt(huntId) {
  const url =
    `${SUPABASE_URL}/rest/v1/${BONUSES_TABLE}` +
    `?select=*` +
    `&hunt_id=eq.${huntId}` +
    `&order=created_at.asc`;

  return await apiFetch(url);
}

function getBonusStatus(bonus) {
  const raw = String(bonus.status || "").toLowerCase();

  if (raw === "opened" || raw === "open" || raw === "done" || raw === "completed") {
    return "opened";
  }

  if (raw === "active" || raw === "opening" || raw === "current") {
    return "active";
  }

  return "pending";
}

function getPayout(bonus) {
  return safeNumber(bonus.payout ?? bonus.win_amount ?? 0);
}

function getBuyAmount(bonus) {
  return safeNumber(bonus.buy_amount ?? bonus.cost ?? bonus.price ?? 0);
}

function getTotalPaid(bonuses) {
  return bonuses.reduce((sum, b) => sum + getPayout(b), 0);
}

function getTotalCost(bonuses) {
  return bonuses.reduce((sum, b) => sum + getBuyAmount(b), 0);
}

function getProfitLoss(bonuses) {
  return getTotalPaid(bonuses) - getTotalCost(bonuses);
}
