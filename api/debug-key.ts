import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Debug private key processing
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    let step1 = rawKey;
    let step2 = step1.replace(/^["']|["']$/g, '');
    let step3 = step2.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\\r\\n/g, '\n');
    
    return res.status(200).json({
      rawLength: rawKey.length,
      rawStart: rawKey.substring(0, 50),
      rawHasBackslashN: rawKey.includes('\\n'),
      rawHasNewline: rawKey.includes('\n'),
      
      step1Length: step1.length,
      step1Start: step1.substring(0, 50),
      
      step2Length: step2.length,
      step2Start: step2.substring(0, 50),
      step2HasQuotes: step2.startsWith('"') || step2.endsWith('"'),
      
      step3Length: step3.length,
      step3Start: step3.substring(0, 50),
      step3End: step3.substring(step3.length - 50),
      step3HasBackslashN: step3.includes('\\n'),
      step3HasNewline: step3.includes('\n'),
      step3NewlineCount: (step3.match(/\n/g) || []).length,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
