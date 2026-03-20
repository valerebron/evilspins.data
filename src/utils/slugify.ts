import { createHash } from 'crypto'

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function createEsid(year: number, month: number, day: number, hour: number, artist: string, title: string): string {
  return createHash('md5')
    .update(`${year}${month}${day}${hour}${artist}${title}`)
    .digest('hex')
}
