from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from security.jwt import oauth2_scheme, SECRET_KEY, ALGORITHM

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недійсні облікові дані",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        id_employee: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        
        if id_employee is None or role is None:
            raise credentials_exception
        return {"id_employee": id_employee, "role": role}
    except JWTError:
        raise credentials_exception

def require_manager(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Доступ заборонено. Потрібні права Менеджера."
        )
    return current_user

def require_cashier(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Доступ заборонено. Тільки Касир може виконувати цю дію."
        )
    return current_user