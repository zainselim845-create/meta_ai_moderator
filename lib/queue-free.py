import time
import threading
from collections import deque

class FreeWebhookQueue:
    """
    $0 Free Tier Webhook Queue & Background Worker.
    Ensures Meta Webhook POST returns HTTP 200 in <100ms.
    """
    def __init__(self, max_items=1000):
        self.queue = deque(maxlen=max_items)
        self.lock = threading.Lock()

    def enqueue(self, payload):
        with self.lock:
            self.queue.append({
                "payload": payload,
                "timestamp": time.time(),
                "processed": False
            })

    def pop_batch(self, batch_size=10):
        with self.lock:
            batch = []
            while self.queue and len(batch) < batch_size:
                batch.append(self.queue.popleft())
            return batch

    def size(self):
        with self.lock:
            return len(self.queue)

webhook_queue = FreeWebhookQueue()
