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

app = FastAPI(title="АІС ZLAGODA", description="Бекенд для міні-супермаркету")

# Реєстрація роутерів
app.include_router(employees.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(store_products.router)
app.include_router(customer_cards.router)
app.include_router(checks.router)
app.include_router(sales.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {"message": "API ZLAGODA працює!"}