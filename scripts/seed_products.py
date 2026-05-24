import psycopg2
from psycopg2.extras import RealDictCursor

# Конфигурация подключения к твоему локальному Supabase (Docker)
DB_CONFIG = "postgresql://postgres:postgres@localhost:54322/postgres"

def seed_products():
    try:
        conn = psycopg2.connect(DB_CONFIG, cursor_factory=RealDictCursor)
        cur = conn.cursor()

        # 1. Получаем существующие банки
        cur.execute("SELECT id, name FROM banks;")
        banks = cur.fetchall()
        
        if not banks:
            print("Ошибка: Таблица banks пуста. Сначала добавьте банки.")
            return

        print(f"Найдено банков в базе: {len(banks)}")

        # 2. Определяем стандартный набор продуктов для каждого банка
        # Формат: (category, name, currency_array)
        base_products = [
            ('current_account', 'Личный счет (RSD/EUR)', ['RSD', 'EUR']),
            ('business_account', 'Счет для ИП (Preduzetnik)', ['RSD', 'EUR']),
            ('savings', 'Сберегательный вклад', ['EUR']),
        ]

        inserted_count = 0
        for bank in banks:
            for category, name, currencies in base_products:
                # Используем ON CONFLICT, чтобы не дублировать при повторном запуске
                # Примечание: Чтобы это сработало, в БД нужен UNIQUE индекс на (bank_id, category)
                # Но пока просто вставляем проверкой через SELECT для простоты
                
                cur.execute("""
                    INSERT INTO products (bank_id, category, name, currency)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                """, (bank['id'], category, f"{bank['name']}: {name}", currencies))
                inserted_count += cur.rowcount

        conn.commit()
        print(f"Успешно добавлено {inserted_count} продуктов.")

    except Exception as e:
        print(f"Критическая ошибка при сидинге: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    seed_products()