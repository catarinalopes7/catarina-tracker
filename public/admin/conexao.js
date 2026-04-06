const SUPABASE_URL = "https://cwengomkuhqvrdcpkgwp.supabase.co";
const SUPABASE_KEY = "sb_publishable_Hi1T9WK_snEgqPep5JJnRQ__HSJXQUs";

const HUNTS_TABLE = "hunts";
const BONUS_TABLE = "bonus";

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
    return await res.json();
  }

  return await res.text();
}

async function getAllHunts() {
  const url =
    `${SUPABASE_URL}/rest/v1/${HUNTS_TABLE}` +
    `?select=*` +
    `&order=id.desc`;

  return await apiFetch(url);
}

async function createHunt({ nome, startValue }) {
  const body = [
    {
      nome: String(nome || "").trim(),
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
    `${SUPABASE_URL}/rest/v1/${BONUS_TABLE}` +
    `?select=*` +
    `&hunt_id=eq.${huntId}` +
    `&order=id.asc`;

  return await apiFetch(url);
}

function getPayout(bonus) {
  return safeNumber(bonus.payout ?? bonus.win_amount ?? 0);
}

function getBet(bonus) {
  return safeNumber(bonus.bet ?? 0);
}

function getTotalPaid(bonuses) {
  return bonuses.reduce((sum, b) => sum + getPayout(b), 0);
}

function getProfitLossFromStart(hunt, bonuses) {
  return getTotalPaid(bonuses) - safeNumber(hunt?.start_value);
}
