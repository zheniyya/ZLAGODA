from fastapi import APIRouter, Depends, Response
from app.security.permissions import require_manager
from app.database import get_db_connection, put_db_connection
from app.services.report_service import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/employees")
def report_employees(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_employee, empl_surname, empl_name, role, phone_number, salary FROM Employee ORDER BY empl_surname")
            data = cur.fetchall()
        headers = ["ID", "Surname", "Name", "Role", "Phone", "Salary"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report("Employees Report", headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=employees_report.pdf"})
    finally:
        put_db_connection(conn)

@router.get("/products")
def report_products(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT p.id_product, p.product_name, c.category_name, p.characteristics 
                FROM Product p
                JOIN Category c ON p.category_number = c.category_number
                ORDER BY p.product_name
            """)
            data = cur.fetchall()
        headers = ["ID", "Product Name", "Category", "Characteristics"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report("Products Report", headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=products_report.pdf"})
    finally:
        put_db_connection(conn)

@router.get("/checks")
def report_checks(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT check_number, id_employee, card_number, print_date, sum_total, vat FROM "Check" ORDER BY print_date DESC')
            data = cur.fetchall()
        headers = ["Check No", "Employee ID", "Card No", "Date", "Total", "VAT"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report("Checks Report", headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=checks_report.pdf"})
    finally:
        put_db_connection(conn)

@router.get("/store_products")
def report_store_products(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT UPC, id_product, selling_price, products_number, promotional_product FROM Store_Product")
            data = cur.fetchall()
        headers = ["UPC", "Product ID", "Price", "Quantity", "Is Promo"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report("Store Products Report", headers, rows)
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
def report_customer_cards(current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT card_number, percent, registration_date FROM Customer_Card ORDER BY registration_date DESC")
            data = cur.fetchall()
        headers = ["Card No", "Discount", "Registration Date"]
        rows = [[row[h] for h in row.keys()] for row in data]
        pdf_buffer = generate_pdf_report("Customer Cards Report", headers, rows)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=customer_cards_report.pdf"})
    finally:
        put_db_connection(conn)