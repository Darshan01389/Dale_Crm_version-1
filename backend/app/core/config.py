# app/core/config.py
# Reads all settings from your .env file
# Trigger reload: SMTP configuration added

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None
    SECRET_KEY: str
    ENCRYPTION_MASTER_KEY: str | None = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Optional: when set, new-lead AI scoring uses Ollama Chat Completions
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "meta/llama-3.1-8b-instruct" # Default fallback
    STRATEGY_MODEL: str = "meta/llama-3.3-70b-instruct" # For deep reasoning
    CHAT_MODEL: str = "meta/llama-3.1-8b-instruct" # For fast chat/tasks
    VOICE_MODEL: str = "meta/llama-3.1-70b-instruct" # Dedicated for large context audio/voice
    ANALYTICS_MODEL: str = "mistralai/mixtral-8x7b-instruct-v0.1" # Dedicated for optimization and cron jobs
    NVIDIA_API_KEY: str | None = None # Can be a comma-separated list of keys
    
    @property
    def nvidia_keys(self) -> list[str]:
        if not self.NVIDIA_API_KEY:
            return []
        return [k.strip() for k in self.NVIDIA_API_KEY.split(",") if k.strip()]
    # AI lead gathering and message generation
    ENABLE_OLLAMA_LEAD_GATHERING: bool = True
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
    # Sentiment: Ollama JSON when True; else VADER
    USE_OLLAMA_SENTIMENT: bool = True
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
    SMTP_VERIFY_USER: str | None = None
    SMTP_VERIFY_PASSWORD: str | None = None
    SMTP_VERIFY_FROM: str | None = None
    ALERT_EMAIL_TO: str | None = None
    
    # Global AI Toggle
    USE_OLLAMA_FOR_ALL: bool = True

    # Debug / Development Mode
    DEBUG: bool = True

    # Payment Gateways (Stripe & Razorpay)
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_UPI_VPA: str | None = None

    # CORS & Frontend URLs
    ALLOWED_ORIGINS: str = "http://localhost:5173,https://dale-crm-version-1.vercel.app"
    FRONTEND_URL: str = "http://localhost:5173"
    SENTRY_DSN: str | None = None
    GOOGLE_CLIENT_ID: str | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def encryption_key(self) -> str:
        if self.ENCRYPTION_MASTER_KEY:
            return self.ENCRYPTION_MASTER_KEY
        import hashlib
        import base64
        key_bytes = hashlib.sha256(self.SECRET_KEY.encode()).digest()
        return base64.urlsafe_b64encode(key_bytes).decode()

    # Cloud Storage Configurations
    STORAGE_BACKEND: str = "local"
    S3_BUCKET_NAME: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_REGION: str = "us-east-1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Create one instance — import this everywhere
settings = Settings()