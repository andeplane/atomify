"""Firebase Admin SDK initialization and token verification."""

import asyncio
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials

from atomify_api.config import get_settings


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    """Initialize and cache the Firebase Admin SDK app.

    Uses Application Default Credentials (ADC) when GOOGLE_APPLICATION_CREDENTIALS
    is set, or explicit service account file path.
    """
    settings = get_settings()

    if settings.google_application_credentials:
        cred = credentials.Certificate(settings.google_application_credentials)
    else:
        # Use Application Default Credentials
        cred = credentials.ApplicationDefault()

    try:
        return firebase_admin.get_app()
    except ValueError:
        return firebase_admin.initialize_app(
            cred,
            {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None,
        )


def _verify_token_sync(token: str) -> dict[str, Any]:
    """Synchronous token verification (called from thread pool)."""
    get_firebase_app()  # Ensure app is initialized
    return auth.verify_id_token(token)


async def verify_firebase_token(token: str) -> dict[str, Any]:
    """Verify a Firebase ID token asynchronously.

    The firebase-admin SDK is synchronous, so we run verification
    in a thread pool to avoid blocking the event loop.

    Args:
        token: The Firebase ID token to verify.

    Returns:
        The decoded token claims if valid.

    Raises:
        firebase_admin.auth.InvalidIdTokenError: If the token is invalid.
        firebase_admin.auth.ExpiredIdTokenError: If the token has expired.
        firebase_admin.auth.RevokedIdTokenError: If the token has been revoked.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _verify_token_sync, token)

