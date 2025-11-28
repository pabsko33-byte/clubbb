document.addEventListener("DOMContentLoaded", () => {
  /* SMOOTH SCROLL NAV */
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.scroll);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* REVEAL AU SCROLL (EFFET CINÉMA) */
  const revealEls = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* ====== DESK MARCHÉS ====== */

  const ASSETS = {
    sp500: {
      name: "S&P 500",
      tag: "Backbone actions US",
      base: 5095,
      comment:
        "Indice large actions US. Sert souvent de noyau de portefeuille long terme. Sensible aux taux, aux résultats des grandes entreprises et au sentiment global de risque.",
      role:
        "Utilisé via ETF comme socle actions pour un horizon long (10 ans et +). Jamais avec de l’argent nécessaire à court terme.",
      series: {
        "1D": [5090, 5098, 5085, 5102, 5095],
        "1M": [4950, 5000, 5040, 5070, 5095],
        "1Y": [4300, 4550, 4700, 4900, 5095],
      },
      dayChange: 0.32,
    },
    nasdaq: {
      name: "NASDAQ 100",
      tag: "Tech / croissance",
      base: 18045,
      comment:
        "Indice très exposé aux valeurs technologiques. Plus volatil que le S&P 500, réagit fortement aux attentes de croissance et aux taux.",
      role:
        "Poche croissance. S’ajoute à un socle plus large (ETF monde / S&P 500), jamais unique pour un débutant.",
      series: {
        "1D": [17950, 18010, 17920, 18080, 18045],
        "1M": [17000, 17400, 17700, 17900, 18045],
        "1Y": [13500, 15000, 16200, 17300, 18045],
      },
      dayChange: 0.61,
    },
    cac40: {
      name: "CAC 40",
      tag: "Actions France",
      base: 7420,
      comment:
        "Indice des grandes valeurs françaises : banque, luxe, industrie. Permet une exposition locale.",
      role:
        "Bloc d’exposition France, souvent en complément d’ETF plus globaux. On évite d’y mettre 100 % du portefeuille.",
      series: {
        "1D": [7380, 7410, 7395, 7430, 7420],
        "1M": [7200, 7270, 7320, 7380, 7420],
        "1Y": [6600, 6950, 7120, 7300, 7420],
      },
      dayChange: 0.18,
    },
    msci: {
      name: "MSCI World",
      tag: "ETF monde développé",
      base: 322,
      comment:
        "Panier d’actions de pays développés. Très utilisé en investissement passif : un seul ETF pour couvrir le monde développé.",
      role:
        "Candidat idéal pour une épargne programmée long terme, à condition d’accepter la volatilité de court terme.",
      series: {
        "1D": [320.8, 321.5, 321.2, 322.4, 322.0],
        "1M": [311, 315, 318, 320, 322],
        "1Y": [280, 295, 305, 315, 322],
      },
      dayChange: 0.24,
    },
    btc: {
      name: "Bitcoin",
      tag: "Actif spéculatif",
      base: 68440,
      comment:
        "Actif très volatil, sans flux de dividendes. Intéressant pour comprendre les cycles et la psychologie de marché, dangereux comme base de patrimoine.",
      role:
        "Poche spéculative limitée (0–5 % du patrimoine). Jamais financée à crédit, ni avec l’épargne de sécurité.",
      series: {
        "1D": [67500, 67900, 68200, 68700, 68440],
        "1M": [61000, 64000, 66000, 67500, 68440],
        "1Y": [23000, 35000, 47000, 59000, 68440],
      },
      dayChange: 1.25,
    },
    eth: {
      name: "Ethereum",
      tag: "Réseau / smart contracts",
      base: 3905,
      comment:
        "Token lié à un réseau. Exposé à la DeFi, aux narratifs tech et aux cycles crypto. Risque élevé, incertitude réglementaire.",
      role:
        "Poche expérimentale, encore plus limitée que Bitcoin. On y touche après avoir solidifié cash + ETF.",
      series: {
        "1D": [3920, 3910, 3880, 3925, 3905],
        "1M": [3550, 3650, 3780, 3860, 3905],
        "1Y": [1600, 2200, 2800, 3400, 3905],
      },
      dayChange: -0.8,
    },
  };

  const assetNameEl = document.getElementById("asset-name");
  const assetTagEl = document.getElementById("asset-tag");
  const assetCommentEl = document.getElementById("asset-comment");
  const assetRoleEl = document.getElementById("asset-role");
  const tfButtons = document.querySelectorAll(".tf-btn");
  const canvas = document.getElementById("market-chart");
  const ctx = canvas.getContext("2d");
  const refreshBtn = document.getElementById("btn-refresh");

  let currentAsset = "sp500";
  let currentTf = "1M";

  function applyAssetValues() {
    Object.entries(ASSETS).forEach(([key, asset]) => {
      const valueEl = document.querySelector(`[data-field="${key}-value"]`);
      const changeEl = document.querySelector(`[data-field="${key}-change"]`);
      if (!valueEl || !changeEl) return;

      valueEl.textContent = asset.base.toLocaleString("fr-FR", {
        maximumFractionDigits: key === "msci" ? 2 : 0,
      });

      changeEl.textContent = `${asset.dayChange.toFixed(2)} %`;
      changeEl.classList.remove("positive", "negative");
      changeEl.classList.add(asset.dayChange >= 0 ? "positive" : "negative");
    });
  }

  function drawChart(assetKey, tf) {
    const asset = ASSETS[assetKey];
    if (!asset) return;
    const data = asset.series[tf];
    if (!data) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // fond
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#020617");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "rgba(75, 85, 99, 0.5)";
    ctx.lineWidth = 1;
    const lines = 4;
    for (let i = 1; i < lines; i++) {
      const y = (h / lines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const paddingX = 32;
    const paddingY = 22;

    ctx.beginPath();
    data.forEach((v, i) => {
      const x =
        paddingX +
        ((w - paddingX * 2) * i) / Math.max(1, data.length - 1);
      const norm = (v - min) / span;
      const y = h - paddingY - norm * (h - paddingY * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const first = data[0];
    const last = data[data.length - 1];
    const up = last >= first;

    const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
    if (up) {
      lineGrad.addColorStop(0, "#22c55e");
      lineGrad.addColorStop(1, "#06b6d4");
    } else {
      lineGrad.addColorStop(0, "#fb7185");
      lineGrad.addColorStop(1, "#f97316");
    }

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // area
    const areaGrad = ctx.createLinearGradient(0, paddingY, 0, h - paddingY);
    if (up) {
      areaGrad.addColorStop(0, "rgba(34,197,94,0.25)");
      areaGrad.addColorStop(1, "rgba(15,23,42,0)");
    } else {
      areaGrad.addColorStop(0, "rgba(248,113,113,0.25)");
      areaGrad.addColorStop(1, "rgba(15,23,42,0)");
    }
    ctx.lineTo(w - paddingX, h - paddingY);
    ctx.lineTo(paddingX, h - paddingY);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // label
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px system-ui";
    ctx.fillText(`Horizon ${tf} • maquette`, paddingX, paddingY - 8);
  }

  function updateDesk(assetKey, tf) {
    const asset = ASSETS[assetKey];
    if (!asset) return;
    currentAsset = assetKey;
    currentTf = tf;

    assetNameEl.textContent = asset.name;
    assetTagEl.textContent = asset.tag;
    assetCommentEl.textContent = asset.comment;
    assetRoleEl.textContent = asset.role;

    document.querySelectorAll(".asset-row").forEach((row) => {
      row.classList.toggle("active", row.dataset.asset === assetKey);
    });

    drawChart(assetKey, tf);
  }

  applyAssetValues();
  updateDesk(currentAsset, currentTf);

  document.querySelectorAll(".asset-row").forEach((row) => {
    row.addEventListener("click", () => {
      const key = row.dataset.asset;
      if (!key) return;
      updateDesk(key, currentTf);
    });
  });

  tfButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tf = btn.dataset.tf;
      if (!tf) return;
      tfButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateDesk(currentAsset, tf);
    });
  });

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      // légère variation aléatoire sur la journée
      Object.values(ASSETS).forEach((asset) => {
        const shock = (Math.random() * 1.6 - 0.8).toFixed(2);
        asset.dayChange = parseFloat(shock);
      });
      applyAssetValues();
      drawChart(currentAsset, currentTf);
    });
  }

  /* ====== CHATBOT INVEST DÉBUTANT ====== */

  const chatLog = document.getElementById("chat-log");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  const QA_PAIRS = [
    {
      keywords: ["livret", "a", "livret a", "épargne"],
      answer:
        "Le livret sert à ta sécurité, pas à tout. En gros : 3–6 mois de dépenses sur livret pour les imprévus. Le reste, si horizon long (≥ 10 ans), peut aller vers ETF monde / obligations. Le réflexe FEIS : “épargne de sécurité” ≠ “épargne long terme”.",
    },
    {
      keywords: ["etf", "monde", "msci", "world"],
      answer:
        "Un ETF monde est un panier d’actions de nombreux pays. Tu ne paries pas sur une seule action, mais sur des centaines. Avantages : diversification, frais faibles. Prix à payer : les -20 % temporaires sont possibles, donc horizon long obligatoire.",
    },
    {
      keywords: ["crypto", "bitcoin", "btc", "eth", "ethereum"],
      answer:
        "FEIS traite la crypto comme une poche labo, pas une base de retraite. Typiquement 0–5 % max de ton patrimoine financier, uniquement avec de l’argent que tu acceptes de voir fortement baisser. Le vrai travail se fait d’abord sur cash + ETF.",
    },
    {
      keywords: ["risque", "peur", "perdre", "baisse", "-20"],
      answer:
        "Si un -20 % te fait paniquer, soit ton horizon est trop court, soit ton exposition aux actions est trop élevée. La règle : tu investis de l’argent dont tu n’as pas besoin avant plusieurs années, et tu définis un plan écrit avant la tempête, pas pendant.",
    },
    {
      keywords: ["moi", "étudiant", "débutant"],
      answer:
        "En tant qu’étudiant débutant : 1) construire un coussin de sécurité sur livret, 2) apprendre ce qu’est un ETF monde, 3) comprendre le lien entre marchés et politiques économiques. Le but n’est pas de battre le marché, mais de ne pas faire n’importe quoi.",
    },
    {
      keywords: ["feis", "club", "assos", "association"],
      answer:
        "FEIS est un club étudiant orienté marchés, macro et politiques publiques. On ne vend rien, on ne “place” pas de produits : on crée une culture d’investissement et un langage pro pour CV, entretiens, et projets.",
    },
  ];

  function addMessage(text, from = "bot") {
    const msg = document.createElement("div");
    msg.className = `chat-message ${from}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;
    msg.appendChild(bubble);
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function findAnswer(question) {
    const q = question.toLowerCase();
    for (const pair of QA_PAIRS) {
      if (pair.keywords.some((k) => q.includes(k))) return pair.answer;
    }
    return (
      "Je ne comprends pas complètement ta question, mais je peux te proposer une logique simple : " +
      "séparer épargne de sécurité (livret), investissement long terme (ETF / obligations) et poche spéculative (crypto / stock-picking). " +
      "C’est exactement ce qu’on travaille en atelier FEIS."
    );
  }

  // Messages d’intro
  addMessage(
    "Bienvenue sur l’assistant FEIS. Pose une question simple : livret, ETF, crypto, risque… Je réponds avec une logique pédagogique."
  );

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      addMessage(text, "user");
      const answer = findAnswer(text);
      setTimeout(() => addMessage(answer, "bot"), 200);
      chatInput.value = "";
    });
  }

  /* ====== NEWSLETTER ====== */

  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterMsg = document.getElementById("newsletter-message");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      if (!email) return;

      newsletterMsg.textContent =
        "Inscription enregistrée côté front. Plus tard, ce bouton pourra être relié à un vrai système d’envoi.";
      newsletterMsg.style.color = "#22c55e";

      setTimeout(() => {
        newsletterMsg.textContent = "";
      }, 5000);

      newsletterEmail.value = "";
    });
  }
});
