#!/usr/bin/env node
/**
 * Download brand logos for services not covered (or poorly covered) by simple-icons.
 * Sources: Simple Icons CDN where available, Clearbit Logo API otherwise.
 */
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'
import * as simpleIcons from 'simple-icons'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../src/renderer/src/assets/service-icons')
fs.mkdirSync(outDir, { recursive: true })

// slug or domain based catalog — keys become filename stem
const CATALOG = {
  // simple-icons slugs (prefer these)
  github: { type: 'si', slug: 'github' },
  githubcopilot: { type: 'si', slug: 'githubcopilot' },
  google: { type: 'si', slug: 'google' },
  googlegemini: { type: 'si', slug: 'googlegemini' },
  perplexity: { type: 'si', slug: 'perplexity' },
  x: { type: 'si', slug: 'x' },
  xiaomi: { type: 'si', slug: 'xiaomi' },
  digitalocean: { type: 'si', slug: 'digitalocean' },
  apple: { type: 'si', slug: 'apple' },
  appletv: { type: 'si', slug: 'appletv' },
  applemusic: { type: 'si', slug: 'applemusic' },
  icloud: { type: 'si', slug: 'icloud' },
  netflix: { type: 'si', slug: 'netflix' },
  spotify: { type: 'si', slug: 'spotify' },
  youtube: { type: 'si', slug: 'youtube' },
  notion: { type: 'si', slug: 'notion' },
  figma: { type: 'si', slug: 'figma' },
  discord: { type: 'si', slug: 'discord' },
  twitch: { type: 'si', slug: 'twitch' },
  dropbox: { type: 'si', slug: 'dropbox' },
  paypal: { type: 'si', slug: 'paypal' },
  revolut: { type: 'si', slug: 'revolut' },
  n26: { type: 'si', slug: 'n26' },
  bytedance: { type: 'si', slug: 'bytedance' },
  anthropic: { type: 'si', slug: 'anthropic' },
  claude: { type: 'si', slug: 'claude' },
  zoom: { type: 'si', slug: 'zoom' },
  telegram: { type: 'si', slug: 'telegram' },
  whatsapp: { type: 'si', slug: 'whatsapp' },
  instagram: { type: 'si', slug: 'instagram' },
  tiktok: { type: 'si', slug: 'tiktok' },
  uber: { type: 'si', slug: 'uber' },
  airbnb: { type: 'si', slug: 'airbnb' },
  vercel: { type: 'si', slug: 'vercel' },
  cloudflare: { type: 'si', slug: 'cloudflare' },
  jetbrains: { type: 'si', slug: 'jetbrains' },
  cursor: { type: 'si', slug: 'cursor' },
  hbo: { type: 'si', slug: 'hbo' },
  paramountplus: { type: 'si', slug: 'paramountplus' },
  crunchyroll: { type: 'si', slug: 'crunchyroll' },
  duolingo: { type: 'si', slug: 'duolingo' },
  evernote: { type: 'si', slug: 'evernote' },
  todoist: { type: 'si', slug: 'todoist' },
  asana: { type: 'si', slug: 'asana' },
  trello: { type: 'si', slug: 'trello' },
  linear: { type: 'si', slug: 'linear' },
  gitlab: { type: 'si', slug: 'gitlab' },
  bitbucket: { type: 'si', slug: 'bitbucket' },
  docker: { type: 'si', slug: 'docker' },
  patreon: { type: 'si', slug: 'patreon' },
  substack: { type: 'si', slug: 'substack' },
  medium: { type: 'si', slug: 'medium' },
  strava: { type: 'si', slug: 'strava' },
  grammarly: { type: 'si', slug: 'grammarly' },
  '1password': { type: 'si', slug: '1password' },
  lastpass: { type: 'si', slug: 'lastpass' },
  bitwarden: { type: 'si', slug: 'bitwarden' },
  nordvpn: { type: 'si', slug: 'nordvpn' },
  expressvpn: { type: 'si', slug: 'expressvpn' },
  surfshark: { type: 'si', slug: 'surfshark' },
  setapp: { type: 'si', slug: 'setapp' },
  raycast: { type: 'si', slug: 'raycast' },
  alfred: { type: 'si', slug: 'alfred' },
  obsidian: { type: 'si', slug: 'obsidian' },
  things: { type: 'si', slug: 'things' },
  ticktick: { type: 'si', slug: 'ticktick' },
  playstation: { type: 'si', slug: 'playstation' },
  steam: { type: 'si', slug: 'steam' },
  epicgames: { type: 'si', slug: 'epicgames' },
  ea: { type: 'si', slug: 'ea' },
  ubisoft: { type: 'si', slug: 'ubisoft' },
  openrouter: { type: 'si', slug: 'openrouter' },
  appstore: { type: 'si', slug: 'appstore' },
  itunes: { type: 'si', slug: 'itunes' },
  applepodcasts: { type: 'si', slug: 'applepodcasts' },
  applepay: { type: 'si', slug: 'applepay' },
  fitbit: { type: 'si', slug: 'fitbit' },
  headspace: { type: 'si', slug: 'headspace' },
  nike: { type: 'si', slug: 'nike' },
  onlyfans: { type: 'si', slug: 'onlyfans' },

  // domains via Clearbit (PNG) — trademarks often missing from simple-icons
  openai: { type: 'clearbit', domain: 'openai.com' },
  microsoft: { type: 'clearbit', domain: 'microsoft.com' },
  adobe: { type: 'clearbit', domain: 'adobe.com' },
  amazon: { type: 'clearbit', domain: 'amazon.com' },
  slack: { type: 'clearbit', domain: 'slack.com' },
  canva: { type: 'clearbit', domain: 'canva.com' },
  disney: { type: 'clearbit', domain: 'disneyplus.com' },
  disneyplus: { type: 'clearbit', domain: 'disneyplus.com' },
  hulu: { type: 'clearbit', domain: 'hulu.com' },
  primevideo: { type: 'clearbit', domain: 'primevideo.com' },
  xbox: { type: 'clearbit', domain: 'xbox.com' },
  nintendo: { type: 'clearbit', domain: 'nintendo.com' },
  midjourney: { type: 'clearbit', domain: 'midjourney.com' },
  xai: { type: 'clearbit', domain: 'x.ai' },
  volcengine: { type: 'clearbit', domain: 'volcengine.com' },
  amaysim: { type: 'clearbit', domain: 'amaysim.com.au' },
  office: { type: 'clearbit', domain: 'office.com' },
  onedrive: { type: 'clearbit', domain: 'onedrive.live.com' },
  outlook: { type: 'clearbit', domain: 'outlook.com' },
  teams: { type: 'clearbit', domain: 'teams.microsoft.com' },
  linkedin: { type: 'clearbit', domain: 'linkedin.com' },
  reddit: { type: 'clearbit', domain: 'reddit.com' },
  nytimes: { type: 'clearbit', domain: 'nytimes.com' },
  calm: { type: 'clearbit', domain: 'calm.com' },
  fantastical: { type: 'clearbit', domain: 'flexibits.com' },
  craft: { type: 'clearbit', domain: 'craft.do' },
  bear: { type: 'clearbit', domain: 'bear.app' },
  railway: { type: 'clearbit', domain: 'railway.app' },
  supabase: { type: 'clearbit', domain: 'supabase.com' },
  zhipu: { type: 'clearbit', domain: 'zhipuai.cn' },
  clubsim: { type: 'clearbit', domain: 'clubsim.com.hk' },
  felix: { type: 'clearbit', domain: 'felixmobile.com.au' },
  chatgpt: { type: 'clearbit', domain: 'chatgpt.com' },
  gemini: { type: 'clearbit', domain: 'gemini.google.com' },
  youtube_premium: { type: 'clearbit', domain: 'youtube.com' },
  apple_developer: { type: 'clearbit', domain: 'developer.apple.com' },
}

function getSi(slug) {
  const key = 'si' + slug
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  // try common export patterns
  if (simpleIcons[key]) return simpleIcons[key]
  // brute
  return Object.values(simpleIcons).find((v) => v && v.slug === slug)
}

function writeSvg(name, icon) {
  const svg = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>${icon.title}</title><path fill="#${icon.hex}" d="${icon.path}"/></svg>`
  fs.writeFileSync(path.join(outDir, `${name}.svg`), svg)
  return { name, hex: icon.hex, file: `${name}.svg`, kind: 'svg' }
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'SublistIconFetcher/1.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuffer(res.headers.location).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        res.resume()
        return
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
    req.setTimeout(15000, () => {
      req.destroy(new Error('timeout'))
    })
  })
}

async function main() {
  const manifest = {}
  let ok = 0
  let fail = 0

  for (const [name, entry] of Object.entries(CATALOG)) {
    try {
      if (entry.type === 'si') {
        const icon = getSi(entry.slug)
        if (!icon) throw new Error(`simple-icons missing ${entry.slug}`)
        const meta = writeSvg(name, icon)
        manifest[name] = meta
        ok++
        process.stdout.write(`✓ si ${name}\n`)
      } else if (entry.type === 'clearbit') {
        const url = `https://logo.clearbit.com/${entry.domain}`
        const buf = await fetchBuffer(url)
        // detect type
        const isPng = buf[0] === 0x89 && buf[1] === 0x50
        const isSvg = buf.slice(0, 200).toString('utf8').includes('<svg')
        const ext = isSvg ? 'svg' : 'png'
        const file = `${name}.${ext}`
        fs.writeFileSync(path.join(outDir, file), buf)
        manifest[name] = { name, file, kind: ext, domain: entry.domain }
        ok++
        process.stdout.write(`✓ clearbit ${name} (${ext}, ${buf.length}b)\n`)
      }
    } catch (e) {
      fail++
      process.stdout.write(`✗ ${name}: ${e.message}\n`)
    }
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\nDone: ${ok} ok, ${fail} fail → ${outDir}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
