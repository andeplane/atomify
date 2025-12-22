"""Simple test endpoint to verify database connectivity."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, SQLModel, select

from atomify_api.db.database import get_session


# Simple test model
class TestRecord(SQLModel, table=True):
    """Simple test record for database verification."""

    __tablename__ = "test_records"

    id: int | None = Field(default=None, primary_key=True)
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TestInput(BaseModel):
    """Input for test endpoint."""

    message: str


class TestOutput(BaseModel):
    """Output from test endpoint."""

    id: int
    message: str
    created_at: datetime


router = APIRouter(tags=["test"])


@router.post("/test", response_model=TestOutput)
async def create_test_record(
    data: TestInput,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TestRecord:
    """Store a test record in the database."""
    record = TestRecord(message=data.message)
    session.add(record)
    await session.flush()
    await session.refresh(record)
    return record


@router.get("/test", response_model=list[TestOutput])
async def get_test_records(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TestRecord]:
    """Retrieve all test records from the database."""
    result = await session.execute(select(TestRecord).order_by(TestRecord.id.desc()))  # type: ignore[union-attr]
    return list(result.scalars().all())

