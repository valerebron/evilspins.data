import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import cardRouter from './api/card'
import boxRouter from './api/box'

import { addMediaUrls } from './middleware/url'
import { initializeDatabase } from './db/init'
import { startWatcher } from './watcher'

const app = express()
const PORT = process.env.PORT

const MEDIA_DIR = process.env.MEDIA_DIR ?? ''

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// Serve audio and image files directly
app.use('/files', express.static(MEDIA_DIR))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/card', addMediaUrls, cardRouter)
app.use('/api/box', boxRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

// ─── Startup ──────────────────────────────────────────────────────────────────
async function main() {
  // Initialize database with schema and initial scan
  await initializeDatabase()

  // Watch for incremental changes
  startWatcher()

  app.listen(PORT, () => {
    console.log(`🎵  EvilSpins API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('Fatal startup error', err)
  process.exit(1)
})
