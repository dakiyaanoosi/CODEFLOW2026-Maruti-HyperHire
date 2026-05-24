"""
Encryption Module
Handles encryption and decryption of sensitive fields
"""

from cryptography.fernet import Fernet
import os
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Load or generate encryption key
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    logger.warning("⚠️  Generated new encryption key. Store this securely in .env")

try:
    cipher = Fernet(ENCRYPTION_KEY.encode())
except Exception as e:
    logger.error(f"Failed to initialize encryption: {str(e)}")
    cipher = None


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""

    @staticmethod
    def encrypt_field(value: str) -> str:
        """Encrypt a string field"""
        if not value or not cipher:
            return value
        try:
            encrypted = cipher.encrypt(value.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            return value

    @staticmethod
    def decrypt_field(encrypted_value: str) -> str:
        """Decrypt an encrypted field"""
        if not encrypted_value or not cipher:
            return encrypted_value
        try:
            decrypted = cipher.decrypt(encrypted_value.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise ValueError(f"Failed to decrypt field: {str(e)}")

    @staticmethod
    def encrypt_dict(data: Dict[str, Any], fields_to_encrypt: list) -> Dict[str, Any]:
        """Encrypt specific fields in a dictionary"""
        encrypted_data = data.copy()
        for field in fields_to_encrypt:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = EncryptionService.encrypt_field(
                    str(encrypted_data[field])
                )
        return encrypted_data

    @staticmethod
    def decrypt_dict(data: Dict[str, Any], fields_to_decrypt: list) -> Dict[str, Any]:
        """Decrypt specific fields in a dictionary"""
        decrypted_data = data.copy()
        for field in fields_to_decrypt:
            if field in decrypted_data and decrypted_data[field]:
                try:
                    decrypted_data[field] = EncryptionService.decrypt_field(
                        str(decrypted_data[field])
                    )
                except Exception as e:
                    logger.warning(f"Could not decrypt field {field}: {str(e)}")
        return decrypted_data


# Sensitive fields that should be encrypted
SENSITIVE_FIELDS = [
    "phone_number",
    "ssn",
    "bank_account",
    "api_key",
    "payment_token",
    "address",
]


def encrypt_sensitive(data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt all sensitive fields in data"""
    return EncryptionService.encrypt_dict(data, SENSITIVE_FIELDS)


def decrypt_sensitive(data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt all sensitive fields in data"""
    return EncryptionService.decrypt_dict(data, SENSITIVE_FIELDS)
