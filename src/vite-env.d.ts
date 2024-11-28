/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TON_PAYMENTS_API_URL: string
}

// Add support for process.env
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly VITE_TON_PAYMENTS_API_URL: string
        }
    }
} 