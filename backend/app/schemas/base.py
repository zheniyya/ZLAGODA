from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

# --- EMPLOYEE  ---
class EmployeeBase(BaseModel):
    id_employee: str = Field(..., max_length=10)
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., max_length=10)
    salary: Decimal = Field(..., ge=0) # Не від'ємне
    date_of_birth: date
    date_of_start: date
    phone_number: str = Field(..., max_length=13) # До 13 символів
    city: str = Field(..., max_length=50)
    street: str = Field(..., max_length=50)
    zip_code: str = Field(..., max_length=9)

    @field_validator('date_of_birth')
    @classmethod
    def validate_age(cls, v):
        # Працівнику має бути не менше 18 років
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Працівник повинен бути старше 18 років')
        return v

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    pass


# --- CATEGORY  ---
class CategoryBase(BaseModel):
    category_name: str = Field(..., max_length=50)

class CategoryCreate(CategoryBase):
    category_number: int

class CategoryResponse(CategoryBase):
    category_number: int


# --- PRODUCT  ---
class ProductBase(BaseModel):
    category_number: int
    product_name: str = Field(..., max_length=50)
    characteristics: str = Field(..., max_length=100)

class ProductCreate(ProductBase):
    id_product: int

class ProductResponse(ProductBase):
    id_product: int


# --- STORE_PRODUCT ---
class StoreProductBase(BaseModel):
    UPC: str = Field(..., max_length=12)
    UPC_prom: Optional[str] = Field(None, max_length=12)
    id_product: int
    selling_price: Decimal = Field(..., ge=0) # Не від'ємне 
    products_number: int = Field(..., ge=0)   # Не від'ємне
    promotional_product: bool

class StoreProductCreate(StoreProductBase):
    pass

class StoreProductResponse(StoreProductBase):
    pass


# --- CUSTOMER_CARD ---
class CustomerCardBase(BaseModel):
    card_number: str = Field(..., max_length=13)
    cust_surname: str = Field(..., max_length=50)
    cust_name: str = Field(..., max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: str = Field(..., max_length=13) # До 13 символів
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int = Field(..., ge=0) # Не від'ємне

class CustomerCardCreate(CustomerCardBase):
    pass

class CustomerCardResponse(CustomerCardBase):
    pass


# --- CHECK ---
class CheckBase(BaseModel):
    check_number: str = Field(..., max_length=10)
    id_employee: str = Field(..., max_length=10)
    card_number: Optional[str] = Field(None, max_length=13)
    print_date: datetime
    sum_total: Decimal = Field(..., ge=0) # Не від'ємне 
    vat: Decimal = Field(..., ge=0)       # Не від'ємне 

class CheckCreate(CheckBase):
    pass

class CheckResponse(CheckBase):
    pass


# --- SALE  ---
class SaleBase(BaseModel):
    UPC: str = Field(..., max_length=12)
    check_number: str = Field(..., max_length=10)
    product_number: int = Field(..., ge=0)    # Не від'ємне 
    selling_price: Decimal = Field(..., ge=0) # Не від'ємне 

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    pass