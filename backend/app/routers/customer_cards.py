from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.base import CustomerCardBase, CustomerCardResponse
from app.security.permissions import require_manager, get_current_user
from app.database import get_db_connection

router = APIRouter(prefix="/customer_cards", tags=["CustomerCards"])

@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
def create_customer_card(
    customer_card: CustomerCardBase, 
    current_user: dict = Depends(get_current_user), # Доступно всім
    conn = Depends(get_db_connection)
):
    import uuid
    card_number = str(uuid.uuid4())[:13] # Або використовуйте логіку генерації штрих-кодів
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO Customer_Card (
                card_number, cust_surname, cust_name, cust_patronymic, 
                phone_number, city, street, zip_code, percent
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            card_number, customer_card.cust_surname, customer_card.cust_name, 
            customer_card.cust_patronymic, customer_card.phone_number, 
            customer_card.city, customer_card.street, customer_card.zip_code, 
            customer_card.percent
        ))
        new_card = cur.fetchone()
        conn.commit()
    return new_card

@router.get("/", response_model=List[CustomerCardResponse])
def get_all_customer_cards(current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Customer_Card ORDER BY cust_surname")
        return cur.fetchall()

@router.get("/{card_number}", response_model=CustomerCardResponse)
def get_customer_card(card_number: str, current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Customer_Card WHERE card_number = %s", (card_number,))
        card = cur.fetchone()
        if not card:
            raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
        return card

@router.put("/{card_number}", response_model=CustomerCardResponse)
def update_customer_card(
    card_number: str, 
    card_data: CustomerCardBase, 
    current_user: dict = Depends(get_current_user), # Доступно всім
    conn = Depends(get_db_connection)
):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE Customer_Card 
            SET cust_surname = %s, cust_name = %s, cust_patronymic = %s, 
                phone_number = %s, city = %s, street = %s, zip_code = %s, percent = %s
            WHERE card_number = %s RETURNING *
        """, (
            card_data.cust_surname, card_data.cust_name, card_data.cust_patronymic,
            card_data.phone_number, card_data.city, card_data.street, 
            card_data.zip_code, card_data.percent, card_number
        ))
        updated_card = cur.fetchone()
        if not updated_card:
            raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
        conn.commit()
    return updated_card

@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_card(
    card_number: str, 
    current_user: dict = Depends(require_manager), # ТІЛЬКИ МЕНЕДЖЕР
    conn = Depends(get_db_connection)
):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM Customer_Card WHERE card_number = %s RETURNING card_number", (card_number,))
        deleted = cur.fetchone()
        if not deleted:
            raise HTTPException(status_code=404, detail="Карту клієнта не знайдено")
        conn.commit()