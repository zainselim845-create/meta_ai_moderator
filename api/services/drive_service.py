# Drive & URL utilities for meta_ai_moderator
import re

def drive_file_id(url):
    """Extract Google Drive file ID from standard or shortened share URLs."""
    if not url:
        return ""
    url = str(url).strip()
    m = (
        re.search(r"/file/(?:u/\d+/)?d/([A-Za-z0-9_-]+)", url) or
        re.search(r"/folders/(?:u/\d+/)?([A-Za-z0-9_-]+)", url) or
        re.search(r"[?&]id=([A-Za-z0-9_-]+)", url) or
        re.search(r"/d/([A-Za-z0-9_-]+)", url)
    )
    return m.group(1) if m else ""

def drive_to_direct(url):
    """Convert Google Drive share URL to direct download URL suitable for Meta API ingestion."""
    fid = drive_file_id(url)
    if fid:
        return f"https://drive.google.com/uc?export=download&id={fid}&confirm=t"
    return url or ""

def extract_post_id_from_url(url):
    """Extract Post / Reel ID from Facebook or Instagram URLs."""
    if not url:
        return None
    url = str(url).strip()
    m = re.search(r'(?:posts/|story\.php\?story_fbid=|fbid=|p/|reel/|videos/|groups/[^/]+/posts/|\?v=|[?&]v=)(?:pfbid0)?([a-zA-Z0-9_-]+)', url)
    if m:
        return m.group(1).rstrip('/')
    m2 = re.search(r'([0-9]{6,20})', url)
    return m2.group(1) if m2 else None
