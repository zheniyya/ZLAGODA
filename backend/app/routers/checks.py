from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.base import CheckCreate, CheckResponse
from app.security.permissions import require_cashier, require_manager, get_current_user
from app.database import get_db_connection
import uuid
from datetime import datetime

router = APIRouter(prefix="/checks", tags=["Checks"])


@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
def create_check(
        check_data: CheckCreate,
        current_user: dict = Depends(require_cashier),
        conn=Depends(get_db_connection)
):
    """Створення нового чеку. Доступно виключно касирам."""
    check_number = str(uuid.uuid4())[:10]

    # TODO: додати повну транзакцію з Sale та оновленням залишків
    sum_total = 100.50  # тимчасово
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
def get_all_checks(
        current_user: dict = Depends(get_current_user),
        conn=Depends(get_db_connection)
):
    """
    Перегляд чеків:
    - Менеджер бачить усі чеки.
    - Касир бачить тільки свої чеки.
    """
    with conn.cursor() as cur:
        if current_user["role"] == "manager":
            cur.execute('SELECT * FROM "Check" ORDER BY print_date DESC')
        else:
            cur.execute(
                'SELECT * FROM "Check" WHERE id_employee = %s ORDER BY print_date DESC',
                (current_user["id_employee"],)
            )
        return cur.fetchall()


@router.get("/{check_number}", response_model=CheckResponse)
def get_check(
        check_number: str,
        current_user: dict = Depends(get_current_user),
        conn=Depends(get_db_connection)
):
    """
    Отримання конкретного чеку.
    - Менеджер може дивитись будь-який чек.
    - Касир — тільки свій.
    """
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM "Check" WHERE check_number = %s', (check_number,))
        check = cur.fetchone()
        if not check:
            raise HTTPException(status_code=404, detail="Чек не знайдено")

        if current_user["role"] == "cashier" and check["id_employee"] != current_user["id_employee"]:
            raise HTTPException(status_code=403, detail="Ви не маєте доступу до цього чеку")

        return check


@router.get("/{check_number}/items")
def get_check_items(
        check_number: str,
        current_user: dict = Depends(get_current_user),
        conn=Depends(get_db_connection)
):
    """Отримання списку куплених товарів для конкретного чеку."""
    with conn.cursor() as cur:
        # Спочатку перевіряємо доступ до чеку (як у get_check)
        cur.execute('SELECT id_employee FROM "Check" WHERE check_number = %s', (check_number,))
        check = cur.fetchone()
        if not check:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        if current_user["role"] == "cashier" and check["id_employee"] != current_user["id_employee"]:
            raise HTTPException(status_code=403, detail="Ви не маєте доступу до цього чеку")

        cur.execute("""
                    SELECT p.product_name   AS name,
                           s.product_number AS qty,
                           s.selling_price  AS price
                    FROM Sale s
                             JOIN Store_Product sp ON s.upc = sp.upc
                             JOIN Product p ON sp.id_product = p.id_product
                    WHERE s.check_number = %s
                    """, (check_number,))
        items = cur.fetchall()
        return items


@router.delete("/{check_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_check(
        check_number: str,
        current_user: dict = Depends(require_manager),
        conn=Depends(get_db_connection)
):
    """Видалення чеку. Тільки менеджер."""
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "Check" WHERE check_number = %s RETURNING check_number', (check_number,))
        deleted = cur.fetchone()
        if not deleted:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        conn.commit()