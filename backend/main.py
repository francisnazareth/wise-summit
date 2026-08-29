import json
import logging
import os
from functools import lru_cache
from typing import Annotated, Literal, Protocol

from azure.identity import AzureCliCredential, ManagedIdentityCredential, get_bearer_token_provider
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AzureOpenAI, OpenAI, OpenAIError
from pydantic import BaseModel, Field, field_validator, model_validator


logger = logging.getLogger(__name__)


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
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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


@app.post("/api/speakers/discover", response_model=SpeakerDiscoveryResponse)
def discover_speakers(
    request: SpeakerDiscoveryRequest,
    client: Annotated[OpenAI, Depends(get_responses_client)],
) -> SpeakerDiscoveryResponse:
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        raise HTTPException(status_code=503, detail="Model deployment is not configured")

    prompt = f"""Perform a public web search for potential speakers for WISE Summit 2027 in Doha.
The approved strategic theme is: {request.theme}
Return JSON only with a candidates array containing exactly 100 real, living global education, policy, technology, research, social-impact, or philanthropy leaders: exactly 30 USA, 20 Europe, 20 Africa, and 30 Asia. Do not include people whose primary base is outside their assigned region. Each candidate must have name, current role and organization in role, region (exactly USA, Europe, Africa, or Asia), fit score from 0 to 100, and source_url from the web search supporting their current role. Use snake_case source_url. Do not include markdown."""

    try:
        response = client.responses.create(
            model=deployment,
            tools=[{"type": "web_search"}],
            input=prompt,
            max_output_tokens=12_000,
        )
        if not any(item.type == "web_search_call" for item in response.output):
            raise ValueError("The model did not perform a web search")
        payload = json.loads(response.output_text)
        return SpeakerDiscoveryResponse.model_validate(payload)
    except (OpenAIError, OSError):
        logger.exception("Foundry speaker discovery failed")
        raise HTTPException(status_code=502, detail="Speaker web search failed") from None
    except (json.JSONDecodeError, ValueError):
        logger.exception("Foundry returned invalid speaker discovery results")
        raise HTTPException(status_code=502, detail="Model returned invalid speaker candidates") from None