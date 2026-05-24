SELECT 
    b.name as bank_name,
    p.name as product_name,
    pa.status,
    pa.is_available,
    pa.approval_probability,
    pa.notes
FROM product_availability pa
JOIN products p ON pa.product_id = p.id
JOIN banks b ON p.bank_id = b.id
ORDER BY b.name, pa.status;