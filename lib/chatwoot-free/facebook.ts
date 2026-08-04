// lib/chatwoot-free/facebook.ts - Chatwoot Official Facebook Graph API v21.0 Connector (MIT)

export class FacebookOfficialConnector {
  static getAppId() {
    return process.env.NEXT_PUBLIC_FB_APP_ID || "1331918902446123";
  }

  static getLoginUrl(state: string) {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'business_management'
    ].join(',');

    const redirectUri = process.env.NEXT_PUBLIC_FB_REDIRECT || 'https://metaaimoderator.vercel.app/api/oauth/callback';
    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${this.getAppId()}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;
  }

  static async getPages(longLivedToken: string) {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`);
    const data = await res.json();
    if (!data.data) return [];

    return Promise.all(data.data.map(async (page: any) => {
      try {
        const igRes = await fetch(`https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,name}&access_token=${longLivedToken}`);
        const igData = await igRes.json();
        return {
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          picture: `https://graph.facebook.com/${page.id}/picture`,
          ig_account: igData.instagram_business_account || null,
          perms: page.perms,
          category: page.category
        };
      } catch (e) {
        return {
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          picture: `https://graph.facebook.com/${page.id}/picture`,
          ig_account: null,
          perms: page.perms,
          category: page.category
        };
      }
    }));
  }

  static async sendMessage(pageId: string, senderId: string, text: string, token: string) {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text },
        messaging_type: 'RESPONSE'
      })
    });
    return res.json();
  }
}
