export const mockEmployees = [
  { id_employee: 'manager_1', empl_surname: 'Авченко', empl_name: 'Андрій', empl_role: 'manager', phone_number: '+380501111111', city: 'Київ', street: 'Сковороди' },
  { id_employee: 'cashier_1', empl_surname: 'Коваленко', empl_name: 'Олена', empl_role: 'cashier', phone_number: '+380672222222', city: 'Київ', street: 'Волоська' },
];

export const mockCategories = [
  { category_number: 1, category_name: 'Молочні продукти' },
  { category_number: 2, category_name: 'Випічка' },
];

export const mockProducts = [
  { id_product: 1, category_number: 1, product_name: 'Молоко 2.5%', characteristics: 'Пляшка 1л' },
  { id_product: 2, category_number: 2, product_name: 'Батон', characteristics: 'Нарізний' },
];

export const mockStoreProducts = [
  { upc: '111111111111', id_product: 1, selling_price: 35.50, products_number: 50, promotional_product: false },
  { upc: '111111111112', id_product: 1, selling_price: 28.40, products_number: 15, promotional_product: true }, // 20% off
  { upc: '222222222222', id_product: 2, selling_price: 20.00, products_number: 30, promotional_product: false },
];

export const mockCustomers = [
  { card_number: 'CARD001', cust_surname: 'Іваненко', cust_name: 'Іван', phone_number: '+380993333333', percent: 5 },
  { card_number: 'CARD002', cust_surname: 'Петренко', cust_name: 'Петро', phone_number: '+380994444444', percent: 10 },
];

export const mockChecks = [
  { check_number: 'CH-001', id_employee: 'cashier_1', card_number: 'CARD001', print_date: '2026-04-13T10:30:00', sum_total: 67.45, vat: 13.49 },
];