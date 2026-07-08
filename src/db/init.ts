import { createSchema } from './schema'
import { scanCard } from '../scanner'

export async function initializeDatabase(): Promise<{ added: number; updated: number; removed: number }> {
  console.log('🚀 Initializing database...')
  try {
    await createSchema()
    console.log('📁 Running scan to synchronize cards and boxes...')
    const result = await scanCard()
    console.log(`✅ Database initialization complete!`)
    console.log(`   Added: ${result.added}, Updated: ${result.updated}, Removed: ${result.removed}`)
    return result
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
