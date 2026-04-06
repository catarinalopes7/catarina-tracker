const SUPABASE_URL = "https://cwengomkuhqvrdcpkgwp.supabase.co";
const SUPABASE_KEY = "sb_publishable_Hi1T9WK_snEgqPep5JJnRQ__HSJXQUs";

window.CT_SUPABASE = {
  url: SUPABASE_URL,
  key: SUPABASE_KEY
};

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
};

async function inserirDados(tabela, dados) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
      method: "POST",
      headers,
      body: JSON.stringify(dados)
    });

    const texto = await r.text();

    if (!r.ok) {
      console.error(`Erro ao inserir em ${tabela}:`, texto);
      return false;
    }

    return true;
  } catch (erro) {
    console.error(`Erro de ligação ao inserir em ${tabela}:`, erro);
    return false;
  }
}

async function apagarDado(tabela, id) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
      method: "DELETE",
      headers
    });

    const texto = await r.text();

    if (!r.ok) {
      console.error(`Erro ao apagar em ${tabela}:`, texto);
      return false;
    }

    return true;
  } catch (erro) {
    console.error(`Erro de ligação ao apagar em ${tabela}:`, erro);
    return false;
  }
}

async function atualizarDado(tabela, id, dados) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(dados)
    });

    const texto = await r.text();

    if (!r.ok) {
      console.error(`Erro ao atualizar em ${tabela}:`, texto);
      return false;
    }

    return true;
  } catch (erro) {
    console.error(`Erro de ligação ao atualizar em ${tabela}:`, erro);
    return false;
  }
}

async function buscarDados(tabela, query = "select=*") {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?${query}`, {
      method: "GET",
      headers
    });

    const texto = await r.text();

    if (!r.ok) {
      console.error(`Erro ao buscar em ${tabela}:`, texto);
      return [];
    }

    return texto ? JSON.parse(texto) : [];
  } catch (erro) {
    console.error(`Erro de ligação ao buscar em ${tabela}:`, erro);
    return [];
  }
}

async function gravarBonus(dadosBonus) {
  return await inserirDados("bonus", dadosBonus);
}

async function apagarBonus(id) {
  return await apagarDado("bonus", id);
}

async function atualizarBonus(id, dadosBonus) {
  return await atualizarDado("bonus", id, dadosBonus);
}

async function listarBonus() {
  return await buscarDados("bonus", "select=*&order=id.desc");
}

async function gravarHunt(dadosHunt) {
  return await inserirDados("hunts", dadosHunt);
}

async function apagarHunt(id) {
  return await apagarDado("hunts", id);
}

async function atualizarHunt(id, dadosHunt) {
  return await atualizarDado("hunts", id, dadosHunt);
}

async function listarHunts() {
  return await buscarDados("hunts", "select=*&order=id.desc");
}

async function buscarHuntPorId(huntId) {
  const dados = await buscarDados("hunts", `select=*&id=eq.${huntId}`);
  return dados.length ? dados[0] : null;
}

async function ativarHunt(huntId) {
  try {
    const hunts = await listarHunts();

    for (const hunt of hunts) {
      const ok = await atualizarDado("hunts", hunt.id, { status: "inativa" });
      if (!ok) {
        console.error("Erro ao desativar hunt:", hunt.id);
        return false;
      }
    }

    const okAtivar = await atualizarDado("hunts", huntId, { status: "ativa" });
    if (!okAtivar) {
      console.error("Erro ao ativar hunt:", huntId);
      return false;
    }

    return true;
  } catch (erro) {
    console.error("Erro ao ativar hunt:", erro);
    return false;
  }
}

async function fecharHunt(huntId) {
  try {
    return await atualizarDado("hunts", huntId, { status: "inativa" });
  } catch (erro) {
    console.error("Erro ao fechar hunt:", erro);
    return false;
  }
}

async function gravarSlot(dadosSlot) {
  return await inserirDados("slots", dadosSlot);
}

async function apagarSlot(id) {
  return await apagarDado("slots", id);
}

async function atualizarSlot(id, dadosSlot) {
  return await atualizarDado("slots", id, dadosSlot);
}

async function listarSlots() {
  return await buscarDados("slots", "select=*&order=id.desc");
}

async function recalcularHunt(huntId) {
  try {
    const bonus = await buscarDados("bonus", "select=*");
    const lista = bonus.filter((b) => Number(b.hunt_id) === Number(huntId));

    const totalPago = lista.reduce((s, b) => s + Number(b.payout || 0), 0);
    const totalAposta = lista.reduce((s, b) => s + Number(b.aposta || 0), 0);
    const average = totalAposta > 0 ? totalPago / totalAposta : 0;

    const hunt = await buscarHuntPorId(huntId);

    if (!hunt) {
      console.error(`Hunt com ID ${huntId} não encontrada.`);
      return false;
    }

    const start = Number(hunt.start_balance || 0);
    const profit = totalPago - start;

    return await atualizarDado("hunts", huntId, {
      total_pago: totalPago,
      average_x: average,
      profit_loss: profit
    });
  } catch (erro) {
    console.error(`Erro ao recalcular hunt ${huntId}:`, erro);
    return false;
  }
}
