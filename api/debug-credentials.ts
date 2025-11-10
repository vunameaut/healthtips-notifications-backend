import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin, processPrivateKey } from './firebase-config';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const results: any = {
    step1_envVarsExist: {},
    step2_privateKeyProcessing: {},
    step3_firebaseInit: {},
    step4_credentialTest: {},
  };

  try {
    // Step 1: Kiểm tra env vars
    results.step1_envVarsExist = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_DATABASE_URL: !!process.env.FIREBASE_DATABASE_URL,
    };

    // Step 2: Xử lý private key
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    const processedKey = processPrivateKey(rawKey);
    results.step2_privateKeyProcessing = {
      rawLength: rawKey.length,
      processedLength: processedKey.length,
      hasNewlines: processedKey.includes('\n'),
      startsWithBegin: processedKey.startsWith('-----BEGIN'),
      endsWithEnd: processedKey.trim().endsWith('-----END PRIVATE KEY-----'),
      newlineCount: (processedKey.match(/\n/g) || []).length,
    };

    // Step 3: Thử init Firebase
    if (!admin.apps.length) {
      try {
        initializeFirebaseAdmin();
        results.step3_firebaseInit = {
          success: true,
          appName: admin.apps[0]?.name,
        };
      } catch (error) {
        results.step3_firebaseInit = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        };
      }
    } else {
      results.step3_firebaseInit = {
        success: true,
        appName: admin.apps[0]?.name,
        alreadyInitialized: true,
      };
    }

    // Step 4: Test credential bằng cách tạo custom token
    if (admin.apps.length > 0) {
      try {
        // Thử tạo một custom token test
        await admin.auth().createCustomToken('test-uid-12345');
        results.step4_credentialTest = {
          success: true,
          message: 'Credential is valid - can create custom tokens',
        };
      } catch (error) {
        results.step4_credentialTest = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        };
      }
    } else {
      results.step4_credentialTest = {
        success: false,
        error: 'Firebase not initialized',
      };
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      partialResults: results,
    });
  }
}
