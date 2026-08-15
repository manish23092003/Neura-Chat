# SendGrid Email Setup Guide

## ✅ Quick Setup (5 Minutes)

SendGrid is **easier** than Gmail and offers **100 free emails per day**!

### Step 1: Create SendGrid Account

1. **Go to:** https://signup.sendgrid.com/
2. **Fill in the form:**
   - Email: Your email address
   - Password: Create a strong password
   - Click "Create Account"
3. **Verify your email** (check your inbox)
4. **Complete the onboarding:**
   - Select "Integrate using our Web API or SMTP Relay"
   - Choose "Web API"
   - Select "Node.js"

### Step 2: Create API Key

1. **After login**, you'll be on the dashboard
2. **Click:** Settings → API Keys (or go to https://app.sendgrid.com/settings/api_keys)
3. **Click:** "Create API Key"
4. **Enter details:**
   - Name: `NeuraChat`
   - Permission: Select "Full Access"
5. **Click:** "Create & View"
6. **IMPORTANT:** Copy the API key (starts with `SG.`)
   - You won't be able to see it again!
   - Save it somewhere safe

### Step 3: Verify Sender Email (Important!)

SendGrid requires you to verify the email address you'll send from:

1. **Go to:** Settings → Sender Authentication
2. **Click:** "Verify a Single Sender"
3. **Fill in the form:**
   - From Name: `NeuraChat`
   - From Email: `manishsoni135790@gmail.com` (or any email you own)
   - Reply To: Same as From Email
   - Company Address: Any address
   - City, State, Zip, Country: Your details
4. **Click:** "Create"
5. **Check your email** and click the verification link

### Step 4: Update `.env` File

Open `backend/.env` and add:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM=manishsoni135790@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Replace:**
- `SG.your-api-key-here` with your actual SendGrid API key
- `manishsoni135790@gmail.com` with the email you verified in Step 3

### Step 5: Restart Backend Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Step 6: Test It!

1. Go to http://localhost:5173/forgot-password
2. Enter any email address
3. Click "Send Reset Link"
4. **Check the email inbox!** 📬

---

## 🎯 Quick Checklist

- [ ] Create SendGrid account at https://signup.sendgrid.com/
- [ ] Verify your email
- [ ] Create API Key with "Full Access"
- [ ] Copy the API key (starts with SG.)
- [ ] Verify sender email address
- [ ] Add `SENDGRID_API_KEY` to `.env`
- [ ] Add `EMAIL_FROM` to `.env`
- [ ] Restart backend server
- [ ] Test password reset
- [ ] Check email inbox!

---

## 📧 What Your `.env` Should Look Like

```env
# Database
MONGODB_URI=your_mongodb_connection_string
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key

# SendGrid Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=manishsoni135790@gmail.com
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
```

---

## 🔍 Troubleshooting

### "Failed to send email"

**Check:**
1. Is the API key correct in `.env`?
2. Did you verify the sender email?
3. Did you restart the backend server?
4. Check backend console for error details

### Email goes to spam

- This is normal for new SendGrid accounts
- Check spam/junk folder
- After sending a few emails, deliverability improves

### "Sender email not verified"

- Go to: https://app.sendgrid.com/settings/sender_auth
- Verify your sender email
- Use the exact same email in `EMAIL_FROM`

---

## 💡 Why SendGrid is Better Than Gmail

| Feature | SendGrid | Gmail |
|---------|----------|-------|
| Setup Difficulty | ✅ Easy | ❌ Complex (App Password) |
| Free Tier | ✅ 100 emails/day | ❌ Limited |
| Deliverability | ✅ Excellent | ⚠️ May go to spam |
| 2FA Required | ❌ No | ✅ Yes |
| Email Analytics | ✅ Yes | ❌ No |

---

## 🚀 You're All Set!

Once configured, your password reset emails will:
- ✅ Be sent to real email addresses
- ✅ Look professional with HTML template
- ✅ Include working reset links
- ✅ Expire after 1 hour for security

**Need help?** Let me know if you get stuck on any step!

