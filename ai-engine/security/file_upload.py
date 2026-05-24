"""
Secure File Upload Module
Validates and handles file uploads securely
"""

from fastapi import UploadFile, HTTPException, status
import os
from pathlib import Path
import uuid
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)

# Security configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10 MB default
ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
}
UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIR", "./uploads")

# Create upload directory if it doesn't exist
Path(UPLOAD_DIRECTORY).mkdir(parents=True, exist_ok=True)


class FileValidator:
    """Validates uploaded files for security"""

    @staticmethod
    def validate_file_extension(filename: str) -> Tuple[bool, str]:
        """Validate file extension"""
        extension = Path(filename).suffix.lower()
        
        allowed_extensions = [
            ext for exts in ALLOWED_MIME_TYPES.values()
            for ext in exts
        ]
        
        if extension not in allowed_extensions:
            return False, f"File extension {extension} not allowed"
        
        return True, ""

    @staticmethod
    def validate_file_size(file_size: int) -> Tuple[bool, str]:
        """Validate file size"""
        if file_size > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE / (1024 * 1024)
            return False, f"File size exceeds {max_mb}MB limit"
        
        if file_size == 0:
            return False, "File is empty"
        
        return True, ""

    @staticmethod
    async def validate_upload(file: UploadFile) -> Tuple[bool, str]:
        """Complete file validation"""
        # Check extension
        is_valid, msg = FileValidator.validate_file_extension(file.filename)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        
        # Check filename for path traversal
        if ".." in file.filename or "/" in file.filename or "\\" in file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename"
            )
        
        # Read and check file
        contents = await file.read()
        
        # Check file size
        is_valid, msg = FileValidator.validate_file_size(len(contents))
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        
        return True, "File validation passed"


class FileUploadService:
    """Handles secure file uploads"""

    @staticmethod
    async def save_upload(
        file: UploadFile,
        subfolder: str = "general"
    ) -> str:
        """Save uploaded file securely"""
        # Validate first
        await FileValidator.validate_upload(file)
        
        # Generate secure filename
        file_extension = Path(file.filename).suffix
        secure_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create subfolder path
        upload_path = Path(UPLOAD_DIRECTORY) / subfolder
        upload_path.mkdir(parents=True, exist_ok=True)
        
        # Full file path
        file_path = upload_path / secure_filename
        
        # Save file
        try:
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            
            logger.info(f"File uploaded: {file_path}")
            
            # Return relative path for database storage
            return f"{subfolder}/{secure_filename}"
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Safely delete an uploaded file"""
        try:
            full_path = Path(UPLOAD_DIRECTORY) / file_path
            
            # Prevent directory traversal
            if not str(full_path).startswith(str(Path(UPLOAD_DIRECTORY).resolve())):
                logger.warning(f"Attempted directory traversal: {file_path}")
                return False
            
            if full_path.exists():
                full_path.unlink()
                logger.info(f"File deleted: {full_path}")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False

    @staticmethod
    def get_file_path(stored_path: str) -> str:
        """Get full file path for serving"""
        return str(Path(UPLOAD_DIRECTORY) / stored_path)
