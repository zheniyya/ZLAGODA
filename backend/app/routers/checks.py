from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.base import CheckCreate, CheckResponse 
from security.permissions import require_cashier, require_manager, get_current_user
from database import get_db_connection
import uuid
from datetime import datetime

router = APIRouter(prefix="/checks", tags=["Checks"])

@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
def create_check(
    check_data: CheckCreate, 
    current_user: dict = Depends(require_cashier), # ТІЛЬКИ КАСИР!
    conn = Depends(get_db_connection)
):
    """Створення нового чеку. Доступно виключно касирам."""
    check_number = str(uuid.uuid4())[:10] 
    
    # Заглушка для price_service
    sum_total = 100.50 
    vat = sum_total * 0.20
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "Check" (check_number, id_employee, card_number, print_date, sum_total, vat)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            check_number, 
            current_user["id_employee"], 
            check_data.card_number, 
            datetime.now(), 
            sum_total, 
            vat
        ))
        new_check = cur.fetchone()
        conn.commit()
        
    return new_check

@router.get("/", response_model=List[CheckResponse])
def get_all_checks(current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    """Перегляд всіх чеків. Доступно менеджерам (для аналітики)."""
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM "Check"')
        return cur.fetchall()

@router.get("/{check_number}", response_model=CheckResponse)
def get_check(check_number: str, current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM "Check" WHERE check_number = %s', (check_number,))
        check = cur.fetchone()
        if not check:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        return check

@router.delete("/{check_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_check(check_number: str, current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    """Видалення чеку. Тільки менеджер."""
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "Check" WHERE check_number = %s RETURNING check_number', (check_number,))
        deleted = cur.fetchone()
        if not deleted:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        conn.commit()