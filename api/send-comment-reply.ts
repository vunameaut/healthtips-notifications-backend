import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { setCorsHeaders } from './cors-config';

// Khởi tạo Firebase Admin SDK (chỉ khởi tạo 1 lần)
if (!admin.apps.length) {
  // Xử lý private key - loại bỏ tất cả escape sequences
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  // Loại bỏ quotes nếu có
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  // Replace tất cả \\n, \\r\\n, \r\n thành \n thật
  privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\\r\\n/g, '\n');
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

interface CommentData {
  healthTipId: string;
  commentId: string;
  commentUserId: string;
  commentContent: string;
  healthTipTitle: string;
  healthTipAuthorId: string;
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
    const data: CommentData = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!data.healthTipId || !data.commentId || !data.commentUserId || 
        !data.commentContent || !data.healthTipTitle || !data.healthTipAuthorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Không gửi thông báo nếu người comment chính là tác giả
    if (data.commentUserId === data.healthTipAuthorId) {
      console.log('Skipping notification: Author commented on their own tip');
      return res.status(200).json({ 
        success: true, 
        message: 'Skipped: Author self-comment' 
      });
    }

    // Lấy thông tin người comment
    const commenterSnapshot = await admin.database()
      .ref(`users/${data.commentUserId}`)
      .once('value');
    
    const commenterData = commenterSnapshot.val();
    const commenterName = commenterData?.fullName || commenterData?.username || 'Người dùng';

    // Lấy FCM token của tác giả bài viết
    const authorSnapshot = await admin.database()
      .ref(`users/${data.healthTipAuthorId}`)
      .once('value');
    
    const authorData = authorSnapshot.val();
    const fcmToken = authorData?.fcmToken;

    if (!fcmToken) {
      console.log('No FCM token found for author:', data.healthTipAuthorId);
      return res.status(200).json({ 
        success: true, 
        message: 'No FCM token available' 
      });
    }

    // Tạo deep link để mở bài viết khi nhấn thông báo
    const deepLink = `healthtips://tip/${data.healthTipId}?highlight=comment_${data.commentId}`;

    // Gửi thông báo qua FCM
    const message = {
      token: fcmToken,
      notification: {
        title: `💬 ${commenterName} đã bình luận`,
        body: `"${data.commentContent.substring(0, 100)}${data.commentContent.length > 100 ? '...' : ''}"`,
      },
      data: {
        type: 'comment_reply',
        healthTipId: data.healthTipId,
        commentId: data.commentId,
        deepLink: deepLink,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'comments',
          color: '#4CAF50',
          priority: 'high' as const,
        },
      },
    };

    const response = await admin.messaging().send(message);
    
    console.log('Successfully sent comment notification:', response);

    return res.status(200).json({ 
      success: true, 
      messageId: response,
      message: 'Notification sent successfully' 
    });

  } catch (error) {
    console.error('Error sending comment notification:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
