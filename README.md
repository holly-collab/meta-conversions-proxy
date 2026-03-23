# Meta Conversions API Setup for Holly The Locator

This project has **two parts** that work together to track events from your Squarespace website and send them to Meta (Facebook) for your ad campaigns.

### Why Two Parts?

- **Client-side Pixel** (runs in the visitor's browser) — fast but can be blocked by ad blockers
- **Conversions API** (runs on a server you control) — reliable, can't be blocked, and keeps your access token secret

Using both together gives you the **best tracking accuracy** for your Meta ads.

---

## 📁 What's in This Project

| File | What It Does |
|------|-------------|
| `server.js` | The proxy server that securely sends events to Meta |
| `squarespace-header-code.html` | JavaScript to paste into your Squarespace header |
| `.env` | Your Meta credentials (keep this secret!) |
| `Dockerfile` | For deploying with Docker (optional) |
| `railway.json` | Config for Railway deployment (recommended) |
| `render.yaml` | Config for Render deployment (alternative) |

---

## 🚀 Step 1: Deploy the Server

You need to host `server.js` somewhere on the internet. Here are two easy, **free** options:

### Option A: Deploy to Railway (Recommended — Easiest)

1. Go to [railway.app](https://railway.app) and sign up (free tier available)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Connect your GitHub and push this project to a new repository, OR:
   - Click **"Deploy from Template"** → **"Empty Project"**
   - Then **"New Service"** → **"GitHub Repo"** or just drag and drop
4. In the service settings, add these **Environment Variables**:
   ```
   META_PIXEL_ID = 1348226510464250
   META_ACCESS_TOKEN = EAAZAKZBPAhlTUBRKKPvYkokU7qk1KrXiLZAB3pogSGu3KCPvmTnezsaSW0Oxo6BPVZA8SseaUZAZCCgPTLDiE2poD3lS5vLqxqvsusXqdVgUPTdpunG4SbzcUsnJZA0dcoUxSXX0H2VnZBy6DDDZB5OSaMSZAjSRydBl7j2lka6NpbBJZCRFJzSP7YSsZCKRoZCfQaQZDZD
   PORT = 3000
   ```
5. Railway will give you a URL like `https://your-app-name.up.railway.app`
6. Visit that URL — you should see: `{"status":"ok","service":"Holly The Locator - Meta Conversions API Proxy"}`

### Option B: Deploy to Render (Free)

1. Go to [render.com](https://render.com) and sign up
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo or upload the code
4. Set the **Start Command** to: `node server.js`
5. Add the same environment variables as above
6. Render will give you a URL like `https://your-app-name.onrender.com`

### Option C: Deploy via the Command Line (For Tech-Savvy Users)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set META_PIXEL_ID=1348226510464250
railway variables set META_ACCESS_TOKEN=EAAZAKZBPAhlTUBRKKPvYkokU7qk1KrXiLZAB3pogSGu3KCPvmTnezsaSW0Oxo6BPVZA8SseaUZAZCCgPTLDiE2poD3lS5vLqxqvsusXqdVgUPTdpunG4SbzcUsnJZA0dcoUxSXX0H2VnZBy6DDDZB5OSaMSZAjSRydBl7j2lka6NpbBJZCRFJzSP7YSsZCKRoZCfQaQZDZD

# Deploy!
railway up
```

---

## 📋 Step 2: Add Tracking Code to Squarespace

1. Open `squarespace-header-code.html` in a text editor
2. **Find this line near the top** of the custom tracking script:
   ```javascript
   var SERVER_URL = 'https://YOUR-SERVER-URL-HERE.com';
   ```
3. **Replace it** with your actual server URL from Step 1, for example:
   ```javascript
   var SERVER_URL = 'https://holly-meta-proxy.up.railway.app';
   ```
   ⚠️ **No trailing slash!** ✅ `https://example.com` ❌ `https://example.com/`

4. **Copy the entire contents** of `squarespace-header-code.html`

5. In Squarespace:
   - Go to **Settings** → **Advanced** → **Code Injection**
   - In the **Header** section, paste the code **below** any existing code (like your schema markup)
   - Click **Save**

---

## ✅ Step 3: Test Everything

### Test the Server

Open your server URL in a browser with `/health` at the end:
```
https://your-server-url.com/health
```
You should see: `{"status":"ok"}`

### Test an Event

You can send a test event using this URL in your browser's address bar:
```
https://your-server-url.com/api/test
```
(You'll need to send a POST request — use the test below instead)

**Quick test from your terminal or any online POST tool:**
```bash
curl -X POST https://your-server-url.com/api/test
```

### Test on Your Website

1. Visit your website: [hollythelocator.com](https://hollythelocator.com)
2. Open browser Developer Tools (press F12 or right-click → Inspect)
3. Go to the **Console** tab
4. You should see messages like:
   ```
   [Holly Tracking] ViewContent tracked (ID: eid_1234567890_abc123)
   ```
5. Visit the [apartment wishlist page](https://hollythelocator.com/apartmentwishlist)
6. Click on a form field — you should see:
   ```
   [Holly Tracking] Form interaction started
   ```
7. Submit the form — you should see:
   ```
   [Holly Tracking] ✅ LEAD EVENT — Form submitted!
   ```

### Verify in Meta Events Manager

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel (ID: 1348226510464250)
3. You should see events coming in under both:
   - **Browser** (from the Pixel)
   - **Server** (from the Conversions API)
4. If events show as "deduplicated" — that's **good**! It means the system is working correctly.

---

## 📊 Events Being Tracked

| Event | When It Fires | Why It Matters |
|-------|--------------|----------------|
| **PageView** | Every page load | Standard tracking (built into pixel) |
| **ViewContent** | Every page load | Tracks which pages visitors view |
| **Lead** (submitted) | Form is submitted on /apartmentwishlist | **Your main conversion event for ads** |
| **Lead** (partial) | User fills a field but leaves without submitting | Captures interested users who didn't finish |
| **Contact** | "Chat with Holly" or similar button clicks | Tracks engagement with booking/contact buttons |

---

## 🔒 Security Notes

- Your Meta Access Token is **only stored on the server** — it's never visible in browser code
- The server only accepts requests from `hollythelocator.com` (CORS protection)
- The `.env` file with your credentials is in `.gitignore` and won't be pushed to GitHub

---

## 🛠 Troubleshooting

**"SERVER_URL not configured" in console**
→ You forgot to update `SERVER_URL` in the Squarespace header code. See Step 2.

**No events showing in Meta Events Manager**
→ Events can take up to 20 minutes to appear. Wait and refresh.

**CORS errors in browser console**
→ Make sure your server's allowed origins include your exact domain.

**Form submission not being tracked**
→ Squarespace uses AJAX forms. The code already handles this via MutationObserver, but if your form has a unique structure, let me know.

**Server returns 500 error**
→ Check that your META_ACCESS_TOKEN is correct and hasn't expired. You can regenerate it in Meta Events Manager → Settings → Generate Access Token.

---

## 💡 Tips

- **Event Deduplication**: Each event gets a unique `event_id` shared between the Pixel and Conversions API. Meta automatically deduplicates them — you'll see matched events in Events Manager.
- **Ad Optimization**: Once you have enough Lead events (aim for 50+ per week), you can optimize your ad campaigns for "Lead" conversions.
- **Keep the server running**: If you're using a free tier, the server may sleep after inactivity. Railway's free tier includes 500 hours/month which is enough. Render's free tier may sleep after 15 minutes of inactivity.
