import psycopg2

# Данные для подключения (локальный Supabase через Docker)
# Порт 54322 — стандартный для локального Supabase Postgres
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:54322/postgres")
cur = conn.cursor()

banks_data = [
    ('Raiffeisen Bank', 'https://www.raiffeisenbank.rs', True, 5),
    ('Alta Banka', 'https://altabanka.rs', True, 3),
    ('Banka Poštanska Štedionica', 'https://www.posted.co.rs', True, 2)
]

try:
    for bank in banks_data:
        cur.execute(
            "INSERT INTO banks (name, official_site, ru_support, tech_score) VALUES (%s, %s, %s, %s)",
            bank
        )
    conn.commit()
    print("Данные успешно загружены! Обнови страницу в браузере.")
except Exception as e:
    print(f"Ошибка: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()