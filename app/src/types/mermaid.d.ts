declare module 'mermaid' {
  type MermaidInitConfig = {
    startOnLoad?: boolean;
    securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox' | string;
    theme?: 'default' | 'dark' | 'neutral' | 'forest' | 'base' | string;
  };

  type MermaidRenderResult = { svg: string; bindFunctions?: (element: Element) => void };

  export type Mermaid = {
    initialize: (config: MermaidInitConfig) => void;
    render: (id: string, text: string) => Promise<MermaidRenderResult>;
  };

  const mermaid: Mermaid;
  export default mermaid;
}

