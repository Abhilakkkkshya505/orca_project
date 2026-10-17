import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Abstract model providing self-updating created_at and updated_at fields."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PublicIdModel(models.Model):
    """Abstract model exposing an immutable UUIDv4 public_id to external clients."""

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)

    class Meta:
        abstract = True
