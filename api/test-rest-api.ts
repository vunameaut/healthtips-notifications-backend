import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './cors-config';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Test Firebase REST API trực tiếp (không cần Admin SDK)
    const dbUrl = process.env.FIREBASE_DATABASE_URL;
    const testUrl = `${dbUrl}/categories.json?limitToFirst=3`;

    const response = await fetch(testUrl);
    
    if (!response.ok) {
      throw new Error(`Firebase returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message: 'Successfully read via REST API',
      databaseUrl: dbUrl,
      dataReceived: !!data,
      sampleData: data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'REST API test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
