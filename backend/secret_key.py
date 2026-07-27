import secrets

# Generate a 32-byte (256-bit) secret key
secret_key = secrets.token_hex(32)
print("Your secret key:", secret_key)
# ad94165ede7c3f0ee6db018a13055bfafa1ff352eedc4975cbcace5a7562a73c