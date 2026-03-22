export type LangCode = 'en' | 'es' | 'zh' | 'ru' | 'ro' | 'pt' | 'de';

export interface OracleKnowledge {
  price: string;
  mining: string;
  ai: string;
  ton: string;
  buy: string;
  quantum: string;
  security: string;
  roadmap: string;
  competition: string;
  rwa: string;
  dcbm: string;
  rav: string;
  braid: string;
  wallet: string;
  staking: string;
  team: string;
  default: string;
}

export interface Translations {
  nav: {
    home: string;
    cetApp: string;
    tokenomics: string;
    roadmap: string;
    team: string;
    howToBuy: string;
    whitepaper: string;
    resources: string;
    faq: string;
    competition: string;
  };
  hero: {
    tagline: string;
    subtitle: string;
    buyNow: string;
    learnMore: string;
    description: string;
    startMining: string;
    docs: string;
  };
  tokenomics: {
    title: string;
    supply: string;
    poolAddress: string;
  };
  oracle: {
    title: string;
    subtitle: string;
    placeholder: string;
    sendButton: string;
    followUpPlaceholder: string;
    confidence: string;
    oracleResponse: string;
    escToClose: string;
    processing: string;
    done: string;
    knowledge: OracleKnowledge;
  };
}

const translations: Record<LangCode, Translations> = {
  en: {
    nav: {
      home: 'Home',
      cetApp: 'CET App',
      tokenomics: 'Tokenomics',
      roadmap: 'Roadmap',
      team: 'AI Team',
      howToBuy: 'How to Buy',
      whitepaper: 'Whitepaper',
      resources: 'Resources',
      faq: 'FAQ',
      competition: 'Compare',
    },
    hero: {
      tagline: 'The Digital Foundation of Cetățuia',
      subtitle: 'A hyper-scarce token with 9,000 CET supply on the TON blockchain',
      buyNow: 'Buy CET',
      learnMore: 'Learn More',
      description:
        '200,000 autonomous AI agents across 10 enterprise departments — operating 24/7 at zero marginal cost. The world\'s first AI-native RWA token on TON, powered by the Grok × Gemini dual-AI RAV Protocol and anchored in the real-world infrastructure of Cetățuia, Romania.',
      startMining: 'START MINING',
      docs: 'DOCS',
    },
    tokenomics: {
      title: 'Tokenomics',
      supply: 'Total Supply',
      poolAddress: 'DeDust Pool Address',
    },
    oracle: {
      title: 'Solaris Oracle',
      subtitle: 'Grok × Gemini · RAV Protocol Bridge',
      placeholder: 'Ask about price, mining, AI, security, roadmap…',
      sendButton: 'INITIATE PROTOCOL',
      followUpPlaceholder: 'Ask a follow-up question…',
      confidence: 'Confidence',
      oracleResponse: 'Oracle Response',
      escToClose: 'Press Esc to close',
      processing: 'PROCESSING',
      done: 'DONE',
      knowledge: {
        price: '**CET trades on DeDust (TON)** with a fixed supply of **9,000 tokens** — genuine hyper-scarcity.\n\n- Pool: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- The **DCBM model** correlates scarcity with a 90-year emission schedule\n- Long-term value accumulation driven purely by on-chain demand',
        mining: '**CET mining runs for 90 years** with a decaying reward curve.\n\n- **66.66%** of total supply enters circulation through proof-of-work\n- Active nodes: **18,420+**\n- Battery drain approaches **0%** thanks to the Zero-Battery constraint\n- Optimal mining window: **Q3 2025** (high-efficiency period)',
        ai: '**Solaris CET embeds the BRAID framework** (Blockchain-Recursive AI Decision).\n\n- **200,000 autonomous agents** operate across C-Suite, Engineering, Sales, Data, Finance, Marketing, Product, Security, Legal, and Research departments\n- Every AI agent action is validated through a **5-phase ReAct loop**: Observe → Think → Plan → Act → Verify\n- All reasoning traces are **anchored on-chain** for immutable auditability\n- No black-box decisions — every step is public and verifiable\n- Agents operate at the scale of a Fortune 500 company with **zero marginal cost**',
        ton: '**CET lives on TON mainnet** — the fastest L1 blockchain.\n\n- **~100,000 TPS** throughput\n- **2-second** finality\n- Sharded architecture for infinite scalability\n- Smart contract **audited by Cyberscope** and KYC-verified',
        buy: '**Buy CET on DeDust DEX** in 3 simple steps:\n\n1. Connect your **TON wallet** (Tonkeeper recommended)\n2. Navigate to pool `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Swap **TON for CET** — recommended slippage: 0.5–1%\n\nOnly **9,000 CET** exist globally — each token = **0.011%** of total supply.',
        quantum: '**Quantum OS** is Solaris CET\'s entropy layer.\n\n- **8 simulated qubits** in superposition\n- Collapse via QRNG-seeded wavefunction generates unpredictable cryptographic seeds\n- Powers **fair mining randomness**, agent scheduling, and zero-knowledge proof generation\n- Every on-chain event is **provably random**',
        security: '**CET contract passed Cyberscope\'s audit** with zero critical findings.\n\n- ✅ Full **KYC** completed by the team\n- ✅ On-chain reasoning traces **prevent hallucinated AI decisions**\n- ✅ **Quantum OS entropy** + ReAct verification loops\n- ✅ TON\'s BFT consensus (66.7% honest nodes required)',
        roadmap: '**Solaris CET roadmap — updated March 2026:**\n\n- ✅ **Q1–Q4 2025** (COMPLETE): Contract deployed, Cyberscope audit passed, DeDust pool live, IPFS whitepaper, AI farming pilot, Developer SDK beta, ReAct on-chain traces, Next-gen processing units, Self-Actualization Protocol mainnet\n- ✅ **Q1 2026** (COMPLETE): Multi-chain liquidity integrated, Community governance portal launched, AI oracle public API v1 released, Mobile wallet deep-link deployed\n- 🔄 **Q2 2026** (ACTIVE): DAO formation, Cross-chain bridge mainnet, Ecosystem grants expansion, RWA tokenisation pilot\n- 🔮 **Q3 2026+** (PLANNED): AI-to-AI autonomous contract execution, Solaris Prime neural mesh, Zero-knowledge proof layer, Global agriculture data oracle network',
        competition: '**Solaris CET vs. AI token competitors:**\n\n- **Supply**: CET=9,000 · FET=1.15B · TAO=21M · AGIX=2B · OCEAN=1.41B — CET is 233,000× scarcer than AGIX\n- **TPS**: TON=100,000 · FET~1,000 · TAO~1,000 · AGIX~15 — CET runs on the fastest chain\n- **Agents**: CET has **200,000 deployed agents** — competitors have marketplaces only\n- **Dual-AI**: Only CET uses **Grok × Gemini** simultaneously — no competitor does this\n- **RWA**: Only CET is backed by real-world agricultural assets\n- **Bottom line**: same AI agent thesis, but CET has structural scarcity, TON speed, and real assets',
        rwa: '**Real-World Asset (RWA) backing** is Solaris CET\'s core differentiator.\n\n- Every CET token is anchored to **agricultural and AI infrastructure in Cetățuia, Romania**\n- Unlike purely digital tokens, CET represents a claim on physical productivity\n- The **BRAID Framework** connects AI agent actions directly to real-world outcomes\n- RWA tokenisation pilot launches **Q2 2026** — expanding on-chain ↔ real-world integration\n- This makes CET one of the only crypto assets where **digital scarcity meets physical value**',
        dcbm: '**DCBM — Dynamic-Control Buyback Mechanism** is Solaris CET\'s price stability engine.\n\n- Uses **PID controllers** (Proportional-Integral-Derivative) to manage autonomous buybacks\n- When CET price deviates from the target band, the DCBM automatically triggers buy-back operations\n- Reduces price volatility by up to **66%** compared to uncontrolled market dynamics\n- No manual intervention, no governance votes — **pure mathematical control theory**\n- Every DCBM action is recorded on-chain and verifiable in real time',
        rav: '**RAV Protocol — Reason · Act · Verify** is the operational core of every Solaris CET agent.\n\n- **REASON** (Google Gemini): decomposes goals into sub-objectives using BRAID graphs, indexes all on-chain and off-chain signals\n- **ACT** (xAI Grok): executes the optimised action plan, generates TON transactions, updates agent state\n- **VERIFY**: a second independent model reviews the action and its on-chain trace before finalisation\n- All reasoning traces are **stored immutably on IPFS** and anchored to each transaction\n- Result: **zero hallucinated actions** — every agent decision is auditable months later',
        braid: '**BRAID Framework — Blockchain-Recursive AI Decision** is the architectural backbone.\n\n- Serialises reasoning paths as **Mermaid notation graphs** stored on IPFS\n- Every CET transaction references its BRAID graph — developers can reconstruct any decision post-facto\n- Enables **recursive AI reasoning**: each agent can spawn sub-agents for complex tasks\n- Compatible with TON\'s sharded architecture for **infinite horizontal scaling**\n- Open standard — third-party developers can build BRAID-compatible agents',
        wallet: '**Connect your TON wallet** to interact with Solaris CET.\n\n1. Install **Tonkeeper** (iOS / Android / Browser extension) — the recommended wallet\n2. Create or import your wallet — back up your seed phrase securely\n3. Fund with **TON** from any major exchange (Bybit, OKX, Huobi)\n4. Click **Connect Wallet** on this page to link via TonConnect\n5. Navigate to DeDust pool to swap TON → CET\n\nContract: `EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX`',
        staking: '**CET holding benefits** increase with time and scarcity.\n\n- **9,000 CET maximum supply** — every holder owns a permanent fraction of a finite resource\n- DCBM buyback pressure creates **natural price support** for long-term holders\n- **Mining staking bonus**: staking CET multiplies your BTC-S mining rewards (up to 2× at max stake)\n- DAO governance rights scale with holding — **more CET = more voting power**\n- As AI adoption grows, demand for CET (the payment token for agent actions) increases structurally',
        team: '**The Solaris CET AI team — 200,000 autonomous agents** across 10 enterprise departments.\n\n| Department | Agents | Key Roles |\n|---|---|---|\n| Customer Operations | 48,000 | Tier-1/2 Support, Onboarding, Retention |\n| Engineering | 34,000 | DevOps, Smart Contract, Protocol R&D |\n| Sales | 27,000 | Lead Qualification, Enterprise, Partnerships |\n| Data & AI | 21,000 | Model Training, Analytics, RAV Optimisation |\n| Finance | 18,000 | Treasury, DCBM Control, FP&A |\n| Marketing | 17,000 | Growth, Content, Community |\n| Product | 13,000 | UX, Roadmap, Protocol Design |\n| Security | 10,000 | Audit, Threat Detection, KYC |\n| Legal | 7,000 | Compliance, RWA Contracts |\n| Research | 5,000 | Quantum OS, BRAID, ZK Proofs |\n\nEvery agent operates 24/7 at **zero marginal cost** via the RAV Protocol.',
        default: '**Solaris CET** — the world\'s first AI-native corporate token (9,000 CET) on TON.\n\n- **200,000 autonomous agents** across 10 enterprise departments, operating 24/7\n- **90-year mining horizon** with decaying reward curve (Bitcoin-style)\n- Bridges AI agents to on-chain execution via the **BRAID Framework**\n- Powered by **Quantum OS** for provable randomness and **DCBM** for price stability\n- Q1 2026 milestones **complete** — Q2 2026 in progress\n\nAsk about *price, mining, AI, security*, or *roadmap* for deep insights.',
      },
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      cetApp: 'App CET',
      tokenomics: 'Tokenómica',
      roadmap: 'Hoja de Ruta',
      team: 'Equipo IA',
      howToBuy: 'Cómo Comprar',
      whitepaper: 'Libro Blanco',
      resources: 'Recursos',
      faq: 'Preguntas',
      competition: 'Comparar',
    },
    hero: {
      tagline: 'La Base Digital de Cetățuia',
      subtitle: 'Un token de escasez extrema con 9.000 CET en la blockchain TON',
      buyNow: 'Comprar CET',
      learnMore: 'Saber Más',
      description:
        '200,000 agentes autónomos en 10 departamentos empresariales — operando 24/7 a costo marginal cero. El primer token RWA nativo de IA en TON, impulsado por el protocolo RAV dual-IA Grok × Gemini y anclado en la infraestructura real de Cetățuia, Rumanía.',
      startMining: 'INICIAR MINERÍA',
      docs: 'DOCUMENTOS',
    },
    tokenomics: {
      title: 'Tokenómica',
      supply: 'Suministro Total',
      poolAddress: 'Dirección del Pool DeDust',
    },
    oracle: {
      title: 'Oráculo Solaris',
      subtitle: 'Grok × Gemini · Puente Protocolo RAV',
      placeholder: 'Pregunta sobre precio, minería, IA, seguridad, hoja de ruta…',
      sendButton: 'INICIAR PROTOCOLO',
      followUpPlaceholder: 'Haz una pregunta de seguimiento…',
      confidence: 'Confianza',
      oracleResponse: 'Respuesta del Oráculo',
      escToClose: 'Presiona Esc para cerrar',
      processing: 'PROCESANDO',
      done: 'LISTO',
      knowledge: {
        price: '**CET cotiza en DeDust (TON)** con un suministro fijo de **9,000 tokens** — escasez real.\n\n- Pool: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- El **modelo DCBM** correlaciona la escasez con un cronograma de emisión de 90 años\n- Acumulación de valor a largo plazo impulsada por la demanda on-chain',
        mining: '**La minería CET dura 90 años** con una curva de recompensa decreciente.\n\n- **66.66%** del suministro total entra en circulación mediante prueba de trabajo\n- Nodos activos: **18,420+**\n- Consumo de batería cercano a **0%** gracias al Zero-Battery constraint\n- Ventana óptima de minería: **Q3 2025**',
        ai: '**Solaris CET integra el marco BRAID** (Blockchain-Recursive AI Decision).\n\n- Cada acción de agente IA se valida a través de un **bucle ReAct de 5 fases**\n- Fases: Observar → Pensar → Planificar → Actuar → Verificar\n- Todos los rastros de razonamiento están **anclados on-chain** para auditabilidad inmutable',
        ton: '**CET vive en TON mainnet** — el blockchain L1 más rápido.\n\n- **~100,000 TPS** de rendimiento\n- Finalidad en **2 segundos**\n- Arquitectura fragmentada para escalabilidad infinita\n- Contrato inteligente **auditado por Cyberscope** y verificado KYC',
        buy: '**Compra CET en DeDust DEX** en 3 pasos simples:\n\n1. Conecta tu **wallet TON** (Tonkeeper recomendado)\n2. Ve al pool `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Intercambia **TON por CET** — deslizamiento recomendado: 0.5–1%\n\nSolo existen **9,000 CET** en el mundo — cada token = **0.011%** del suministro total.',
        quantum: '**Quantum OS** es la capa de entropía de Solaris CET.\n\n- **8 qubits simulados** en superposición\n- Colapso vía función de onda QRNG genera semillas criptográficas impredecibles\n- Impulsa **aleatoriedad justa en minería**, programación de agentes y pruebas de conocimiento cero',
        security: '**El contrato CET pasó la auditoría de Cyberscope** sin hallazgos críticos.\n\n- ✅ **KYC** completo del equipo\n- ✅ Rastros de razonamiento on-chain **previenen decisiones alucinadas de IA**\n- ✅ **Entropía Quantum OS** + bucles de verificación ReAct\n- ✅ Consenso BFT de TON (se requieren 66.7% nodos honestos)',
        roadmap: '**Hoja de ruta de Solaris CET:**\n\n- ✅ **Q1–Q2 2025** (LISTO): Contrato desplegado, auditoría pasada, pool DeDust activo\n- 🔄 **Q3 2025** (ACTIVO): Piloto de agricultura IA, SDK para desarrolladores beta\n- 🔮 **Q4 2025+**: Unidades de procesamiento de próxima generación, protocolo Self-Actualization',
        competition: '**Solaris CET vs competidores de tokens de IA:**\n\n- CET=9.000 tokens · FET=1.150M · TAO=21M · AGIX=2.000M — CET es 233.000× más escaso que AGIX\n- TON=100.000 TPS · FET~1.000 · AGIX~15 — la cadena más rápida del sector\n- **200.000 agentes desplegados** (no solo un marketplace) · Solo CET usa **Grok × Gemini** dual-AI\n- Único token IA respaldado por **activos del mundo real** (tierra agrícola en Rumanía)',
        rwa: '**RWA — Activo del Mundo Real**: cada CET está anclado a infraestructura agrícola y de IA en Cetățuia, Rumanía.\n\n- Une escasez digital con valor físico real\n- Piloto de tokenización RWA en **Q2 2026**',
        dcbm: '**DCBM** usa controladores PID para recompras autónomas. Reduce la volatilidad hasta un **66%** sin intervención manual.',
        rav: '**Protocolo RAV**: Razonar (Gemini) → Actuar (Grok) → Verificar. Cada decisión del agente está en IPFS, auditable para siempre.',
        braid: '**BRAID Framework**: serializa rutas de razonamiento en IPFS. Cada transacción CET referencia su grafo BRAID.',
        wallet: '**Conecta tu wallet TON**: instala Tonkeeper, financia con TON, conecta vía TonConnect, intercambia TON→CET en DeDust.',
        staking: '**Beneficios de mantener CET**: supply fijo de 9.000 · presión de compra DCBM · bonus de minería 2× con staking máximo · derechos de gobernanza DAO.',
        team: '**200.000 agentes autónomos** en 10 departamentos: Customer Ops (48k), Ingeniería (34k), Ventas (27k), Datos & IA (21k), Finanzas (18k), Marketing (17k), Producto (13k), Seguridad (10k), Legal (7k), Investigación (5k).',
        default: '**Solaris CET** — token ultra-escaso (9,000 CET) en la blockchain TON.\n\n- **Horizonte de minería de 90 años** con curva de recompensa decreciente\n- Conecta agentes IA a la ejecución on-chain a través del **marco BRAID**\n- Impulsado por **Quantum OS** para aleatoriedad demostrable\n\nPregunta sobre *precio, minería, IA, seguridad* o *hoja de ruta* para información detallada.',
      },
    },
  },
  zh: {
    nav: {
      home: '首页',
      cetApp: 'CET 应用',
      tokenomics: '代币经济学',
      roadmap: '路线图',
      team: 'AI团队',
      howToBuy: '如何购买',
      whitepaper: '白皮书',
      resources: '资源',
      faq: '常见问题',
      competition: '对比',
    },
    hero: {
      tagline: 'Cetățuia 的数字基础',
      subtitle: 'TON 区块链上供应量仅 9,000 枚 CET 的超稀缺代币',
      buyNow: '购买 CET',
      learnMore: '了解更多',
      description:
        '200,000个自主AI智能体遍布10个企业部门，24/7运行，零边际成本。全球首个TON链上AI原生RWA代币，由Grok × Gemini双AI RAV协议驱动，根植于罗马尼亚Cetățuia的真实基础设施。',
      startMining: '开始挖矿',
      docs: '文档',
    },
    tokenomics: {
      title: '代币经济学',
      supply: '总供应量',
      poolAddress: 'DeDust 池地址',
    },
    oracle: {
      title: 'Solaris 预言机',
      subtitle: 'Grok × Gemini · RAV 协议桥',
      placeholder: '询问价格、挖矿、AI、安全、路线图…',
      sendButton: '启动协议',
      followUpPlaceholder: '继续提问…',
      confidence: '置信度',
      oracleResponse: '预言机回复',
      escToClose: '按 Esc 关闭',
      processing: '处理中',
      done: '完成',
      knowledge: {
        price: '**CET 在 DeDust（TON）上交易**，固定供应量 **9,000 枚** — 真正的超稀缺性。\n\n- 池: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- **DCBM 模型**将稀缺性与 90 年发行时间表相关联\n- 长期价值积累完全由链上需求驱动',
        mining: '**CET 挖矿持续 90 年**，奖励曲线递减。\n\n- **66.66%** 的总供应量通过工作量证明流入流通\n- 活跃节点: **18,420+**\n- 得益于零电池约束，电池消耗接近 **0%**\n- 最佳挖矿窗口: **2025 年 Q3**',
        ai: '**Solaris CET 内嵌 BRAID 框架**（区块链递归 AI 决策）。\n\n- 每个 AI 代理操作通过 **5 阶段 ReAct 循环**验证\n- 阶段: 观察 → 思考 → 规划 → 行动 → 验证\n- 所有推理轨迹**锚定在链上**，具有不可变的可审计性',
        ton: '**CET 运行在 TON 主网** — 最快的 L1 区块链。\n\n- **~100,000 TPS** 吞吐量\n- **2 秒**最终性\n- 分片架构实现无限扩展性\n- 智能合约经 **Cyberscope 审计**并通过 KYC 验证',
        buy: '**在 DeDust DEX 购买 CET** — 3 个简单步骤:\n\n1. 连接您的 **TON 钱包**（推荐 Tonkeeper）\n2. 导航到池 `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. 将 **TON 兑换为 CET** — 推荐滑点: 0.5–1%\n\n全球只有 **9,000 枚 CET** — 每个代币 = 总供应量的 **0.011%**。',
        quantum: '**量子操作系统**是 Solaris CET 的熵层。\n\n- 叠加态中的 **8 个模拟量子位**\n- 通过 QRNG 种子波函数坍缩生成不可预测的密码学种子\n- 驱动**公平挖矿随机性**、代理调度和零知识证明生成',
        security: '**CET 合约通过了 Cyberscope 的审计**，零严重发现。\n\n- ✅ 团队完成完整 **KYC**\n- ✅ 链上推理轨迹**防止 AI 幻觉决策**\n- ✅ **量子操作系统熵** + ReAct 验证循环\n- ✅ TON 的 BFT 共识（需要 66.7% 诚实节点）',
        roadmap: '**Solaris CET 开发路线图:**\n\n- ✅ **Q1–Q2 2025**（完成）：合约部署、审计通过、DeDust 池上线\n- 🔄 **Q3 2025**（进行中）：AI 精准农业试点，开发者 SDK 测试版\n- 🔮 **Q4 2025+**：下一代处理单元，Self-Actualization 协议主网',
        competition: '**Solaris CET 与AI代币竞争对手对比：**\n\n- 供应量：CET=9,000 · FET=11.5亿 · TAO=2100万 · AGIX=20亿 — CET稀缺性是AGIX的23.3万倍\n- TPS：TON=100,000 · 竞争对手≤1,000 — 最快的AI代币链\n- **已部署20万自主智能体**（非市场平台）· 独家**Grok×Gemini双AI**协议\n- 唯一由**真实世界资产**（罗马尼亚农业土地）支撑的AI代币',
        rwa: '**RWA真实世界资产**：每个CET代币锚定于罗马尼亚Cetățuia的农业和AI基础设施。**Q2 2026**启动RWA代币化试点。',
        dcbm: '**DCBM动态控制回购机制**：使用PID控制器实现自主回购，将价格波动性降低最高**66%**，无需人工干预。',
        rav: '**RAV协议**：推理（Gemini）→行动（Grok）→验证。每个智能体决策存储于IPFS，永久可审计，零幻觉风险。',
        braid: '**BRAID框架**：将推理路径序列化为Mermaid图存储于IPFS，每笔CET交易都引用其BRAID图。',
        wallet: '**连接TON钱包**：安装Tonkeeper→用TON充值→通过TonConnect连接→在DeDust上将TON换成CET。',
        staking: '**持有CET的好处**：固定供应9,000枚·DCBM回购支撑价格·最大质押可获2倍挖矿奖励·DAO治理投票权。',
        team: '**20万自主AI智能体**分布于10个部门：客户运营(4.8万)、工程(3.4万)、销售(2.7万)、数据AI(2.1万)、财务(1.8万)、营销(1.7万)、产品(1.3万)、安全(1万)、法务(7千)、研究(5千)。',
        default: '**Solaris CET** — TON 区块链上的超稀缺代币（9,000 CET 供应量）。\n\n- **90 年挖矿周期**，奖励曲线递减\n- 通过 **BRAID 框架**将 AI 代理桥接到链上执行\n- 由 **量子操作系统**提供可证明的随机性\n\n询问*价格、挖矿、AI、安全*或*路线图*获取深度见解。',
      },
    },
  },
  ru: {
    nav: {
      home: 'Главная',
      cetApp: 'Приложение CET',
      tokenomics: 'Токеномика',
      roadmap: 'Дорожная карта',
      team: 'AI Команда',
      howToBuy: 'Как купить',
      whitepaper: 'Белая книга',
      resources: 'Ресурсы',
      faq: 'FAQ',
      competition: 'Сравнить',
    },
    hero: {
      tagline: 'Цифровая Основа Cetățuia',
      subtitle: 'Гиперредкий токен с запасом 9 000 CET на блокчейне TON',
      buyNow: 'Купить CET',
      learnMore: 'Узнать больше',
      description:
        '200 000 автономных агентов в 10 корпоративных отделах — работают 24/7 при нулевых предельных издержках. Первый в мире AI-нативный RWA-токен на TON, работающий на двойном AI-протоколе RAV Grok × Gemini, привязанном к реальной инфраструктуре Cetățuia, Румыния.',
      startMining: 'НАЧАТЬ МАЙНИНГ',
      docs: 'ДОКУМЕНТЫ',
    },
    tokenomics: {
      title: 'Токеномика',
      supply: 'Общий запас',
      poolAddress: 'Адрес пула DeDust',
    },
    oracle: {
      title: 'Оракул Solaris',
      subtitle: 'Grok × Gemini · Мост RAV Протокола',
      placeholder: 'Спросите о цене, майнинге, ИИ, безопасности, дорожной карте…',
      sendButton: 'ЗАПУСТИТЬ ПРОТОКОЛ',
      followUpPlaceholder: 'Задайте уточняющий вопрос…',
      confidence: 'Уверенность',
      oracleResponse: 'Ответ Оракула',
      escToClose: 'Нажмите Esc для закрытия',
      processing: 'ОБРАБОТКА',
      done: 'ГОТОВО',
      knowledge: {
        price: '**CET торгуется на DeDust (TON)** с фиксированным запасом **9 000 токенов** — настоящая гиперредкость.\n\n- Пул: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- **Модель DCBM** коррелирует дефицит с 90-летним графиком эмиссии\n- Долгосрочное накопление стоимости, обусловленное исключительно он-чейн спросом',
        mining: '**Майнинг CET продолжается 90 лет** с убывающей кривой вознаграждений.\n\n- **66.66%** от общего запаса поступает в обращение через proof-of-work\n- Активных узлов: **18 420+**\n- Расход батареи стремится к **0%** благодаря Zero-Battery ограничению\n- Оптимальное окно майнинга: **Q3 2025**',
        ai: '**Solaris CET внедряет фреймворк BRAID** (Blockchain-Recursive AI Decision).\n\n- Каждое действие ИИ-агента проверяется через **5-фазный цикл ReAct**\n- Фазы: Наблюдение → Мышление → Планирование → Действие → Проверка\n- Все цепочки рассуждений **закреплены в блокчейне** для неизменяемого аудита',
        ton: '**CET работает на мейннете TON** — самом быстром L1 блокчейне.\n\n- **~100 000 TPS** пропускная способность\n- Финальность **2 секунды**\n- Шардированная архитектура для бесконечного масштабирования\n- Смарт-контракт **прошёл аудит Cyberscope** и верификацию KYC',
        buy: '**Купите CET на DEX DeDust** за 3 простых шага:\n\n1. Подключите **TON кошелёк** (рекомендуется Tonkeeper)\n2. Перейдите в пул `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Обменяйте **TON на CET** — рекомендуемое проскальзывание: 0.5–1%\n\nВо всём мире существует только **9 000 CET** — каждый токен = **0.011%** от общего запаса.',
        quantum: '**Quantum OS** — это слой энтропии Solaris CET.\n\n- **8 имитируемых кубитов** в суперпозиции\n- Коллапс через волновую функцию с QRNG-сидом генерирует непредсказуемые криптографические сиды\n- Обеспечивает **честную случайность майнинга**, планирование агентов и генерацию ZK-доказательств',
        security: '**Контракт CET прошёл аудит Cyberscope** без критических находок.\n\n- ✅ Полная **KYC** верификация команды\n- ✅ Он-чейн трейсы рассуждений **предотвращают галлюцинации ИИ**\n- ✅ **Энтропия Quantum OS** + циклы проверки ReAct\n- ✅ BFT консенсус TON (требуется 66.7% честных узлов)',
        roadmap: '**Дорожная карта Solaris CET:**\n\n- ✅ **Q1–Q2 2025** (ГОТОВО): Развёртывание контракта, аудит пройден, пул DeDust запущен\n- 🔄 **Q3 2025** (АКТИВНО): Пилот ИИ точного земледелия, Developer SDK бета\n- 🔮 **Q4 2025+**: Процессинговые юниты нового поколения, Self-Actualization Protocol мейннет',
        competition: '**Solaris CET vs конкуренты AI-токенов:**\n\n- CET=9 000 · FET=1,15 млрд · TAO=21 млн · AGIX=2 млрд — CET в 233 000 раз редче AGIX\n- TON=100 000 TPS · конкуренты ≤1 000 — самый быстрый блокчейн в секторе\n- **200 000 развёрнутых агентов** (не просто маркетплейс) · Эксклюзивный **Grok × Gemini** дуальный ИИ\n- Единственный AI-токен, обеспеченный **реальными активами** (сельхозземли Румынии)',
        rwa: '**RWA — реальные активы**: каждый CET привязан к сельскохозяйственной и ИИ-инфраструктуре Cetățuia, Румыния. Пилот токенизации RWA в **Q2 2026**.',
        dcbm: '**DCBM** использует PID-контроллеры для автономных обратных выкупов. Снижает волатильность до **66%** без ручного вмешательства.',
        rav: '**Протокол RAV**: Рассуждение (Gemini) → Действие (Grok) → Верификация. Каждое решение агента хранится на IPFS — вечная аудитируемость.',
        braid: '**BRAID Framework**: сериализует пути рассуждений в IPFS. Каждая транзакция CET ссылается на свой граф BRAID.',
        wallet: '**Подключить TON-кошелёк**: установить Tonkeeper → пополнить TON → подключить через TonConnect → обменять TON→CET на DeDust.',
        staking: '**Преимущества холдинга CET**: фиксированный запас 9 000 · давление выкупа DCBM · бонус майнинга 2× при максимальном стейкинге · права голоса DAO.',
        team: '**200 000 автономных агентов** в 10 отделах: Клиентский сервис (48k), Инжиниринг (34k), Продажи (27k), Данные и ИИ (21k), Финансы (18k), Маркетинг (17k), Продукт (13k), Безопасность (10k), Юридический (7k), Исследования (5k).',
        default: '**Solaris CET** — гиперредкий токен (9 000 CET) на блокчейне TON.\n\n- **90-летний горизонт майнинга** с убывающей кривой вознаграждений\n- Связывает ИИ-агентов с он-чейн исполнением через **фреймворк BRAID**\n- Работает на **Quantum OS** для доказуемой случайности\n\nСпросите о *цене, майнинге, ИИ, безопасности* или *дорожной карте* для глубокого анализа.',
      },
    },
  },
  ro: {
    nav: {
      home: 'Acasă',
      cetApp: 'Aplicație CET',
      tokenomics: 'Tokenomică',
      roadmap: 'Foaie de Parcurs',
      team: 'Echipa AI',
      howToBuy: 'Cum să Cumperi',
      whitepaper: 'Whitepaper',
      resources: 'Resurse',
      faq: 'Întrebări',
      competition: 'Comparare',
    },
    hero: {
      tagline: 'Fundația Digitală a Cetățuiei',
      subtitle: 'Un token ultra-rar cu 9.000 CET pe blockchain-ul TON',
      buyNow: 'Cumpără CET',
      learnMore: 'Află Mai Mult',
      description:
        '200.000 de agenți autonomi AI în 10 departamente enterprise — operând 24/7 la cost marginal zero. Primul token RWA nativ AI din lume pe TON, alimentat de protocolul RAV cu IA duală Grok × Gemini și ancorat în infrastructura reală din Cetățuia, România.',
      startMining: 'ÎNCEPE MINAREA',
      docs: 'DOCUMENTE',
    },
    tokenomics: {
      title: 'Tokenomică',
      supply: 'Ofertă Totală',
      poolAddress: 'Adresa Pool-ului DeDust',
    },
    oracle: {
      title: 'Oracolul Solaris',
      subtitle: 'Grok × Gemini · Puntea Protocolului RAV',
      placeholder: 'Întreabă despre preț, minare, AI, securitate, foaie de parcurs…',
      sendButton: 'INIȚIAZĂ PROTOCOLUL',
      followUpPlaceholder: 'Pune o întrebare suplimentară…',
      confidence: 'Încredere',
      oracleResponse: 'Răspunsul Oracolului',
      escToClose: 'Apasă Esc pentru a închide',
      processing: 'PROCESARE',
      done: 'GATA',
      knowledge: {
        price: '**CET se tranzacționează pe DeDust (TON)** cu o ofertă fixă de **9.000 de tokeni** — raritate extremă reală.\n\n- Pool: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- **Modelul DCBM** corelează raritatea cu un program de emisie de 90 de ani\n- Acumulare de valoare pe termen lung determinată exclusiv de cererea on-chain',
        mining: '**Minarea CET durează 90 de ani** cu o curbă de recompensă descrescătoare.\n\n- **66.66%** din oferta totală intră în circulație prin proof-of-work\n- Noduri active: **18.420+**\n- Consum de baterie aproape de **0%** datorită constrângerii Zero-Battery\n- Fereastra optimă de minare: **T3 2025** (perioadă de eficiență ridicată)',
        ai: '**Solaris CET integrează cadrul BRAID** (Blockchain-Recursive AI Decision).\n\n- Fiecare acțiune a agentului AI este validată printr-o **buclă ReAct de 5 faze**\n- Faze: Observă → Gândește → Planifică → Acționează → Verifică\n- Toate urmele de raționament sunt **ancorate on-chain** pentru auditabilitate imuabilă\n- Nicio decizie opacă — fiecare pas este public și verificabil',
        ton: '**CET există pe mainnet-ul TON** — cel mai rapid blockchain L1.\n\n- **~100.000 TPS** debit\n- Finalitate de **2 secunde**\n- Arhitectură fragmentată pentru scalabilitate infinită\n- Contract inteligent **auditat de Cyberscope** și verificat KYC',
        buy: '**Cumpără CET pe DEX-ul DeDust** în 3 pași simpli:\n\n1. Conectează-ți **portofelul TON** (recomandat Tonkeeper)\n2. Navighează la pool-ul `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Schimbă **TON cu CET** — slippage recomandat: 0.5–1%\n\nExistă doar **9.000 CET** la nivel global — fiecare token = **0.011%** din oferta totală.',
        quantum: '**Quantum OS** este stratul de entropie al Solaris CET.\n\n- **8 qubits simulați** în superpoziție\n- Colapsul prin funcția de undă QRNG generează semințe criptografice imprevizibile\n- Alimentează **aleatorizarea echitabilă a minării**, programarea agenților și generarea dovezilor zero-knowledge',
        security: '**Contractul CET a trecut auditul Cyberscope** fără constatări critice.\n\n- ✅ **KYC** complet finalizat de echipă\n- ✅ Urmele de raționament on-chain **previn deciziile halucinatoare ale AI**\n- ✅ **Entropia Quantum OS** + bucle de verificare ReAct\n- ✅ Consensul BFT al TON (necesare 66.7% noduri oneste)',
        roadmap: '**Foaia de parcurs Solaris CET:**\n\n- ✅ **T1–T2 2025** (FINALIZAT): Contract implementat, audit trecut, pool DeDust activ, whitepaper IPFS\n- 🔄 **T3 2025** (ACTIV): Pilot agricultură de precizie AI în Puiești, SDK pentru dezvoltatori beta\n- 🔮 **T4 2025+**: Unități de procesare de nouă generație, Self-Actualization Protocol mainnet',
        competition: '**Solaris CET vs concurenții de tokeni AI:**\n\n- CET=9.000 · FET=1,15 mld · TAO=21 mil · AGIX=2 mld — CET este de 233.000× mai rar decât AGIX\n- TON=100.000 TPS · competitori ≤1.000 — cel mai rapid blockchain din sector\n- **200.000 agenți implementați** (nu doar un marketplace) · Exclusiv **Grok × Gemini** dual-AI\n- Singurul token AI susținut de **active din lumea reală** (teren agricol în România)',
        rwa: '**RWA — Active din Lumea Reală**: fiecare CET este ancorat la infrastructura agricolă și AI din Cetățuia, România. Pilot de tokenizare RWA în **Q2 2026**.',
        dcbm: '**DCBM** folosește controllere PID pentru răscumpărări autonome. Reduce volatilitatea cu până la **66%** fără intervenție manuală.',
        rav: '**Protocolul RAV**: Raționament (Gemini) → Acțiune (Grok) → Verificare. Fiecare decizie a agentului este stocată pe IPFS — auditabilitate permanentă.',
        braid: '**BRAID Framework**: serializează căile de raționament pe IPFS. Fiecare tranzacție CET face referire la graful său BRAID.',
        wallet: '**Conectează-ți portofelul TON**: instalează Tonkeeper → alimentează cu TON → conectează prin TonConnect → schimbă TON→CET pe DeDust.',
        staking: '**Beneficii deținere CET**: ofertă fixă 9.000 · presiune de cumpărare DCBM · bonus mining 2× la stake maxim · drepturi de vot DAO.',
        team: '**200.000 agenți autonomi** în 10 departamente: Ops Clienți (48k), Inginerie (34k), Vânzări (27k), Date & AI (21k), Finanțe (18k), Marketing (17k), Produs (13k), Securitate (10k), Juridic (7k), Cercetare (5k).',
        default: '**Solaris CET** — token ultra-rar (9.000 CET) pe blockchain-ul TON.\n\n- **Orizont de minare de 90 de ani** cu curbă de recompensă descrescătoare\n- Conectează agenți AI la execuția on-chain prin **cadrul BRAID**\n- Alimentat de **Quantum OS** pentru aleatoritate demonstrabilă\n- Fiecare decizie este **transparentă, verificabilă și imuabilă**\n\nÎntreabă despre *preț, minare, AI, securitate* sau *foaie de parcurs* pentru analize aprofundate.',
      },
    },
  },
  pt: {
    nav: {
      home: 'Início',
      cetApp: 'App CET',
      tokenomics: 'Tokenomia',
      roadmap: 'Roteiro',
      team: 'Equipa IA',
      howToBuy: 'Como Comprar',
      whitepaper: 'White Paper',
      resources: 'Recursos',
      faq: 'FAQ',
      competition: 'Comparar',
    },
    hero: {
      tagline: 'A Fundação Digital da Cetățuia',
      subtitle: 'Um token ultra-escasso com oferta de 9.000 CET na blockchain TON',
      buyNow: 'Comprar CET',
      learnMore: 'Saiba Mais',
      description:
        '200.000 agentes autônomos de IA em 10 departamentos empresariais — operando 24/7 a custo marginal zero. O primeiro token RWA nativo de IA do mundo na TON, alimentado pelo protocolo RAV dual-IA Grok × Gemini e ancorado na infraestrutura real de Cetățuia, Romênia.',
      startMining: 'INICIAR MINERAÇÃO',
      docs: 'DOCUMENTOS',
    },
    tokenomics: {
      title: 'Tokenomia',
      supply: 'Oferta Total',
      poolAddress: 'Endereço do Pool DeDust',
    },
    oracle: {
      title: 'Oráculo Solaris',
      subtitle: 'Grok × Gemini · Ponte Protocolo RAV',
      placeholder: 'Pergunte sobre preço, mineração, IA, segurança, roteiro…',
      sendButton: 'INICIAR PROTOCOLO',
      followUpPlaceholder: 'Faça uma pergunta de acompanhamento…',
      confidence: 'Confiança',
      oracleResponse: 'Resposta do Oráculo',
      escToClose: 'Pressione Esc para fechar',
      processing: 'PROCESSANDO',
      done: 'PRONTO',
      knowledge: {
        price: '**CET negocia na DeDust (TON)** com fornecimento fixo de **9.000 tokens** — escassez real.\n\n- Pool: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- O **modelo DCBM** correlaciona escassez com cronograma de emissão de 90 anos\n- Acumulação de valor a longo prazo impulsionada pela demanda on-chain',
        mining: '**A mineração CET dura 90 anos** com curva de recompensa decrescente.\n\n- **66.66%** do fornecimento total entra em circulação via proof-of-work\n- Nós ativos: **18.420+**\n- Consumo de bateria próximo a **0%** graças à restrição Zero-Battery\n- Janela ótima de mineração: **Q3 2025**',
        ai: '**Solaris CET incorpora o framework BRAID** (Blockchain-Recursive AI Decision).\n\n- Cada ação do agente IA é validada por um **ciclo ReAct de 5 fases**\n- Fases: Observar → Pensar → Planejar → Agir → Verificar\n- Todos os rastros de raciocínio estão **ancorados on-chain** para auditabilidade imutável',
        ton: '**CET vive na mainnet TON** — o blockchain L1 mais rápido.\n\n- **~100.000 TPS** de throughput\n- Finalidade em **2 segundos**\n- Arquitetura fragmentada para escalabilidade infinita\n- Contrato inteligente **auditado pela Cyberscope** e verificado KYC',
        buy: '**Compre CET na DEX DeDust** em 3 passos simples:\n\n1. Conecte sua **carteira TON** (Tonkeeper recomendado)\n2. Navegue para o pool `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Troque **TON por CET** — slippage recomendado: 0.5–1%\n\nExistem apenas **9.000 CET** no mundo — cada token = **0.011%** do fornecimento total.',
        quantum: '**Quantum OS** é a camada de entropia do Solaris CET.\n\n- **8 qubits simulados** em superposição\n- Colapso via função de onda QRNG gera sementes criptográficas imprevisíveis\n- Alimenta **aleatoriedade justa na mineração**, agendamento de agentes e geração de provas de conhecimento zero',
        security: '**O contrato CET passou na auditoria da Cyberscope** sem descobertas críticas.\n\n- ✅ **KYC** completo realizado pela equipe\n- ✅ Rastros de raciocínio on-chain **previnem decisões alucinadas da IA**\n- ✅ **Entropia Quantum OS** + ciclos de verificação ReAct\n- ✅ Consenso BFT do TON (66.7% de nós honestos necessários)',
        roadmap: '**Roteiro do Solaris CET:**\n\n- ✅ **Q1–Q2 2025** (CONCLUÍDO): Contrato implantado, auditoria aprovada, pool DeDust ativo\n- 🔄 **Q3 2025** (ATIVO): Piloto de agricultura de precisão IA, SDK para desenvolvedores beta\n- 🔮 **Q4 2025+**: Unidades de processamento de próxima geração, Self-Actualization Protocol mainnet',
        competition: '**Solaris CET vs concorrentes de tokens IA:**\n\n- CET=9.000 · FET=1,15B · TAO=21M · AGIX=2B — CET é 233.000× mais escasso que AGIX\n- TON=100.000 TPS · concorrentes ≤1.000 — a blockchain mais rápida do setor\n- **200.000 agentes implantados** (não apenas um marketplace) · Exclusivo **Grok × Gemini** dual-IA\n- Único token IA respaldado por **ativos do mundo real** (terra agrícola na Romênia)',
        rwa: '**RWA — Ativo do Mundo Real**: cada CET está ancorado à infraestrutura agrícola e de IA em Cetățuia, Romênia. Piloto de tokenização RWA em **Q2 2026**.',
        dcbm: '**DCBM** usa controladores PID para recompras autônomas. Reduz volatilidade em até **66%** sem intervenção manual.',
        rav: '**Protocolo RAV**: Raciocinar (Gemini) → Agir (Grok) → Verificar. Cada decisão do agente está no IPFS — auditabilidade permanente.',
        braid: '**BRAID Framework**: serializa caminhos de raciocínio no IPFS. Cada transação CET referencia seu grafo BRAID.',
        wallet: '**Conecte sua carteira TON**: instale Tonkeeper → financie com TON → conecte via TonConnect → troque TON→CET na DeDust.',
        staking: '**Benefícios de manter CET**: oferta fixa de 9.000 · pressão de compra DCBM · bônus de mineração 2× com staking máximo · direitos de voto DAO.',
        team: '**200.000 agentes autônomos** em 10 departamentos: Ops Cliente (48k), Engenharia (34k), Vendas (27k), Dados & IA (21k), Finanças (18k), Marketing (17k), Produto (13k), Segurança (10k), Jurídico (7k), Pesquisa (5k).',
        default: '**Solaris CET** — token de extrema escassez (9.000 CET) na blockchain TON.\n\n- **Horizonte de mineração de 90 anos** com curva de recompensa decrescente\n- Conecta agentes IA à execução on-chain via **framework BRAID**\n- Alimentado por **Quantum OS** para aleatoriedade comprovável\n\nPergunte sobre *preço, mineração, IA, segurança* ou *roteiro* para insights profundos.',
      },
    },
  },
  de: {
    nav: {
      home: 'Startseite',
      cetApp: 'CET App',
      tokenomics: 'Tokenomik',
      roadmap: 'Fahrplan',
      team: 'KI-Team',
      howToBuy: 'Wie Kaufen',
      whitepaper: 'Whitepaper',
      resources: 'Ressourcen',
      faq: 'FAQ',
      competition: 'Vergleich',
    },
    hero: {
      tagline: 'Das digitale Fundament von Cetățuia',
      subtitle: 'Ein extrem seltener Token mit 9.000 CET auf der TON-Blockchain',
      buyNow: 'CET kaufen',
      learnMore: 'Mehr erfahren',
      description:
        '200.000 autonome KI-Agenten in 10 Unternehmensabteilungen — 24/7 betrieben bei null Grenzkosten. Das weltweit erste KI-native RWA-Token auf TON, angetrieben durch das duale KI-RAV-Protokoll Grok × Gemini, verankert in der realen Infrastruktur von Cetățuia, Rumänien.',
      startMining: 'MINING STARTEN',
      docs: 'DOKUMENTE',
    },
    tokenomics: {
      title: 'Tokenomik',
      supply: 'Gesamtangebot',
      poolAddress: 'DeDust Pool-Adresse',
    },
    oracle: {
      title: 'Solaris Orakel',
      subtitle: 'Grok × Gemini · RAV-Protokoll-Brücke',
      placeholder: 'Frage nach Preis, Mining, KI, Sicherheit, Fahrplan…',
      sendButton: 'PROTOKOLL STARTEN',
      followUpPlaceholder: 'Stell eine Folgefrage…',
      confidence: 'Konfidenz',
      oracleResponse: 'Orakel-Antwort',
      escToClose: 'Esc drücken zum Schließen',
      processing: 'VERARBEITUNG',
      done: 'FERTIG',
      knowledge: {
        price: '**CET wird auf DeDust (TON)** mit einem festen Angebot von **9.000 Token** gehandelt — echte Hyperknappheit.\n\n- Pool: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n- Das **DCBM-Modell** korreliert Knappheit mit einem 90-Jahres-Emissionsplan\n- Langfristige Wertakkumulation, die ausschließlich durch On-Chain-Nachfrage angetrieben wird',
        mining: '**CET-Mining läuft 90 Jahre** mit einer abnehmenden Belohnungskurve.\n\n- **66.66%** des Gesamtangebots gelangt durch Proof-of-Work in Umlauf\n- Aktive Nodes: **18.420+**\n- Akkuverbrauch nahezu **0%** dank der Zero-Battery-Einschränkung\n- Optimales Mining-Fenster: **Q3 2025**',
        ai: '**Solaris CET integriert das BRAID-Framework** (Blockchain-Recursive AI Decision).\n\n- Jede KI-Agenten-Aktion wird durch eine **5-Phasen-ReAct-Schleife** validiert\n- Phasen: Beobachten → Denken → Planen → Handeln → Verifizieren\n- Alle Reasoning-Spuren sind **On-Chain verankert** für unveränderliche Auditierbarkeit',
        ton: '**CET lebt auf dem TON-Mainnet** — der schnellsten L1-Blockchain.\n\n- **~100.000 TPS** Durchsatz\n- **2-Sekunden**-Finalität\n- Gesplittete Architektur für unendliche Skalierbarkeit\n- Smart Contract **von Cyberscope auditiert** und KYC-verifiziert',
        buy: '**Kaufe CET auf DeDust DEX** in 3 einfachen Schritten:\n\n1. Verbinde deine **TON-Wallet** (Tonkeeper empfohlen)\n2. Navigiere zu Pool `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Tausche **TON gegen CET** — empfohlener Slippage: 0,5–1%\n\nWeltweit gibt es nur **9.000 CET** — jeder Token = **0,011%** des Gesamtangebots.',
        quantum: '**Quantum OS** ist Solaris CETs Entropie-Schicht.\n\n- **8 simulierte Qubits** in Superposition\n- Kollaps durch QRNG-gesäte Wellenfunktion erzeugt unvorhersehbare kryptografische Seeds\n- Treibt **faire Mining-Zufälligkeit**, Agenten-Scheduling und Zero-Knowledge-Proof-Generierung an',
        security: '**CET-Vertrag bestand Cyberscopes Audit** ohne kritische Befunde.\n\n- ✅ Vollständige **KYC**-Verifizierung des Teams\n- ✅ On-Chain-Reasoning-Spuren **verhindern halluzinierte KI-Entscheidungen**\n- ✅ **Quantum OS Entropie** + ReAct-Verifikationsschleifen\n- ✅ TONs BFT-Konsens (66,7% ehrliche Nodes erforderlich)',
        roadmap: '**Solaris CET Fahrplan:**\n\n- ✅ **Q1–Q2 2025** (FERTIG): Vertrag deployed, Audit bestanden, DeDust-Pool live\n- 🔄 **Q3 2025** (AKTIV): KI-Präzisionslandwirtschaftspilot, Developer SDK Beta\n- 🔮 **Q4 2025+**: Next-Gen-Verarbeitungseinheiten, Self-Actualization Protocol Mainnet',
        competition: '**Solaris CET vs. KI-Token-Wettbewerber:**\n\n- CET=9.000 · FET=1,15 Mrd · TAO=21 Mio · AGIX=2 Mrd — CET ist 233.000× seltener als AGIX\n- TON=100.000 TPS · Wettbewerber ≤1.000 — schnellste Blockchain im Sektor\n- **200.000 eingesetzte Agenten** (kein bloßer Marktplatz) · Exklusiv **Grok × Gemini** Dual-KI\n- Einziger KI-Token mit **Real-World-Asset**-Deckung (Agrarland in Rumänien)',
        rwa: '**RWA — Reale Vermögenswerte**: Jeder CET ist an landwirtschaftliche und KI-Infrastruktur in Cetățuia, Rumänien, gebunden. RWA-Tokenisierungspilot in **Q2 2026**.',
        dcbm: '**DCBM** nutzt PID-Regler für autonome Rückkäufe. Reduziert Volatilität um bis zu **66%** ohne manuellen Eingriff.',
        rav: '**RAV-Protokoll**: Begründen (Gemini) → Handeln (Grok) → Verifizieren. Jede Agentenentscheidung ist auf IPFS gespeichert — dauerhafte Nachvollziehbarkeit.',
        braid: '**BRAID Framework**: serialisiert Begründungspfade auf IPFS. Jede CET-Transaktion referenziert ihren BRAID-Graphen.',
        wallet: '**TON-Wallet verbinden**: Tonkeeper installieren → TON einzahlen → über TonConnect verbinden → TON→CET auf DeDust tauschen.',
        staking: '**Vorteile des CET-Holdings**: festes Angebot 9.000 · DCBM-Kaufdruck · 2× Mining-Bonus beim Max-Staking · DAO-Stimmrechte.',
        team: '**200.000 autonome Agenten** in 10 Abteilungen: Kunden-Ops (48k), Engineering (34k), Vertrieb (27k), Daten & KI (21k), Finanzen (18k), Marketing (17k), Produkt (13k), Sicherheit (10k), Recht (7k), Forschung (5k).',
        default: '**Solaris CET** — hyperseltener Token (9.000 CET) auf der TON-Blockchain.\n\n- **90-jähriger Mining-Horizont** mit abnehmender Belohnungskurve\n- Verbindet KI-Agenten mit On-Chain-Ausführung über das **BRAID-Framework**\n- Angetrieben von **Quantum OS** für nachweisbare Zufälligkeit\n\nFrage nach *Preis, Mining, KI, Sicherheit* oder *Fahrplan* für tiefe Einblicke.',
      },
    },
  },
};

export default translations;
