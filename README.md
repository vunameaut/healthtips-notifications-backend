# HealthTips Notifications Backend

Backend hệ thống thông báo cho ứng dụng HealthTips, được triển khai trên **Vercel Serverless Functions** (miễn phí 100%).

## 🌟 Tính năng

Cung cấp 4 API endpoints cho hệ thống thông báo:

1. **`/api/send-comment-reply`** - Gửi thông báo khi có bình luận mới
2. **`/api/send-new-health-tip`** - Gửi thông báo broadcast về mẹo sức khỏe mới
3. **`/api/queue-recommendation`** - Thêm mẹo vào hàng đợi gợi ý
4. **`/api/send-daily-recommendations`** - Gửi gợi ý cá nhân hóa hàng ngày (chạy bằng Cron Job)

## 📋 Yêu cầu

- Node.js 18+ hoặc 20+
- Tài khoản GitHub (miễn phí)
- Tài khoản Vercel (miễn phí, đăng nhập bằng GitHub)
- Firebase Project với Realtime Database và Firebase Cloud Messaging

## 🚀 Hướng dẫn Setup

### Bước 1: Clone hoặc Download project

```bash
# Nếu từ Git repository
git clone <repository-url>
cd healthtips-notifications-backend

# Hoặc đã tải về máy
cd healthtips-notifications-backend
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Lấy Firebase Service Account Key

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Settings (⚙️) → Project settings → Service accounts**
4. Click **"Generate new private key"**
5. Download file JSON, mở ra và copy các thông tin sau:

### Bước 4: Tạo file `.env` (cho test local)

```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin từ Service Account JSON:

```env
FIREBASE_PROJECT_ID=reminderwater-84694
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@reminderwater-84694.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://reminderwater-84694-default-rtdb.firebaseio.com
CRON_SECRET=my-secret-key-123
```

**Lưu ý quan trọng:**
- `FIREBASE_PRIVATE_KEY` phải giữ nguyên dấu `"` và `\n`
- `CRON_SECRET` tự tạo 1 chuỗi ngẫu nhiên (dùng để bảo mật endpoint cron)

## 🧪 Test Local

```bash
npm run dev
```

Vercel Dev Server sẽ chạy tại: `http://localhost:3000`

Test các endpoints:

```bash
# Test send-comment-reply
curl -X POST http://localhost:3000/api/send-comment-reply \
  -H "Content-Type: application/json" \
  -d '{
    "healthTipId": "tip123",
    "commentId": "comment456",
    "commentUserId": "user789",
    "commentContent": "Mẹo hay quá!",
    "healthTipTitle": "Uống nước mỗi ngày",
    "healthTipAuthorId": "user111"
  }'

# Test queue-recommendation
curl -X POST http://localhost:3000/api/queue-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "healthTipId": "tip123",
    "title": "Uống đủ nước mỗi ngày",
    "category": "nutrition"
  }'
```

## 📦 Deploy lên Vercel

### Bước 1: Push code lên GitHub

```bash
# Khởi tạo Git repository (nếu chưa có)
git init
git add .
git commit -m "Initial commit: HealthTips Notifications Backend"

# Tạo repository trên GitHub
# Vào https://github.com/new
# Đặt tên: healthtips-notifications-backend
# Chọn Public hoặc Private
# KHÔNG tick "Initialize with README"

# Link với remote repository
git remote add origin https://github.com/<your-username>/healthtips-notifications-backend.git
git branch -M main
git push -u origin main
```

### Bước 2: Deploy trên Vercel

1. **Truy cập [Vercel](https://vercel.com/)**
2. Click **"Sign up"** → Chọn **"Continue with GitHub"**
3. Sau khi đăng nhập, click **"Add New..." → "Project"**
4. Chọn repository **`healthtips-notifications-backend`**
5. Click **"Import"**
6. **Configure Project:**
   - **Framework Preset:** Chọn "Other"
   - **Build Command:** Để trống
   - **Output Directory:** Để trống
7. **Environment Variables** - Click "Add" và thêm từng biến:
   ```
   FIREBASE_PROJECT_ID = reminderwater-84694
   FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@reminderwater-84694.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...\n-----END PRIVATE KEY-----\n
   FIREBASE_DATABASE_URL = https://reminderwater-84694-default-rtdb.firebaseio.com
   CRON_SECRET = my-secret-key-123
   ```
   **Lưu ý:** 
   - Copy nguyên Private Key từ file JSON (giữ `\n`)
   - Vercel sẽ tự động wrap trong dấu ngoặc kép

8. Click **"Deploy"**

### Bước 3: Lấy URL Production

Sau khi deploy thành công, Vercel sẽ cung cấp URL:
```
https://healthtips-notifications-backend.vercel.app
```

Các endpoints sẽ là:
- `https://healthtips-notifications-backend.vercel.app/api/send-comment-reply`
- `https://healthtips-notifications-backend.vercel.app/api/send-new-health-tip`
- `https://healthtips-notifications-backend.vercel.app/api/queue-recommendation`
- `https://healthtips-notifications-backend.vercel.app/api/send-daily-recommendations`

## ⏰ Setup Cron Job cho Daily Recommendations

Endpoint `/api/send-daily-recommendations` cần được gọi hàng ngày lúc 18:00.

### Cách 1: Sử dụng Cron-job.org (Miễn phí)

1. Truy cập [Cron-job.org](https://cron-job.org/)
2. Đăng ký tài khoản miễn phí
3. Tạo Cron Job mới:
   - **Title:** HealthTips Daily Recommendations
   - **URL:** `https://healthtips-notifications-backend.vercel.app/api/send-daily-recommendations`
   - **Schedule:** 
     - **Execution:** Every day
     - **Time:** 18:00 (timezone của bạn)
   - **Request Method:** POST
   - **Headers:** Thêm header:
     ```
     Authorization: Bearer my-secret-key-123
     ```
     (Sử dụng cùng `CRON_SECRET` đã set trong Environment Variables)
4. Click **"Create"**

### Cách 2: Sử dụng GitHub Actions (Miễn phí)

Tạo file `.github/workflows/daily-cron.yml` trong repository:

```yaml
name: Daily Recommendations Cron

on:
  schedule:
    - cron: '0 11 * * *' # 18:00 Vietnam time (UTC+7 = 11:00 UTC)
  workflow_dispatch: # Cho phép chạy thủ công

jobs:
  send-recommendations:
    runs-on: ubuntu-latest
    steps:
      - name: Call Vercel Endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://healthtips-notifications-backend.vercel.app/api/send-daily-recommendations
```

Thêm Secret trong GitHub repository:
1. Vào repository → **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Name: `CRON_SECRET`, Value: `my-secret-key-123`

## 🔧 Cập nhật Android App

### 1. Thay đổi logic gửi thông báo

**Trước (Firebase Cloud Functions - Database Trigger):**
```java
// Không cần làm gì, Firebase tự động trigger khi có comment mới
```

**Sau (Vercel API - Gọi từ Android):**
```java
// Sau khi tạo comment thành công, gọi Vercel endpoint
public void sendCommentNotification(String healthTipId, String commentId, ...) {
    String url = "https://healthtips-notifications-backend.vercel.app/api/send-comment-reply";
    
    JSONObject json = new JSONObject();
    json.put("healthTipId", healthTipId);
    json.put("commentId", commentId);
    json.put("commentUserId", currentUserId);
    json.put("commentContent", commentContent);
    json.put("healthTipTitle", healthTipTitle);
    json.put("healthTipAuthorId", authorId);
    
    // Gửi POST request
    JsonObjectRequest request = new JsonObjectRequest(
        Request.Method.POST, url, json,
        response -> Log.d("Notification", "Sent successfully"),
        error -> Log.e("Notification", "Failed", error)
    );
    
    requestQueue.add(request);
}
```

### 2. Tự động queue recommendations

```java
// Sau khi tạo mẹo sức khỏe mới thành công
public void queueForRecommendation(String healthTipId, String title, String category) {
    String url = "https://healthtips-notifications-backend.vercel.app/api/queue-recommendation";
    
    JSONObject json = new JSONObject();
    json.put("healthTipId", healthTipId);
    json.put("title", title);
    json.put("category", category);
    
    JsonObjectRequest request = new JsonObjectRequest(
        Request.Method.POST, url, json,
        response -> Log.d("Queue", "Added to recommendations"),
        error -> Log.e("Queue", "Failed", error)
    );
    
    requestQueue.add(request);
}
```

### 3. Admin Web - Gửi thông báo broadcast

```java
// Khi Admin muốn gửi thông báo về mẹo mới
public void broadcastNewHealthTip(String healthTipId, String title, String category, String authorId) {
    String url = "https://healthtips-notifications-backend.vercel.app/api/send-new-health-tip";
    
    JSONObject json = new JSONObject();
    json.put("healthTipId", healthTipId);
    json.put("title", title);
    json.put("category", category);
    json.put("authorId", authorId);
    
    JsonObjectRequest request = new JsonObjectRequest(
        Request.Method.POST, url, json,
        response -> {
            int sentCount = response.getInt("successCount");
            Toast.makeText(context, "Đã gửi tới " + sentCount + " người dùng", Toast.LENGTH_SHORT).show();
        },
        error -> Log.e("Broadcast", "Failed", error)
    );
    
    requestQueue.add(request);
}
```

## 📊 Monitoring

### Xem Logs trên Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project **healthtips-notifications-backend**
3. Tab **"Deployments"** → Click vào deployment mới nhất
4. Tab **"Functions"** → Chọn function cần xem
5. Tab **"Logs"** để xem real-time logs

### Test Endpoints Production

```bash
# Test comment reply
curl -X POST https://healthtips-notifications-backend.vercel.app/api/send-comment-reply \
  -H "Content-Type: application/json" \
  -d '{...}'

# Test daily recommendations (cần Authorization header)
curl -X POST https://healthtips-notifications-backend.vercel.app/api/send-daily-recommendations \
  -H "Authorization: Bearer my-secret-key-123"
```

## 🛡️ Bảo mật

- ✅ Tất cả Environment Variables được encrypt trên Vercel
- ✅ Private Key không bao giờ được commit vào Git
- ✅ Endpoint cron job được bảo vệ bằng `CRON_SECRET`
- ✅ HTTPS bắt buộc cho tất cả requests

## 🆓 Vercel Free Tier Limits

- **100,000 requests/tháng**
- **100 GB bandwidth**
- **Unlimited deployments**
- **Automatic HTTPS**
- **Edge Network (CDN)**

## 🔄 Cập nhật Code

```bash
# Sửa code trong thư mục api/
# Commit và push
git add .
git commit -m "Update notification logic"
git push

# Vercel sẽ tự động deploy lại
```

## ❓ FAQ

**Q: Làm sao biết endpoint đã hoạt động?**
A: Kiểm tra Logs trên Vercel Dashboard hoặc test bằng curl/Postman.

**Q: Daily recommendations không chạy đúng giờ?**
A: Kiểm tra timezone trong Cron-job.org hoặc GitHub Actions workflow.

**Q: Quá 100K requests/tháng thì sao?**
A: Vercel sẽ từ chối requests mới, nhưng với app nhỏ rất khó đạt ngưỡng này.

**Q: Có thể dùng Firebase Functions miễn phí không?**
A: Firebase Functions yêu cầu Blaze Plan (cần thẻ tín dụng) dù có free tier.

## 📞 Hỗ trợ

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cron-job.org Help](https://cron-job.org/en/documentation/)

---

**Developed with ❤️ for HealthTips App**
"# healthtips-notifications-backend" 
