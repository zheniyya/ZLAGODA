from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.schemas.base import EmployeeCreate, EmployeeResponse, EmployeeCreateResponse
from app.security.permissions import require_manager, get_current_user
from app.security.hashing import get_password_hash
from app.database import get_db_connection, put_db_connection
import secrets
import string

router = APIRouter(prefix="/employees", tags=["Employees"])

# UPDATE THIS LINE: change response_model to EmployeeCreateWithPasswordResponse
@router.post("/", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        # 1. Generate a secure 8-character random password
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        raw_password = ''.join(secrets.choice(alphabet) for i in range(8))
        hashed_password = get_password_hash(raw_password)

        with conn.cursor() as cur:
            # 2. Determine the prefix based on the role
            prefix = "MGR" if employee.empl_role.lower() == "manager" else "CSH"
            
            # 3. Find the highest existing ID with this prefix
            cur.execute(
                "SELECT id_employee FROM Employee WHERE id_employee LIKE %s ORDER BY id_employee DESC LIMIT 1", 
                (f"{prefix}%",)
            )
            last_id_record = cur.fetchone()
            
            # 4. Generate the new ID
            if last_id_record and last_id_record["id_employee"]:
                last_id = last_id_record["id_employee"]
                numeric_part = int(last_id[len(prefix):])
                new_id = f"{prefix}{numeric_part + 1:03d}"
            else:
                new_id = f"{prefix}001"

            # 5. Insert into Database
            cur.execute("""
                INSERT INTO Employee (id_employee, empl_surname, empl_name, empl_patronymic, 
                    empl_role, salary, date_of_birth, date_of_start, phone_number, city, street, zip_code, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
            """, (
                new_id, 
                employee.empl_surname,
                employee.empl_name,
                getattr(employee, "empl_patronymic", None),
                employee.empl_role,
                employee.salary,
                employee.date_of_birth,
                employee.date_of_start,
                employee.phone_number,
                employee.city,
                employee.street,
                employee.zip_code,
                hashed_password
            ))
            
            new_employee = dict(cur.fetchone())
            conn.commit()
            
            # This will now successfully pass through Pydantic!
            new_employee["generated_password"] = raw_password 
            
            return new_employee
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        put_db_connection(conn)


@router.put("/{id_employee}", response_model=EmployeeResponse)
def update_employee(id_employee: str, employee: EmployeeCreate, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Notice we removed the password hashing and updating from here
            cur.execute("""
                UPDATE Employee SET 
                    empl_surname = %s, empl_name = %s, empl_patronymic = %s, 
                    empl_role = %s, salary = %s, date_of_birth = %s, date_of_start = %s, 
                    phone_number = %s, city = %s, street = %s, zip_code = %s
                WHERE id_employee = %s RETURNING *
            """, (
                employee.empl_surname,
                employee.empl_name,
                getattr(employee, "empl_patronymic", None),
                employee.empl_role,
                employee.salary,
                employee.date_of_birth,
                employee.date_of_start,
                employee.phone_number,
                employee.city,
                employee.street,
                employee.zip_code,
                id_employee
            ))
            updated_emp = cur.fetchone()
            if not updated_emp:
                raise HTTPException(status_code=404, detail="Працівника не знайдено")
            conn.commit()
            return updated_emp
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        put_db_connection(conn)


@router.get("/", response_model=List[EmployeeResponse])
def get_all_employees(
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: dict = Depends(require_manager)
):
    """
    Отримати всіх працівників.
    Параметри фільтрації: search (по імені/прізвищу), role (cashier|manager)
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = []
            params = []

            if search:
                conditions.append("(empl_surname ILIKE %s OR empl_name ILIKE %s)")
                params.extend([f"%{search}%", f"%{search}%"])

            # ВИПРАВЛЕНО: регістронезалежне порівняння ролі
            if role:
                conditions.append("LOWER(empl_role) = LOWER(%s)")
                params.append(role)

            where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
            cur.execute(f"SELECT * FROM Employee {where} ORDER BY empl_surname", params)
            employees = cur.fetchall()
        return employees
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження працівників: {str(e)}")
    finally:
        put_db_connection(conn)


@router.get("/{id_employee}", response_model=EmployeeResponse)
def get_employee(id_employee: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "manager" and current_user["id_employee"] != id_employee:
        raise HTTPException(status_code=403, detail="Ви можете переглядати лише свій профіль")

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM Employee WHERE id_employee = %s", (id_employee,))
            employee = cur.fetchone()
            if not employee:
                raise HTTPException(status_code=404, detail="Працівника не знайдено")
            return employee
    finally:
        put_db_connection(conn)


@router.delete("/{id_employee}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(id_employee: str, current_user: dict = Depends(require_manager)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM Employee WHERE id_employee = %s RETURNING id_employee", (id_employee,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Працівника не знайдено")
            conn.commit()
            
    except HTTPException:
        # Re-raise HTTP exceptions (like the 404 above) so they don't get caught by the general Exception block
        raise
    except Exception as e:
        conn.rollback()
        error_msg = str(e).lower()
        
        # Check if the error is due to a foreign key constraint (e.g., they have checks)
        if "foreign key constraint" in error_msg or "violates foreign key" in error_msg or "update or delete on table" in error_msg:
            raise HTTPException(
                status_code=400, 
                detail="Неможливо видалити працівника, оскільки за ним закріплені існуючі чеки. Видалення призведе до втрати фінансової історії."
            )
            
        # Catch-all for any other database crashes
        raise HTTPException(status_code=500, detail=f"Внутрішня помилка бази даних: {str(e)}")
    finally:
        put_db_connection(conn)