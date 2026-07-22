export type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  RATE_LIMIT_KV: KVNamespace;

  ENVIRONMENT: 'production' | 'staging' | 'development';
  PUBLIC_SITE_URL: string;
  CORS_ALLOWED_ORIGIN: string;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ADMIN_SESSION_PEPPER: string;
};

export type Variables = {
  requestId: string;
  authUser?: {
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'editor' | 'support';
    permissions: string[];
  };
};

export type AppContext = {
  Bindings: Env;
  Variables: Variables;
};
