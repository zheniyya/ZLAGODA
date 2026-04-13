from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.security.permissions import require_manager
from app.database import get_db_connection
from app.services.report_service import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/employees")
def report_employees(current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        # Вибираємо тільки ті поля, які безпечно показувати (без хешу пароля)
        cur.execute("""
            SELECT id_employee, empl_surname, empl_name, role, phone_number, salary 
            FROM Employee ORDER BY empl_surname
        """)
        data = cur.fetchall()
        
    headers = ["ID", "Surname", "Name", "Role", "Phone", "Salary"]
    # Перетворюємо список словників на список списків (для таблиці)
    rows = [[row[h] for h in row.keys()] for row in data]
    
    pdf_buffer = generate_pdf_report("Employees Report", headers, rows)
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=employees_report.pdf"}
    )

@router.get("/products")
def report_products(current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        # Робимо JOIN для отримання назви категорії замість просто цифри
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
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=products_report.pdf"})

@router.get("/checks")
def report_checks(current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT check_number, id_employee, card_number, print_date, sum_total, vat 
            FROM "Check" ORDER BY print_date DESC
        """)
        data = cur.fetchall()
        
    headers = ["Check No", "Employee ID", "Card No", "Date", "Total", "VAT"]
    rows = [[row[h] for h in row.keys()] for row in data]
    
    pdf_buffer = generate_pdf_report("Checks Report", headers, rows)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=checks_report.pdf"})

# Додаткові звіти для Categories, Store Products та Customer Cards робляться за аналогією:
@router.get("/store_products")
def report_store_products(current_user: dict = Depends(require_manager), conn = Depends(get_db_connection)):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT UPC, id_product, selling_price, products_number, promotional_product 
            FROM Store_Product
        """)
        data = cur.fetchall()
    headers = ["UPC", "Product ID", "Price", "Quantity", "Is Promo"]
    rows = [[row[h] for h in row.keys()] for row in data]
    pdf_buffer = generate_pdf_report("Store Products Report", headers, rows)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=store_products_report.pdf"})