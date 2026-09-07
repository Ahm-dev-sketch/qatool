import 'dotenv/config';

export interface EnvConfig {
  baseUrl: string;
}

function loadEnv(): EnvConfig {
  return {
    baseUrl: process.env.API_BASE_URL ?? "https://reqres.in",
  };
}

export const env = loadEnv();
