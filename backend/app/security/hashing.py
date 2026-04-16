from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"[ERROR] verify_password: {e}")
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

# Для тестування – згенеруйте хеші для ваших тестових паролів
if __name__ == "__main__":
    print("manager123 ->", get_password_hash("manager123"))
    print("cashier123 ->", get_password_hash("cashier123"))