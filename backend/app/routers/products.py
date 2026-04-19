from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.schemas.base import ProductBase, ProductResponse
from app.security.permissions import require_manager, get_current_user
from app.database import get_db_connection, put_db_connection

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductBase, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO Product (category_number, product_name, characteristics) VALUES (%s, %s, %s) RETURNING *",
                        (product.category_number, product.product_name, product.characteristics))
            new_product = cur.fetchone()
            conn.commit()
            return new_product
    finally:
        put_db_connection(conn)

@router.get("/", response_model=List[ProductResponse])
def get_all_products(
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        current_user: dict = Depends(get_current_user)
):
    """
    Отримати всі товари.
    Параметри фільтрації: search (по назві), category_id
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            
            if search:
                conditions.append("product_name ILIKE %s")
                params.append(f"%{search}%")
            if category_id is not None:
                conditions.append("category_number = %s")
                params.append(category_id)
            
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"SELECT * FROM Product {where} ORDER BY product_name", params)
            products = cur.fetchall()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження товарів: {str(e)}")
    finally:
        put_db_connection(conn)

@router.get("/{id_product}", response_model=ProductResponse)
def get_product(id_product: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM Product WHERE id_product = %s", (id_product,))
            product = cur.fetchone()
            if not product:
                raise HTTPException(status_code=404, detail="Товар не знайдено")
            return product
    finally:
        put_db_connection(conn)

@router.put("/{id_product}", response_model=ProductResponse)
def update_product(id_product: int, product: ProductBase, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE Product SET category_number = %s, product_name = %s, characteristics = %s WHERE id_product = %s RETURNING *",
                        (product.category_number, product.product_name, product.characteristics, id_product))
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Товар не знайдено")
            conn.commit()
            return updated
    finally:
        put_db_connection(conn)

@router.delete("/{id_product}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id_product: int, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM Product WHERE id_product = %s RETURNING id_product", (id_product,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Товар не знайдено")
            conn.commit()
    finally:
        put_db_connection(conn)