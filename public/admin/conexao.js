<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920">
  <title>CT Overlay - Catarina Tracker</title>
  <style>
    body {
      width: 1080px;
      height: 1920px;
      margin: 0;
      background: linear-gradient(180deg, #4F3EC7, #362A7A);
      color: #fff;
      font-family: 'Poppins', Arial, sans-serif;
      text-align: center;
      overflow: hidden;
    }

    #title {
      font-size: 40px;
      font-weight: 700;
      color: #FFD54A;
      margin-top: 25px;
    }

    #stats {
      font-size: 22px;
      line-height: 1.5em;
      margin-top: 10px;
      color: #EEE;
      padding: 0 30px;
    }

    #bestworst {
      margin-top: 25px;
    }

    .slot-card {
      background: rgba(0, 0, 0, 0.35);
      border-radius: 12px;
      margin: 8px auto;
      padding: 15px;
      width: 85%;
      font-size: 22px;
      line-height: 1.4em;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.8s ease;
      box-sizing: border-box;
    }

    .slot-card.best {
      border-left: 6px solid #36d27d;
    }

    .slot-card.worst {
      border-left: 6px solid #ff5c5c;
    }

    .slot-img {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      margin-right: 15px;
      background: #444;
      overflow: hidden;
      flex-shrink: 0;
    }

    .slot-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
      display: block;
    }

    .slot-info {
      flex: 1;
      text-align: left;
    }

    #bonus-wrap {
      height: 1250px;
      overflow-y: auto;
      margin-top: 20px;
      padding: 0 40px;
      box-sizing: border-box;
    }

    .card {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      margin: 10px 0;
      padding: 15px;
      font-size: 20px;
      text-align: left;
      display: flex;
      align-items: center;
      box-sizing: border-box;
    }

    .card-img {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      margin-right: 12px;
      background: #444;
      overflow: hidden;
      flex-shrink: 0;
    }

    .card-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-info {
      flex: 1;
    }

    .super {
      color: #FFD54A;
      font-weight: 700;
    }

    .épico, .epico {
      color: #FF5C5C;
      font-weight: 700;
    }

    .normal {
      color: #FFF;
      font-weight: 700;
    }

    #bonus-wrap::-webkit-scrollbar {
      width: 6px;
    }

    #bonus-wrap::-webkit-scrollbar-thumb {
      background: #FFD54A;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="title">CT 🎯</div>
  <div id="stats">Carregando estatísticas...</div>

  <div id="bestworst">
    <div id="slideshow" class="slot-card"></div>
  </div>

  <div id="bonus-wrap"></div>

  <script src="../admin/conexao.js"></script>
  <script>
    let melhorSlot = null;
    let piorSlot = null;
    let mostrandoMelhor = true;
    let todasSlots = [];
    let huntAtivaAtualId = null;

    function numero(valor) {
      return Number(valor || 0);
    }

    function formatarEuro(valor) {
      return `${numero(valor).toFixed(2)} €`;
    }

    function formatarX(valor) {
      return `${numero(valor).toFixed(2)}×`;
    }

    function getTipoClass(tipo) {
      const t = String(tipo || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (t === "epico") return "epico";
      if (t === "super") return "super";
      return "normal";
    }

    function getProviderStyle(provider) {
      const p = String(provider || "").toLowerCase();

      if (p.includes("pragmatic")) {
        return { bg1: "#ff8a00", bg2: "#ff3d00", accent: "#fff3cf", short: "PP" };
      }
      if (p.includes("hacksaw")) {
        return { bg1: "#8b0000", bg2: "#2b0000", accent: "#ffd2d2", short: "HG" };
      }
      if (p.includes("nolimit")) {
        return { bg1: "#191919", bg2: "#5c00ff", accent: "#e6d8ff", short: "NL" };
      }
      if (p.includes("bgaming")) {
        return { bg1: "#111827", bg2: "#00a86b", accent: "#d4ffe9", short: "BG" };
      }

      return { bg1: "#2b2b2b", bg2: "#575757", accent: "#f3f3f3", short: "SL" };
    }

    function escapeXml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function criarFallbackSlot(nome, provider) {
      const style = getProviderStyle(provider);
      const titulo = escapeXml(nome || "Slot");
      const prov = escapeXml(provider || "Provider");

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="${style.bg1}"/>
              <stop offset="100%" stop-color="${style.bg2}"/>
            </linearGradient>
          </defs>
          <rect width="400" height="400" rx="36" fill="url(#g)"/>
          <rect x="18" y="18" width="364" height="364" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
          <circle cx="70" cy="70" r="34" fill="rgba(255,255,255,0.12)"/>
          <text x="70" y="81" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" font-weight="700" fill="${style.accent}">${style.short}</text>
          <text x="28" y="170" font-size="34" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${titulo.slice(0, 18)}</text>
          <text x="28" y="212" font-size="22" font-family="Arial, sans-serif" fill="${style.accent}">${prov}</text>
          <rect x="28" y="248" width="140" height="10" rx="5" fill="rgba(255,255,255,0.35)"/>
          <rect x="28" y="272" width="220" height="10" rx="5" fill="rgba(255,255,255,0.18)"/>
          <rect x="28" y="296" width="180" height="10" rx="5" fill="rgba(255,255,255,0.18)"/>
        </svg>
      `;

      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function getManualImageOverrides() {
      return {
        "pragmatic play:sugar-rush-1000": "/images/slots/sugar-rush-1000.png",
        "pragmatic play:sweet-bonanza": "/images/slots/sweet-bonanza.png",
        "pragmatic play:gates-of-olympus": "/images/slots/gates-of-olympus.png",
        "pragmatic play:starlight-princess": "/images/slots/starlight-princess.png",
        "pragmatic play:the-dog-house-megaways": "/images/slots/the-dog-house-megaways.png"
      };
    }

    function resolverImagemSlot(slot) {
      const provider = String(slot?.provider || "").toLowerCase().trim();
      const slug = String(slot?.slug || "").toLowerCase().trim();

      if (slot?.imagem_url && String(slot.imagem_url).trim()) {
        return String(slot.imagem_url).trim();
      }

      const key = `${provider}:${slug}`;
      const overrides = getManualImageOverrides();

      if (overrides[key]) {
        return overrides[key];
      }

      return criarFallbackSlot(slot?.nome || "Slot", slot?.provider || "Provider");
    }

    function limparOverlaySemHunt(mensagem = "Nenhuma hunt ativa.") {
      huntAtivaAtualId = null;
      melhorSlot = null;
      piorSlot = null;

      document.getElementById("stats").innerHTML = mensagem;
      document.getElementById("bonus-wrap").innerHTML = "";
      document.getElementById("slideshow").className = "slot-card";
      document.getElementById("slideshow").innerHTML = "<span style='color:#888;'>Sem dados disponíveis</span>";
    }

    async function carregarSlots() {
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/slots?select=*`, { headers });
        if (!resp.ok) {
          console.error("Erro ao carregar slots:", await resp.text());
          todasSlots = [];
          return;
        }
        todasSlots = await resp.json();
      } catch (erro) {
        console.error("Erro de ligação ao carregar slots:", erro);
        todasSlots = [];
      }
    }

    function obterSlotPorBonus(bonus) {
      let slot = null;

      if (bonus.slot_id) {
        slot = todasSlots.find((s) => Number(s.id) === Number(bonus.slot_id));
      }

      if (!slot && bonus.nome) {
        slot = todasSlots.find(
          (s) => String(s.nome || "").trim().toLowerCase() === String(bonus.nome || "").trim().toLowerCase()
        );
      }

      if (!slot && bonus.nome) {
        slot = todasSlots.find(
          (s) =>
            String(s.nome || "").toLowerCase().includes(String(bonus.nome || "").toLowerCase()) ||
            String(bonus.nome || "").toLowerCase().includes(String(s.nome || "").toLowerCase())
        );
      }

      if (slot) return slot;

      return {
        nome: bonus.nome || "Slot",
        provider: "Provider",
        slug: (bonus.nome || "slot").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        imagem_url: null
      };
    }

    async function carregarOverlay() {
      try {
        const huntsResp = await fetch(
          `${SUPABASE_URL}/rest/v1/hunts?select=*&status=eq.ativa&order=id.desc&limit=1`,
          { headers }
        );

        if (!huntsResp.ok) {
          document.getElementById("stats").innerHTML = "Erro ao carregar hunts.";
          console.error(await huntsResp.text());
          return;
        }

        const hunts = await huntsResp.json();
        const atual = hunts[0];

        if (!atual) {
          limparOverlaySemHunt("Nenhuma hunt ativa.");
          return;
        }

        if (huntAtivaAtualId !== null && Number(huntAtivaAtualId) !== Number(atual.id)) {
          melhorSlot = null;
          piorSlot = null;
          mostrandoMelhor = true;
          document.getElementById("bonus-wrap").innerHTML = "";
          document.getElementById("slideshow").className = "slot-card";
          document.getElementById("slideshow").innerHTML = "<span style='color:#888;'>A atualizar hunt ativa...</span>";
        }

        huntAtivaAtualId = atual.id;

        const start = numero(atual.start_balance);
        const pago = numero(atual.total_pago);
        const lucro = numero(atual.profit_loss);
        const corLucro = lucro >= 0 ? "lawngreen" : "#FF5C5C";

        const averageX = numero(atual.average_x) > 0
          ? numero(atual.average_x)
          : (start > 0 ? pago / start : 0);

        const breakevenX = start > 0 ? 1 : 0;

        document.getElementById("stats").innerHTML = `
          💰 Hunt Ativa: ${atual.nome}<br>
          💰 Saldo Inicial: ${formatarEuro(start)} |
          💵 Total Pago: ${formatarEuro(pago)} |
          <span style="color:${corLucro};">Lucro/Prejuízo: ${formatarEuro(lucro)}</span><br>
          🏁 Breakeven X: ${formatarX(breakevenX)} |
          📈 Average X: ${formatarX(averageX)}
        `;

        const bonusResp = await fetch(
          `${SUPABASE_URL}/rest/v1/bonus?select=*&hunt_id=eq.${atual.id}&order=id.asc`,
          { headers }
        );

        if (!bonusResp.ok) {
          console.error("Erro ao carregar bônus:", await bonusResp.text());
          return;
        }

        const bonus = await bonusResp.json();

        const bonusComPayout = bonus.filter((b) => numero(b.payout) > 0 && numero(b.aposta) > 0);

        if (bonusComPayout.length) {
          melhorSlot = bonusComPayout.reduce((a, b) => {
            const multA = numero(a.payout) / numero(a.aposta);
            const multB = numero(b.payout) / numero(b.aposta);
            return multB > multA ? b : a;
          });

          piorSlot = bonusComPayout.reduce((a, b) => {
            const multA = numero(a.payout) / numero(a.aposta);
            const multB = numero(b.payout) / numero(b.aposta);
            return multB < multA ? b : a;
          });
        } else {
          melhorSlot = null;
          piorSlot = null;
        }

        const lista = document.getElementById("bonus-wrap");
        lista.innerHTML = "";

        for (const b of [...bonus].reverse()) {
          const slot = obterSlotPorBonus(b);
          const imagem = resolverImagemSlot(slot);
          const tipoClass = getTipoClass(b.tipo);

          const div = document.createElement("div");
          div.className = "card";
          div.innerHTML = `
            <div class="card-img">
              <img
                src="${imagem}"
                alt="${b.nome}"
                onerror="this.src='${criarFallbackSlot(slot.nome, slot.provider)}'"
              >
            </div>
            <div class="card-info">
              <b>${b.nome}</b> — Aposta ${numero(b.aposta).toFixed(2)} €
              <span class="${tipoClass}">${b.tipo || ""}</span>
              | Payout: ${numero(b.payout).toFixed(2)} €<br>
              <small style="color:#BBB;">${slot.provider || "N/A"}</small>
            </div>
          `;
          lista.appendChild(div);
        }

        atualizarSlideshow();
      } catch (erro) {
        console.error("Erro no overlay:", erro);
        document.getElementById("stats").innerHTML = "Erro ao carregar overlay.";
      }
    }

    function atualizarSlideshow() {
      const slideDiv = document.getElementById("slideshow");

      if (!melhorSlot && !piorSlot) {
        slideDiv.className = "slot-card";
        slideDiv.innerHTML = "<span style='color:#888;'>Sem slots com payout ainda</span>";
        return;
      }

      const slotBonus = mostrandoMelhor ? melhorSlot : piorSlot;

      if (!slotBonus) {
        slideDiv.className = "slot-card";
        slideDiv.innerHTML = "<span style='color:#888;'>Sem dados suficientes</span>";
        mostrandoMelhor = !mostrandoMelhor;
        return;
      }

      const emoji = mostrandoMelhor ? "🏆" : "💀";
      const label = mostrandoMelhor ? "Melhor" : "Pior";
      const classe = mostrandoMelhor ? "best" : "worst";

      const slotInfo = obterSlotPorBonus(slotBonus);
      const imagem = resolverImagemSlot(slotInfo);
      const mult = numero(slotBonus.aposta) > 0 ? numero(slotBonus.payout) / numero(slotBonus.aposta) : 0;
      const tipoClass = getTipoClass(slotBonus.tipo);

      slideDiv.className = `slot-card ${classe}`;
      slideDiv.innerHTML = `
        <div class="slot-img">
          <img
            src="${imagem}"
            alt="${slotBonus.nome}"
            onerror="this.src='${criarFallbackSlot(slotInfo.nome, slotInfo.provider)}'"
          >
        </div>
        <div class="slot-info">
          ${emoji} ${label} Slot<br>
          <b>${slotBonus.nome}</b> <span class="${tipoClass}">${slotBonus.tipo || ""}</span><br>
          Bet: ${numero(slotBonus.aposta).toFixed(2)}€ | Mult: ${mult.toFixed(2)}×<br>
          <small style="color:#BBB;">${slotInfo.provider || "N/A"}</small>
        </div>
      `;

      mostrandoMelhor = !mostrandoMelhor;
    }

    async function inicializar() {
      await carregarSlots();
      await carregarOverlay();

      setInterval(carregarOverlay, 5000);
      setInterval(atualizarSlideshow, 4000);
    }

    inicializar();
  </script>
</body>
</html>
