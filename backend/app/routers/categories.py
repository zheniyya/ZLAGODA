from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.base import CategoryBase, CategoryResponse
from security.permissions import require_manager, get_current_user
from database import get_db_connection

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: CategoryBase, 
    current_user: dict = Depends(require_manager), 
    conn = Depends(get_db_connection)
):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO Category (category_name) VALUES (%s) RETURNING *",
            (category.category_name,)
        )
        new_category = cur.fetchone()
        conn.commit()
    return new_category

@router.get("/", response_model=List[CategoryResponse])
def get_all_categories(current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    """Отримати список всіх категорій. Доступно всім авторизованим."""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Category ORDER BY category_name")
        return cur.fetchall()

@router.get("/{category_number}", response_model=CategoryResponse)
def get_category(category_number: int, current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Category WHERE category_number = %s", (category_number,))
        category = cur.fetchone()
        if not category:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")
        return category

@router.put("/{category_number}", response_model=CategoryResponse)
def update_category(
    category_number: int, 
    category_data: CategoryBase, 
    current_user: dict = Depends(require_manager), 
    conn = Depends(get_db_connection)
):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE Category 
            SET category_name = %s 
            WHERE category_number = %s RETURNING *
        """, (category_data.category_name, category_number))
        updated_category = cur.fetchone()
        if not updated_category:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")
        conn.commit()
    return updated_category

@router.delete("/{category_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_number: int, 
    current_user: dict = Depends(require_manager), 
    conn = Depends(get_db_connection)
):
    with conn.cursor() as cur:
        try:
            cur.execute("DELETE FROM Category WHERE category_number = %s RETURNING category_number", (category_number,))
            deleted = cur.fetchone()
            if not deleted:
                raise HTTPException(status_code=404, detail="Категорію не знайдено")
            conn.commit()
        except Exception as e:
            conn.rollback()
            # Обробка помилки зовнішнього ключа, якщо до категорії прив'язані товари
            raise HTTPException(status_code=400, detail="Неможливо видалити категорію, що містить товари.")