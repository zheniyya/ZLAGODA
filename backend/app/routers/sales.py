from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.base import SaleBase, SaleResponse
from security.permissions import require_manager, get_current_user
from database import get_db_connection

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("/", response_model=List[SaleResponse])
def get_all_sales(current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    """Перегляд усіх проданих позицій (для аналітики менеджера)"""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Sale")
        return cur.fetchall()

@router.get("/{check_number}", response_model=List[SaleResponse])
def get_sales_by_check(check_number: str, current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    """Отримати всі товари конкретного чека"""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Sale WHERE check_number = %s", (check_number,))
        return cur.fetchall()

@router.get("/{check_number}/{UPC}", response_model=SaleResponse)
def get_specific_sale(check_number: str, UPC: str, current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Sale WHERE check_number = %s AND UPC = %s", (check_number, UPC))
        sale = cur.fetchone()
        if not sale:
            raise HTTPException(status_code=404, detail="Позицію не знайдено")
        return sale