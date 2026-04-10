/// <reference types="vite/client" />

// AppKit web components
declare namespace JSX {
  interface IntrinsicElements {
    "w3m-button": {
      size?: "sm" | "md";
      label?: string;
      loadingLabel?: string;
      balance?: "show" | "hide";
    };
    "w3m-account-button": {
      balance?: "show" | "hide";
    };
    "w3m-connect-button": {
      size?: "sm" | "md";
      label?: string;
    };
    "w3m-network-button": Record<string, unknown>;
  }
}

// Env variables
interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_DEFAULT_SIGNER_ADDRESS?: string;
  readonly VITE_AI_GOVERNANCE_URL?: string;
  readonly VITE_AI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
