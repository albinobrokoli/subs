/**
 * Resolve a subscription/service name to a local brand icon asset.
 * Icons: Simple Icons SVG (80) + Google favicon PNG (109+) = 189 total.
 */
import manifest from '../assets/service-icons/manifest.json'

const modules = import.meta.glob('../assets/service-icons/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const urlByFile: Record<string, string> = {}
for (const [p, url] of Object.entries(modules)) {
  const file = p.split('/').pop()!
  urlByFile[file] = url
}

export type ResolvedIcon = { key: string; url: string; kind: 'svg' | 'png' }

const ALIASES: Array<[RegExp | string, string]> = [
  // AI
  [/chatgpt|chat\s*gpt|openai/i, 'openai'],
  [/github\s*copilot|copilot/i, 'githubcopilot'],
  [/google\s*ai|gemini|bard/i, 'googlegemini'],
  [/perplexity/i, 'perplexity'],
  [/claude|anthropic/i, 'anthropic'],
  [/grok|\bx\.?\s*ai\b|xai/i, 'xai'],
  [/midjourney/i, 'midjourney'],
  [/cursor/i, 'cursor'],
  [/openrouter/i, 'openrouter'],
  [/z\.?ai|zhipu|glm/i, 'zhipu'],
  [/volcengine|byteplus/i, 'volcengine'],
  [/xiaomi|mimo/i, 'xiaomi'],
  [/cohere/i, 'cohere'],
  [/mistral/i, 'mistral'],
  [/stability|stable\s*diffusion/i, 'stabilityai'],
  [/replicate/i, 'replicate'],
  [/hugging\s*face|hf/i, 'huggingface'],
  [/quillbot/i, 'quillbot'],

  // Apple
  [/apple\s*tv/i, 'appletv'],
  [/apple\s*music/i, 'applemusic'],
  [/apple\s*podcast/i, 'applepodcasts'],
  [/apple\s*pay/i, 'applepay'],
  [/icloud/i, 'icloud'],
  [/developer\s*program|apple\s*developer/i, 'apple_developer'],
  [/app\s*store/i, 'appstore'],
  [/\bitunes\b/i, 'itunes'],
  [/\bapple\b/i, 'apple'],

  // Cloud / dev
  [/digital\s*ocean/i, 'digitalocean'],
  [/github(?!copilot)/i, 'github'],
  [/gitlab/i, 'gitlab'],
  [/bitbucket/i, 'bitbucket'],
  [/docker/i, 'docker'],
  [/kubernetes|k8s/i, 'kubernetes'],
  [/npm\b/i, 'npm'],
  [/vercel/i, 'vercel'],
  [/cloudflare/i, 'cloudflare'],
  [/railway/i, 'railway'],
  [/fly\.io|flyio/i, 'flyio'],
  [/render\b/i, 'render'],
  [/netlify/i, 'netlify'],
  [/heroku/i, 'heroku'],
  [/supabase/i, 'supabase'],
  [/jetbrains|intellij|webstorm|pycharm/i, 'jetbrains'],
  [/linear\b/i, 'linear'],
  [/figma/i, 'figma'],
  [/notion/i, 'notion'],
  [/obsidian/i, 'obsidian'],
  [/raycast/i, 'raycast'],
  [/alfred/i, 'alfred'],
  [/setapp/i, 'setapp'],

  // Productivity
  [/microsoft\s*365|office\s*365|\boffice\b/i, 'office'],
  [/onedrive/i, 'onedrive'],
  [/outlook/i, 'outlook'],
  [/teams\b/i, 'teams'],
  [/microsoft/i, 'microsoft'],
  [/adobe|creative\s*cloud|photoshop/i, 'adobe'],
  [/canva/i, 'canva'],
  [/dropbox/i, 'dropbox'],
  [/box\b|box\.com/i, 'box'],
  [/mega\b|mega\.nz/i, 'mega'],
  [/pcloud/i, 'pcloud'],
  [/evernote/i, 'evernote'],
  [/todoist/i, 'todoist'],
  [/ticktick/i, 'ticktick'],
  [/asana/i, 'asana'],
  [/trello/i, 'trello'],
  [/monday\.com|monday\b/i, 'monday'],
  [/clickup/i, 'clickup'],
  [/things\b/i, 'things'],
  [/fantastical/i, 'fantastical'],
  [/craft\b/i, 'craft'],
  [/bear\b(?!.*dicebear)/i, 'bear'],
  [/grammarly/i, 'grammarly'],
  [/zoom/i, 'zoom'],
  [/slack/i, 'slack'],
  [/discord/i, 'discord'],
  [/linkedin/i, 'linkedin'],
  [/jira/i, 'jira'],
  [/confluence/i, 'confluence'],
  [/bitly/i, 'bitly'],

  // Streaming / media
  [/netflix/i, 'netflix'],
  [/spotify/i, 'spotify'],
  [/youtube\s*premium|youtube/i, 'youtube'],
  [/disney\+?|disneyplus/i, 'disneyplus'],
  [/hulu/i, 'hulu'],
  [/hbo|hbomax/i, 'hbomax'],
  [/paramount/i, 'paramount'],
  [/peacock/i, 'peacock'],
  [/crunchyroll/i, 'crunchyroll'],
  [/funimation/i, 'funimation'],
  [/mubi/i, 'mubi'],
  [/prime\s*video|amazon\s*prime/i, 'amazonprime'],
  [/amazon(?!.*prime)/i, 'amazon'],
  [/tidal/i, 'tidal'],
  [/soundcloud/i, 'soundcloud'],
  [/deezer/i, 'deezer'],
  [/bandcamp/i, 'bandcamp'],
  [/pandora/i, 'pandora'],
  [/twitch/i, 'twitch'],
  [/patreon/i, 'patreon'],
  [/onlyfans/i, 'onlyfans'],
  [/substack/i, 'substack'],
  [/medium/i, 'medium'],
  [/nytimes|new\s*york\s*times/i, 'nytimes'],

  // Gaming
  [/playstation|ps\s?plus|psn/i, 'playstation'],
  [/xbox\s*game\s*pass|xbox/i, 'xbox'],
  [/nintendo|switch\s*online/i, 'nintendo'],
  [/steam/i, 'steam'],
  [/epic\s*games|epicgames/i, 'epicgames'],
  [/\bea\b|ea\s*play/i, 'ea'],
  [/ubisoft|ubi\+/i, 'ubisoft'],
  [/gog\b/i, 'gog'],
  [/itch\.io|itch\b/i, 'itch'],
  [/riot\s*games|riot/i, 'riotgames'],
  [/blizzard/i, 'blizzard'],
  [/bethesda/i, 'bethesda'],

  // Social
  [/\bx\b|twitter|premium\+/i, 'x'],
  [/instagram/i, 'instagram'],
  [/tiktok/i, 'tiktok'],
  [/telegram/i, 'telegram'],
  [/whatsapp/i, 'whatsapp'],
  [/reddit/i, 'reddit'],
  [/threads/i, 'threads'],
  [/bluesky/i, 'bluesky'],
  [/mastodon/i, 'mastodon'],
  [/signal/i, 'signal'],
  [/viber/i, 'viber'],
  [/line\b/i, 'line'],

  // Travel / telecom
  [/uber(?!.*eats)/i, 'uber'],
  [/airbnb/i, 'airbnb'],
  [/amaysim/i, 'amaysim'],
  [/clubsim|club\s*sim/i, 'clubsim'],
  [/felix/i, 'felix'],

  // Security / health
  [/1password|onepassword/i, '1password'],
  [/lastpass/i, 'lastpass'],
  [/bitwarden/i, 'bitwarden'],
  [/proton\s*mail|protonmail/i, 'protonmail'],
  [/proton\s*vpn|protonvpn/i, 'protonvpn'],
  [/tunnelbear/i, 'tunnelbear'],
  [/dashlane/i, 'dashlane'],
  [/keeper/i, 'keepersecurity'],
  [/nordvpn/i, 'nordvpn'],
  [/expressvpn/i, 'expressvpn'],
  [/surfshark/i, 'surfshark'],
  [/mullvad/i, 'mullvad'],
  [/windscribe/i, 'windscribe'],
  [/headspace/i, 'headspace'],
  [/calm/i, 'calm'],
  [/strava/i, 'strava'],
  [/fitbit/i, 'fitbit'],
  [/nike|nrc|ntc/i, 'nike'],
  [/peloton/i, 'peloton'],
  [/whoop/i, 'whoop'],
  [/myfitnesspal/i, 'myfitnesspal'],
  [/noom/i, 'noom'],

  // Finance
  [/paypal/i, 'paypal'],
  [/revolut/i, 'revolut'],
  [/\bn26\b/i, 'n26'],
  [/wise\b/i, 'wise'],
  [/stripe/i, 'stripe'],
  [/coinbase/i, 'coinbase'],
  [/binance/i, 'binance'],
  [/kraken/i, 'kraken'],

  // Learning
  [/duolingo/i, 'duolingo'],
  [/udemy/i, 'udemy'],
  [/coursera/i, 'coursera'],
  [/skillshare/i, 'skillshare'],
  [/masterclass/i, 'masterclass'],
  [/khan\s*academy/i, 'khanacademy'],
  [/pluralsight/i, 'pluralsight'],

  // Food / delivery
  [/doordash/i, 'doordash'],
  [/uber\s*eats/i, 'ubereats'],
  [/grubhub/i, 'grubhub'],
  [/instacart/i, 'instacart'],

  // Turkish / local
  [/trendyol/i, 'trendyol'],
  [/hepsiburada|hepsipay/i, 'hepsiburada'],
  [/getir|yemeksepeti|banabi/i, 'getir'],
  [/yemeksepeti/i, 'yemeksepeti'],
  [/turkcell/i, 'turkcell'],
  [/türk\\s*telekom|turktelekom/i, 'türktelekom'],
  [/superonline/i, 'superonline'],
  [/vodafone/i, 'vodafone'],
  [/turknet|millenicom/i, 'turknet'],
  [/migros/i, 'migros'],
  [/carrefour/i, 'carrefoursa'],
  [/a101|şok\\s*market|sokmarket/i, 'a101'],
  [/teknosa/i, 'teknosa'],
  [/mediamarkt/i, 'mediamarkt'],
  [/boyner/i, 'boyner'],
  [/defacto/i, 'defacto'],
  [/mavi\\s*giyim|lc\\s*waikiki|lcwaikiki/i, 'mavi'],
  [/koton/i, 'koton'],
  [/arçelik|arcelik/i, 'arçelik'],
  [/vestel/i, 'vestel'],
  [/beko/i, 'beko'],
  [/sahibinden/i, 'sahibinden'],
  [/garanti|garantibbva/i, 'garanti'],
  [/iş\\s*bankası|isbank|ziraat/i, 'isbank'],
  [/akbank/i, 'akbank'],
  [/yapı\\s*kredi|yapikredi/i, 'yapikredi'],
  [/denizbank/i, 'denizbank'],
  [/qnbfinans|qnbfinansbank/i, 'qnbfinansbank'],
  [/ptt(?!.*avm)|pttavm/i, 'pttavm'],
  [/trt/i, 'trt'],
  [/ekşi/i, 'eksiduyuru'],
  [/donanım\\s*haber|donanimhaber/i, 'donanimhaber'],
  [/shiftdelete/i, 'shiftdelete'],
  [/papara/i, 'papara'],
  [/ininal/i, 'ininal'],
  [/param(?!.*ount|.*ounts)/i, 'param'],
  [/hürriyet|hurriyet/i, 'hurriyet'],
  [/sabah/i, 'sabah'],
  [/milliyet/i, 'milliyet'],
  [/cnnturk/i, 'cnnturk'],
  [/exxen/i, 'exxen'],
  [/blu\\s*tv|blutv/i, 'blutv'],
  [/puhu\\s*tv|puhutv/i, 'puhutv'],
  [/tabii/i, 'tabii'],
  [/tivibu/i, 'tivibu'],
  [/digiturk|bein\\s*sports/i, 'digiturk'],
  [/watsons/i, 'watsons'],
  [/gratis/i, 'gratis'],
  [/rossmann/i, 'rossmann'],
  [/macrocenter|makro/i, 'macrocenter'],
  [/istanbul\\s*kart/i, 'istanbulkart'],
  [/biletix/i, 'biletix'],
  [/passolig/i, 'passolig'],
  [/toyzz/i, 'toyzzshop'],
  [/joker/i, 'joker'],
  [/ebebek/i, 'ebebek'],
  [/bim(?!.*boom)/i, 'bim'],
  [/n11|n\\s*11/i, 'n11'],
  [/gitti\\s*gi\\s*di\\s*yor/i, 'gittigidiyor'],
  [/paycell/i, 'paycell'],
  [/türk\\s*hava\\s*yolları|turkishairlines|thy/i, 'turkishairlines'],
  [/pegasus/i, 'pegasus'],
  [/sun\\s*express/i, 'sunexpress'],
  [/anadolu\\s*jet|anadolujet/i, 'anadolujet'],

  // Others
  [/bytedance|douyin/i, 'bytedance'],
]

function normalize(name: string) {
  return (name || '').trim().toLowerCase()
}

export function resolveIconKey(name: string): string | null {
  const n = normalize(name)
  if (!n) return null
  if ((manifest as any)[n]) return n
  for (const [pattern, key] of ALIASES) {
    if (typeof pattern === 'string') {
      if (n.includes(pattern)) return key
    } else if (pattern.test(name) || pattern.test(n)) {
      return key
    }
  }
  const slug = n.replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '')
  if ((manifest as any)[slug]) return slug
  return null
}

export function resolveServiceIcon(name: string): ResolvedIcon | null {
  const key = resolveIconKey(name)
  if (!key) return null
  const meta = (manifest as any)[key]
  if (!meta?.file) return null
  const url = urlByFile[meta.file]
  if (!url) return null
  return { key, url, kind: meta.kind === 'svg' ? 'svg' : 'png' }
}

export function getAllIcons(): Array<{ key: string; name: string; url: string; kind: string }> {
  const out: Array<{ key: string; name: string; url: string; kind: string }> = []
  for (const [key, meta] of Object.entries(manifest as Record<string, any>)) {
    const url = urlByFile[meta.file]
    if (!url) continue
    out.push({ key, name: key.replace(/_/g, ' '), url, kind: meta.kind || 'png' })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export function searchIcons(query: string, limit = 8): Array<{ key: string; name: string; url: string; kind: string }> {
  const q = (query || '').trim().toLowerCase()
  const all = getAllIcons()
  if (!q) return all.slice(0, limit)
  const scored = all
    .map((icon) => {
      const name = icon.name.toLowerCase()
      let score = 0
      if (name === q) score = 100
      else if (name.startsWith(q)) score = 80
      else if (name.includes(q)) score = 60
      // Turkish char normalization for fuzzy match
      const norm = (s: string) => s.replace(/ı/g, 'i').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
      if (norm(name).includes(norm(q))) score = Math.max(score, 50)
      return { icon, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.icon)
}
