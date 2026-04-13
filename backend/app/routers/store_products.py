from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.base import StoreProductBase, StoreProductResponse
from app.security.permissions import require_manager, get_current_user
from app.database import get_db_connection
import uuid

router = APIRouter(prefix="/store_products", tags=["StoreProducts"])

@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
def create_store_product(sp: StoreProductBase, current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    UPC = str(uuid.uuid4())[:12] # Або реальний штрих-код
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO Store_Product (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product)
            VALUES (%s, NULL, %s, %s, %s, %s) RETURNING *
        """, (UPC, sp.id_product, sp.selling_price, sp.products_number, sp.promotional_product))
        new_sp = cur.fetchone()
        conn.commit()
    return new_sp

@router.get("/", response_model=List[StoreProductResponse])
def get_all_store_products(current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Store_Product")
        return cur.fetchall()

@router.get("/{UPC}", response_model=StoreProductResponse)
def get_store_product(UPC: str, current_user: dict = Depends(get_current_user), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Store_Product WHERE UPC = %s", (UPC,))
        sp = cur.fetchone()
        if not sp:
            raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")
        return sp

@router.put("/{UPC}", response_model=StoreProductResponse)
def update_store_product(UPC: str, sp: StoreProductBase, current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE Store_Product SET 
                id_product = %s, selling_price = %s, products_number = %s, promotional_product = %s
            WHERE UPC = %s RETURNING *
        """, (sp.id_product, sp.selling_price, sp.products_number, sp.promotional_product, UPC))
        updated_sp = cur.fetchone()
        if not updated_sp:
            raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")
        conn.commit()
    return updated_sp

@router.delete("/{UPC}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store_product(UPC: str, current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM Store_Product WHERE UPC = %s RETURNING UPC", (UPC,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")
        conn.commit()