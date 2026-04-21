from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from app.database import get_db_connection, put_db_connection
from app.security.permissions import require_manager

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# -------------------------------------------------------------------
# 1. Звіт по клієнтах (використовує customer_summary_view)
# -------------------------------------------------------------------
# app/routers/analytics.py (фрагмент)

@router.get("/customer-summary", response_model=List[Dict[str, Any]])
def get_sales_by_discount(
    min_percent: int = Query(10, ge=0, description="Мінімальний відсоток знижки клієнта"),
    current_user: dict = Depends(require_manager)
):
    """
    Продажі за категоріями серед клієнтів зі знижкою ≥ min_percent.
    Повертає: назву категорії, кількість унікальних клієнтів, загальну суму продажів.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM get_sales_by_discount(%s);", (min_percent,))
            rows = cur.fetchall()
            result = []
            for row in rows:
                result.append({
                    "category_name": row["category_name"],
                    "unique_customers": row["unique_customers"],
                    "total_sales_amount": float(row["total_sales_amount"])
                })
            return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка: {str(e)}")
    finally:
        put_db_connection(conn)


# -------------------------------------------------------------------
# 2. Продажі за категоріями та місяцями (sales_by_category_month_view)
# -------------------------------------------------------------------
@router.get("/sales-by-category-month", response_model=List[Dict[str, Any]])
def get_sales_by_category_month(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM sales_by_category_month_view;")
            rows = cur.fetchall()
            result = []
            for row in rows:
                result.append({
                    "category_number": row["category_number"],
                    "category_name": row["category_name"],
                    "year": int(row["year"]),
                    "month": int(row["month"]),
                    "total_sales": float(row["total_sales"])
                })
            return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка: {str(e)}")
    finally:
        put_db_connection(conn)


# -------------------------------------------------------------------
# 3. Акційні товари, які жодного разу не продавались (promo_never_sold_view)
# -------------------------------------------------------------------
@router.get("/categories-all-promo-sold", response_model=List[Dict[str, Any]])
def get_categories_all_promo_sold(
    current_user: dict = Depends(require_manager)
):
    """
    Повертає категорії, у яких ВСІ акційні товари були продані хоча б один раз.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM get_categories_where_all_promotional_products_sold(%s);", (True,))
            rows = cur.fetchall()
            result = []
            for row in rows:
                result.append({
                    "category_name": row["category_name"]
                })
            return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка: {str(e)}")
    finally:
        put_db_connection(conn)


# -------------------------------------------------------------------
# 4. Товари, що не продавались N днів (функція get_not_sold_for_days)
# -------------------------------------------------------------------
@router.get("/not-sold-days", response_model=List[Dict[str, Any]])
def get_not_sold_for_days(
    days: int = Query(30, ge=1, description="Кількість днів"),
    current_user: dict = Depends(require_manager)
):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM get_not_sold_for_days(%s);", (days,))
            rows = cur.fetchall()
            result = []
            for row in rows:
                result.append({
                    "upc": row["upc"],
                    "product_name": row["product_name"],
                    "products_number": row["products_number"],
                    "selling_price": float(row["selling_price"]),
                    "promotional_product": row["promotional_product"]
                })
            return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка: {str(e)}")
    finally:
        put_db_connection(conn)