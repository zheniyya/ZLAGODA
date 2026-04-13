def get_employee_by_id(conn, id_employee: str):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM Employee WHERE id_employee = %s", (id_employee,))
        return cur.fetchone()

def create_employee(conn, empl_data, hashed_password):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO Employee (
                id_employee, empl_surname, empl_name, empl_patronymic, 
                role, salary, date_of_birth, date_of_start, 
                phone_number, city, street, zip_code, password_hash
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            empl_data.id_employee, empl_data.empl_surname, empl_data.empl_name, 
            empl_data.empl_patronymic, empl_data.role, empl_data.salary, 
            empl_data.date_of_birth, empl_data.date_of_start, empl_data.phone_number, 
            empl_data.city, empl_data.street, empl_data.zip_code, hashed_password
        ))
        conn.commit()
        return cur.fetchone()