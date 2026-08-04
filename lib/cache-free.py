import time
import threading
import collections

class FreeLRUCache:
    """
    $0 Free Tier In-Memory LRU Cache with TTL Eviction & Thread Lock.
    Reduces database/RAG latency by up to 90%.
    """
    def __init__(self, maxsize=512, ttl=300):
        self.maxsize = maxsize
        self.ttl = ttl
        self.cache = collections.OrderedDict()
        self.lock = threading.Lock()

    def get(self, key, default=None):
        with self.lock:
            if key not in self.cache:
                return default
            val, expire = self.cache[key]
            if expire is not None and time.time() > expire:
                del self.cache[key]
                return default
            self.cache.move_to_end(key)
            return val

    def set(self, key, value, ttl=None):
        with self.lock:
            ttl_val = ttl if ttl is not None else self.ttl
            expire = (time.time() + ttl_val) if ttl_val is not None else None
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = (value, expire)
            if len(self.cache) > self.maxsize:
                self.cache.popitem(last=False)

    def delete(self, key):
        with self.lock:
            if key in self.cache:
                del self.cache[key]

    def clear(self):
        with self.lock:
            self.cache.clear()

def with_free_cache(cache_instance, key_prefix, ttl=300):
    """
    Decorator for caching function return values in memory.
    """
    def decorator(fn):
        def wrapper(*args, **kwargs):
            key = f"{key_prefix}:" + ":".join(map(str, args))
            cached = cache_instance.get(key)
            if cached is not None:
                return cached
            res = fn(*args, **kwargs)
            if res is not None:
                cache_instance.set(key, res, ttl=ttl)
            return res
        return wrapper
    return decorator
