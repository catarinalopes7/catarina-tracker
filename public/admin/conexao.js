// conexao.js – ligação e operações Supabase

// 🔥 URL CORRETO (sem [ ] nem markdown)
const SUPABASE_URL = "https://cwengomkuhqvrdcpkgwp.supabase.co";

// 🔑 chave pública (anon / publishable)
const SUPABASE_KEY = "sb_publishable_Hi1T9WK_snEgqPep5JJnRQ__HSJXQUs";

// headers padrão para todas as requests
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ================================
// 🔹 FUNÇÕES CRUD GENÉRICAS
// ================================

// inserir dados
async function inserirDados(tabela, dados) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
    method: "POST",
    headers,
    body: JSON.stringify(dados),
  });

  if (!r.ok) {
    console.error("Erro ao inserir:", await r.text());
  }

  return r.ok;
}

// apagar
async function apagarDado(tabela, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
    method: "DELETE",
    headers,
  });

  if (!r.ok) {
    console.error("Erro ao apagar:", await r.text());
  }

  return r.ok;
}

// atualizar
async function atualizarDado(tabela, id, dados) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(dados),
  });

  if (!r.ok) {
    console.error("Erro ao atualizar:", await r.text());
  }

  return r.ok;
}

// ================================
// 🔹 RECALCULAR HUNT AUTOMATICAMENTE
// ================================

async function recalcularHunt(huntId) {
  try {
    // buscar todos os bónus
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/bonus?select=*`, {
      headers,
    });

    if (!resp.ok) {
      console.error("Erro ao buscar bônus:", await resp.text());
      return;
    }

    const dados = await resp.json();

    // filtrar apenas os da hunt atual
    const lista = dados.filter((b) => b.hunt_id == huntId);

    const totalPago = lista.reduce((s, b) => s + (b.payout || 0), 0);
    const totalAposta = lista.reduce((s, b) => s + (b.aposta || 0), 0);

    const average = totalAposta > 0 ? totalPago / totalAposta : 0;

    // buscar hunt
    const huntResp = await fetch(
      `${SUPABASE_URL}/rest/v1/hunts?id=eq.${huntId}`,
      { headers }
    );

    if (!huntResp.ok) {
      console.error("Erro ao buscar hunt:", await huntResp.text());
      return;
    }

    const [hunt] = await huntResp.json();

    const start = hunt.start_balance || 0;
    const profit = totalPago - start;

    // atualizar hunt
    await atualizarDado("hunts", huntId, {
      total_pago: totalPago,
      profit_loss: profit,
    });

    console.log(
      `Recalcular Hunt ${huntId}: pago=${totalPago}, lucro=${profit}, média=${average}`
    );

  } catch (erro) {
    console.error("Erro no recalcularHunt:", erro);
  }
}
