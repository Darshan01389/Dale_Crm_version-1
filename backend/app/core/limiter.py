import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# Disable rate limiting if running unit tests to prevent 429 errors during test executions
is_testing = os.environ.get("TESTING") == "True" or os.environ.get("DATABASE_URL", "").startswith("sqlite")
limiter = Limiter(key_func=get_remote_address, enabled=not is_testing)
