import os
import secrets
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from database import SessionLocal, engine, get_db
from models import Base, Token, Admin
from schemas import Token as SchemaToken, TokenCreate, TokenCheck, TokenCheckResponse, Admin as SchemaAdmin, AdminCreate, TokenBase

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBasic()

# Admin password from .env
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")

# Function to get hashed password
def get_password_hash(password):
    return pwd_context.hash(password)

# Initialize admin user if not exists
def create_initial_admin(db: Session):
    global ADMIN_PASSWORD_HASH
    admin_user = db.query(Admin).filter(Admin.username == ADMIN_USERNAME).first()
    if not admin_user:
        initial_password = os.getenv("ADMIN_PASSWORD")
        if not initial_password:
            raise ValueError("ADMIN_PASSWORD not set in .env for initial admin creation.")
        
        hashed_initial_password = get_password_hash(initial_password)
        db_admin = Admin(username=ADMIN_USERNAME, hashed_password=hashed_initial_password)
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)
        ADMIN_PASSWORD_HASH = hashed_initial_password # Update global hash
        print("Initial admin user created.")
    else:
        ADMIN_PASSWORD_HASH = admin_user.hashed_password # Use existing hashed password
        print("Admin user already exists.")

# Dependency to get the DB session and create initial admin
def get_db_and_init_admin():
    db = SessionLocal()
    try:
        create_initial_admin(db)
        yield db
    finally:
        db.close()

# Admin authentication
def authenticate_admin(credentials: HTTPBasicCredentials = Depends(security), db: Session = Depends(get_db_and_init_admin)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password_hash = ADMIN_PASSWORD_HASH # Use the globally updated hash
    
    if not (correct_username and pwd_context.verify(credentials.password, correct_password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/token/generate/", response_model=SchemaToken)
def generate_token(db: Session = Depends(get_db), admin_user: str = Depends(authenticate_admin)):
    token_value = secrets.token_urlsafe(32)
    db_token = Token(token=token_value)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

@app.post("/token/check/", response_model=TokenCheckResponse)
def check_token(token_check: TokenCheck, db: Session = Depends(get_db)):
    db_token = db.query(Token).filter(Token.token == token_check.token, Token.is_active == True).first()
    if db_token:
        return {"is_valid": True}
    return {"is_valid": False}

@app.get("/tokens/", response_model=List[SchemaToken])
def get_all_tokens(db: Session = Depends(get_db), admin_user: str = Depends(authenticate_admin)):
    tokens = db.query(Token).all()
    return tokens

@app.put("/tokens/{token_id}/", response_model=SchemaToken)
def update_token_status(token_id: int, token_update: TokenBase, db: Session = Depends(get_db), admin_user: str = Depends(authenticate_admin)):
    db_token = db.query(Token).filter(Token.id == token_id).first()
    if not db_token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    db_token.is_active = token_update.is_active
    db.commit()
    db.refresh(db_token)
    return db_token

@app.delete("/tokens/{token_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_token(token_id: int, db: Session = Depends(get_db), admin_user: str = Depends(authenticate_admin)):
    db_token = db.query(Token).filter(Token.id == token_id).first()
    if not db_token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    db.delete(db_token)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
