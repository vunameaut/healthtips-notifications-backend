import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Kiểm tra env vars
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_DATABASE_URL: !!process.env.FIREBASE_DATABASE_URL,
      CRON_SECRET: !!process.env.CRON_SECRET,
    };

    // Kiểm tra format của private key
    const privateKeyStart = process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'Not set';
    const privateKeyHasNewlines = process.env.FIREBASE_PRIVATE_KEY?.includes('\\n') || false;
    const privateKeyLength = process.env.FIREBASE_PRIVATE_KEY?.length || 0;

    // Thử khởi tạo Firebase Admin
    let firebaseInitError = null;
    let firebaseInitSuccess = false;

    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
        firebaseInitSuccess = true;
      } catch (error) {
        firebaseInitError = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      firebaseInitSuccess = true;
    }

    // Thử test database connection
    let dbTestSuccess = false;
    let dbTestError = null;

    if (firebaseInitSuccess) {
      try {
        await admin.database().ref('.info/connected').once('value');
        dbTestSuccess = true;
      } catch (error) {
        dbTestError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environmentVariables: envCheck,
      privateKeyInfo: {
        start: privateKeyStart,
        hasNewlines: privateKeyHasNewlines,
        length: privateKeyLength,
      },
      firebaseInit: {
        success: firebaseInitSuccess,
        error: firebaseInitError,
        appName: admin.apps[0]?.name || 'No app initialized',
      },
      databaseTest: {
        success: dbTestSuccess,
        error: dbTestError,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
