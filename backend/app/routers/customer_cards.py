from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import CustomerCardCreate, CustomerCardResponse

router = APIRouter(prefix="/customer_cards", tags=["CustomerCards"])

@router.post("/", response_model=CustomerCardResponse, status_code=status.HTTP_201_CREATED)
def create_customer_card(customer_card: CustomerCardCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return customer_card

@router.get("/", response_model=List[CustomerCardResponse])
def get_all_customer_cards():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{card_number}", response_model=CustomerCardResponse)
def get_customer_card(card_number: int):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{card_number}", response_model=CustomerCardResponse)
def update_customer_card(card_number: int, customer_card: CustomerCardCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return customer_card

@router.delete("/{card_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_card(card_number: int):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass