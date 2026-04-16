from datetime import datetime, timedelta
from jose import jwt
from fastapi.security import OAuth2PasswordBearer

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("❌ SECRET_KEY не знайдено у .env файлі! \"")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    # Приводимо роль до нижнього регістру перед кодуванням
    if 'role' in to_encode:
        to_encode['role'] = to_encode['role'].lower()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt