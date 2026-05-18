import { spawn } from 'child_process'
import * as readline from 'readline/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const PROD_URL = 'https://giovanni.earthdata.nasa.gov'
const UAT_URL = 'https://giovanni.uat.earthdata.gov'
const LOCAL_URL = 'http://127.0.0.1:5173'

async function isReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    // Accept any non-5xx response — a redirect or 401 still means the server is up
    return response.status < 500
  } catch {
    return false
  }
}

const ENVS: Record<string, string> = {
  prod: PROD_URL,
  uat: UAT_URL,
  local: LOCAL_URL,
}

async function promptEnv(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    while (true) {
      const answer = await rl.question(
        '\nWhich Giovanni environment would you like to test?\n' +
          '  [1] prod  — https://giovanni.earthdata.nasa.gov\n' +
          '  [2] uat   — https://giovanni.uat.earthdata.gov\n' +
          '  [3] local — http://127.0.0.1:5173\n' +
          'Enter 1, 2, 3, or the name: ',
      )
      const map: Record<string, string> = { '1': 'prod', '2': 'uat', '3': 'local' }
      const key = map[answer.trim()] ?? answer.trim().toLowerCase()
      if (key in ENVS) return key
      console.log(`  Invalid choice "${answer.trim()}" — please enter 1, 2, 3, prod, uat, or local.`)
    }
  } finally {
    rl.close()
  }
}

async function globalSetup() {
  let envKey = (process.env.TEST_ENV ?? '').toLowerCase()

  if (!envKey || !(envKey in ENVS)) {
    envKey = await promptEnv()
  }

  const targetUrl = ENVS[envKey]
  process.env.GIOVANNI_BASE_URL = targetUrl
  console.log(`\n[setup] TEST_ENV=${envKey} — targeting: ${targetUrl}`)

  if (envKey !== 'local') {
    if (!(await isReachable(targetUrl))) {
      throw new Error(`[setup] ${targetUrl} is not reachable. Check your network or VPN.`)
    }
    return
  }

  if (await isReachable(LOCAL_URL)) {
    console.log('[setup] Local dev server already running — reusing it.')
    return
  }

  console.log('[setup] Starting local dev server (npm run dev)…')
  const root = path.dirname(fileURLToPath(import.meta.url))
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    shell: true,
  })
  devServer.unref()

  // Wait up to 30 s for Vite to come up
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000))
    if (await isReachable(LOCAL_URL)) {
      console.log('[setup] Local dev server is up.')
      return
    }
  }

  throw new Error('[setup] Local dev server did not start within 30 s.')
}

export default globalSetup
