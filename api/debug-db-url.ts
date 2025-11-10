import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  
  return res.status(200).json({
    exists: !!dbUrl,
    length: dbUrl?.length || 0,
    value: dbUrl || 'NOT SET',
    charCodes: dbUrl ? Array.from(dbUrl).map((c, i) => ({ 
      index: i, 
      char: c, 
      code: c.charCodeAt(0),
      isSpecial: c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126
    })).filter(x => x.isSpecial || x.index < 10 || x.index > (dbUrl.length - 10)) : []
  });
}
