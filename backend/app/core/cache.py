"""
Centralized high-performance thread-safe caching layer for reference and read-heavy data.
Supports TTL expiration, tag-based cache invalidation, and seamless fallback.
"""

import time
import threading
from typing import Any, Optional, Dict, Tuple, List, Callable
from functools import wraps

class AppCache:
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expiry_timestamp)
        self._tag_map: Dict[str, set] = {}             # tag -> set of keys
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            val, expiry = self._cache[key]
            if expiry is not None and time.time() > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: Optional[int] = 300, tags: Optional[List[str]] = None, ttl_seconds: Optional[int] = None) -> None:
        effective_ttl = ttl_seconds if ttl_seconds is not None else ttl
        expiry = (time.time() + effective_ttl) if effective_ttl is not None else None
        with self._lock:
            self._cache[key] = (value, expiry)
            if tags:
                for tag in tags:
                    if tag not in self._tag_map:
                        self._tag_map[tag] = set()
                    self._tag_map[tag].add(key)

    def invalidate_key(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)

    def invalidate_tag(self, tag: str) -> None:
        """Invalidates all cached items associated with a given tag."""
        with self._lock:
            keys_to_remove = self._tag_map.pop(tag, set())
            for k in keys_to_remove:
                self._cache.pop(k, None)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._tag_map.clear()

    def invalidate_all(self) -> None:
        self.clear()

    def cleanup_expired(self) -> None:
        """Periodic cleanup of expired entries to prevent memory growth."""
        now = time.time()
        with self._lock:
            expired_keys = [k for k, (_, exp) in self._cache.items() if exp is not None and now > exp]
            for k in expired_keys:
                del self._cache[k]

# Global singleton cache instance
cache = AppCache()
app_cache = cache

def cached(key_prefix: str, ttl: int = 300, tag: Optional[str] = None):
    """
    Decorator to cache function results by key_prefix and arguments.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Compute cache key from prefix and simple serializable arguments
            arg_str = "_".join(str(a) for a in args[1:]) if len(args) > 1 else ""
            kw_str = "_".join(f"{k}={v}" for k, v in sorted(kwargs.items()) if k != "db")
            cache_key = f"{key_prefix}:{arg_str}:{kw_str}".rstrip(":")
            
            cached_val = cache.get(cache_key)
            if cached_val is not None:
                return cached_val
            
            result = func(*args, **kwargs)
            tags = [tag] if tag else None
            cache.set(cache_key, result, ttl=ttl, tags=tags)
            return result
        return wrapper
    return decorator
