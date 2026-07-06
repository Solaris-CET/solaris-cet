import { TOKEN_DECIMALS,TOKEN_TOTAL_SUPPLY } from '@/constants/token';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';

import type { FaqContent } from './faqContent.types';

type FaqLang = 'en' | 'es' | 'zh' | 'ru' | 'ro' | 'pt' | 'de';

const faqEn: FaqContent = {
  headingBadge: 'FAQ',
  titleBefore: 'Common Questions',
  titleHighlight: 'Answered',
  subtitle:
    'Everything you need to know about Solaris CET, from token economics to technical architecture.',
  q1: 'What is Solaris CET?',
  a1:
    `Solaris CET (CET) is a hyper-scarce Real-World Asset token on the TON blockchain with a fixed supply of ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. It bridges AI agents to on-chain execution through the BRAID Framework and the RAV Protocol, anchored in the agricultural and AI infrastructure of Cetățuia, Romania.`,
  q2: 'What is the total supply of CET?',
  a2:
    `The total supply is fixed at ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET — permanently. No minting, no admin keys, no inflation. This makes each token represent 0.011% of the entire global supply.`,
  q3: 'How do I buy CET?',
  a3:
    `CET trades on DeDust DEX on the TON network. Connect a TON wallet (Tonkeeper recommended), fund it with TON, then swap TON → CET at the official DeDust pool. Always verify the contract address: ${CET_CONTRACT_ADDRESS}`,
  q4: 'Is the smart contract audited?',
  a4:
    'Yes. The CET smart contract was fully audited by Cyberscope with zero critical findings. The core team has also completed KYC verification and the project is listed on Freshcoins. The full audit report is linked in the whitepaper.',
  q5: 'How does CET mining work?',
  a5:
    "Mining is designed to run over a long horizon with a decaying reward curve, similar in spirit to emission schedules like Bitcoin's. Exact reward distribution and device impact depend on implementation details and should be verified against the deployed protocol rules.",
  q6: 'What is the DCBM mechanism?',
  a6:
    'DCBM (Dynamic-Control Buyback Mechanism) is a proposed buyback and stabilization concept using feedback-control ideas (e.g. PID-like controllers). Any quantitative claims should be backed by a reproducible backtest and on-chain audit trail when implemented.',
  q7: 'What blockchain does CET run on?',
  a7:
    "CET is deployed on the TON (The Open Network) mainnet — a sharded L1 designed for high throughput and short finality in typical conditions. Exact performance varies by network load and workload.",
  q8: 'What is the ReAct Protocol?',
  a8:
    "ReAct (Reasoning + Acting) is a pattern that interleaves reasoning and actions. Solaris CET uses a 5-phase loop (Observe → Think → Plan → Act → Verify) to keep actions reviewable; traces can be anchored via IPFS/on-chain references when deployed.",
  q9: 'Where can I find the whitepaper?',
  a9: 'The whitepaper is permanently published on IPFS — immutable and censorship-resistant.',
  q10: 'How do I join the Solaris CET community?',
  a10:
    'Join the official Telegram community for news, updates, and direct communication with the team. The source code is also open on GitHub.',
  q11: 'How does Solaris CET compare to Fetch.ai, Bittensor and SingularityNET?',
  a11:
    'CET has a fixed supply of 9,000 (many competitors are in the millions/billions). CET runs on TON (sharded L1). The site includes a simulated agent-mesh UX for structured answers, and multi-model routing can be enabled when deployed. CET is anchored to a real-world agricultural narrative in Romania (Cetățuia).',
  q12: 'What is the BRAID Framework?',
  a12:
    'BRAID (Blockchain-Recursive AI Decision) serialises agent reasoning paths as Mermaid notation graphs, stores them on IPFS, and anchors them in every CET transaction. This means any decision made by any agent can be reconstructed and audited months or years later — with complete traceability and zero trust assumptions.',
  q13: 'What are the RAV Protocol phases?',
  a13:
    'RAV = Reason · Act · Verify. Phase 1 (REASON): decompose the goal into sub-objectives using a structured reasoning graph. Phase 2 (ACT): execute the action plan (on-chain/off-chain). Phase 3 (VERIFY): cross-check outcomes against chain facts and expected results. Traces can be stored on IPFS and referenced for audits.',
  q14: 'What is the Zero-Battery Constraint?',
  a14:
    "CET mining is engineered to approach zero battery drain on mobile devices. Unlike Bitcoin mining, CET's Zero-Battery Constraint limits CPU utilisation to background-idle levels, meaning mining can run passively without heating your device or reducing battery life measurably.",
  linkWhitepaper: 'Open Whitepaper on IPFS ↗',
  linkTelegram: 'Join Telegram ↗',
  linkGithub: 'View on GitHub ↗',
  linkComparison: 'Full comparison ↗',
};

/** Per-locale FAQ accordion copy (14 Q&A + link labels). */
export const faqContentByLang: Record<FaqLang, FaqContent> = {
  en: faqEn,
  es: {
    headingBadge: 'FAQ',
    titleBefore: 'Preguntas frecuentes',
    titleHighlight: 'Respondidas',
    subtitle:
      'Todo lo que necesitas saber sobre Solaris CET: economía del token y arquitectura técnica.',
    q1: '¿Qué es Solaris CET?',
    a1:
      `Solaris CET (CET) es un token RWA hiperescaso en la blockchain TON con oferta fija de ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Conecta agentes de IA con la ejecución on-chain mediante el marco BRAID y el protocolo RAV, anclado en la infraestructura agrícola y de IA de Cetățuia, Rumanía.`,
    q2: '¿Cuál es el suministro total de CET?',
    a2:
      `El suministro total es fijo en ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET — para siempre. Sin acuñación, sin claves de administrador, sin inflación. Cada token representa el 0,011% del suministro global.`,
    q3: '¿Cómo compro CET?',
    a3:
      `CET cotiza en el DEX DeDust en TON. Conecta un wallet TON (recomendado Tonkeeper), carga TON e intercambia TON → CET en el pool oficial DeDust. Verifica siempre la dirección del contrato: ${CET_CONTRACT_ADDRESS}`,
    q4: '¿Está auditado el contrato inteligente?',
    a4:
      'Sí. El contrato CET fue auditado por Cyberscope sin hallazgos críticos. El equipo completó KYC y el proyecto figura en Freshcoins. El informe completo está enlazado en el libro blanco.',
    q5: '¿Cómo funciona la minería de CET?',
    a5:
      'El 66,66% del suministro BTC-S entra en circulación mediante PoW en 90 años con curva decreciente — modelo tipo halving de Bitcoin. La restricción Zero-Battery hace que el consumo de batería se acerque al 0% en los dispositivos.',
    q6: '¿Qué es el mecanismo DCBM?',
    a6:
      'DCBM (mecanismo de recompra de control dinámico) usa controladores PID para gestionar recompras cuando el precio se desvía de la banda objetivo. Reduce la volatilidad hasta un 66% sin intervención manual.',
    q7: '¿En qué blockchain funciona CET?',
    a7:
      'CET está desplegado en la mainnet de TON (The Open Network) — una de las L1 más rápidas, con ~100.000 TPS y finalidad en ~2 segundos. La arquitectura fragmentada de TON ofrece escalabilidad muy alta.',
    q8: '¿Qué es el protocolo ReAct?',
    a8:
      'ReAct (razonamiento + acción) es el estándar de razonamiento IA on-chain de Solaris CET. Cada acción de agente sigue: Observar → Pensar → Planificar → Actuar → Verificar. Las trazas quedan ancladas on-chain, con transparencia y resistencia a alucinaciones.',
    q9: '¿Dónde encuentro el libro blanco?',
    a9: 'El libro blanco está publicado de forma permanente en IPFS — inmutable y resistente a la censura.',
    q10: '¿Cómo me uno a la comunidad Solaris CET?',
    a10:
      'Únete al Telegram oficial para novedades y contacto con el equipo. El código fuente también está abierto en GitHub.',
    q11: '¿Cómo se compara Solaris CET con Fetch.ai, Bittensor y SingularityNET?',
    a11:
      'CET tiene 9.000 de suministro frente a miles de millones en rivales. TON ofrece 100.000 TPS frente a menos de 1.000 en muchos competidores. CET opera ~200.000 agentes autónomos desplegados. Solo CET usa Grok × Gemini en dual-AI. Solo CET está respaldado por activos agrícolas reales en Rumanía.',
    q12: '¿Qué es el marco BRAID?',
    a12:
      'BRAID serializa rutas de razonamiento como grafos Mermaid en IPFS y las ancla en cada transacción CET. Cualquier decisión puede reconstruirse y auditarse mucho después.',
    q13: '¿Cuáles son las fases del protocolo RAV?',
    a13:
      'RAV = Reason · Act · Verify. REASON: Gemini descompone objetivos con un grafo BRAID. ACT: Grok ejecuta el plan y genera transacciones TON. VERIFY: un modelo independiente revisa la acción y su traza on-chain. Todo queda en IPFS de forma inmutable.',
    q14: '¿Qué es la restricción Zero-Battery?',
    a14:
      'La minería CET está diseñada para un consumo de batería cercano a cero en móviles. A diferencia del minado tipo Bitcoin, limita la CPU a niveles casi inactivos para no calentar el dispositivo ni desgastar la batería de forma notable.',
    linkWhitepaper: 'Abrir libro blanco en IPFS ↗',
    linkTelegram: 'Unirse a Telegram ↗',
    linkGithub: 'Ver en GitHub ↗',
    linkComparison: 'Comparación completa ↗',
  },
  zh: {
    headingBadge: '常见问题',
    titleBefore: '常见问题',
    titleHighlight: '解答',
    subtitle: '关于 Solaris CET 的代币经济与技术架构，您需要了解的核心内容。',
    q1: '什么是 Solaris CET？',
    a1:
      `Solaris CET（CET）是 TON 上的超稀缺现实世界资产（RWA）代币，固定供应量 ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET。通过 BRAID 框架与 RAV 协议将 AI 智能体与链上执行连接，锚定罗马尼亚 Cetățuia 的农业与 AI 基础设施。`,
    q2: 'CET 总供应量是多少？',
    a2:
      `总供应量永久固定为 ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET。无增发、无管理员私钥、无通胀。每个代币占全球总供应的 0.011%。`,
    q3: '如何购买 CET？',
    a3:
      `CET 在 TON 网络的 DeDust DEX 上交易。连接 TON 钱包（推荐 Tonkeeper），充值 TON，再在官方 DeDust 池将 TON 兑换为 CET。请务必核对合约地址：${CET_CONTRACT_ADDRESS}`,
    q4: '智能合约是否经过审计？',
    a4:
      '是的。CET 合约已由 Cyberscope 全面审计，零严重问题。核心团队已完成 KYC，项目已上架 Freshcoins。完整审计报告见白皮书链接。',
    q5: 'CET 挖矿如何运作？',
    a5:
      'BTC-S 供应量的 66.66% 通过工作量证明在 90 年内按递减曲线释放，类似比特币减半模型。零电池约束使参与设备的电池消耗趋近于 0%。',
    q6: '什么是 DCBM 机制？',
    a6:
      'DCBM（动态控制回购机制）使用 PID 控制器在价格偏离目标区间时自动管理回购，可将价格波动降低最多约 66%，无需人工干预。',
    q7: 'CET 运行在哪个区块链上？',
    a7:
      'CET 部署在 TON（The Open Network）主网——高吞吐 L1，约 10 万 TPS、约 2 秒最终确认。分片架构具备极强扩展能力。',
    q8: '什么是 ReAct 协议？',
    a8:
      'ReAct（推理+行动）是 Solaris CET 的链上 AI 推理标准。每个智能体动作经过：观察→思考→计划→行动→验证。推理轨迹锚定在链上，可审计、抗幻觉。',
    q9: '在哪里可以阅读白皮书？',
    a9: '白皮书永久发布在 IPFS 上——不可篡改、抗审查。',
    q10: '如何加入 Solaris CET 社区？',
    a10:
      '加入官方 Telegram 获取资讯并与团队交流。源代码亦在 GitHub 开源。',
    q11: 'Solaris CET 与 Fetch.ai、Bittensor、SingularityNET 相比如何？',
    a11:
      'CET 总供应仅 9,000，而许多竞品为数十亿级。TON 约 10 万 TPS，远高于多数竞品。CET 运行约 20 万自主智能体。仅 CET 同时使用 Grok × Gemini 双模型。仅 CET 由罗马尼亚真实农业资产支撑。',
    q12: '什么是 BRAID 框架？',
    a12:
      'BRAID（区块链递归 AI 决策）将智能体推理路径序列化为 Mermaid 图并存于 IPFS，并锚定在每笔 CET 交易中，可追溯审计。',
    q13: 'RAV 协议有哪些阶段？',
    a13:
      'RAV = 推理·行动·验证。推理：Gemini 用 BRAID 图分解目标。行动：Grok 执行并生成 TON 交易。验证：独立模型复核动作与链上痕迹。各阶段时间戳并存于 IPFS。',
    q14: '什么是零电池约束？',
    a14:
      'CET 挖矿针对移动设备将电池消耗压至极低。与比特币式挖矿不同，零电池约束将 CPU 限制在接近后台空闲水平，避免明显发热与耗电。',
    linkWhitepaper: '在 IPFS 打开白皮书 ↗',
    linkTelegram: '加入 Telegram ↗',
    linkGithub: '在 GitHub 查看 ↗',
    linkComparison: '完整对比 ↗',
  },
  ru: {
    headingBadge: 'FAQ',
    titleBefore: 'Частые вопросы',
    titleHighlight: 'с ответами',
    subtitle:
      'Всё важное о Solaris CET: токеномика и техническая архитектура.',
    q1: 'Что такое Solaris CET?',
    a1:
      `Solaris CET (CET) — сверхдефицитный RWA-токен в сети TON с фиксированной эмиссией ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Связывает ИИ-агентов с ончейн-исполнением через BRAID и RAV, привязан к агро- и ИИ-инфраструктуре Cetățuia, Румыния.`,
    q2: 'Какой общий объём предложения CET?',
    a2:
      `Общий объём зафиксирован навсегда: ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Без минтинга, без админ-ключей, без инфляции. Каждый токен = 0,011% от всего предложения.`,
    q3: 'Как купить CET?',
    a3:
      `CET торгуется на DEX DeDust в сети TON. Подключите кошелёк TON (рекомендуется Tonkeeper), пополните TON и обменяйте TON → CET в официальном пуле. Проверяйте адрес контракта: ${CET_CONTRACT_ADDRESS}`,
    q4: 'Проведён ли аудит смарт-контракта?',
    a4:
      'Да. Контракт CET полностью аудирован Cyberscope без критических замечаний. Команда прошла KYC, проект в Freshcoins. Полный отчёт — в whitepaper.',
    q5: 'Как работает майнинг CET?',
    a5:
      '66,66% предложения BTC-S поступает в обращение через PoW за 90 лет с убывающей кривой — по аналогии с халвингом Bitcoin. Ограничение Zero-Battery удерживает разряд батареи близким к нулю.',
    q6: 'Что такое механизм DCBM?',
    a6:
      'DCBM использует PID-регуляторы для автономных обратных выкупов при отклонении цели. Снижает волатильность до ~66% без ручного вмешательства.',
    q7: 'На каком блокчейне CET?',
    a7:
      'CET развёрнут в мейннете TON (The Open Network) — один из самых быстрых L1, ~100 000 TPS и финальность ~2 с. Шардирование TON даёт высокую масштабируемость.',
    q8: 'Что такое протокол ReAct?',
    a8:
      'ReAct (рассуждение + действие) — стандарт ончейн-рассуждений Solaris CET. Каждое действие агента: Наблюдение → Мышление → План → Действие → Проверка. Следы рассуждений фиксируются в сети.',
    q9: 'Где whitepaper?',
    a9: 'Whitepaper постоянно опубликован в IPFS — неизменяемо и устойчиво к цензуре.',
    q10: 'Как присоединиться к сообществу?',
    a10:
      'Официальный Telegram — новости и связь с командой. Исходный код открыт на GitHub.',
    q11: 'Сравнение с Fetch.ai, Bittensor и SingularityNET?',
    a11:
      'У CET эмиссия 9 000 против миллиардов у конкурентов. TON даёт ~100 000 TPS против <1000 у многих. ~200 000 автономных агентов. Только CET использует Grok × Gemini одновременно. Только CET привязан к реальному агро в Румынии.',
    q12: 'Что такое BRAID?',
    a12:
      'BRAID сериализует пути рассуждений как графы Mermaid в IPFS и привязывает к каждой транзакции CET для последующего аудита.',
    q13: 'Фазы протокола RAV?',
    a13:
      'RAV = Reason · Act · Verify. REASON: Gemini декомпозирует цели. ACT: Grok исполняет план и формирует транзакции TON. VERIFY: независимая модель проверяет след. Всё неизменяемо в IPFS.',
    q14: 'Что такое ограничение Zero-Battery?',
    a14:
      'Майнинг CET рассчитан на минимальный расход батареи на мобильных устройствах: CPU удерживается на уровне фоновых задач без перегрева.',
    linkWhitepaper: 'Открыть whitepaper в IPFS ↗',
    linkTelegram: 'Войти в Telegram ↗',
    linkGithub: 'Открыть GitHub ↗',
    linkComparison: 'Полное сравнение ↗',
  },
  ro: {
    headingBadge: 'FAQ',
    titleBefore: 'Întrebări frecvente',
    titleHighlight: 'cu răspunsuri',
    subtitle:
      'Tot ce trebuie să știi despre Solaris CET: tokenomics și arhitectură tehnică.',
    q1: 'Ce este Solaris CET?',
    a1:
      `Solaris CET (CET) este un token RWA hiper-rar pe blockchain-ul TON, cu ofertă fixă de ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Leagă agenții AI de execuția on-chain prin cadrul BRAID și protocolul RAV, ancorat în infrastructura agricolă și AI din Cetățuia, România.`,
    q2: 'Care este oferta totală de CET?',
    a2:
      `Oferta totală este fixată permanent la ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Fără emisie nouă, fără chei de admin, fără inflație. Fiecare token reprezintă 0,011% din întreaga ofertă globală.`,
    q3: 'Cum cumpăr CET?',
    a3:
      `CET se tranzacționează pe DEX-ul DeDust în rețeaua TON. Conectează un portofel TON (recomandat Tonkeeper), alimentează cu TON, apoi schimbă TON → CET la pool-ul oficial DeDust. Verifică mereu adresa contractului: ${CET_CONTRACT_ADDRESS}`,
    q4: 'Este contractul inteligent auditat?',
    a4:
      'Da. Contractul CET a fost auditat complet de Cyberscope, fără constatări critice. Echipa a finalizat KYC, iar proiectul este listat pe Freshcoins. Raportul complet este legat în whitepaper.',
    q5: 'Cum funcționează minarea CET?',
    a5:
      'Minarea este gândită să ruleze pe un orizont lung, cu o curbă de recompense descrescătoare, similar ca idee cu programe de emisie precum Bitcoin. Distribuția exactă a recompenselor și impactul pe dispozitive depind de implementarea finală și trebuie verificate în regulile protocolului deployat.',
    q6: 'Ce este mecanismul DCBM?',
    a6:
      'DCBM (mecanism dinamic de răscumpărare) este un concept propus de stabilizare care folosește idei de control (feedback de tip PID). Orice afirmație cantitativă trebuie susținută de un backtest reproductibil și de un audit trail on-chain când este implementat.',
    q7: 'Pe ce blockchain rulează CET?',
    a7:
      'CET este deployat pe mainnet-ul TON (The Open Network) — un L1 fragmentat proiectat pentru debit ridicat și finalitate scurtă în condiții tipice. Performanța exactă variază în funcție de load și workload.',
    q8: 'Ce este protocolul ReAct?',
    a8:
      'ReAct (Raționament + Acțiune) este un pattern care îmbină raționarea cu acțiuni. Solaris CET folosește o buclă în 5 pași (Observă → Gândește → Planifică → Acționează → Verifică) pentru a păstra acțiunile ușor de revizuit; urmele pot fi ancorate prin referințe IPFS/on-chain când e deployat.',
    q9: 'Unde găsesc whitepaper-ul?',
    a9: 'Whitepaper-ul este publicat permanent pe IPFS — imuabil și rezistent la cenzură.',
    q10: 'Cum mă alătur comunității Solaris CET?',
    a10:
      'Intră în comunitatea oficială Telegram pentru noutăți și dialog cu echipa. Codul sursă este deschis pe GitHub.',
    q11: 'Cum se compară Solaris CET cu Fetch.ai, Bittensor și SingularityNET?',
    a11:
      'CET are o ofertă fixă de 9.000 (multe proiecte concurente sunt la milioane/miliarde). CET rulează pe TON (L1 fragmentat). Site-ul include o experiență de tip agent-mesh (simulat) pentru răspunsuri structurate, iar rutarea multi-model poate fi activată când e deployat. CET este ancorat într-o narațiune RWA în România (Cetățuia).',
    q12: 'Ce este cadrul BRAID?',
    a12:
      'BRAID serializează căile de raționament ca grafuri Mermaid pe IPFS și le ancorează în fiecare tranzacție CET, pentru audit ulterior.',
    q13: 'Care sunt fazele protocolului RAV?',
    a13:
      'RAV = Reason · Act · Verify. REASON: descompune obiectivul în sub-obiective folosind un graf de raționament. ACT: execută planul (on-chain/off-chain). VERIFY: verifică rezultatul vs. fapte on-chain și așteptări. Urmele pot fi stocate pe IPFS și referențiate pentru audit.',
    q14: 'Ce este constrângerea Zero-Battery?',
    a14:
      'Minarea CET este proiectată pentru consum aproape nul de baterie pe mobil. Spre deosebire de minarea tip Bitcoin, Zero-Battery limitează CPU la nivel de fundal, fără încălzire vizibilă sau uzură de baterie.',
    linkWhitepaper: 'Deschide whitepaper pe IPFS ↗',
    linkTelegram: 'Intră pe Telegram ↗',
    linkGithub: 'Vezi pe GitHub ↗',
    linkComparison: 'Comparație completă ↗',
  },
  pt: {
    headingBadge: 'FAQ',
    titleBefore: 'Perguntas frequentes',
    titleHighlight: 'Respondidas',
    subtitle:
      'O essencial sobre Solaris CET: tokenomics e arquitetura técnica.',
    q1: 'O que é Solaris CET?',
    a1:
      `Solaris CET (CET) é um token RWA hiper-escasso na blockchain TON com oferta fixa de ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Liga agentes de IA à execução on-chain via framework BRAID e protocolo RAV, ancorado na infraestrutura agrícola e de IA de Cetățuia, Romênia.`,
    q2: 'Qual é o fornecimento total de CET?',
    a2:
      `O fornecimento total é fixo em ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET — permanentemente. Sem mint, sem chaves de admin, sem inflação. Cada token = 0,011% do fornecimento global.`,
    q3: 'Como compro CET?',
    a3:
      `O CET negocia na DeDust na rede TON. Ligue uma carteira TON (Tonkeeper recomendado), carregue TON e troque TON → CET no pool oficial. Verifique o endereço do contrato: ${CET_CONTRACT_ADDRESS}`,
    q4: 'O contrato inteligente foi auditado?',
    a4:
      'Sim. O contrato CET foi auditado pela Cyberscope sem achados críticos. A equipa concluiu KYC e o projeto está na Freshcoins. O relatório completo está ligado no whitepaper.',
    q5: 'Como funciona a mineração de CET?',
    a5:
      '66,66% do fornecimento BTC-S entra em circulação via PoW ao longo de 90 anos com curva decrescente — modelo semelhante ao halving do Bitcoin. A restrição Zero-Battery mantém o consumo de bateria próximo de zero.',
    q6: 'O que é o mecanismo DCBM?',
    a6:
      'O DCBM usa controladores PID para recompras autónomas quando o preço se desvia da faixa-alvo. Reduz a volatilidade até cerca de 66% sem intervenção manual.',
    q7: 'Em que blockchain o CET funciona?',
    a7:
      'O CET está na mainnet TON (The Open Network) — uma das L1 mais rápidas, com ~100.000 TPS e finalidade em ~2 segundos. A arquitetura shardada permite grande escalabilidade.',
    q8: 'O que é o protocolo ReAct?',
    a8:
      'ReAct (raciocínio + ação) é o padrão on-chain de raciocínio de IA da Solaris CET. Cada ação segue: Observar → Pensar → Planear → Agir → Verificar. Os traços ficam ancorados on-chain.',
    q9: 'Onde encontro o whitepaper?',
    a9: 'O whitepaper está publicado permanentemente no IPFS — imutável e resistente à censura.',
    q10: 'Como entro na comunidade Solaris CET?',
    a10:
      'Junte-se ao Telegram oficial para notícias e contacto com a equipa. O código-fonte está aberto no GitHub.',
    q11: 'Como a Solaris CET se compara a Fetch.ai, Bittensor e SingularityNET?',
    a11:
      'O CET tem 9.000 de fornecimento total contra milhões de milhões nos rivais. A TON oferece 100.000 TPS. O CET opera ~200.000 agentes autónomos. Só o CET usa Grok × Gemini em dual-AI. Só o CET é lastreado por ativos agrícolas reais na Roménia.',
    q12: 'O que é o framework BRAID?',
    a12:
      'O BRAID serializa caminhos de raciocínio como grafos Mermaid no IPFS e ancora em cada transação CET para auditoria posterior.',
    q13: 'Quais são as fases do protocolo RAV?',
    a13:
      'RAV = Reason · Act · Verify. REASON: Gemini decompõe objetivos. ACT: Grok executa e gera transações TON. VERIFY: modelo independente revê a ação. Tudo imutável no IPFS.',
    q14: 'O que é a restrição Zero-Battery?',
    a14:
      'A mineração CET visa consumo de bateria quase nulo em telemóveis, limitando a CPU a níveis de segundo plano, sem aquecer o aparelho de forma significativa.',
    linkWhitepaper: 'Abrir whitepaper no IPFS ↗',
    linkTelegram: 'Entrar no Telegram ↗',
    linkGithub: 'Ver no GitHub ↗',
    linkComparison: 'Comparação completa ↗',
  },
  de: {
    headingBadge: 'FAQ',
    titleBefore: 'Häufige Fragen',
    titleHighlight: 'beantwortet',
    subtitle:
      'Alles Wichtige zu Solaris CET: Tokenökonomie und technische Architektur.',
    q1: 'Was ist Solaris CET?',
    a1:
      `Solaris CET (CET) ist ein hyper-seltener RWA-Token auf TON mit festem Angebot von ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET. Es verbindet KI-Agenten mit On-Chain-Ausführung über BRAID und RAV, verankert in der Agrar- und KI-Infrastruktur von Cetățuia, Rumänien.`,
    q2: 'Wie hoch ist das Gesamtangebot von CET?',
    a2:
      `Das Gesamtangebot ist dauerhaft auf ${TOKEN_TOTAL_SUPPLY.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET fixiert. Kein Minting, keine Admin-Keys, keine Inflation. Jeder Token entspricht 0,011% des globalen Angebots.`,
    q3: 'Wie kaufe ich CET?',
    a3:
      `CET wird auf DeDust im TON-Netz gehandelt. Verbinden Sie eine TON-Wallet (empfohlen: Tonkeeper), laden Sie TON auf und tauschen Sie im offiziellen Pool TON → CET. Vertragsadresse prüfen: ${CET_CONTRACT_ADDRESS}`,
    q4: 'Ist der Smart Contract auditiert?',
    a4:
      'Ja. Der CET-Vertrag wurde von Cyberscope vollständig auditiert, ohne kritische Befunde. Das Team hat KYC abgeschlossen, das Projekt ist bei Freshcoins gelistet. Der Bericht ist im Whitepaper verlinkt.',
    q5: 'Wie funktioniert CET-Mining?',
    a5:
      '66,66% des BTC-S-Angebots gelangt über 90 Jahre per Proof-of-Work mit fallender Kurve in Umlauf — ähnlich wie Bitcoin-Halving. Die Zero-Battery-Beschränkung hält den Akkuverbrauch nahe null.',
    q6: 'Was ist der DCBM-Mechanismus?',
    a6:
      'DCBM nutzt PID-Regler für autonome Rückkäufe bei Preisabweichung. Die Volatilität kann um bis zu ~66% sinken — ohne manuellen Eingriff.',
    q7: 'Auf welcher Blockchain läuft CET?',
    a7:
      'CET ist auf dem TON-Mainnet (The Open Network) deployed — eine der schnellsten L1 mit ~100.000 TPS und ~2 s Finalität. Sharding ermöglicht hohe Skalierbarkeit.',
    q8: 'Was ist das ReAct-Protokoll?',
    a8:
      'ReAct (Reasoning + Acting) ist Solaris CETs On-Chain-KI-Standard. Jede Agentenaktion: Beobachten → Denken → Planen → Handeln → Verifizieren. Reasoning-Spuren werden on-chain verankert.',
    q9: 'Wo finde ich das Whitepaper?',
    a9: 'Das Whitepaper ist dauerhaft auf IPFS veröffentlicht — unveränderlich und zensurresistent.',
    q10: 'Wie trete ich der Community bei?',
    a10:
      'Offizieller Telegram-Kanal für News und Kontakt zum Team. Der Quellcode ist auf GitHub offen.',
    q11: 'Wie schneidet Solaris CET gegen Fetch.ai, Bittensor und SingularityNET ab?',
    a11:
      'CET hat 9.000 Gesamtangebot gegen Milliarden bei Wettbewerbern. TON liefert 100.000 TPS. CET betreibt ~200.000 autonome Agenten. Nur CET nutzt gleichzeitig Grok × Gemini. Nur CET ist an reale Landwirtschaft in Rumänien gebunden.',
    q12: 'Was ist das BRAID-Framework?',
    a12:
      'BRAID serialisiert Reasoning-Pfade als Mermaid-Graphen auf IPFS und verankert sie in jeder CET-Transaktion — vollständig nachvollziehbar.',
    q13: 'Welche Phasen hat das RAV-Protokoll?',
    a13:
      'RAV = Reason · Act · Verify. REASON: Gemini zerlegt Ziele. ACT: Grok führt aus und erzeugt TON-Transaktionen. VERIFY: unabhängiges Modell prüft die Spur. Alles unveränderlich auf IPFS.',
    q14: 'Was ist die Zero-Battery-Beschränkung?',
    a14:
      'CET-Mining soll auf Mobilgeräten praktisch keinen Akku verbrauchen — CPU nahe Leerlauf, ohne spürbare Erwärmung.',
    linkWhitepaper: 'Whitepaper auf IPFS öffnen ↗',
    linkTelegram: 'Telegram beitreten ↗',
    linkGithub: 'Auf GitHub ansehen ↗',
    linkComparison: 'Vollständiger Vergleich ↗',
  },
};
