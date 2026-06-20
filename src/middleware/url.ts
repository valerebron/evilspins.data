import path from 'path';
import { Request, Response, NextFunction } from 'express';

const MEDIA_URL = 'files/card';  // Assuming this is the base URL for your media files

export function addMediaUrls(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (Array.isArray(body)) {
      body.forEach(replaceUrls);
    } else if (body && typeof body === 'object') {
      if (Array.isArray(body.data)) {
        body.data.forEach(replaceUrls);
      } else {
        replaceUrls(body);
      }
    }
    return originalJson(body);
  };
  next();
}

function replaceUrls(item: any) {
  if (!item || typeof item !== 'object') {
    return;
  }

  if (item.ext_audio) {
    item.url_audio = path.posix.join(MEDIA_URL, `${item.stem}.${item.ext_audio}`);
  }
  if (item.ext_image) {
    item.url_image = path.posix.join(MEDIA_URL, `${item.stem}.${item.ext_image}`);
  }
  delete item.ext_audio;
  delete item.ext_image;
}
