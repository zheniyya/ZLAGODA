from fastapi import APIRouter, Depends, Response
from typing import Optional
from datetime import date
from app.security.permissions import require_manager
from app.database import get_db_connection, put_db_connection
from app.services.report_service import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/employees")
def report_employees(
        role: Optional[str] = None,
        current_user: dict = Depends(require_manager)
):
    """
    Звіт по працівниках.
    Параметри: role (cashier|manager) — регістр не має значення.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            if role:
                # ВИПРАВЛЕНО: нечутливе до регістру порівняння ролі
                conditions.append("LOWER(empl_role) = LOWER(%s)")
                params.append(role)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(
                f"SELECT id_employee, empl_surname, empl_name, empl_role, phone_number, salary "
                f"FROM Employee {where} ORDER BY empl_surname",
                params
            )
            data = cur.fetchall()
        title = f"Employees Report" + (f" — role: {role}" if role else "")
        headers = ["ID", "Surname", "Name", "Role", "Phone", "Salary"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=employees_report.pdf"})
    finally:
        put_db_connection(conn)


@router.get("/products")
def report_products(
        category_id: Optional[int] = None,
        current_user: dict = Depends(require_manager)
):
    """
    Звіт по товарах.
    Параметри: category_id
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            if category_id:
                conditions.append("p.category_number = %s")
                params.append(category_id)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"""
                SELECT p.id_product, p.product_name, c.category_name, p.characteristics
                FROM Product p
                JOIN Category c ON p.category_number = c.category_number
                {where}
                ORDER BY p.product_name
            """, params)
            data = cur.fetchall()
        title = "Products Report" + (f" — category_id: {category_id}" if category_id else "")
        headers = ["ID", "Product Name", "Category", "Characteristics"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=products_report.pdf"})
    finally:
        put_db_connection(conn)


@router.get("/checks")
def report_checks(
        cashier_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        current_user: dict = Depends(require_manager)
):
    """
    Звіт по чеках з фільтрацією за касиром та датою.
    Параметри: cashier_id, start_date, end_date
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            if cashier_id:
                # ВИПРАВЛЕНО: нечутливе до регістру порівняння ID касира
                conditions.append("LOWER(c.id_employee) = LOWER(%s)")
                params.append(cashier_id)
            if start_date:
                conditions.append("c.print_date >= %s")
                params.append(start_date)
            if end_date:
                conditions.append("c.print_date < %s + INTERVAL '1 day'")
                params.append(end_date)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"""
                SELECT c.check_number, e.empl_surname || ' ' || e.empl_name AS cashier,
                       c.card_number, c.print_date, c.sum_total, c.vat
                FROM "Check" c
                JOIN Employee e ON c.id_employee = e.id_employee
                {where}
                ORDER BY c.print_date DESC
            """, params)
            data = cur.fetchall()

        title_parts = ["Checks Report"]
        if cashier_id:
            title_parts.append(f"cashier: {cashier_id}")
        if start_date:
            title_parts.append(f"from: {start_date}")
        if end_date:
            title_parts.append(f"to: {end_date}")
        title = " — ".join(title_parts)

        headers = ["Check No", "Cashier", "Card No", "Date", "Total", "VAT"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=checks_report.pdf"})
    finally:
        put_db_connection(conn)


@router.get("/store_products")
def report_store_products(
        promotional: Optional[bool] = None,
        current_user: dict = Depends(require_manager)
):
    """
    Звіт по товарах у магазині.
    Параметри: promotional (true|false)
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            if promotional is not None:
                conditions.append("sp.promotional_product = %s")
                params.append(promotional)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"""
                SELECT sp.upc, p.product_name, sp.selling_price,
                       sp.products_number, sp.promotional_product
                FROM "Store_Product" sp
                JOIN Product p ON sp.id_product = p.id_product
                {where}
                ORDER BY p.product_name
            """, params)
            data = cur.fetchall()
        title = "Store Products Report" + (f" — promo only" if promotional else "")
        headers = ["UPC", "Product Name", "Price", "Quantity", "Is Promo"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=store_products_report.pdf"})
    finally:
        put_db_connection(conn)


@router.get("/categories")
def report_categories(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT category_number, category_name FROM Category ORDER BY category_name")
            data = cur.fetchall()
        headers = ["Category No", "Category Name"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report("Categories Report", headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=categories_report.pdf"})
    finally:
        put_db_connection(conn)


@router.get("/customer_cards")
def report_customer_cards(
        min_percent: Optional[int] = None,
        current_user: dict = Depends(require_manager)
):
    """
    Звіт по картах клієнтів.
    Параметри: min_percent (клієнти зі знижкою ≥ X%)
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []
            if min_percent is not None:
                conditions.append("percent >= %s")
                params.append(min_percent)
            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(
                f"SELECT card_number, cust_surname, cust_name, percent "
                f"FROM Customer_Card {where} ORDER BY percent DESC",
                params
            )
            data = cur.fetchall()
        title = "Customer Cards Report" + (f" — min discount: {min_percent}%" if min_percent else "")
        headers = ["Card No", "Surname", "Name", "Discount %"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=customer_cards_report.pdf"})
    finally:
        put_db_connection(conn)


@router.get("/cashier-summary")
def report_cashier_summary(
        cashier_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        current_user: dict = Depends(require_manager)
):
    """
    Зведений звіт по касиру: кількість чеків, загальна сума продажів за період.
    Параметр cashier_id є обов'язковим.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = ["LOWER(c.id_employee) = LOWER(%s)"]
            params = [cashier_id]
            if start_date:
                conditions.append("c.print_date >= %s")
                params.append(start_date)
            if end_date:
                conditions.append("c.print_date < %s + INTERVAL '1 day'")
                params.append(end_date)
            where = "WHERE " + " AND ".join(conditions)
            cur.execute(f"""
                SELECT COUNT(*) AS checks_count, COALESCE(SUM(sum_total), 0) AS total_sales
                FROM "Check" c
                {where}
            """, params)
            summary = cur.fetchone()

        headers = ["Checks Count", "Total Sales"]
        rows = [[summary["checks_count"], summary["total_sales"]]]
        title = f"Cashier Summary — {cashier_id}"
        pdf_buffer = generate_pdf_report(title, headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=cashier_summary.pdf"})
    finally:
        put_db_connection(conn)