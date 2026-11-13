"""Shared paths for the portfolio test suite."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def root():
    return ROOT
