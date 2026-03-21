export type LangCode = 'en' | 'es' | 'zh' | 'ru' | 'ro' | 'pt';

export interface Translations {
  nav: {
    home: string;
    cetApp: string;
    tokenomics: string;
    roadmap: string;
    howToBuy: string;
    whitepaper: string;
    resources: string;
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
}

const translations: Record<LangCode, Translations> = {
  en: {
    nav: {
      home: 'Home',
      cetApp: 'CET App',
      tokenomics: 'Tokenomics',
      roadmap: 'Roadmap',
      howToBuy: 'How to Buy',
      whitepaper: 'Whitepaper',
      resources: 'Resources',
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
  },
  es: {
    nav: {
      home: 'Inicio',
      cetApp: 'App CET',
      tokenomics: 'Tokenómica',
      roadmap: 'Hoja de Ruta',
      howToBuy: 'Cómo Comprar',
      whitepaper: 'Libro Blanco',
      resources: 'Recursos',
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
  },
  zh: {
    nav: {
      home: '首页',
      cetApp: 'CET 应用',
      tokenomics: '代币经济学',
      roadmap: '路线图',
      howToBuy: '如何购买',
      whitepaper: '白皮书',
      resources: '资源',
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
  },
  ru: {
    nav: {
      home: 'Главная',
      cetApp: 'Приложение CET',
      tokenomics: 'Токеномика',
      roadmap: 'Дорожная карта',
      howToBuy: 'Как купить',
      whitepaper: 'Белая книга',
      resources: 'Ресурсы',
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
  },
  ro: {
    nav: {
      home: 'Acasă',
      cetApp: 'Aplicație CET',
      tokenomics: 'Tokenomică',
      roadmap: 'Foaie de Parcurs',
      howToBuy: 'Cum să Cumperi',
      whitepaper: 'Whitepaper',
      resources: 'Resurse',
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
  },
  pt: {
    nav: {
      home: 'Início',
      cetApp: 'App CET',
      tokenomics: 'Tokenomia',
      roadmap: 'Roteiro',
      howToBuy: 'Como Comprar',
      whitepaper: 'White Paper',
      resources: 'Recursos',
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
  },
};

export default translations;
