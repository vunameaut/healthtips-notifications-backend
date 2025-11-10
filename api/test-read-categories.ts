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

    // Đọc data categories (đã có sẵn trong DB)
    const categoriesRef = admin.database().ref('categories');
    const snapshot = await categoriesRef.limitToFirst(3).once('value');
    
    const categories = snapshot.val();

    return res.status(200).json({
      success: true,
      message: 'Successfully read from database',
      categoriesCount: categories ? Object.keys(categories).length : 0,
      sampleData: categories
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to read database',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
