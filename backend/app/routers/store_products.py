from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.schemas.base import StoreProductBase, StoreProductResponse
from app.security.permissions import require_manager, get_current_user
from app.database import get_db_connection, put_db_connection
import uuid

router = APIRouter(prefix="/store_products", tags=["StoreProducts"])


@router.post("/", response_model=StoreProductResponse, status_code=status.HTTP_201_CREATED)
def create_store_product(sp: StoreProductBase, current_user: dict = Depends(require_manager)):
    """
    Створення нового товару в магазині.
    ВИПРАВЛЕННЯ №3: Перевірка обмеження — не більше 2-х Store_Product на один Product
    (один звичайний + один акційний).
    """
    UPC = str(uuid.uuid4())[:12]
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Перевіряємо кількість існуючих записів для цього продукту
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM Store_Product WHERE id_product = %s",
                (sp.id_product,)
            )
            result = cur.fetchone()
            if result["cnt"] >= 2:
                raise HTTPException(
                    status_code=400,
                    detail="Для одного продукту може бути не більше 2-х позицій у магазині (звичайна та акційнa)"
                )

            # Якщо це звичайний товар — перевіряємо що вже не існує інший звичайний
            if not sp.promotional_product:
                cur.execute(
                    "SELECT upc FROM Store_Product WHERE id_product = %s AND promotional_product = FALSE",
                    (sp.id_product,)
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Для цього товару вже існує звичайна версія. Ви можете додати лише акційну версію (зі знижкою 20%)"
                    )

            # Якщо це акційний товар — перевіряємо що вже є звичайний
            if sp.promotional_product:
                cur.execute(
                    "SELECT upc FROM Store_Product WHERE id_product = %s AND promotional_product = FALSE",
                    (sp.id_product,)
                )
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Спочатку додайте звичайну (не акційну) версію цього товару"
                    )

            cur.execute("""
                INSERT INTO Store_Product (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product)
                VALUES (%s, NULL, %s, %s, %s, %s) RETURNING *
            """, (UPC, sp.id_product, sp.selling_price, sp.products_number, sp.promotional_product))
            new_sp = cur.fetchone()
            conn.commit()
            return new_sp
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
    ВИПРАВЛЕННЯ №2: При зміні ціни звичайного товару — автоматично оновлюється
    акційний (ціна * 0.8), і навпаки — якщо оновлюється акційний, перевіряємо
    що ціна не перевищує 80% від базової.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Отримуємо поточний запис
            cur.execute("SELECT * FROM Store_Product WHERE upc = %s", (UPC,))
            current = cur.fetchone()
            if not current:
                raise HTTPException(status_code=404, detail="Товар в магазині не знайдено")

            # --- ДОДАНО: Заборона змінювати акційний на звичайний, якщо вже є звичайний ---
            if not sp.promotional_product:
                cur.execute(
                    "SELECT upc FROM Store_Product WHERE id_product = %s AND promotional_product = FALSE AND upc != %s",
                    (sp.id_product, UPC)
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Для цього товару вже існує звичайна версія. Ви можете додати лише акційну версію (зі знижкою 20%)"
                    )

            cur.execute("""
                UPDATE Store_Product SET
                    id_product = %s,
                    selling_price = %s,
                    products_number = %s,
                    promotional_product = %s
                WHERE upc = %s RETURNING *
            """, (sp.id_product, sp.selling_price, sp.products_number, sp.promotional_product, UPC))
            updated = cur.fetchone()

            # ВИПРАВЛЕННЯ №2: Переоцінка пов'язаного товару
            if not current["promotional_product"]:
                # Оновлюємо звичайний товар → автоматично перераховуємо акційний (80% від нової ціни)
                promo_price = round(float(sp.selling_price) * 0.8, 2)
                cur.execute("""
                    UPDATE Store_Product
                    SET selling_price = %s
                    WHERE id_product = %s AND promotional_product = TRUE
                """, (promo_price, sp.id_product))
            else:
                # Оновлюємо акційний товар → перевіряємо що ціна ≤ 80% від базової
                cur.execute("""
                    SELECT selling_price FROM Store_Product
                    WHERE id_product = %s AND promotional_product = FALSE
                """, (sp.id_product,))
                base = cur.fetchone()
                if base:
                    max_promo_price = round(float(base["selling_price"]) * 0.8, 2)
                    if float(sp.selling_price) > max_promo_price:
                        conn.rollback()
                        raise HTTPException(
                            status_code=400,
                            detail=f"Акційна ціна не може бути більшою за {max_promo_price} ₴ (80% від базової)"
                        )

            conn.commit()
            return updated
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