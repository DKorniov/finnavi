import psycopg2
from psycopg2.extras import RealDictCursor
import re

# Конфигурация подключения
DB_CONFIG = "postgresql://postgres:postgres@localhost:54322/postgres"

def analyze_chat_sentiment(file_path):
    """Извлекает статистику упоминаний банков из текстовых файлов."""
    banks_patterns = {
        "Raiffeisen": r"райф|raif|райффайзен",
        "Alta": r"альта|alta",
        "Poštanska": r"поштанска|postanska|пошта"
    }
    
    positive_keywords = ["открыл", "одобрили", "без проблем", "получилось", "открывают"]
    negative_keywords = ["отказ", "не открывают", "развернули", "нельзя", "требуют внж"]

    results = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().lower()
            # Разделяем на сообщения (предполагаем стандартный разделитель логов)
            messages = content.split("--- сообщение")
            
            for msg in messages:
                for bank_name, pattern in banks_patterns.items():
                    if re.search(pattern, msg):
                        sentiment = "neutral"
                        if any(word in msg for word in positive_keywords):
                            sentiment = "positive"
                        elif any(word in msg for word in negative_keywords):
                            sentiment = "negative"
                        
                        if sentiment != "neutral":
                            results.append({
                                "bank": bank_name,
                                "sentiment": sentiment
                            })
    except Exception as e:
        print(f"Ошибка при чтении файла {file_path}: {e}")
        
    return results

def update_availability_with_chat_data(stats):
    """Обновляет таблицу product_availability в БД на основе собранной статистики."""
    try:
        conn = psycopg2.connect(DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        print("\n--- Обновление базы данных ---")
        
        for bank_name, s in stats.items():
            total = s['positive'] + s['negative']
            if total == 0: continue
            
            pos_ratio = s['positive'] / total
            
            # Логика смены вероятности:
            # > 70% успеха -> High
            # 40-70% успеха -> Medium
            # < 40% успеха -> Low
            if pos_ratio > 0.7: 
                prob = "High"
            elif pos_ratio > 0.4: 
                prob = "Medium"
            else: 
                prob = "Low"

            chat_note = f" [Обновлено из чатов: 👍{s['positive']} / 👎{s['negative']}]."
            
            # SQL: Обновляем только для нерезидентов, так как для них 'рандом' критичен
            cur.execute("""
                UPDATE product_availability 
                SET approval_probability = %s,
                    notes = notes || %s
                WHERE product_id IN (
                    SELECT id FROM products WHERE bank_id IN (
                        SELECT id FROM banks WHERE name ILIKE %s
                    )
                ) AND status = 'non_resident'
                -- Чтобы не дублировать примечание при повторном запуске:
                AND notes NOT LIKE '%%Обновлено из чатов%%';
            """, (prob, chat_note, f"%{bank_name}%"))

            print(f"Банк {bank_name}: установлен статус {prob} (успех {pos_ratio:.1%})")

        conn.commit()
        print("\nБаза данных успешно обогащена данными из чатов!")
        
    except Exception as e:
        print(f"Ошибка БД: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

def main():
    # Пути к файлам (проверь, что они лежат в папке data)
    chat_files = [
        "data/Сербские IT Предузетники_Про банки_01.txt",
        "data/Сербские IT Предузетники_Про банки_02.txt",
        "data/Сербские IT Предузетники_Про банки_03.txt"
    ]
    
    all_findings = []
    for file in chat_files:
        print(f"Парсинг {file}...")
        all_findings.extend(analyze_chat_sentiment(file))
    
    # Группируем статистику
    stats = {}
    for f in all_findings:
        bank = f['bank']
        if bank not in stats: 
            stats[bank] = {"positive": 0, "negative": 0}
        stats[bank][f['sentiment']] += 1
    
    print("\n--- Результаты анализа чатов ---")
    for bank, s in stats.items():
        print(f"{bank}: 👍 {s['positive']} | 👎 {s['negative']}")
    
    # Вызываем функцию обновления БД
    update_availability_with_chat_data(stats)

if __name__ == "__main__":
    main()