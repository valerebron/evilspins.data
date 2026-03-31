/**
 * Watches the media directory's cards subfolder for file changes and triggers a debounced re-scan.
 *
 * Uses Node's built-in fs.watch (no extra deps).
 * On busy systems you may want to swap this for chokidar for more reliability.
 */

import fs from 'fs'
import path from 'path'
import { scanCards } from '../scanner'

const MEDIA_DIR = process.env.MEDIA_DIR ?? path.resolve(__dirname, '/var/evilspins.media')
const CARDS_DIR = path.join(MEDIA_DIR, 'cards')
const DEBOUNCE_MS   = 2_000   // wait 2 s after last event before scanning

let debounceTimer: NodeJS.Timeout | null = null

function scheduleRescan(eventType: string, filename: string | null) {
  console.log(`📁  fs.watch: ${eventType} — ${filename ?? '?'}`)

  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(async () => {
    try {
      await scanCards()
    } catch (err) {
      console.error('❌  Re-scan failed', err)
    }
  }, DEBOUNCE_MS)
}

export function startWatcher(): fs.FSWatcher {
  if (!fs.existsSync(CARDS_DIR)) {
    throw new Error(`Cards directory does not exist: ${CARDS_DIR}`)
  }

  const watcher = fs.watch(CARDS_DIR, { persistent: true }, scheduleRescan)

  watcher.on('error', (err) => {
    console.error('Watcher error:', err)
  })

  console.log(`👁️   Watching ${CARDS_DIR}`)
  return watcher
}
