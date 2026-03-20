import { createSchema } from './schema'
import { scanCards } from '../scanner'

export async function initializeDatabase() {
  console.log('🚀 Initializing database...')
  
  try {
    // Create the complete schema
    await createSchema()
    
    // Run initial scan to populate the database
    console.log('📁 Running initial scan to populate database...')
    const result = await scanCards()
    
    console.log(`✅ Database initialization complete!`)
    console.log(`   Added: ${result.added}, Updated: ${result.updated}, Removed: ${result.removed}`)
    
    return result
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
