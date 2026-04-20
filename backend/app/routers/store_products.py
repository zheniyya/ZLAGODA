from random import randint
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.schemas.base import StoreProductBase, StoreProductResponse, StoreProductCreate
from app.security.permissions import require_manager, get_current_user
from app.database import get_db_connection, put_db_connection
import uuid

router = APIRouter(prefix="/store_products", tags=["StoreProducts"])


# Helper function to guarantee a unique UPC
def generate_unique_upc(cur):
    while True:
        # Generate a random 12-digit string
        new_upc = str(randint(100000000000, 999999999999))
        
        # Check if it already exists
        cur.execute("SELECT upc FROM Store_Product WHERE upc = %s", (new_upc,))
        if not cur.fetchone():
            return new_upc # It's unique, return it

@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_store_product(sp: StoreProductCreate, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check if this exact type of store product (promo or regular) already exists
            cur.execute("""
                SELECT upc, products_number, selling_price 
                FROM Store_Product 
                WHERE id_product = %s AND promotional_product = %s
            """, (sp.id_product, sp.promotional_product))
            existing_product = cur.fetchone()

            if not sp.promotional_product:
                # ==========================================
                # SCENARIO A: HANDLING REGULAR PRODUCTS
                # ==========================================
                if existing_product:
                    # 1. Product exists: Add quantities, update to the new price
                    new_qty = existing_product['products_number'] + sp.products_number
                    
                    cur.execute("""
                        UPDATE Store_Product 
                        SET selling_price = %s, products_number = %s 
                        WHERE upc = %s RETURNING *
                    """, (sp.selling_price, new_qty, existing_product['upc']))
                    saved_product = cur.fetchone()

                    # 2. Revaluate the promo product if it exists!
                    promo_price = round(float(sp.selling_price) * 0.8, 2)
                    cur.execute("""
                        UPDATE Store_Product 
                        SET selling_price = %s 
                        WHERE id_product = %s AND promotional_product = TRUE
                    """, (promo_price, sp.id_product))
                else:
                    # 1. Product doesn't exist: Standard Insert for the new regular batch
                    upc = generate_unique_upc(cur)
                    cur.execute("""
                        INSERT INTO Store_Product 
                        (upc, id_product, selling_price, products_number, promotional_product) 
                        VALUES (%s, %s, %s, %s, FALSE) RETURNING *
                    """, (upc, sp.id_product, sp.selling_price, sp.products_number))
                    saved_product = cur.fetchone()

                    # 2. THE FIX: If there is a leftover promo product on the shelves, 
                    # we MUST forcefully update its price to match the new regular product's price!
                    promo_price = round(float(sp.selling_price) * 0.8, 2)
                    cur.execute("""
                        UPDATE Store_Product 
                        SET selling_price = %s 
                        WHERE id_product = %s AND promotional_product = TRUE
                    """, (promo_price, sp.id_product))

            else:
                # ==========================================
                # SCENARIO B: HANDLING PROMOTIONAL PRODUCTS
                # ==========================================
                # 1. Find the base regular product to get the true price
                cur.execute("""
                    SELECT upc, selling_price FROM Store_Product 
                    WHERE id_product = %s AND promotional_product = FALSE
                """, (sp.id_product,))
                base_product = cur.fetchone()

                if not base_product:
                    raise HTTPException(
                        status_code=400, 
                        detail="Неможливо створити акційний товар без існуючого звичайного товару."
                    )

                # Force the 80% calculation, ignoring the user input
                calculated_promo_price = round(float(base_product['selling_price']) * 0.8, 2)

                if existing_product:
                    # Promo exists: Just add the quantities
                    new_qty = existing_product['products_number'] + sp.products_number
                    cur.execute("""
                        UPDATE Store_Product 
                        SET products_number = %s, selling_price = %s 
                        WHERE upc = %s RETURNING *
                    """, (new_qty, calculated_promo_price, existing_product['upc']))
                    saved_product = cur.fetchone()
                else:
                    # Insert new promo linked to the regular product
                    upc = generate_unique_upc(cur)
                    cur.execute("""
                        INSERT INTO Store_Product 
                        (upc, upc_prom, id_product, selling_price, products_number, promotional_product) 
                        VALUES (%s, %s, %s, %s, %s, TRUE) RETURNING *
                    """, (upc, base_product['upc'], sp.id_product, calculated_promo_price, sp.products_number))
                    saved_product = cur.fetchone()

            conn.commit()
            return saved_product

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_db_connection(conn)

@router.get("/", response_model=List[StoreProductResponse])
def get_all_store_products(
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        promotional: Optional[bool] = None,
        current_user: dict = Depends(get_current_user)
):
    """
    Отримати всі товари в магазині.
    ВИПРАВЛЕННЯ №5: Серверна фільтрація за UPC/назвою/категорією/акційністю.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []

            if search:
                conditions.append("(sp.upc ILIKE %s OR p.product_name ILIKE %s)")
                params.extend([f"%{search}%", f"%{search}%"])
            if category_id is not None:
                conditions.append("p.category_number = %s")
                params.append(category_id)
            if promotional is not None:
                conditions.append("sp.promotional_product = %s")
                params.append(promotional)

            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

            cur.execute(f"""
                SELECT sp.upc, sp.upc_prom, sp.id_product, sp.selling_price,
                       sp.products_number, sp.promotional_product,
                       p.product_name, p.characteristics, c.category_name
                FROM Store_Product sp
                JOIN Product p ON sp.id_product = p.id_product
                JOIN Category c ON p.category_number = c.category_number
                {where}
                ORDER BY p.product_name
            """, params)
            products = cur.fetchall()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження товарів: {str(e)}")
    finally:
        put_db_connection(conn)


@router.get("/{UPC}", response_model=StoreProductResponse)
def get_store_product(UPC: str, current_user: dict = Depends(get_current_user)):
    """
    Отримати товар за UPC.
    ВИПРАВЛЕННЯ №6: Повертає також product_name та characteristics з таблиці Product.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT sp.upc, sp.upc_prom, sp.id_product, sp.selling_price,
                       sp.products_number, sp.promotional_product,
                       p.product_name, p.characteristics, c.category_name
                FROM Store_Product sp
                JOIN Product p ON sp.id_product = p.id_product
                JOIN Category c ON p.category_number = c.category_number
                WHERE sp.upc = %s
            """, (UPC,))
            sp = cur.fetchone()
            if not sp:
                raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")
            return sp
    finally:
        put_db_connection(conn)

@router.put("/{UPC}", response_model=StoreProductResponse)
def update_store_product(UPC: str, sp: StoreProductBase, current_user: dict = Depends(require_manager)):
    """
    Оновлення товару в магазині. 
    Жорстко контролює зміну цін та кількості згідно з правилом 20% знижки.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Fetch the existing product to see what we are dealing with
            cur.execute("SELECT * FROM Store_Product WHERE upc = %s", (UPC,))
            current = cur.fetchone()
            if not current:
                raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")

            # 2. Prevent changing a regular product to promotional (or vice versa) during an edit.
            # If they want a promo, they should create a new one to generate a new UPC.
            if current['promotional_product'] != sp.promotional_product:
                raise HTTPException(
                    status_code=400, 
                    detail="Неможливо змінити тип (звичайний/акційний) існуючого товару. Додайте нову партію."
                )

            if not current['promotional_product']:
                # ==========================================
                # SCENARIO A: EDITING A REGULAR PRODUCT
                # ==========================================
                # Update the regular product with whatever the user entered
                cur.execute("""
                    UPDATE Store_Product SET
                        id_product = %s,
                        selling_price = %s,
                        products_number = %s
                    WHERE upc = %s RETURNING *
                """, (sp.id_product, sp.selling_price, sp.products_number, UPC))
                updated = cur.fetchone()

                # CRITICAL: Automatically recalculate and update the linked promo product!
                promo_price = round(float(sp.selling_price) * 0.8, 2)
                cur.execute("""
                    UPDATE Store_Product
                    SET selling_price = %s
                    WHERE id_product = %s AND promotional_product = TRUE
                """, (promo_price, sp.id_product))
            
            else:
                # ==========================================
                # SCENARIO B: EDITING A PROMOTIONAL PRODUCT
                # ==========================================
                # First, find the base product to get the true price
                cur.execute("""
                    SELECT selling_price FROM Store_Product
                    WHERE id_product = %s AND promotional_product = FALSE
                """, (sp.id_product,))
                base = cur.fetchone()
                
                if not base:
                    raise HTTPException(status_code=400, detail="Відсутній базовий товар для розрахунку акційної ціни.")

                # Forcefully calculate the 80% price, ignoring whatever the frontend sent
                calculated_promo_price = round(float(base["selling_price"]) * 0.8, 2)

                # Update the promo product
                cur.execute("""
                    UPDATE Store_Product SET
                        id_product = %s,
                        selling_price = %s,
                        products_number = %s
                    WHERE upc = %s RETURNING *
                """, (sp.id_product, calculated_promo_price, sp.products_number, UPC))
                updated = cur.fetchone()

            conn.commit()
            return updated

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка оновлення: {str(e)}")
    finally:
        put_db_connection(conn)

@router.delete("/{UPC}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store_product(UPC: str, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM Store_Product WHERE UPC = %s RETURNING UPC", (UPC,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")
            conn.commit()
    finally:
        put_db_connection(conn)