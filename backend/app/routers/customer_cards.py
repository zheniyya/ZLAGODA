from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.schemas.base import CustomerCardBase, CustomerCardResponse
from app.security.permissions import require_manager, get_current_user
from app.database import get_db_connection, put_db_connection
import uuid

router = APIRouter(prefix="/customer_cards", tags=["CustomerCards"])

@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
def create_customer_card(customer_card: CustomerCardBase, current_user: dict = Depends(get_current_user)):
    card_number = str(uuid.uuid4())[:13]
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO Customer_Card (card_number, cust_surname, cust_name, cust_patronymic, phone_number, city, street, zip_code, percent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
            """, (card_number, customer_card.cust_surname, customer_card.cust_name, customer_card.cust_patronymic,
                  customer_card.phone_number, customer_card.city, customer_card.street, customer_card.zip_code, customer_card.percent))
            new_card = cur.fetchone()
            conn.commit()
            return new_card
    finally:
        put_db_connection(conn)

@router.get("/", response_model=List[CustomerCardResponse])
def get_all_customer_cards(
        search: Optional[str] = None,
        min_discount: Optional[int] = None,
        current_user: dict = Depends(get_current_user)
):
    """
    Отримати всі карти клієнтів.
    Параметри фільтрації: search (по назві/номеру), min_discount (мінімальна знижка %)
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            
            if search:
                conditions.append("(card_number ILIKE %s OR cust_surname ILIKE %s OR cust_name ILIKE %s)")
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
            if min_discount is not None:
                conditions.append("percent >= %s")
                params.append(min_discount)
            
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"SELECT * FROM Customer_Card {where} ORDER BY cust_surname", params)
            cards = cur.fetchall()
        return cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження карт: {str(e)}")
    finally:
        put_db_connection(conn)

@router.get("/{card_number}", response_model=CustomerCardResponse)
def get_customer_card(card_number: str, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM Customer_Card WHERE card_number = %s", (card_number,))
            card = cur.fetchone()
            if not card:
                raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
            return card
    finally:
        put_db_connection(conn)

@router.put("/{card_number}", response_model=CustomerCardResponse)
def update_customer_card(card_number: str, card_data: CustomerCardBase, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE Customer_Card SET 
                    cust_surname = %s, cust_name = %s, cust_patronymic = %s, 
                    phone_number = %s, city = %s, street = %s, zip_code = %s, percent = %s
                WHERE card_number = %s RETURNING *
            """, (card_data.cust_surname, card_data.cust_name, card_data.cust_patronymic,
                  card_data.phone_number, card_data.city, card_data.street, card_data.zip_code,
                  card_data.percent, card_number))
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
            conn.commit()
            return updated
    finally:
        put_db_connection(conn)

@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_card(card_number: str, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM Customer_Card WHERE card_number = %s RETURNING card_number", (card_number,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
            conn.commit()
    finally:
        put_db_connection(conn)