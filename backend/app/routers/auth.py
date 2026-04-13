from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db_connection
from app.security.hashing import verify_password
from app.security.jwt import create_access_token
from repositories.employee_repo import get_employee_by_id

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), conn = Depends(get_db_connection)):
    # В якості username використовуємо id_employee
    user = get_employee_by_id(conn, form_data.username)
    if not user or not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невірний ID або пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["id_employee"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}