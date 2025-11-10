import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Khởi tạo Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

interface UserPreferences {
  categories?: { [key: string]: boolean };
}

interface UserData {
  fcmToken?: string;
  preferences?: UserPreferences;
  username?: string;
  fullName?: string;
}

interface RecommendationQueueItem {
  healthTipId: string;
  title: string;
  category: string;
  priority: number;
  status: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Chỉ chấp nhận POST requests (được gọi từ cron job)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Kiểm tra authorization header (bảo mật cho cron job)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting daily recommendations job at:', new Date().toISOString());

    // Lấy tất cả recommendations từ queue
    const queueSnapshot = await admin.database()
      .ref('recommendationQueue')
      .orderByChild('status')
      .equalTo('pending')
      .once('value');

    if (!queueSnapshot.exists()) {
      console.log('No pending recommendations in queue');
      return res.status(200).json({ 
        success: true,
        message: 'No recommendations to send',
        sentCount: 0
      });
    }

    const recommendations = queueSnapshot.val() as { [key: string]: RecommendationQueueItem };
    
    // Sắp xếp recommendations theo priority (số likes)
    const sortedRecommendations = Object.values(recommendations)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5); // Lấy tối đa 5 mẹo có priority cao nhất

    // Lấy tất cả users
    const usersSnapshot = await admin.database()
      .ref('users')
      .once('value');

    const users = usersSnapshot.val() as { [key: string]: UserData };
    let totalSent = 0;
    let totalFailed = 0;

    // Gửi recommendations cho từng user
    for (const userId in users) {
      const user = users[userId];

      if (!user.fcmToken) {
        continue; // Bỏ qua user không có FCM token
      }

      // Lọc recommendations phù hợp với preferences của user
      const userCategories = user.preferences?.categories || {};
      const personalizedRecommendations = sortedRecommendations.filter(
        rec => userCategories[rec.category] === true
      );

      if (personalizedRecommendations.length === 0) {
        continue; // Bỏ qua nếu không có recommendations phù hợp
      }

      // Lấy recommendation đầu tiên (có priority cao nhất)
      const topRecommendation = personalizedRecommendations[0];

      // Tạo deep link
      const deepLink = `healthtips://tip/${topRecommendation.healthTipId}`;

      // Gửi thông báo
      const message = {
        token: user.fcmToken,
        notification: {
          title: '🌟 Mẹo sức khỏe dành cho bạn',
          body: topRecommendation.title,
        },
        data: {
          type: 'daily_recommendation',
          healthTipId: topRecommendation.healthTipId,
          category: topRecommendation.category,
          deepLink: deepLink,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'normal' as const,
          notification: {
            channelId: 'recommendations',
            color: '#FFC107',
            priority: 'high' as const,
          },
        },
      };

      try {
        await admin.messaging().send(message);
        totalSent++;
      } catch (error) {
        console.error(`Failed to send to user ${userId}:`, error);
        totalFailed++;
      }
    }

    // Đánh dấu tất cả recommendations đã được gửi
    const updates: { [key: string]: any } = {};
    for (const recId in recommendations) {
      updates[`recommendationQueue/${recId}/status`] = 'sent';
      updates[`recommendationQueue/${recId}/sentAt`] = Date.now();
    }
    await admin.database().ref().update(updates);

    console.log(`Daily recommendations completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

    return res.status(200).json({ 
      success: true,
      message: 'Daily recommendations sent',
      sentCount: totalSent,
      failedCount: totalFailed,
      totalRecommendations: sortedRecommendations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending daily recommendations:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send daily recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
