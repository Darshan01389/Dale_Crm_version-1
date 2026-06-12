import base64
from cryptography.fernet import Fernet
from app.core.config import settings

_fernet: Fernet | None = None

def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = settings.encryption_key
        # Ensure key is a base64 encoded 32-byte key
        try:
            # Check if key is already a valid base64 key
            base64.urlsafe_b64decode(key.encode())
            f_key = key.encode()
        except Exception:
            # Force derive standard key if invalid
            import hashlib
            digest = hashlib.sha256(key.encode()).digest()
            f_key = base64.urlsafe_b64encode(digest)
        _fernet = Fernet(f_key)
    return _fernet

def encrypt_value(val: str | None) -> str | None:
    if val is None:
        return None
    f = _get_fernet()
    return f.encrypt(val.encode()).decode()

def decrypt_value(val: str | None) -> str | None:
    if val is None:
        return None
    f = _get_fernet()
    try:
        return f.decrypt(val.encode()).decode()
    except Exception:
        # Fallback to plain text if decryption fails (e.g. legacy plain values in DB)
        return val
