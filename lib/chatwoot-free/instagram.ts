// lib/chatwoot-free/instagram.ts - Official Instagram Graph API v21.0 Only (MIT / Safe / No Ban)

export class InstagramOfficialConnector {
  static async sendDM(igId: string, senderId: string, text: string, token: string) {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text }
      })
    });
    return res.json();
  }

  static async publishFeed(igId: string, imageUrl: string, caption: string, token: string) {
    const mediaRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${token}`, { method: 'POST' });
    const { id: creationId } = await mediaRes.json();
    const pubRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish?creation_id=${creationId}&access_token=${token}`, { method: 'POST' });
    return pubRes.json();
  }

  static async publishReel(igId: string, videoUrl: string, caption: string, token: string) {
    const mediaRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${token}`, { method: 'POST' });
    const { id: creationId } = await mediaRes.json();
    const pubRes = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish?creation_id=${creationId}&access_token=${token}`, { method: 'POST' });
    return pubRes.json();
  }
}
