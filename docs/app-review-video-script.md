# 🎥 Meta App Review Video Recording Script & Justifications

## 1. 3-Minute Screen Recording Script

**[0:00 - 0:20] Introduction:**
"Hello Meta Review Team, this is Domya Marketing Agency. Our app Domya AI Moderator helps businesses manage Facebook and Instagram messages with AI. I will show you how we use each permission."

**[0:20 - 0:50] pages_show_list + pages_read_engagement + pages_manage_metadata:**
- Open `https://metaaimoderator.vercel.app/`
- Click "ربط Meta OAuth 🌐"
- Show Facebook Page selection dialog (`Domya Marketing Agency`)
- Complete authorization and return to dashboard
- Voiceover: *"We use pages_show_list to list user's pages, pages_read_engagement to read comments, pages_manage_metadata to get page info."*

**[0:50 - 1:30] pages_messaging:**
- Open Facebook Messenger as customer and send a message ("بكام إدارة الصفحة؟")
- Show message arriving in dashboard Inbox
- Show AI draft reply suggestion
- Click "موافقة وإرسال الآن 🚀"
- Show reply delivered in Messenger
- Voiceover: *"We use pages_messaging to read and reply to Facebook DMs with AI assistance and human approval."*

**[1:30 - 2:20] instagram_basic + instagram_manage_messages + instagram_manage_comments:**
- Send an Instagram DM to Domya Instagram Business account
- Show DM arriving under Instagram filter
- Reply to DM
- Comment on Instagram post ("بكام؟")
- Show comment arriving in dashboard + AI suggested reply
- Voiceover: *"We use instagram_basic to get IG account, instagram_manage_messages for IG DMs, instagram_manage_comments for IG comments, with same AI + human approval flow."*

**[2:20 - 2:50] Demonstrating Human Approval Mode:**
- Open Settings > Mode
- Show "مراجعة وموافقة الإدارة أولاً" (Manual Approval Mode)
- Voiceover: *"We never auto-reply without human review in manual mode. Every AI draft requires admin approval before sending. This prevents spam."*

**[2:50 - 3:00] Conclusion:**
- Open `https://metaaimoderator.vercel.app/privacy`
- Voiceover: *"We store messages encrypted for 90 days only, user can delete anytime. Privacy policy is at /privacy."*

---

## 2. Permission Justification Answers for App Review Form

### `pages_messaging`
> "Our app provides a unified inbox for Facebook Page DMs. When a user messages the Page, we receive it via webhook, generate an AI draft using a custom knowledge base, show it to the Page Admin in the dashboard for review, and send the reply only after the admin clicks Approve. Video at 0:50 shows this flow. We need this to help businesses respond faster with AI assistance while maintaining human oversight."

### `instagram_manage_messages`
> "Same as pages_messaging but for Instagram Business DMs. We receive via Instagram webhook (`object=instagram`, `field=messages`), show in the IG filter tab, generate an AI draft, and require admin approval before sending. Video at 1:30 shows the IG DM flow. Official Graph API v21.0 only."

### `instagram_manage_comments`
> "We receive Instagram comments via webhook (`object=instagram`, `field=comments`), show them in our unified dashboard, generate short public replies + optional private DM replies. The admin approves before sending. Video at 1:50 shows this flow."

### `pages_read_engagement`, `pages_show_list`, `pages_manage_metadata`, `instagram_basic`
> "We need these to list the user's Pages and linked IG Business Accounts and read initial metadata to display the inbox. Basic permissions for core app functionality."
