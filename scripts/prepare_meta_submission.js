const fs = require('fs');
const path = require('path');

const youtubeLink = 'https://www.youtube.com/watch?v=UNLISTED_DEMO_VIDEO';

const submission = {
  app_id: '1331918902446123',
  app_name: 'Domya AI Moderator',
  app_url: 'https://metaaimoderator.vercel.app/',
  permissions: [
    {
      name: 'pages_messaging',
      justification: `Our app provides a unified inbox for Facebook Page DMs. When a user messages the Page, we receive it via official webhook, generate an AI draft using a custom knowledge base, show it to the Page Admin in the dashboard for review, and send the reply only after the admin clicks Approve. Video at 0:50 shows this flow. We need this to help businesses respond faster with AI assistance while maintaining human oversight.`,
      video_url: youtubeLink,
      how_to_test: '1. Send DM to Page Domya Marketing Agency 2. Check dashboard inbox 3. See AI draft 4. Click Approve 5. Reply appears in Messenger'
    },
    {
      name: 'pages_read_engagement',
      justification: `We need to read comments on Page posts to display them in the unified inbox and generate AI draft replies for admin review. Video at 0:20 shows Page connection and comment reading flow.`,
      video_url: youtubeLink
    },
    {
      name: 'pages_manage_metadata',
      justification: `We need to retrieve Page metadata and info to display connected business entities cleanly in the dashboard workspace. Basic metadata for core functionality.`,
      video_url: youtubeLink
    },
    {
      name: 'pages_show_list',
      justification: `We need to list user's Facebook Pages during OAuth login so Page Admins can choose which Page to connect to the moderator dashboard. Video at 0:20 shows the selection list.`,
      video_url: youtubeLink
    },
    {
      name: 'instagram_basic',
      justification: `We need to retrieve the Instagram Business Account linked to the Facebook Page during official OAuth login. Video at 1:30 shows Instagram account linking via official Meta OAuth.`,
      video_url: youtubeLink
    },
    {
      name: 'instagram_manage_messages',
      justification: `Same as pages_messaging but for Instagram Business DMs. We receive via Instagram webhook (object=instagram, field=messages), show in the IG filter tab, generate an AI draft, and require admin approval before sending. Video at 1:30 shows the IG DM flow. Official Graph API v21.0 only.`,
      video_url: youtubeLink
    },
    {
      name: 'instagram_manage_comments',
      justification: `We receive Instagram comments via webhook (object=instagram, field=comments), show them in our unified dashboard, and generate short public replies + optional private DM replies. The admin approves both before sending. Video at 1:50 shows comment to DM conversion.`,
      video_url: youtubeLink
    }
  ],
  urls: {
    privacy_policy: 'https://metaaimoderator.vercel.app/privacy',
    terms_of_service: 'https://metaaimoderator.vercel.app/terms',
    data_deletion: 'https://metaaimoderator.vercel.app/api/data-deletion',
    deletion_status: 'https://metaaimoderator.vercel.app/deletion-status',
    oauth_redirect: 'https://metaaimoderator.vercel.app/api/oauth/callback'
  },
  youtube_unlisted_url: youtubeLink
};

fs.writeFileSync(path.join(__dirname, '../video_output/meta_submission_payload.json'), JSON.stringify(submission, null, 2));
console.log('✅ META SUBMISSION PAYLOAD READY: video_output/meta_submission_payload.json');
