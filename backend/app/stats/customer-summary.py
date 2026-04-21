from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.database import get_db_connection, put_db_connection
from app.security.permissions import require_manager

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/customer-summary", response_model=List[Dict[str, Any]])
def get_customer_summary(current_user: dict = Depends(require_manager)):
    """
    Повертає статистику по клієнтах:
    - кількість чеків
    - загальна сума покупок (зі знижкою)
    - сума без знижки
    - економія клієнта
    Дані беруться з представлення customer_summary_view у Supabase.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Просто вибираємо всі дані з готового VIEW
            cur.execute("SELECT * FROM customer_summary_view;")
            rows = cur.fetchall()

            # Перетворюємо Decimal у float для JSON
            result = []
            for row in rows:
                result.append({
                    "card_number": row["card_number"],
                    "cust_surname": row["cust_surname"],
                    "cust_name": row["cust_name"],
                    "total_checks": row["total_checks"],
                    "total_spent_with_discount": float(row["total_spent_with_discount"]),
                    "total_without_discount": float(row["total_without_discount"]),
                    "total_saved": float(row["total_saved"])
                })
            return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка виконання запиту: {str(e)}")
    finally:
        put_db_connection(conn)