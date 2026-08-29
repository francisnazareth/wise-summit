import logging
import os
from functools import lru_cache
from typing import Annotated, Protocol

from azure.identity import AzureCliCredential, ManagedIdentityCredential, get_bearer_token_provider
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AzureOpenAI, OpenAIError
from pydantic import BaseModel, Field, field_validator


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