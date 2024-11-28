/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TON_PAYMENTS_API_URL: string
    readonly VITE_TON_PAYMENTS_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_TON_PAYMENTS_API_URL?: string
        REACT_APP_TON_PAYMENTS_API_URL?: string
    }
} 