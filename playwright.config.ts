import { defineConfig } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/checkout',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
