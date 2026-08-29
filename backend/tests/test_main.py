from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from main import app, get_foundry_client


class FakeCompletions:
    def __init__(self, content: str = "Ready", error: Exception | None = None) -> None:
        self.content = content
        self.error = error
        self.last_request: dict[str, object] | None = None

    def create(self, **kwargs: object) -> object:
        self.last_request = kwargs
        if self.error:
            raise self.error
        message = SimpleNamespace(content=self.content)
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> tuple[TestClient, FakeCompletions]:
    completions = FakeCompletions()
    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    app.dependency_overrides[get_foundry_client] = lambda: fake_client
    monkeypatch.setenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4-1")
    with TestClient(app) as test_client:
        yield test_client, completions
    app.dependency_overrides.clear()


def test_health_does_not_require_foundry(client: tuple[TestClient, FakeCompletions]) -> None:
    test_client, completions = client

    response = test_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert completions.last_request is None


def test_chat_invokes_configured_deployment(client: tuple[TestClient, FakeCompletions]) -> None:
    test_client, completions = client

    response = test_client.post("/api/chat", json={"message": "  Build a schedule  "})

    assert response.status_code == 200
    assert response.json() == {"message": "Ready"}
    assert completions.last_request == {
        "model": "gpt-4-1",
        "messages": [{"role": "user", "content": "Build a schedule"}],
        "max_completion_tokens": 800,
    }


@pytest.mark.parametrize("message", ["", "   ", "x" * 4_001])
def test_chat_rejects_invalid_messages(
    client: tuple[TestClient, FakeCompletions], message: str
) -> None:
    test_client, completions = client

    response = test_client.post("/api/chat", json={"message": message})

    assert response.status_code == 422
    assert completions.last_request is None


def test_chat_reports_upstream_failure(client: tuple[TestClient, FakeCompletions]) -> None:
    test_client, completions = client
    completions.error = OSError("network unavailable")

    response = test_client.post("/api/chat", json={"message": "Hello"})

    assert response.status_code == 502
    assert response.json() == {"detail": "Model invocation failed"}