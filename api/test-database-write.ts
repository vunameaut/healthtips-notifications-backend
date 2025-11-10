import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { setCorsHeaders } from './cors-config';
import { initializeFirebaseAdmin } from './firebase-config';

// Khởi tạo Firebase
if (!admin.apps.length) {
  try {
    initializeFirebaseAdmin();
  } catch (error) {
    // Will be caught in handler
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Kiểm tra Firebase init
    if (!admin.apps.length) {
      return res.status(500).json({
        success: false,
        error: 'Firebase not initialized'
      });
    }

    // Test write đơn giản
    const testRef = admin.database().ref('test/simple-write');
    const testData = {
      message: 'Hello from API',
      timestamp: Date.now(),
      randomValue: Math.random()
    };

    await testRef.set(testData);

    // Test read back
    const snapshot = await testRef.once('value');
    const readData = snapshot.val();

    return res.status(200).json({
      success: true,
      message: 'Database write/read test successful',
      written: testData,
      read: readData,
      matches: JSON.stringify(testData) === JSON.stringify(readData)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    });
  }
}
