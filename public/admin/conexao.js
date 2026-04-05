// ligação Supabase
const SUPABASE_URL = "[cwengomkuhqvrdcpkgwp.supabase.co](https://cwengomkuhqvrdcpkgwp.supabase.co)";
const SUPABASE_KEY = "sb_publishable_Hi1T9WK_snEgqPep5JJnRQ__HSJXQUs";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

// funções CRUD
async function inserirDados(tabela, dados) {
  return fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
    method: "POST", headers, body: JSON.stringify(dados)
  });
}
async function apagarDado(tabela, id) {
  return fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${id}`, {
    method: "DELETE", headers
  });
}
