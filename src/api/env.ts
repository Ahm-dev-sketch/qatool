import 'dotenv/config';

/**
 * Environment config for API tests.
 * BASE_URL can be overridden per-environment via .env files.
 *
 * Usage in test files:
 *   import { env } from "../src/api/env.js";
 *   const url = `${env.baseUrl}/api/users`;
 */

export interface EnvConfig {
  baseUrl: string;
}

function loadEnv(): EnvConfig {
  return {
    baseUrl: process.env.API_BASE_URL ?? "https://reqres.in",
  };
}

export const env = loadEnv();