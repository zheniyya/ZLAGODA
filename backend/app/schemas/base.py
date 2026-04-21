from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

# --- EMPLOYEE ---
class EmployeeBase(BaseModel):
    #id_employee: str = Field(..., max_length=10)
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., max_length=10)
    salary: Decimal = Field(..., ge=0)
    date_of_birth: date
    date_of_start: date
    phone_number: str = Field(..., max_length=13)
    city: str = Field(..., max_length=50)
    street: str = Field(..., max_length=50)
    zip_code: str = Field(..., max_length=9)

    @field_validator('date_of_birth')
    @classmethod
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Працівник повинен бути старше 18 років')
        return v

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id_employee: str

# This is what to return ONLY when creating a new employee
class EmployeeCreateResponse(BaseModel):
    id_employee: str
    empl_name: str
    empl_surname: str
    empl_role: str
    salary: float
    date_of_birth: date
    date_of_start: date
    phone_number: str = Field(..., max_length=13)
    city: str = Field(..., max_length=50)
    street: str = Field(..., max_length=50)
    zip_code: str = Field(..., max_length=9)
    generated_password: str


# --- CATEGORY ---
class CategoryBase(BaseModel):
    category_name: str = Field(..., max_length=50)

class CategoryCreate(CategoryBase):
    pass # Фронтенд надсилає тільки ім'я. ID генерує база.

class CategoryResponse(CategoryBase):
    category_number: int # ID повертається вже з бази


# --- PRODUCT ---
class ProductBase(BaseModel):
    category_number: int
    product_name: str = Field(..., max_length=50)
    characteristics: str = Field(..., max_length=100)

class ProductCreate(ProductBase):
    pass # Фронтенд не надсилає id_product

class ProductResponse(ProductBase):
    id_product: int # Повертається з бази


# --- STORE_PRODUCT ---
class StoreProductBase(BaseModel):
    id_product: int
    selling_price: Decimal = Field(..., ge=0)
    products_number: int = Field(..., ge=0)
    promotional_product: bool

# The frontend will send exactly this (no UPC):
class StoreProductCreate(StoreProductBase):
    pass 

# The backend will respond with this (including the generated UPC):
class StoreProductResponse(StoreProductBase):
    upc: str = Field(..., max_length=12)
    upc_prom: Optional[str] = Field(None, max_length=12)
    
    # Optional join fields
    product_name: Optional[str] = Field(None, max_length=50)
    characteristics: Optional[str] = Field(None, max_length=100)
    category_name: Optional[str] = Field(None, max_length=50)



# --- CUSTOMER_CARD ---
class CustomerCardBase(BaseModel):
    # Номер карти зазвичай вводить касир або генерує сканер
    card_number: str = Field(..., max_length=13) 
    cust_surname: str = Field(..., max_length=50)
    cust_name: str = Field(..., max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int = Field(..., ge=0)

class CustomerCreate(BaseModel):
    cust_surname: str
    cust_name: str
    cust_patronymic: Optional[str] = None
    phone_number: str
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int = Field(..., ge=0)

class CustomerCardCreate(CustomerCardBase):
    pass

class CustomerCardResponse(CustomerCardBase):
    pass


# --- CHECK ---
# ВИПРАВЛЕННЯ: Касир при створенні передає ТІЛЬКИ карту клієнта (якщо є)
class CheckCreate(BaseModel):
    card_number: Optional[str] = Field(None, max_length=13)

# А ось у відповіді ми віддаємо всі поля, які згенерувала база/бекенд
class CheckResponse(BaseModel):
    check_number: str
    id_employee: str
    card_number: Optional[str] = None
    print_date: datetime
    sum_total: Decimal
    vat: Decimal


# --- SALE ---
class SaleCreate(BaseModel):
    UPC: str = Field(..., max_length=12)
    product_number: int = Field(..., ge=1) # Скільки штук купує
    # check_number береться з URL, selling_price береться з БД

class SaleResponse(BaseModel):
    UPC: str
    check_number: str
    product_number: int
    selling_price: Decimal