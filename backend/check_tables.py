import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if "?" in DATABASE_URL:
    DATABASE_URL += "&sslmode=require"
else:
    DATABASE_URL += "?sslmode=require"

print("Підключення до БД...")
conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
cur = conn.cursor()

tables = ["employee", "category", "product", "store_product", "customer_card", "check", "sale"]
for table in tables:
    cur.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
    exists = cur.fetchone()['exists']
    print(f"Таблиця {table}: {'✅ існує' if exists else ' НЕ ІСНУЄ'}")

if not any(True for _ in range(1)):  # якщо жодної таблиці немає
    print("\n⚠️ Таблиці відсутні. Потрібно виконати SQL з файлу 001_create_tables.sql")
    with open('001_create_tables.sql', 'r') as f:
        sql = f.read()
        cur.execute(sql)
        conn.commit()
        print("✅ Таблиці створено!")

cur.close()
conn.close()