from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

from app.routers import auth, employees, categories, products, store_products, customer_cards, checks, sales, reports, analytics

from app.database import get_db_connection, put_db_connection

app = FastAPI(title="АІС ZLAGODA")

allowed_origins = []
for port in range(5173, 5201):
    allowed_origins.append(f"http://localhost:{port}")
    allowed_origins.append(f"http://127.0.0.1:{port}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"➡️ {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"⬅️ {response.status_code}")
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("❌ Глобальна помилка:")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc)})

app.include_router(auth.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(store_products.router, prefix="/api")
app.include_router(customer_cards.router, prefix="/api")
app.include_router(checks.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API ZLAGODA"}

@app.get("/health")
def health():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
    finally:
        put_db_connection(conn)