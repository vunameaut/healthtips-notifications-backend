import * as admin from 'firebase-admin';

/**
 * Xử lý private key để loại bỏ tất cả escape sequences
 * Hỗ trợ: \\n, \n, \r\n, \\r\\n, quotes
 */
export function processPrivateKey(privateKey: string | undefined): string {
  if (!privateKey) return '';
  
  let processed = privateKey;
  
  // Loại bỏ quotes nếu có
  processed = processed.replace(/^["']|["']$/g, '');
  
  // Replace tất cả các dạng escape sequences thành \n thật
  // \\\\n -> \n (quadruple backslash)
  // \\n -> \n (double backslash) 
  // \r\n -> \n (Windows newlines)
  // \\r\\n -> \n (escaped Windows newlines)
  processed = processed
    .replace(/\\\\\\\\n/g, '\n')  // 4 backslashes
    .replace(/\\\\n/g, '\n')       // 2 backslashes
    .replace(/\\r\\n/g, '\n')      // escaped \r\n
    .replace(/\r\n/g, '\n')        // Windows newlines
    .replace(/\\n/g, '\n');        // single escape
  
  return processed;
}

/**
 * Khởi tạo Firebase Admin SDK với xử lý private key đúng cách
 */
export function initializeFirebaseAdmin(): void {
  if (!admin.apps.length) {
    const privateKey = processPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
}
