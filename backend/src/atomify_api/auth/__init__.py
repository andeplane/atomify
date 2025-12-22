"""Authentication module using Firebase Admin SDK."""

from atomify_api.auth.firebase import verify_firebase_token
from atomify_api.auth.middleware import get_current_user

__all__ = ["verify_firebase_token", "get_current_user"]

