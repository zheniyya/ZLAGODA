from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.base import EmployeeCreate, EmployeeResponse

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate):
    # Тут буде виклик Service -> Repository (SQL INSERT)
    return employee

@router.get("/", response_model=List[EmployeeResponse])
def get_all_employees():
    # Тут буде виклик Service -> Repository (SQL SELECT *)
    return []

@router.get("/{id_employee}", response_model=EmployeeResponse)
def get_employee(id_employee: str):
    # Тут буде виклик Service -> Repository (SQL SELECT WHERE id=...)
    pass

@router.put("/{id_employee}", response_model=EmployeeResponse)
def update_employee(id_employee: str, employee: EmployeeCreate):
    # Тут буде виклик Service -> Repository (SQL UPDATE)
    return employee

@router.delete("/{id_employee}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(id_employee: str):
    # Тут буде виклик Service -> Repository (SQL DELETE)
    pass