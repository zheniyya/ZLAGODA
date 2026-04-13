from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return product

@router.get("/", response_model=List[ProductResponse])
def get_all_products():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{id_product}", response_model=ProductResponse)
def get_product(id_product: int):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{id_product}", response_model=ProductResponse)
def update_product(id_product: int, product: ProductCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return product

@router.delete("/{id_product}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id_product: int):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass