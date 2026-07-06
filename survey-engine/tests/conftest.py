"""Shared pytest fixtures for survey-engine."""

import pytest
from fastapi.testclient import TestClient

from src.server import app


@pytest.fixture
def client():
    return TestClient(app)