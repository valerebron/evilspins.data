import { createSchema } from './schema'
import { importTarots } from './tarot'
import { scanCards } from '../scanner'
import { pool } from './pool'

export async function initializeDatabase() {
  console.log('🚀 Initializing database...')
  
  try {
    // Create the complete schema if it doesn't already exist
    await createSchema()

    // Seed the tarot deck data from static file
    console.log('🃏 Importing tarot card dataset...')
    await importTarots()

    const { rows } = await pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM cards`)
    const cardCount = Number(rows[0]?.count ?? 0)

    if (cardCount === 0) {
      console.log('📁 Running initial scan to populate database...')
      const result = await scanCards()
      console.log(`✅ Database initialization complete!`)
      console.log(`   Added: ${result.added}, Updated: ${result.updated}, Removed: ${result.removed}`)
      return result
    }

    console.log('⏭️  Skipping initial scan; cards table already populated.')
    return { added: 0, updated: 0, removed: 0 }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Standalone execution
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Initialization completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error)
      process.exit(1)
    })
}
