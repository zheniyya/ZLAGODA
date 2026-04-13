from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import CheckCreate, CheckResponse

router = APIRouter(prefix="/checks", tags=["Checks"])

@router.post("/", response_model=CheckResponse, status_code=status.HTTP_201_CREATED)
def create_check(check: CheckCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return check

@router.get("/", response_model=List[CheckResponse])
def get_all_checks():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{check_number}", response_model=CheckResponse)
def get_check(check_number: int):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{check_number}", response_model=CheckResponse)
def update_check(check_number: int, check: CheckCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return check

@router.delete("/{check_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_check(check_number: int):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass