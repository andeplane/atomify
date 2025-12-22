"""Authentication middleware and dependencies."""

import logging
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from atomify_api.auth.firebase import verify_firebase_token

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


class CurrentUser:
    """Represents the currently authenticated user from Firebase token."""

    def __init__(self, token_claims: dict[str, Any]) -> None:
        self.uid: str = token_claims["uid"]
        self.email: str | None = token_claims.get("email")
        self.email_verified: bool = token_claims.get("email_verified", False)
        self.name: str | None = token_claims.get("name")
        self.picture: str | None = token_claims.get("picture")
        self.claims = token_claims


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> CurrentUser:
    """Dependency that extracts and verifies the current user from Bearer token.

    Args:
        credentials: The HTTP Authorization credentials.

    Returns:
        CurrentUser object with decoded token claims.

    Raises:
        HTTPException: If no token provided or token is invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        claims = await verify_firebase_token(token)
        return CurrentUser(claims)
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except Exception:
        # Log full error server-side; return generic message to client
        logger.exception("Unexpected error during token validation")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> CurrentUser | None:
    """Dependency for optional authentication.

    Returns None if no token provided, or CurrentUser if valid token.
    Still raises error for invalid tokens.
    """
    if credentials is None:
        return None

    return await get_current_user(credentials)

