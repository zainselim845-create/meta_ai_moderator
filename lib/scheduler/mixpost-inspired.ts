// lib/scheduler/mixpost-inspired.ts - Mixpost Open Source Inspired Social Media Publisher (MIT)

export interface ScheduledPost {
  id: string;
  caption: string;
  mediaUrl?: string;
  channels: ('facebook' | 'instagram' | 'instagram-reel-dual')[];
  scheduledAt: string;
  pageId: string;
  igId?: string;
  token: string;
}

export async function publishScheduledPost(post: ScheduledPost) {
  const results: any = {};
  
  if (post.channels.includes('facebook')) {
    const fbRes = await fetch(`https://graph.facebook.com/v21.0/${post.pageId}/feed?message=${encodeURIComponent(post.caption)}&link=${encodeURIComponent(post.mediaUrl || '')}&access_token=${post.token}`, { method: 'POST' });
    results.facebook = await fbRes.json();
  }

  if (post.channels.includes('instagram') && post.igId) {
    const igRes = await fetch(`https://graph.facebook.com/v21.0/${post.igId}/media?image_url=${encodeURIComponent(post.mediaUrl || '')}&caption=${encodeURIComponent(post.caption)}&access_token=${post.token}`, { method: 'POST' });
    const { id: creationId } = await igRes.json();
    if (creationId) {
      const pubRes = await fetch(`https://graph.facebook.com/v21.0/${post.igId}/media_publish?creation_id=${creationId}&access_token=${post.token}`, { method: 'POST' });
      results.instagram = await pubRes.json();
    }
  }

  return results;
}
