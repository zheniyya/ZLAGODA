from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(sale: SaleCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return sale

@router.get("/", response_model=List[SaleResponse])
def get_all_sales():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{UPC}", response_model=SaleResponse)
def get_sale(UPC: str):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{UPC}", response_model=SaleResponse)
def update_sale(UPC: str, sale: SaleCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return sale

@router.delete("/{UPC}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(UPC: str):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass