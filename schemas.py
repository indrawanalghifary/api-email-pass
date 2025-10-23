from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TokenBase(BaseModel):
    token: str
    is_active: Optional[bool] = True

class TokenCreate(TokenBase):
    pass

class Token(TokenBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AdminBase(BaseModel):
    username: str

class AdminCreate(AdminBase):
    password: str

class Admin(AdminBase):
    id: int

    class Config:
        from_attributes = True

class TokenCheck(BaseModel):
    token: str

class TokenCheckResponse(BaseModel):
    is_valid: bool