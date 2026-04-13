from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import StoreProductCreate, StoreProductResponse

router = APIRouter(prefix="/store_products", tags=["StoreProducts"])

@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
def create_store_product(store_product: StoreProductCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return store_product

@router.get("/", response_model=List[StoreProductResponse])
def get_all_store_products():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{UPC}", response_model=StoreProductResponse)
def get_store_product(UPC: str):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{UPC}", response_model=StoreProductResponse)
def update_store_product(UPC: str, store_product: StoreProductCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return store_product

@router.delete("/{UPC}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store_product(UPC: str):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass