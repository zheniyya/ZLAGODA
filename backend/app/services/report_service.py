import os
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

# --- ЗАВАНТАЖЕННЯ ШРИФТУ ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(BASE_DIR, 'DejaVuSans.ttf')

try:
    pdfmetrics.registerFont(TTFont('DejaVuSans', FONT_PATH))
except Exception as e:
    print(f"Помилка завантаження шрифту: {e}")

# -------------------------

def generate_pdf_report(title: str, headers: list, rows: list) -> BytesIO:
    buffer = BytesIO()
    
    # Створюємо документ (Альбомна орієнтація для кращого вигляду таблиць)
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=landscape(A4),
        rightMargin=30, leftMargin=30, topMargin=50, bottomMargin=50
    )
    
    elements = []
    
    # 1. ЗАДАЄМО ШРИФТ ДЛЯ СТИЛІВ (Щоб заголовок підтримував кирилицю)
    styles = getSampleStyleSheet()
    styles['Title'].fontName = 'DejaVuSans'
    styles['Normal'].fontName = 'DejaVuSans'
    
    # Заголовок
    elements.append(Paragraph(title, styles['Title']))
    elements.append(Spacer(1, 20))
    
    # Дані таблиці (Заголовки + Рядки)
    table_data = [headers] + rows
    
    # Визначаємо ширину таблиці на всю сторінку
    page_width = landscape(A4)[0] - 60  # Ширина сторінки мінус відступи
    num_cols = len(headers)
    col_width = page_width / num_cols if num_cols > 0 else page_width
    
    # Створюємо таблицю з рівними колонками (На всю ширину)
    table = Table(table_data, colWidths=[col_width] * num_cols)
    
    # 2. ДОДАЄМО FONTNAME ДО СТИЛЮ ТАБЛИЦІ
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'), # ЗАСТОСОВУЄМО ДО ВСІЄЇ ТАБЛИЦІ
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('WORDWRAP', (0, 0), (-1, -1), 'LTR')
    ]))
    
    elements.append(table)
    
    # Функція для додавання колонтитулів (Верхній і Нижній)
    def add_page_number_and_header(canvas, doc):
        canvas.saveState()
        
        # 3. ВСТАНОВЛЮЄМО ШРИФТ ДЛЯ КОЛОНТИТУЛІВ (CANVAS)
        canvas.setFont('DejaVuSans', 10)
        
        # ВЕРХНІЙ КОЛОНТИТУЛ
        canvas.drawString(30, landscape(A4)[1] - 30, "ZLAGODA Supermarket - Офіційний звіт")
        
        # НИЖНІЙ КОЛОНТИТУЛ (Нумерація сторінок + Дата)
        page_num = canvas.getPageNumber()
        date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        footer_text = f"Дата генерації: {date_str} | Сторінка {page_num}"
        canvas.drawRightString(landscape(A4)[0] - 30, 20, footer_text)
        
        canvas.restoreState()
    
    # Збираємо PDF з використанням колонтитулів
    doc.build(elements, onFirstPage=add_page_number_and_header, onLaterPages=add_page_number_and_header)
    
    buffer.seek(0)
    return buffer