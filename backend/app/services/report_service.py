import io
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))

def generate_pdf_report(title: str, headers: list, data: list) -> io.BytesIO:
    """Генерує PDF таблицю з переданих даних."""
    buffer = io.BytesIO()
    # Використовуємо альбомну орієнтацію, бо таблиці можуть бути широкими
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    
    styles = getSampleStyleSheet()
    # Якщо підключили кирилицю, змініть шрифт у стилі:
    title_style = styles['Title']
    title_style.fontName = 'DejaVuSans'
    elements.append(Paragraph(title, styles['Title']))
    
    # Конвертуємо всі дані у рядки (щоб уникнути помилок з числами чи датами)
    str_data = [[str(item) if item is not None else "" for item in row] for row in data]
    table_data = [headers] + str_data
    
    # Налаштування вигляду таблиці
    table = Table(table_data)
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4CAF50")), # Зелений заголовок
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'), # Розкоментувати для кирилиці
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), # Заголовок жирним
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ])
    table.setStyle(table_style)
    
    elements.append(table)
    doc.build(elements)
    
    buffer.seek(0)
    return buffer