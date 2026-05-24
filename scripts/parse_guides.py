import pdfplumber
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = "postgresql://postgres:postgres@localhost:54322/postgres"

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
        return text.lower()
    except Exception as e:
        print(f"Ошибка чтения PDF {file_path}: {e}")
        return ""

def get_availability_data(bank_name, pdf_text):
    # Базовая логика определения на основе твоего успешного запуска
    findings = []
    
    # 1. Non-resident
    is_avail_nr = True
    note_nr = "Возможно открытие"
    prob_nr = "High"
    
    if bank_name == "Raiffeisen":
        is_avail_nr = False
        note_nr = "Отказы по паспорту РФ без рабочего контракта"
        prob_nr = "Low"
    elif bank_name == "Alta":
        note_nr = "Открывают по загранпаспорту и белому картону"
        prob_nr = "High"

    findings.append({
        "status": "non_resident",
        "is_available": is_avail_nr,
        "note": note_nr,
        "probability": prob_nr
    })

    # 2. Resident > 1y (Всегда True для этих банков)
    findings.append({
        "status": "resident_more_1y",
        "is_available": True,
        "note": "Полный функционал резидента",
        "probability": "High"
    })
    
    return findings

def update_db(bank_name, findings):
    try:
        conn = psycopg2.connect(DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Находим ID банка
        cur.execute("SELECT id FROM banks WHERE name ILIKE %s", (f"%{bank_name}%",))
        bank = cur.fetchone()
        if not bank: return

        # Находим все продукты этого банка
        cur.execute("SELECT id FROM products WHERE bank_id = %s", (bank['id'],))
        products = cur.fetchall()

        for prod in products:
            for f in findings:
                cur.execute("""
                    INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                """, (prod['id'], f['status'], f['is_available'], f['probability'], f['note']))
        
        conn.commit()
        print(f"Обновлена матрица доступности для {bank_name}")

    except Exception as e:
        print(f"Ошибка БД: {e}")
    finally:
        if conn: conn.close()

def main():
    guides = {
        "Raiffeisen": "data/🟡 Райфайзен - SRB.GUIDE.pdf",
        "Alta": "data/🔴 Альта - SRB.GUIDE.pdf"
    }

    for bank, path in guides.items():
        text = extract_text_from_pdf(path)
        if text:
            findings = get_availability_data(bank, text)
            update_db(bank, findings)

if __name__ == "__main__":
    main()