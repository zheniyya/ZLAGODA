import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL не знайдено")

# Ensure SSL is required for Supabase
if "?" in DATABASE_URL:
    if "sslmode=require" not in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
else:
    DATABASE_URL += "?sslmode=require"

print(f"🔗 Підключення до БД (Supabase Pooler): {DATABASE_URL.replace(DATABASE_URL.split('@')[0].split(':')[2], '***')}")

def get_db_connection():
    """
    Supabase on port 6543 handles pooling on the server side.
    We simply open a standard connection here.
    """
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"❌ ПОМИЛКА підключення до бази даних: {e}")
        raise

def put_db_connection(conn):
    """
    Closing the connection here tells Supabase we are done with it 
    so they can recycle it in their PgBouncer pool.
    """
    if conn and not conn.closed:
        conn.close()