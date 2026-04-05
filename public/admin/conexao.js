// conexao.js – ligação e operações Supabase
const SUPABASE_URL   = "[cwengomkuhqvrdcpkgwp.supabase.co](https://cwengomkuhqvrdcpkgwp.supabase.co)";
const SUPABASE_KEY   = "sb_publishable_Hi1T9WK_snEgqPep5JJnRQ__HSJXQUs";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// funções CRUD
async function inserirDados(tabela, dados) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
    method: "POST", headers, body: JSON.stringify(dados),
  });
  return r.ok;
}

async function apagarDado(tabela, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
    method: "DELETE", headers,
  });
  return r.ok;
}

async function atualizarDado(tabela, id, dados) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
    method: "PATCH", headers, body: JSON.stringify(dados),
  });
  return r.ok;
}

// 🔸 Função de cálculo automático
async function recalcularHunt(huntId) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/bonus?select=*`, { headers });
  const dados = await resp.json();
  const lista = dados.filter(b => b.hunt_id == huntId);

  const totalPago = lista.reduce((s,b) => s + (b.payout || 0), 0);
  const totalAposta = lista.reduce((s,b) => s + (b.aposta || 0), 0);
  const average = lista.length ? (totalPago / totalAposta) : 0;

  const huntResp = await fetch(`${SUPABASE_URL}/rest/v1/hunts?id=eq.${huntId}`);
  const [hunt] = await huntResp.json();
  const start = hunt.start_balance || 0;
  const profit = totalPago - start;

  await atualizarDado("hunts", huntId, {
    total_pago: totalPago,
    profit_loss: profit,
  });

  console.log(`Recalcular Hunt ${huntId}: pago=${totalPago}, lucro=${profit}, média=${average}`);
}
