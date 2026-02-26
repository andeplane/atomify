"""Async SQLAlchemy database engine and session management."""

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from atomify_api.config import get_settings

# Lazy initialization - engine created on first use
_engine = None
_async_session_factory = None


def get_engine():
    """Get or create the async database engine."""
    global _engine
    if _engine is None:
        settings = get_settings()

        # Ensure the database directory exists for SQLite
        if settings.database_url.startswith("sqlite"):
            # Extract path from URL (sqlite+aiosqlite:///./path.db)
            db_path = settings.database_url.split("///")[-1]
            if db_path.startswith("/"):
                # Absolute path
                Path(db_path).parent.mkdir(parents=True, exist_ok=True)
            elif db_path != ":memory:":
                # Relative path
                Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            future=True,
        )
    return _engine


def get_session_factory():
    """Get or create the async session factory."""
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_factory


async def init_db() -> None:
    """Initialize the database, creating tables if they don't exist.

    Note: In production, use Alembic migrations instead.
    """
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
