from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.base import CheckResponse
from app.security.permissions import require_cashier, require_manager, get_current_user
from app.database import get_db_connection
import uuid
from datetime import datetime, date

router = APIRouter(prefix="/checks", tags=["Checks"])


# ─── Розширена схема для створення чека ────────────────────────────────────────
class SaleItem(BaseModel):
    upc: str
    product_number: int


class CheckCreate(BaseModel):
    card_number: Optional[str] = None
    items: List[SaleItem]


# ─── ВИПРАВЛЕННЯ №1: Повна транзакція створення чека ──────────────────────────
@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
def create_check(
        check_data: CheckCreate,
        current_user: dict = Depends(require_cashier),
        conn=Depends(get_db_connection)
):
    """
    Створення нового чеку з повною транзакцією:
    - Перевірка залишків на складі
    - Розрахунок суми з урахуванням знижки клієнта
    - Запис позицій у таблицю Sale
    - Зменшення залишків у Store_Product
    """
    if not check_data.items:
        raise HTTPException(status_code=400, detail="Чек не може бути порожнім")

    check_number = str(uuid.uuid4())[:10]

    try:
        with conn.cursor() as cur:
            # 1. Отримуємо знижку клієнта (якщо є карта)
            discount_percent = 0
            if check_data.card_number:
                cur.execute(
                    "SELECT percent FROM Customer_Card WHERE card_number = %s",
                    (check_data.card_number,)
                )
                card = cur.fetchone()
                if not card:
                    raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
                discount_percent = card["percent"]

            # 2. Перевіряємо наявність усіх товарів та отримуємо ціни
            sale_lines = []
            for item in check_data.items:
                cur.execute(
                    "SELECT upc, selling_price, products_number FROM Store_Product WHERE upc = %s FOR UPDATE",
                    (item.upc,)
                )
                sp = cur.fetchone()
                if not sp:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Товар з UPC {item.upc} не знайдено"
                    )
                if sp["products_number"] < item.product_number:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Недостатньо товару {item.upc}: є {sp['products_number']}, потрібно {item.product_number}"
                    )
                sale_lines.append({
                    "upc": item.upc,
                    "product_number": item.product_number,
                    "selling_price": sp["selling_price"],
                })

            # 3. Розраховуємо суму з урахуванням знижки
            raw_sum = sum(
                float(line["selling_price"]) * line["product_number"]
                for line in sale_lines
            )
            discount_multiplier = 1 - (discount_percent / 100)
            sum_total = round(raw_sum * discount_multiplier, 4)
            vat = round(sum_total * 0.20, 4)

            # 4. Створюємо запис чека
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

            # 5. Записуємо позиції Sale та зменшуємо залишки
            for line in sale_lines:
                cur.execute("""
                    INSERT INTO Sale (upc, check_number, product_number, selling_price)
                    VALUES (%s, %s, %s, %s)
                """, (
                    line["upc"],
                    check_number,
                    line["product_number"],
                    line["selling_price"]
                ))
                cur.execute("""
                    UPDATE Store_Product
                    SET products_number = products_number - %s
                    WHERE upc = %s
                """, (line["product_number"], line["upc"]))

            conn.commit()
            return new_check

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка при створенні чеку: {str(e)}")


@router.get("/", response_model=List[CheckResponse])
def get_all_checks(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        cashier_id: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
        conn=Depends(get_db_connection)
):
    """
    Перегляд чеків з фільтрацією за датою та касиром.
    - Менеджер бачить усі чеки (та може фільтрувати за касиром і датою).
    - Касир бачить тільки свої чеки.
    ВИПРАВЛЕННЯ №4: Додано серверну фільтрацію за параметрами.
    """
    with conn.cursor() as cur:
        if current_user["role"] == "manager":
            conditions = []
            params = []

            if cashier_id:
                conditions.append("id_employee = %s")
                params.append(cashier_id)
            if start_date:
                conditions.append("print_date >= %s")
                params.append(start_date)
            if end_date:
                conditions.append("print_date < %s + INTERVAL '1 day'")
                params.append(end_date)

            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(
                f'SELECT * FROM "Check" {where} ORDER BY print_date DESC',
                params
            )
        else:
            # Касир бачить лише свої чеки
            conditions = ["id_employee = %s"]
            params = [current_user["id_employee"]]

            if start_date:
                conditions.append("print_date >= %s")
                params.append(start_date)
            if end_date:
                conditions.append("print_date < %s + INTERVAL '1 day'")
                params.append(end_date)

            where = "WHERE " + " AND ".join(conditions)
            cur.execute(
                f'SELECT * FROM "Check" {where} ORDER BY print_date DESC',
                params
            )
        return cur.fetchall()


@router.get("/{check_number}", response_model=CheckResponse)
def get_check(
        check_number: str,
        current_user: dict = Depends(get_current_user),
        conn=Depends(get_db_connection)
):
    """Отримання конкретного чеку."""
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
        cur.execute('SELECT id_employee FROM "Check" WHERE check_number = %s', (check_number,))
        check = cur.fetchone()
        if not check:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        if current_user["role"] == "cashier" and check["id_employee"] != current_user["id_employee"]:
            raise HTTPException(status_code=403, detail="Ви не маєте доступу до цього чеку")

        cur.execute("""
            SELECT p.product_name   AS name,
                   s.product_number AS qty,
                   s.selling_price  AS price,
                   (s.product_number * s.selling_price) AS line_total
            FROM Sale s
                     JOIN Store_Product sp ON s.upc = sp.upc
                     JOIN Product p ON sp.id_product = p.id_product
            WHERE s.check_number = %s
        """, (check_number,))
        return cur.fetchall()


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