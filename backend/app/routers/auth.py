from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db_connection, put_db_connection
from app.security.hashing import verify_password
from app.security.jwt import create_access_token
import traceback

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    print(">>> LOGIN FUNCTION CALLED", flush=True)
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                        SELECT id_employee, empl_role AS role, password_hash
                        FROM Employee
                        WHERE id_employee = %s
                        """, (form_data.username,))
            user = cur.fetchone()
            print(f"[DEBUG] user found: {user}", flush=True)

            if not user:
                raise HTTPException(status_code=401, detail="Невірний ID або пароль")

            if not user.get('password_hash'):
                print("[DEBUG] password_hash is None or empty", flush=True)
                raise HTTPException(status_code=401, detail="Невірний ID або пароль")

            try:
                if not verify_password(form_data.password, user['password_hash']):
                    raise HTTPException(status_code=401, detail="Невірний ID або пароль")
            except Exception as ve:
                print(f"[DEBUG] verify_password error: {ve}", flush=True)
                traceback.print_exc()
                raise HTTPException(status_code=401, detail="Невірний ID або пароль")

            token = create_access_token(data={"sub": user['id_employee'], "role": user['role']})
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {"id": user['id_employee'], "role": user['role'].lower()}
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Помилка логіну: {e}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Внутрішня помилка: {str(e)}")
    finally:
        put_db_connection(conn)