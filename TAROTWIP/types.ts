export interface Mixtape {
  id: string;
  name: string;
  duration: number;
  createdAt?: Date;
}

export interface Side {
  id: number;
  tapeId: string;
  side: string;
  duration: number;
}

export interface Artist {
  id: number;
  name: string;
  url?: string;
  coverId?: string;
  createdAt?: Date;
}

export interface TarotCard {
  id: number;
  esid: string;
  tapeId: string;
  side: string;
  trackOrder: number;
  title: string;
  artistId: number;
  start: number;
  link?: string;
  coverId?: string;
  url?: string;
}

export interface Card {
  id: number;
  esid: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  artist: string;
  title: string;
  slug: string;
  suit: string;
  rank: string;
  blurhash: string;
  url_audio: string;
  url_image: string;
  createdAt: Date;
  updatedAt: Date;
}
