// Free 100% - LRU In-Memory Cache - $0 (No Upstash Redis)

export class LRUCache {
  private cache = new Map<string, { value: any, expiry: number }>()
  private maxSize = 1000

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  set(key: string, value: any, ttlSeconds: number) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, { value, expiry: Date.now() + ttlSeconds*1000 })
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

export const freeCache = new LRUCache()

export async function withFreeCache<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const cached = freeCache.get(key)
  if (cached) {
    return cached
  }
  const fresh = await fn()
  if (fresh !== null && fresh !== undefined) {
    freeCache.set(key, fresh, ttlSeconds)
  }
  return fresh
}
