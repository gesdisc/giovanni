import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

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

async function globalSetup() {
  if (await isReachable(UAT_URL)) {
    process.env.GIOVANNI_BASE_URL = UAT_URL
    console.log(`\n[setup] Using UAT: ${UAT_URL}`)
    return
  }

  console.log(`\n[setup] UAT unavailable — falling back to local dev server: ${LOCAL_URL}`)
  process.env.GIOVANNI_BASE_URL = LOCAL_URL

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
