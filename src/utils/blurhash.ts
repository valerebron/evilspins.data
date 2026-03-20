import { createHash } from 'crypto'
import { encode } from 'blurhash'
import sharp from 'sharp'
import fs from 'fs'

export async function generateBlurhash(imagePath: string): Promise<string | null> {
  try {
    const { data, info } = await sharp(imagePath)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true })
    
    const { width, height } = info
    const pixels = new Uint8ClampedArray(data)
    
    return encode(pixels, width, height, 4, 4)
  } catch (error) {
    console.warn(`Failed to generate blurhash for ${imagePath}:`, error)
    return null
  }
}
