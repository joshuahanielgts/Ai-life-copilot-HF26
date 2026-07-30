/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_VAPI_PUBLIC_KEY: string;
  readonly VITE_VAPI_ASSISTANT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
