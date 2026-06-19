import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { TwitterApi } from 'twitter-api-v2'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const TWEETS_PATH = path.join(__dirname, 'tweets.json')
const STATE_PATH = path.join(__dirname, 'posted.json')
const MAX_LEN = 280

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

function expandTweet(text) {
  const vars = {
    '{WEBSITE}': process.env.WEBSITE_URL ?? '',
    '{TELEGRAM}': process.env.TELEGRAM_URL ?? 'https://t.me/NULL_COIN',
    '{NULL_MINT}': process.env.NULL_MINT ?? '0xc27E4564dC31e9d435CEeedf77cb7B5258C49F6F',
    '{NULL_TOKEN}': process.env.NULL_TOKEN ?? '0xE1Ef5457eD3775DE642aB039685fA28b01ad5CD9',
    '{ETHERSCAN}': process.env.ETHERSCAN_NULL_MINT ?? 'https://etherscan.io/address/0xc27E4564dC31e9d435CEeedf77cb7B5258C49F6F',
  }
  let out = text
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(key, value)
  }
  return out.trim()
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} in marketing/twitter/.env`)
  return value
}

function createClient() {
  return new TwitterApi({
    appKey: requireEnv('X_API_KEY'),
    appSecret: requireEnv('X_API_SECRET'),
    accessToken: requireEnv('X_ACCESS_TOKEN'),
    accessSecret: requireEnv('X_ACCESS_TOKEN_SECRET'),
  })
}

function pickTweet(tweets, state, mode) {
  const posted = new Set(state.postedIds ?? [])
  const queue = tweets.filter((t) => !posted.has(t.id))
  if (queue.length === 0) {
    console.log('All tweets posted once. Reset posted.json to repeat the queue.')
    process.exit(0)
  }
  if (mode === 'random') {
    return queue[Math.floor(Math.random() * queue.length)]
  }
  return queue[0]
}

function usage() {
  console.log(`Usage:
  node post.mjs --dry-run [--next|--random]   Preview next tweet
  node post.mjs --next                        Post next unposted tweet
  node post.mjs --random                      Post random unposted tweet
  node post.mjs --list                        List tweet queue
`)
}

async function main() {
  const args = new Set(process.argv.slice(2))
  if (args.has('--help') || args.has('-h')) {
    usage()
    return
  }

  const tweets = loadJson(TWEETS_PATH, [])
  if (!tweets.length) throw new Error('tweets.json is empty')

  if (args.has('--list')) {
    const state = loadJson(STATE_PATH, { postedIds: [] })
    const posted = new Set(state.postedIds ?? [])
    for (const t of tweets) {
      console.log(`${posted.has(t.id) ? '[x]' : '[ ]'} ${t.id} (${t.text.length} chars)`)
    }
    return
  }

  const mode = args.has('--random') ? 'random' : 'next'
  const state = loadJson(STATE_PATH, { postedIds: [], history: [] })
  const tweet = pickTweet(tweets, state, mode)
  const text = expandTweet(tweet.text)

  if (text.length > MAX_LEN) {
    throw new Error(`Tweet ${tweet.id} is ${text.length} chars (max ${MAX_LEN})`)
  }

  if (args.has('--dry-run')) {
    console.log(`[dry-run] Would post: ${tweet.id}\n\n${text}\n\n(${text.length}/${MAX_LEN} chars)`)
    return
  }

  const client = createClient()
  const rw = client.readWrite
  const result = await rw.v2.tweet(text)

  state.postedIds = [...new Set([...(state.postedIds ?? []), tweet.id])]
  state.history = [
    ...(state.history ?? []),
    { id: tweet.id, tweetId: result.data.id, at: new Date().toISOString() },
  ]
  saveJson(STATE_PATH, state)

  console.log(`Posted ${tweet.id}`)
  console.log(`https://x.com/i/web/status/${result.data.id}`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
