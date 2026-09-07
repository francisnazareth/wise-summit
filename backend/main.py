import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from threading import Lock
from typing import Annotated, Literal, Protocol

from azure.identity import AzureCliCredential, ManagedIdentityCredential, get_bearer_token_provider
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AzureOpenAI, OpenAI, OpenAIError
from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message must not be blank")
        return value


class ChatResponse(BaseModel):
    message: str


class SpeakerDiscoveryRequest(BaseModel):
    theme: str = Field(min_length=1, max_length=500)


class SpeakerCandidate(BaseModel):
    name: str
    role: str
    region: Literal["USA", "Europe", "Africa", "Asia"]
    score: int = Field(ge=0, le=100)
    source_url: str


class SpeakerDiscoveryResponse(BaseModel):
    candidates: list[SpeakerCandidate] = Field(max_length=100)

    @model_validator(mode="after")
    def validate_regional_split(self) -> "SpeakerDiscoveryResponse":
        expected = {"USA": 30, "Europe": 20, "Africa": 20, "Asia": 30}
        actual = {region: sum(candidate.region == region for candidate in self.candidates) for region in expected}
        if actual != expected:
            raise ValueError(f"Invalid regional split: {actual}")
        return self


class SessionGenerationRequest(BaseModel):
    theme: str = Field(min_length=1, max_length=500)


class SessionIdea(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=20, max_length=600)
    track: Literal["Policy", "Innovation", "Global outlook", "Roundtable", "Workshop", "Partner session"]


class SessionGenerationResponse(BaseModel):
    sessions: list[SessionIdea] = Field(min_length=100, max_length=100)

    @model_validator(mode="after")
    def validate_unique_titles(self) -> "SessionGenerationResponse":
        titles = {session.title.casefold() for session in self.sessions}
        if len(titles) != len(self.sessions):
            raise ValueError("Session titles must be unique")
        return self


class ThemeResearchRequest(BaseModel):
    current_theme: str = Field(min_length=1, max_length=500)

    @field_validator("current_theme")
    @classmethod
    def current_theme_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Current theme must not be blank")
        return value


class ThemeCandidate(BaseModel):
    theme: str = Field(min_length=3, max_length=120)
    territory: str = Field(min_length=3, max_length=300)


class CountrySignal(BaseModel):
    country: str = Field(min_length=2, max_length=100)
    signal: str = Field(min_length=10, max_length=600)
    source_url: HttpUrl


class ConferenceSignal(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    horizon: Literal["Past", "Future"]
    theme: str = Field(min_length=3, max_length=500)
    source_url: HttpUrl


class ExpertSignal(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    role: str = Field(min_length=2, max_length=200)
    perspective: str = Field(min_length=10, max_length=600)
    source_url: HttpUrl


class ThemeResearchResponse(BaseModel):
    countries: list[CountrySignal] = Field(min_length=4, max_length=8)
    conferences: list[ConferenceSignal] = Field(min_length=4, max_length=8)
    experts: list[ExpertSignal] = Field(min_length=4, max_length=8)
    summary: str = Field(min_length=40, max_length=2_000)
    candidates: list[ThemeCandidate] = Field(min_length=4, max_length=4)
    recommendedTheme: str
    rationale: str = Field(min_length=20, max_length=1_000)
    strategicFit: int = Field(ge=0, le=100)
    audienceResonance: int = Field(ge=0, le=100)
    contentExtensibility: int = Field(ge=0, le=100)
    reflectionPrompts: list[str] = Field(min_length=3, max_length=5)
    trace: list[str] = Field(min_length=3, max_length=6)

    @model_validator(mode="after")
    def validate_research_consistency(self) -> "ThemeResearchResponse":
        if {conference.horizon for conference in self.conferences} != {"Past", "Future"}:
            raise ValueError("Conference research must include both past and future events")

        unique_fields = {
            "countries": [item.country.casefold() for item in self.countries],
            "conferences": [item.name.casefold() for item in self.conferences],
            "experts": [item.name.casefold() for item in self.experts],
            "theme candidates": [item.theme.casefold() for item in self.candidates],
        }
        for label, values in unique_fields.items():
            if len(values) != len(set(values)):
                raise ValueError(f"Theme research contains duplicate {label}")

        candidate_names = {candidate.theme.casefold() for candidate in self.candidates}
        if self.recommendedTheme.casefold() not in candidate_names:
            raise ValueError("Recommended theme must be one of the candidates")
        return self


_speaker_cache: SpeakerDiscoveryResponse | None = None
_speaker_cache_lock = Lock()


class ChatCompletions(Protocol):
    def create(self, **kwargs: object) -> object: ...


class ChatApi(Protocol):
    completions: ChatCompletions


class FoundryClient(Protocol):
    chat: ChatApi


def _allowed_origins() -> list[str]:
    return [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()]


@lru_cache
def get_foundry_client() -> FoundryClient:
    endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
    credential = ManagedIdentityCredential() if os.getenv("WEBSITE_INSTANCE_ID") else AzureCliCredential()
    token_provider = get_bearer_token_provider(
        credential,
        "https://cognitiveservices.azure.com/.default",
    )
    return AzureOpenAI(
        azure_endpoint=endpoint,
        azure_ad_token_provider=token_provider,
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21"),
    )


@lru_cache
def get_responses_client() -> OpenAI:
    endpoint = os.environ["AZURE_OPENAI_ENDPOINT"].rstrip("/")
    credential = ManagedIdentityCredential() if os.getenv("WEBSITE_INSTANCE_ID") else AzureCliCredential()
    token_provider = get_bearer_token_provider(credential, "https://ai.azure.com/.default")
    return OpenAI(base_url=f"{endpoint}/openai/v1/", api_key=token_provider)


app = FastAPI(title="WISE Ops API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/speakers/cache", response_model=SpeakerDiscoveryResponse)
@app.get("/api/speakers", response_model=SpeakerDiscoveryResponse)
def cached_speakers() -> SpeakerDiscoveryResponse:
    with _speaker_cache_lock:
        if _speaker_cache is None:
            raise HTTPException(status_code=404, detail="No speaker discovery is cached")
        return _speaker_cache


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    client: Annotated[FoundryClient, Depends(get_foundry_client)],
) -> ChatResponse:
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        raise HTTPException(status_code=503, detail="Model deployment is not configured")

    try:
        completion = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": request.message}],
            max_completion_tokens=800,
        )
    except (OpenAIError, OSError):
        logger.exception("Foundry model invocation failed")
        raise HTTPException(status_code=502, detail="Model invocation failed") from None

    content = completion.choices[0].message.content
    if not content:
        raise HTTPException(status_code=502, detail="Model returned an empty response")
    return ChatResponse(message=content)


@app.post("/api/theme/research", response_model=ThemeResearchResponse)
def research_theme(
    request: ThemeResearchRequest,
    client: Annotated[OpenAI, Depends(get_responses_client)],
) -> ThemeResearchResponse:
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        raise HTTPException(status_code=503, detail="Model deployment is not configured")

    prompt = f"""Research a strategic theme for WISE Summit 2027 in Doha using current public web sources.
Map the countries where global discussion about education is most active and identify the specific discussion in each.
Review both past and announced future education conferences and their themes.
Identify thought leaders and experts whose public work reveals important perspectives.
Synthesize the evidence, propose exactly four concise theme candidates, recommend one, and write three to five questions for reflection with the Steering Committee and WISE team.
Do not reuse the current theme: {request.current_theme}
Every country, conference, and expert item must include a public source URL that supports the claim."""
    schema = {
        "type": "object",
        "properties": {
            "countries": {"type": "array", "minItems": 4, "maxItems": 8, "items": {"type": "object", "properties": {"country": {"type": "string"}, "signal": {"type": "string"}, "source_url": {"type": "string"}}, "required": ["country", "signal", "source_url"], "additionalProperties": False}},
            "conferences": {"type": "array", "minItems": 4, "maxItems": 8, "items": {"type": "object", "properties": {"name": {"type": "string"}, "horizon": {"type": "string", "enum": ["Past", "Future"]}, "theme": {"type": "string"}, "source_url": {"type": "string"}}, "required": ["name", "horizon", "theme", "source_url"], "additionalProperties": False}},
            "experts": {"type": "array", "minItems": 4, "maxItems": 8, "items": {"type": "object", "properties": {"name": {"type": "string"}, "role": {"type": "string"}, "perspective": {"type": "string"}, "source_url": {"type": "string"}}, "required": ["name", "role", "perspective", "source_url"], "additionalProperties": False}},
            "summary": {"type": "string"},
            "candidates": {"type": "array", "minItems": 4, "maxItems": 4, "items": {"type": "object", "properties": {"theme": {"type": "string"}, "territory": {"type": "string"}}, "required": ["theme", "territory"], "additionalProperties": False}},
            "recommendedTheme": {"type": "string"},
            "rationale": {"type": "string"},
            "strategicFit": {"type": "integer", "minimum": 0, "maximum": 100},
            "audienceResonance": {"type": "integer", "minimum": 0, "maximum": 100},
            "contentExtensibility": {"type": "integer", "minimum": 0, "maximum": 100},
            "reflectionPrompts": {"type": "array", "minItems": 3, "maxItems": 5, "items": {"type": "string"}},
            "trace": {"type": "array", "minItems": 3, "maxItems": 6, "items": {"type": "string"}},
        },
        "required": ["countries", "conferences", "experts", "summary", "candidates", "recommendedTheme", "rationale", "strategicFit", "audienceResonance", "contentExtensibility", "reflectionPrompts", "trace"],
        "additionalProperties": False,
    }

    try:
        response = client.responses.create(
            model=deployment,
            tools=[{"type": "web_search"}],
            input=prompt,
            text={"format": {"type": "json_schema", "name": "theme_research", "strict": True, "schema": schema}},
            reasoning={"effort": "low"},
            max_output_tokens=8_000,
        )
        if not any(item.type == "web_search_call" for item in response.output):
            raise ValueError("The model did not perform a web search")
        result = ThemeResearchResponse.model_validate_json(response.output_text)
        logger.info("Foundry theme research response_id=%s countries=%s conferences=%s experts=%s", response.id, len(result.countries), len(result.conferences), len(result.experts))
        return result
    except (OpenAIError, OSError):
        logger.exception("Foundry theme research failed")
        raise HTTPException(status_code=502, detail="Theme web research failed") from None
    except ValueError:
        logger.exception("Foundry returned invalid theme research")
        raise HTTPException(status_code=502, detail="Model returned invalid theme research") from None


@app.post("/api/sessions/generate", response_model=SessionGenerationResponse)
def generate_sessions(
    request: SessionGenerationRequest,
    client: Annotated[OpenAI, Depends(get_responses_client)],
) -> SessionGenerationResponse:
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        raise HTTPException(status_code=503, detail="Model deployment is not configured")

    lenses = [
        "education policy, public systems, and evidence adoption",
        "responsible technology, AI, and learning innovation",
        "learner, teacher, community, and youth perspectives",
        "global partnerships, implementation, and hands-on practice",
    ]
    tracks = ["Policy", "Innovation", "Global outlook", "Roundtable", "Workshop", "Partner session"]

    def generate_batch(batch_number: int, lens: str) -> list[SessionIdea]:
        prompt = f"""Create exactly 25 distinct session ideas for WISE Summit 2027 in Doha.
The approved strategic theme is: {request.theme}
This is idea batch {batch_number} of 4. Focus on {lens} so its titles do not overlap other batches.
Write specific, editorial-quality titles and concise two-sentence descriptions that explain the question, tension, or practical outcome. Vary the formats and assign the most suitable available track."""
        schema = {
            "type": "object",
            "properties": {
                "sessions": {
                    "type": "array",
                    "minItems": 25,
                    "maxItems": 25,
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "minLength": 3, "maxLength": 120},
                            "description": {"type": "string", "minLength": 20, "maxLength": 600},
                            "track": {"type": "string", "enum": tracks},
                        },
                        "required": ["title", "description", "track"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["sessions"],
            "additionalProperties": False,
        }
        response = client.responses.create(
            model=deployment,
            input=prompt,
            text={"format": {"type": "json_schema", "name": "session_ideas", "strict": True, "schema": schema}},
            reasoning={"effort": "low"},
            max_output_tokens=9_000,
        )
        logger.info(
            "Foundry session response batch=%s response_id=%s status=%s output_length=%s",
            batch_number,
            response.id,
            response.status,
            len(response.output_text),
        )
        payload = json.loads(response.output_text)
        ideas = [SessionIdea.model_validate(session) for session in payload["sessions"]]
        if len(ideas) != 25:
            raise ValueError(f"Invalid session idea count for batch {batch_number}")
        return ideas

    try:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(generate_batch, batch_number, lens)
                for batch_number, lens in enumerate(lenses, start=1)
            ]
            sessions = [session for future in futures for session in future.result()]
        return SessionGenerationResponse(sessions=sessions)
    except (OpenAIError, OSError):
        logger.exception("Foundry session generation failed")
        raise HTTPException(status_code=502, detail="Session generation failed") from None
    except (json.JSONDecodeError, KeyError, TypeError, ValueError):
        logger.exception("Foundry returned invalid session ideas")
        raise HTTPException(status_code=502, detail="Model returned invalid session ideas") from None


@app.post("/api/speakers/discover", response_model=SpeakerDiscoveryResponse)
def discover_speakers(
    request: SpeakerDiscoveryRequest,
    client: Annotated[OpenAI, Depends(get_responses_client)],
) -> SpeakerDiscoveryResponse:
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        raise HTTPException(status_code=503, detail="Model deployment is not configured")

    global _speaker_cache
    with _speaker_cache_lock:
        _speaker_cache = None

    quotas = {"USA": 30, "Europe": 20, "Africa": 20, "Asia": 30}

    def search_region(region: str, count: int) -> list[SpeakerCandidate]:
        prompt = f"""Perform a public web search for exactly {count} potential speakers primarily based in {region} for WISE Summit 2027 in Doha.
The approved strategic theme is: {request.theme}
Find real, living education, policy, technology, research, social-impact, or philanthropy leaders. Return current information only. Each source_url must come from the web search and support the person's current role. Do not assign anyone whose primary base is outside {region}."""
        schema = {
            "type": "object",
            "properties": {
                "candidates": {
                    "type": "array",
                    "minItems": count,
                    "maxItems": count,
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "role": {"type": "string"},
                            "region": {"type": "string", "enum": [region]},
                            "score": {"type": "integer", "minimum": 0, "maximum": 100},
                            "source_url": {"type": "string"},
                        },
                        "required": ["name", "role", "region", "score", "source_url"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["candidates"],
            "additionalProperties": False,
        }
        response = client.responses.create(
            model=deployment,
            tools=[{"type": "web_search"}],
            input=prompt,
            text={"format": {"type": "json_schema", "name": "speaker_candidates", "strict": True, "schema": schema}},
            reasoning={"effort": "low"},
            max_output_tokens=12_000,
        )
        output_items = [(item.type, getattr(item, "status", None)) for item in response.output]
        web_search_performed = any(item.type == "web_search_call" for item in response.output)
        usage = response.usage.model_dump() if response.usage else None
        logger.info(
            "Foundry speaker response region=%s response_id=%s status=%s incomplete_details=%r "
            "error=%r output_items=%s web_search=%s usage=%s output_length=%s output=%s",
            region,
            response.id,
            response.status,
            response.incomplete_details,
            response.error,
            output_items,
            web_search_performed,
            usage,
            len(response.output_text),
            response.output_text,
        )
        if not web_search_performed:
            raise ValueError(f"The model did not perform a web search for {region}")
        try:
            payload = json.loads(response.output_text)
            candidates = [SpeakerCandidate.model_validate(candidate) for candidate in payload["candidates"]]
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            logger.exception(
                "Foundry speaker response validation failed region=%s response_id=%s",
                region,
                response.id,
            )
            raise
        if len(candidates) != count or any(candidate.region != region for candidate in candidates):
            raise ValueError(f"Invalid {region} candidate quota")
        logger.info("Foundry speaker response validated region=%s candidates=%s", region, len(candidates))
        return candidates

    try:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(search_region, region, count) for region, count in quotas.items()]
            candidates = [candidate for future in futures for candidate in future.result()]
        result = SpeakerDiscoveryResponse(candidates=candidates)
        with _speaker_cache_lock:
            _speaker_cache = result
        return result
    except (OpenAIError, OSError):
        logger.exception("Foundry speaker discovery failed")
        raise HTTPException(status_code=502, detail="Speaker web search failed") from None
    except (json.JSONDecodeError, ValueError):
        logger.exception("Foundry returned invalid speaker discovery results")
        raise HTTPException(status_code=502, detail="Model returned invalid speaker candidates") from None