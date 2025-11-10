import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { setCorsHeaders } from './cors-config';
import { initializeFirebaseAdmin } from './firebase-config';

// Khởi tạo Firebase Admin SDK với private key processing
if (!admin.apps.length) {
  initializeFirebaseAdmin();
}

interface NewHealthTipData {
  healthTipId: string;
  title: string;
  category: string;
  authorId: string;
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
    const data: NewHealthTipData = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!data.healthTipId || !data.title || !data.category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Lấy thông tin tác giả
    const authorSnapshot = await admin.database()
      .ref(`users/${data.authorId}`)
      .once('value');
    
    const authorData = authorSnapshot.val();
    const authorName = authorData?.fullName || authorData?.username || 'Admin';

    // Lấy danh sách users quan tâm category này
    const usersSnapshot = await admin.database()
      .ref('users')
      .once('value');

    const users = usersSnapshot.val();
    const targetTokens: string[] = [];
    
    // Lọc users có quan tâm category và có FCM token
    for (const userId in users) {
      const user = users[userId];
      
      // Không gửi cho chính tác giả
      if (userId === data.authorId) {
        continue;
      }

      // Kiểm tra xem user có quan tâm category này không
      const preferences = user.preferences?.categories || {};
      if (preferences[data.category] === true && user.fcmToken) {
        targetTokens.push(user.fcmToken);
      }
    }

    if (targetTokens.length === 0) {
      console.log('No users interested in category:', data.category);
      return res.status(200).json({ 
        success: true,
        message: 'No target users found',
        category: data.category
      });
    }

    // Tạo deep link
    const deepLink = `healthtips://tip/${data.healthTipId}`;

    // Gửi thông báo cho tất cả users quan tâm
    const message = {
      notification: {
        title: `🆕 Mẹo sức khỏe mới từ ${authorName}`,
        body: `${data.title}`,
      },
      data: {
        type: 'new_health_tip',
        healthTipId: data.healthTipId,
        category: data.category,
        deepLink: deepLink,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'new_tips',
          color: '#2196F3',
          priority: 'high' as const,
        },
      },
      tokens: targetTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`Successfully sent to ${response.successCount} devices`);
    if (response.failureCount > 0) {
      console.log(`Failed to send to ${response.failureCount} devices`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Error for token ${targetTokens[idx]}:`, resp.error);
        }
      });
    }

    return res.status(200).json({ 
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTargets: targetTokens.length,
      message: 'Notifications sent'
    });

  } catch (error) {
    console.error('Error sending new health tip notification:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
