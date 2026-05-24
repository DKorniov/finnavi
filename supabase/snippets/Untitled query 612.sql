INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
SELECT 
    product_id, 
    'resident_less_1y'::residency_status, 
    is_available, 
    'High', 
    'Статус ВНЖ получен, но до валютного резидентства (12 мес) действуют ограничения на SWIFT.'
FROM product_availability 
WHERE status = 'non_resident'
ON CONFLICT DO NOTHING;