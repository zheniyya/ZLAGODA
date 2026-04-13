from fastapi import FastAPI
from app.routers import (
    employees,
    categories,
    products,
    store_products,
    customer_cards,
    checks,
    sales,
    reports
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="АІС ZLAGODA", description="Бекенд для міні-супермаркету")

# ДОДАЙТЕ ЦЕЙ БЛОК:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Дозволяємо запити з вашого React
    allow_credentials=True,
    allow_methods=["*"], # Дозволяємо всі методи (GET, POST, PUT, DELETE)
    allow_headers=["*"], # Дозволяємо всі заголовки
)

# Реєстрація роутерів
app.include_router(employees.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(store_products.router, prefix="/api")
app.include_router(customer_cards.router, prefix="/api")
app.include_router(checks.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API ZLAGODA працює!"}