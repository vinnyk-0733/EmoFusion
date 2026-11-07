"""
Core infrastructure: configuration, database connectivity, and cross-cutting constants.
"""
from app.core.config import settings
from app.core.database import db

__all__ = ["settings", "db"]

