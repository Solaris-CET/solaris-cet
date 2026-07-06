"""Survey offline PWA hints — technician field mode (D1)."""

from __future__ import annotations

SCHEMA_ID = "solaris-survey-offline-v1"

PREFETCH_URLS = [
    "/survey",
    "/offline-ro.html",
    "/offline-image.svg",
    "/icon-192.png",
    "/icon-512.png",
    "/manifest.json",
]


def offline_hints() -> dict:
    return {
        "schema": SCHEMA_ID,
        "prefetch_urls": PREFETCH_URLS,
        "queue_supported": True,
        "indexeddb_schema": "solaris-survey-v1",
        "draft_autosave_ms": 600,
        "max_queue_items": 20,
        "offline_queue_store": "queue",
        "offline_draft_store": "drafts",
    }


def offline_status() -> dict:
    return {
        "schema": "solaris-survey-offline-status-v1",
        "offline_schema": SCHEMA_ID,
        "engine_hints_available": True,
    }