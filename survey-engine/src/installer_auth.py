"""Installer API key validation for survey endpoints."""

from __future__ import annotations

import json
import os
from typing import Optional


def _load_keys() -> dict[str, str]:
    raw = os.environ.get("INSTALLER_API_KEYS", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return {str(k): str(v) for k, v in data.items()}
    except json.JSONDecodeError:
        pass
    return {}


def keys_configured() -> bool:
    return bool(_load_keys())


def validate_installer_key(api_key: Optional[str]) -> Optional[str]:
    """Return installer_id if key valid, else None. Empty config = auth disabled."""
    keys = _load_keys()
    if not keys:
        return None
    if not api_key:
        return None
    for installer_id, secret in keys.items():
        if secret == api_key:
            return installer_id
    return None


def require_key_if_configured(api_key: Optional[str]) -> tuple[bool, str]:
    """(ok, installer_id_or_error_message)"""
    keys = _load_keys()
    if not keys:
        return True, ""
    installer_id = validate_installer_key(api_key)
    if installer_id:
        return True, installer_id
    return False, "Cheie API instalator invalidă sau lipsă (header X-Installer-Key)"