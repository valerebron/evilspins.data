import { createSchema } from './schema'
import { importTarot } from './tarot'
import { scanCard } from '../scanner'
import { pool } from './pool'

export async function initializeDatabase(): Promise<{ added: number; updated: number; removed: number }> {
  console.log('🚀 Initializing database...')
  try {
    await createSchema()
    console.log('🃏 Importing tarot card dataset...')
    await importTarot()

    const { rows } = await pool.query(`SELECT COUNT(*) AS count FROM card`)
    const cardCount = Number(rows[0]?.count ?? 0)

    if (cardCount === 0) {
      console.log('📁 Running initial scan to populate database...')
      const result = await scanCard()
      console.log(`✅ Database initialization complete!`)
      console.log(`   Added: ${result.added}, Updated: ${result.updated}, Removed: ${result.removed}`)
      return result
    }

    console.log('⏭️  Skipping initial scan; card table already populated.')
    return { added: 0, updated: 0, removed: 0 }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

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
