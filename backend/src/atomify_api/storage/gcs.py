"""Async Google Cloud Storage client wrapper."""

import asyncio
from datetime import timedelta
from typing import Any, BinaryIO

from gcloud.aio.storage import Storage
from google.cloud import storage as sync_storage

from atomify_api.config import get_settings


class GCSClient:
    """Async wrapper for Google Cloud Storage operations."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._storage: Storage | None = None
        self._sync_client: sync_storage.Client | None = None

    async def _get_storage(self) -> Storage:
        """Get or create the async storage client."""
        if self._storage is None:
            self._storage = Storage()
        return self._storage

    def _get_sync_client(self) -> sync_storage.Client:
        """Get or create the sync storage client (for signed URLs)."""
        if self._sync_client is None:
            self._sync_client = sync_storage.Client()
        return self._sync_client

    @property
    def bucket_name(self) -> str:
        """Get the configured bucket name."""
        if self.settings.gcs_bucket_name is None:
            raise ValueError("GCS_BUCKET_NAME environment variable is not set")
        return self.settings.gcs_bucket_name

    async def upload_file(
        self,
        file_path: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload a file to GCS.

        Args:
            file_path: The path within the bucket (e.g., "users/uid/file.txt").
            content: The file content as bytes.
            content_type: MIME type of the file.

        Returns:
            The full GCS path (gs://bucket/path).
        """
        storage = await self._get_storage()
        await storage.upload(
            self.bucket_name,
            file_path,
            content,
            content_type=content_type,
        )
        return f"gs://{self.bucket_name}/{file_path}"

    async def upload_from_file(
        self,
        file_path: str,
        file_obj: BinaryIO,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload from a file-like object.

        Streams the file directly to GCS to avoid loading entire file into memory.

        Args:
            file_path: The path within the bucket.
            file_obj: File-like object to upload.
            content_type: MIME type of the file.

        Returns:
            The full GCS path.
        """
        storage = await self._get_storage()
        await storage.upload(
            self.bucket_name,
            file_path,
            file_obj,
            content_type=content_type,
        )
        return f"gs://{self.bucket_name}/{file_path}"

    async def download_file(self, file_path: str) -> bytes:
        """Download a file from GCS.

        Args:
            file_path: The path within the bucket.

        Returns:
            The file content as bytes.
        """
        storage = await self._get_storage()
        return await storage.download(self.bucket_name, file_path)

    async def delete_file(self, file_path: str) -> None:
        """Delete a file from GCS.

        Args:
            file_path: The path within the bucket.
        """
        storage = await self._get_storage()
        await storage.delete(self.bucket_name, file_path)

    async def file_exists(self, file_path: str) -> bool:
        """Check if a file exists in GCS.

        Args:
            file_path: The path within the bucket.

        Returns:
            True if the file exists, False otherwise.
        """
        storage = await self._get_storage()
        try:
            await storage.download_metadata(self.bucket_name, file_path)
            return True
        except Exception:
            return False

    def _generate_signed_url_sync(
        self,
        file_path: str,
        expiration: timedelta,
        method: str,
    ) -> str:
        """Generate signed URL synchronously (called from thread pool)."""
        client = self._get_sync_client()
        bucket = client.bucket(self.bucket_name)
        blob = bucket.blob(file_path)
        return blob.generate_signed_url(
            expiration=expiration,
            method=method,
            version="v4",
        )

    async def get_signed_url(
        self,
        file_path: str,
        expiration: timedelta = timedelta(hours=1),
        method: str = "GET",
    ) -> str:
        """Generate a signed URL for temporary file access.

        Args:
            file_path: The path within the bucket.
            expiration: How long the URL should be valid.
            method: HTTP method (GET for download, PUT for upload).

        Returns:
            A signed URL string.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            self._generate_signed_url_sync,
            file_path,
            expiration,
            method,
        )

    async def list_files(self, prefix: str = "") -> list[str]:
        """List files in the bucket with optional prefix.

        Args:
            prefix: Filter files by prefix (e.g., "users/uid/").

        Returns:
            List of file paths.
        """
        storage = await self._get_storage()
        result = await storage.list_objects(self.bucket_name, params={"prefix": prefix})
        items: list[dict[str, Any]] = result.get("items", [])
        return [item["name"] for item in items]

    async def close(self) -> None:
        """Close the storage client."""
        if self._storage is not None:
            await self._storage.close()
            self._storage = None
        self._sync_client = None


# Global client instance (lazy initialized)
_gcs_client: GCSClient | None = None


def get_gcs_client() -> GCSClient:
    """Get or create the global GCS client."""
    global _gcs_client
    if _gcs_client is None:
        _gcs_client = GCSClient()
    return _gcs_client

