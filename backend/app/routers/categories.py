from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return category

@router.get("/", response_model=List[CategoryResponse])
def get_all_categories():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{category_number}", response_model=CategoryResponse)
def get_category(category_number: int):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{category_number}", response_model=CategoryResponse)
def update_category(category_number: int, category: CategoryCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return category

@router.delete("/{category_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_number: int):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass