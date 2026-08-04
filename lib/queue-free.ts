// Free 100% Queue - Vercel Cron + Storage - $0 (No QStash)

export async function processQueueJob(job: any) {
  try {
    console.log('[QueueFree] Processing job:', job.id);
    return { status: 'success', id: job.id };
  } catch (e: any) {
    console.error('[QueueFree] Job error:', e);
    return { status: 'failed', error: e.message };
  }
}
