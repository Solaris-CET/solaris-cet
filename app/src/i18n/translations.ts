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
    },
    hero: {
      tagline: 'The Digital Foundation of Cetățuia',
      subtitle: 'A hyper-scarce token with 9,000 CET supply on the TON blockchain',
      buyNow: 'Buy CET',
      learnMore: 'Learn More',
      description:
        'High-impact RWA token anchored in the agricultural and AI infrastructure of Cetățuia. Each unit grants access to the Solaris Prime Tactical Ecosystem, a reasoning hierarchy powered by Gemini 3 Pro Preview. The dual reasoning engine Grok × Gemini drives the RAV protocol for full agent autonomy.',
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
        ai: '**Solaris CET embeds the BRAID framework** (Blockchain-Recursive AI Decision).\n\n- Every AI agent action is validated through a **5-phase ReAct loop**\n- Phases: Observe → Think → Plan → Act → Verify\n- All reasoning traces are **anchored on-chain** for immutable auditability\n- No black-box decisions — every step is public and verifiable',
        ton: '**CET lives on TON mainnet** — the fastest L1 blockchain.\n\n- **~100,000 TPS** throughput\n- **2-second** finality\n- Sharded architecture for infinite scalability\n- Smart contract **audited by Cyberscope** and KYC-verified',
        buy: '**Buy CET on DeDust DEX** in 3 simple steps:\n\n1. Connect your **TON wallet** (Tonkeeper recommended)\n2. Navigate to pool `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`\n3. Swap **TON for CET** — recommended slippage: 0.5–1%\n\nOnly **9,000 CET** exist globally — each token = **0.011%** of total supply.',
        quantum: '**Quantum OS** is Solaris CET\'s entropy layer.\n\n- **8 simulated qubits** in superposition\n- Collapse via QRNG-seeded wavefunction generates unpredictable cryptographic seeds\n- Powers **fair mining randomness**, agent scheduling, and zero-knowledge proof generation\n- Every on-chain event is **provably random**',
        security: '**CET contract passed Cyberscope\'s audit** with zero critical findings.\n\n- ✅ Full **KYC** completed by the team\n- ✅ On-chain reasoning traces **prevent hallucinated AI decisions**\n- ✅ **Quantum OS entropy** + ReAct verification loops\n- ✅ TON\'s BFT consensus (66.7% honest nodes required)',
        roadmap: '**Solaris CET development roadmap:**\n\n- ✅ **Q1–Q2 2025** (DONE): Contract deployed, audit passed, DeDust pool live, IPFS whitepaper\n- 🔄 **Q3 2025** (ACTIVE): AI precision farming pilot, Developer SDK beta, ReAct on-chain traces\n- 🔮 **Q4 2025+**: Next-gen processing units, Self-Actualization Protocol mainnet, cross-chain bridge',
        default: '**Solaris CET** — a hyper-scarce token (9,000 CET supply) on the TON blockchain.\n\n- **90-year mining horizon** with decaying reward curve\n- Bridges AI agents to on-chain execution via the **BRAID Framework**\n- Powered by **Quantum OS** for provable randomness\n- Every decision is **transparent, verifiable, and immutable**\n\nAsk about *price, mining, AI, security*, or *roadmap* for deep insights.',
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
    },
    hero: {
      tagline: 'La Base Digital de Cetățuia',
      subtitle: 'Un token de escasez extrema con 9.000 CET en la blockchain TON',
      buyNow: 'Comprar CET',
      learnMore: 'Saber Más',
      description:
        'Token RWA de alto impacto anclado en la infraestructura agrícola e IA de Cetățuia. Cada unidad otorga acceso al Solaris Prime Tactical Ecosystem, una jerarquía de razonamiento impulsada por Gemini 3 Pro Preview. El motor de razonamiento dual Grok × Gemini impulsa el protocolo RAV para la plena autonomía de agentes.',
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
    },
    hero: {
      tagline: 'Cetățuia 的数字基础',
      subtitle: 'TON 区块链上供应量仅 9,000 枚 CET 的超稀缺代币',
      buyNow: '购买 CET',
      learnMore: '了解更多',
      description:
        '锚定在 Cetățuia 农业和 AI 基础设施中的高影响力 RWA 代币。每个单元授予对 Solaris Prime Tactical Ecosystem 的访问权限，这是由 Gemini 3 Pro Preview 驱动的推理层次结构。双推理引擎 Grok × Gemini 驱动 RAV 协议，实现代理完全自主。',
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
    },
    hero: {
      tagline: 'Цифровая Основа Cetățuia',
      subtitle: 'Гиперредкий токен с запасом 9 000 CET на блокчейне TON',
      buyNow: 'Купить CET',
      learnMore: 'Узнать больше',
      description:
        'Высокоэффективный RWA-токен, основанный на сельскохозяйственной и ИИ-инфраструктуре Cetățuia. Каждая единица предоставляет доступ к Solaris Prime Tactical Ecosystem — иерархии рассуждений на базе Gemini 3 Pro Preview. Двойной движок рассуждений Grok × Gemini обеспечивает протокол RAV для полной автономии агентов.',
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
    },
    hero: {
      tagline: 'Fundația Digitală a Cetățuiei',
      subtitle: 'Un token ultra-rar cu 9.000 CET pe blockchain-ul TON',
      buyNow: 'Cumpără CET',
      learnMore: 'Află Mai Mult',
      description:
        'Token RWA de mare impact ancorat în infrastructura agricolă și AI din Cetățuia. Fiecare unitate oferă acces la Solaris Prime Tactical Ecosystem, o ierarhie de raționament alimentată de Gemini 3 Pro Preview. Motorul de raționament dual Grok × Gemini alimentează protocolul RAV pentru autonomie totală a agenților.',
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
    },
    hero: {
      tagline: 'A Fundação Digital da Cetățuia',
      subtitle: 'Um token ultra-escasso com oferta de 9.000 CET na blockchain TON',
      buyNow: 'Comprar CET',
      learnMore: 'Saiba Mais',
      description:
        'Token RWA de alto impacto ancorado na infraestrutura agrícola e de IA de Cetățuia. Cada unidade concede acesso ao Solaris Prime Tactical Ecosystem, uma hierarquia de raciocínio alimentada pelo Gemini 3 Pro Preview. O motor de raciocínio dual Grok × Gemini impulsiona o protocolo RAV para total autonomia de agentes.',
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
    },
    hero: {
      tagline: 'Das digitale Fundament von Cetățuia',
      subtitle: 'Ein extrem seltener Token mit 9.000 CET auf der TON-Blockchain',
      buyNow: 'CET kaufen',
      learnMore: 'Mehr erfahren',
      description:
        'Wirkungsstarker RWA-Token, verankert in der landwirtschaftlichen und KI-Infrastruktur von Cetățuia. Jede Einheit gewährt Zugang zum Solaris Prime Tactical Ecosystem, einer Reasoning-Hierarchie, die von Gemini 3 Pro Preview angetrieben wird. Das duale Reasoning-Modul Grok × Gemini treibt das RAV-Protokoll für volle Agentenautonomie an.',
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
        default: '**Solaris CET** — hyperseltener Token (9.000 CET) auf der TON-Blockchain.\n\n- **90-jähriger Mining-Horizont** mit abnehmender Belohnungskurve\n- Verbindet KI-Agenten mit On-Chain-Ausführung über das **BRAID-Framework**\n- Angetrieben von **Quantum OS** für nachweisbare Zufälligkeit\n\nFrage nach *Preis, Mining, KI, Sicherheit* oder *Fahrplan* für tiefe Einblicke.',
      },
    },
  },
};

export default translations;
