# app/core/config.py
# Reads all settings from your .env file

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Optional: when set, new-lead AI scoring uses OpenAI Chat Completions
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    # OpenAI lead gathering and message generation
    ENABLE_OPENAI_LEAD_GATHERING: bool = True
    # WhatsApp Business Cloud API (Meta Graph API v19.0)
    # WHATSAPP_MODE: "demo" = simulate locally, "live" = call real Meta endpoint
    WHATSAPP_MODE: str = "demo"
    WHATSAPP_API_URL: str | None = None
    WHATSAPP_API_TOKEN: str | None = None
    WHATSAPP_SENDER_ID: str | None = None
    # Tabular lead + conversion models trained from merged_lead_dataset.csv
    MERGED_LEAD_DATASET_PATH: str = str(
        Path.home() / "Downloads" / "merged_lead_dataset.csv"
    )
    ML_MAX_TRAIN_ROWS: int = 25_000
    ML_FORCE_RETRAIN: bool = False
    # Sentiment: OpenAI JSON when True and OPENAI_API_KEY set; else VADER
    USE_OPENAI_SENTIMENT: bool = True
    # Background scoring (0 = disabled)
    SCORE_REFRESH_MINUTES: int = 60
    SCORE_REFRESH_BATCH_SIZE: int = 200
    HIGH_SCORE_ALERT_THRESHOLD: float = 85.0
    # SMTP (optional alerts after score refresh)
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None
    ALERT_EMAIL_TO: str | None = None
    
    # Global AI Toggle
    USE_GROQ_FOR_ALL: bool = True

    # Groq API for chatbot
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Create one instance — import this everywhere
settings = Settings()