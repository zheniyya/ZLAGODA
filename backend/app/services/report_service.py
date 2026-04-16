import io
import os  # Додаємо цей імпорт
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# --- ВИПРАВЛЕННЯ ШЛЯХУ ---
# Отримуємо шлях до папки, де лежить цей скрипт (app/services/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Формуємо шлях до шрифту (він має лежати в цій же папці)
FONT_PATH = os.path.join(BASE_DIR, 'DejaVuSans.ttf')

# Реєструємо шрифт за повним шляхом
try:
    pdfmetrics.registerFont(TTFont('DejaVuSans', FONT_PATH))
except Exception as e:
    print(f"Помилка завантаження шрифту: {e}")
    # Можна додати fallback на системний шрифт, якщо потрібно


# -------------------------

def generate_pdf_report(title: str, headers: list, data: list) -> io.BytesIO:
    """Генерує PDF таблицю з переданих даних."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []

    styles = getSampleStyleSheet()
    title_style = styles['Title']
    title_style.fontName = 'DejaVuSans'
    elements.append(Paragraph(title, title_style))

    str_data = [[str(item) if item is not None else "" for item in row] for row in data]
    table_data = [headers] + str_data

    table = Table(table_data)
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4CAF50")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),  # Шрифт для всієї таблиці
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ])
    table.setStyle(table_style)

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return buffer