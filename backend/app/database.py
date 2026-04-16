import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL не знайдено")

if "?" in DATABASE_URL:
    DATABASE_URL += "&sslmode=require"
else:
    DATABASE_URL += "?sslmode=require"

print(f"🔗 Підключення до БД: {DATABASE_URL.replace(DATABASE_URL.split('@')[0].split(':')[2], '***')}")

db_pool = None

def init_db_pool():
    global db_pool
    try:
        db_pool = pool.SimpleConnectionPool(1, 10, DATABASE_URL, cursor_factory=RealDictCursor)
        print("✅ Пул з'єднань створено")
        conn = db_pool.getconn()
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"✅ Підключено до PostgreSQL: {version['version'][:50]}...")
        db_pool.putconn(conn)
    except Exception as e:
        print(f"❌ ПОМИЛКА: {e}")
        raise

def get_db_connection():
    return db_pool.getconn()

def put_db_connection(conn):
    db_pool.putconn(conn)

init_db_pool()