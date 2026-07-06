"""Tests for photo analysis pipeline."""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.api_clients.deepseek import DeepSeekClient, DeepSeekError
from src.models import PhotoCategory
from src.photo_analyzer import (
    PhotoAnalyzer,
    guess_category,
    list_photos,
    load_prompt,
    parse_photo_analysis,
)


def test_load_prompt_exists():
    prompt = load_prompt()
    assert "JSON" in prompt
    assert len(prompt) > 200


def test_guess_category_from_filename():
    assert guess_category("roof_overview_01.jpg") == PhotoCategory.ROOF_OVERVIEW
    assert guess_category("tablou_electric.png") == PhotoCategory.ELECTRICAL_PANEL
    assert guess_category("random.jpg") == PhotoCategory.OTHER


def test_list_photos(tmp_path: Path):
    (tmp_path / "a.jpg").write_bytes(b"fake")
    (tmp_path / "b.png").write_bytes(b"fake")
    (tmp_path / "skip.txt").write_text("no")
    photos = list_photos(tmp_path)
    assert len(photos) == 2


def test_list_photos_empty_raises(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        list_photos(tmp_path)


def test_parse_photo_analysis(tmp_path: Path):
    img = tmp_path / "roof.jpg"
    img.write_bytes(b"x")
    data = {
        "photo_id": "P001",
        "category": "roof_overview",
        "findings": ["Acoperiș orientat sud"],
        "issues": [],
        "actionable_notes": ["Marchează zona est"],
        "confidence": 0.91,
    }
    result = parse_photo_analysis(data, img)
    assert result.photo_id == "P001"
    assert result.category == PhotoCategory.ROOF_OVERVIEW
    assert result.confidence == 0.91


def test_deepseek_not_configured():
    client = DeepSeekClient(api_key="")
    assert not client.configured
    with pytest.raises(DeepSeekError):
        client.analyze_image(Path("x.jpg"), "prompt", "P001")


def test_analyze_directory_mock(tmp_path: Path):
    photo = tmp_path / "roof_south.jpg"
    photo.write_bytes(b"\xff\xd8\xff fake jpeg")

    mock_response = {
        "photo_id": "P001",
        "category": "roof_overview",
        "findings": ["Orientare sud"],
        "issues": [],
        "actionable_notes": [],
        "confidence": 0.9,
    }

    mock_client = MagicMock(spec=DeepSeekClient)
    mock_client.analyze_image.return_value = mock_response

    analyzer = PhotoAnalyzer(client=mock_client)
    results = analyzer.analyze_directory(tmp_path, report_id="TEST-001")

    assert len(results) == 1
    assert results[0].findings == ["Orientare sud"]
    mock_client.analyze_image.assert_called_once()


def test_cost_logger(tmp_path: Path):
    from src.api_clients.cost_logger import CostLogger, UsageRecord

    log_path = tmp_path / "usage.jsonl"
    logger = CostLogger(log_path=log_path)
    logger.log(UsageRecord(provider="deepseek", model="deepseek-v4-pro", cost_usd=0.05))
    logger.log(UsageRecord(provider="deepseek", model="deepseek-v4-pro", cost_usd=0.03))
    assert logger.total_cost() == pytest.approx(0.08)