export type LangCode = 'en' | 'es' | 'zh' | 'ru';

export interface Translations {
  nav: {
    home: string;
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
    },
    tokenomics: {
      title: 'Токеномика',
      supply: 'Общий запас',
      poolAddress: 'Адрес пула DeDust',
    },
  },
};

export default translations;
