"""
Rate Limiting and Middleware Module
Protects APIs from abuse and implements security headers
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from collections import defaultdict
import time
from typing import Callable, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiting service using in-memory store"""

    def __init__(self):
        # Store: {identifier: [(timestamp, count)]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.max_requests = 100  # Max requests
        self.window_seconds = 60  # Time window

    def is_allowed(
        self,
        identifier: str,
        max_requests: int = None,
        window_seconds: int = None
    ) -> Tuple[bool, Dict]:
        """Check if request is allowed"""
        max_requests = max_requests or self.max_requests
        window_seconds = window_seconds or self.window_seconds
        
        now = time.time()
        cutoff = now - window_seconds

        # Remove old requests
        self.requests[identifier] = [
            (ts, count) for ts, count in self.requests[identifier]
            if ts > cutoff
        ]

        # Count current requests
        total_requests = sum(count for _, count in self.requests[identifier])

        if total_requests >= max_requests:
            reset_time = min(
                (ts + window_seconds for ts, _ in self.requests[identifier]),
                default=now + window_seconds
            )
            return False, {
                "remaining": 0,
                "reset_at": int(reset_time),
                "limit": max_requests
            }

        # Record this request
        if self.requests[identifier]:
            self.requests[identifier][-1] = (
                self.requests[identifier][-1][0],
                self.requests[identifier][-1][1] + 1
            )
        else:
            self.requests[identifier].append((now, 1))

        return True, {
            "remaining": max_requests - total_requests - 1,
            "reset_at": int(now + window_seconds),
            "limit": max_requests
        }

    def cleanup_old_records(self):
        """Clean up old records periodically"""
        now = time.time()
        cutoff = now - (self.window_seconds * 2)
        for identifier in list(self.requests.keys()):
            self.requests[identifier] = [
                (ts, count) for ts, count in self.requests[identifier]
                if ts > cutoff
            ]
            if not self.requests[identifier]:
                del self.requests[identifier]


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next: Callable):
    """Middleware to apply rate limiting"""
    # Identify user by IP or user ID if authenticated
    identifier = request.client.host if request.client else "unknown"
    if hasattr(request.state, "user_id"):
        identifier = f"user:{request.state.user_id}"

    # Check rate limit
    allowed, limit_info = rate_limiter.is_allowed(identifier)

    if not allowed:
        logger.warning(f"Rate limit exceeded for {identifier}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Too many requests",
                "retry_after": limit_info["reset_at"]
            },
            headers={
                "X-RateLimit-Limit": str(limit_info["limit"]),
                "X-RateLimit-Remaining": str(limit_info["remaining"]),
                "X-RateLimit-Reset": str(limit_info["reset_at"]),
                "Retry-After": str(int(limit_info["reset_at"] - time.time()))
            }
        )

    response = await call_next(request)

    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(limit_info["limit"])
    response.headers["X-RateLimit-Remaining"] = str(limit_info["remaining"])
    response.headers["X-RateLimit-Reset"] = str(limit_info["reset_at"])

    return response


async def security_headers_middleware(request: Request, call_next: Callable):
    """Add security headers to all responses"""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response


class EndpointRateLimiter:
    """Per-endpoint rate limiting configuration"""

    # Endpoint specific limits: {endpoint: (max_requests, window_seconds)}
    LIMITS = {
        "/auth/login": (5, 60),          # 5 requests per minute
        "/auth/register": (3, 60),       # 3 requests per minute
        "/api/match": (100, 60),         # 100 requests per minute
        "/api/recommend": (100, 60),
        "/api/upload": (10, 3600),       # 10 uploads per hour
    }

    @staticmethod
    def get_limit(endpoint: str) -> Tuple[int, int]:
        """Get rate limit for specific endpoint"""
        return EndpointRateLimiter.LIMITS.get(
            endpoint,
            (100, 60)  # Default: 100 per minute
        )
