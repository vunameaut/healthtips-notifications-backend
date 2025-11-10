import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { setCorsHeaders } from './cors-config';
import { initializeFirebaseAdmin } from './firebase-config';

// Khởi tạo Firebase Admin SDK với private key processing
if (!admin.apps.length) {
  initializeFirebaseAdmin();
}

interface QueueRecommendationData {
  healthTipId: string;
  title: string;
  category: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Chỉ chấp nhận POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: QueueRecommendationData = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!data.healthTipId || !data.title || !data.category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Lấy thông tin mẹo sức khỏe để kiểm tra
    const tipSnapshot = await admin.database()
      .ref(`healthTips/${data.healthTipId}`)
      .once('value');

    if (!tipSnapshot.exists()) {
      return res.status(404).json({ error: 'Health tip not found' });
    }

    const tipData = tipSnapshot.val();

    // Thêm vào queue recommendations với timestamp
    const recommendationRef = admin.database()
      .ref('recommendationQueue')
      .child(data.healthTipId);

    await recommendationRef.set({
      healthTipId: data.healthTipId,
      title: data.title,
      category: data.category,
      queuedAt: Date.now(),
      status: 'pending',
      priority: tipData.likes || 0, // Ưu tiên theo số likes
    });

    console.log('Added to recommendation queue:', data.healthTipId);

    return res.status(200).json({ 
      success: true,
      message: 'Added to recommendation queue',
      healthTipId: data.healthTipId,
      queuedAt: Date.now()
    });

  } catch (error) {
    console.error('Error queuing recommendation:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to queue recommendation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
