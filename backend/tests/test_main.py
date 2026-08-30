from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import main
from main import app, get_foundry_client, get_responses_client


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
    main._speaker_cache = None
    completions = FakeCompletions()
    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    app.dependency_overrides[get_foundry_client] = lambda: fake_client
    monkeypatch.setenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4-1")
    with TestClient(app) as test_client:
        yield test_client, completions
    app.dependency_overrides.clear()
    main._speaker_cache = None


def test_health_does_not_require_foundry(client: tuple[TestClient, FakeCompletions]) -> None:
    test_client, completions = client

    response = test_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert completions.last_request is None


def test_speaker_cache_is_empty_before_discovery(client: tuple[TestClient, FakeCompletions]) -> None:
    test_client, _ = client

    response = test_client.get("/api/speakers/cache")

    assert response.status_code == 404
    assert response.json() == {"detail": "No speaker discovery is cached"}


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


def test_speaker_discovery_requires_web_search_and_regional_split(
    client: tuple[TestClient, FakeCompletions],
    caplog: pytest.LogCaptureFixture,
) -> None:
    test_client, _ = client
    counts = {"USA": 30, "Europe": 20, "Africa": 20, "Asia": 30}
    candidates = [
        {
            "name": f"{region} Candidate {index}",
            "role": "Education leader",
            "region": region,
            "score": 90,
            "source_url": "https://example.com/profile",
        }
        for region, count in counts.items()
        for index in range(count)
    ]
    response_item = SimpleNamespace(type="web_search_call")

    def create_response(**kwargs: object) -> object:
        prompt = str(kwargs["input"])
        assert kwargs["reasoning"] == {"effort": "low"}
        assert kwargs["max_output_tokens"] == 12_000
        region = next(region for region in counts if f"based in {region}" in prompt)
        regional_candidates = [candidate for candidate in candidates if candidate["region"] == region]
        return SimpleNamespace(
            id=f"response-{region}",
            status="completed",
            incomplete_details=None,
            error=None,
            output=[response_item],
            output_text=__import__("json").dumps({"candidates": regional_candidates}),
            usage=SimpleNamespace(model_dump=lambda: {"total_tokens": 100}),
        )

    fake_responses = SimpleNamespace(create=create_response)
    app.dependency_overrides[get_responses_client] = lambda: SimpleNamespace(responses=fake_responses)

    response = test_client.post("/api/speakers/discover", json={"theme": "Proof, Practice, Progress"})

    assert response.status_code == 200
    assert len(response.json()["candidates"]) == 100
    assert "Foundry speaker response region=USA" in caplog.text
    assert '"USA Candidate 0"' in caplog.text

    cached_response = test_client.get("/api/speakers/cache")
    assert cached_response.status_code == 200
    assert cached_response.json() == response.json()