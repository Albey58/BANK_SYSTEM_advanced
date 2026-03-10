"""
Request validation schemas using Pydantic.
Ensures data integrity and security for all API endpoints.
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import re
from decimal import Decimal


class UserRegistrationSchema(BaseModel):
    """Validate user registration data."""
    full_name: str
    email: EmailStr
    password: str
    tax_id: str
    doc_type: str = "National_ID"
    doc_num: str = "PENDING"
    initial_pin: str

    class Config:
        validate_assignment = True

    @validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name length."""
        if len(v) < 2 or len(v) > 100:
            raise ValueError('Full name must be between 2 and 100 characters')
        return v

    @validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password has minimum security requirements."""
        if len(v) < 8 or len(v) > 255:
            raise ValueError('Password must be between 8 and 255 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @validator('tax_id')
    @classmethod
    def validate_tax_id(cls, v: str) -> str:
        """Validate tax ID format (alphanumeric only)."""
        if len(v) < 5 or len(v) > 20:
            raise ValueError('Tax ID must be between 5 and 20 characters')
        if not re.match(r'^[A-Za-z0-9\-]+$', v):
            raise ValueError('Tax ID must contain only letters, numbers, and hyphens')
        return v.upper()

    @validator('initial_pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate PIN is numeric."""
        if len(v) < 4 or len(v) > 6:
            raise ValueError('PIN must be between 4 and 6 characters')
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class LoginSchema(BaseModel):
    """Validate login credentials."""
    email: EmailStr
    password: str


class DepositSchema(BaseModel):
    """Validate deposit transaction."""
    account_id: str
    amount: Decimal

    @validator('account_id')
    @classmethod
    def validate_account_id(cls, v: str) -> str:
        """Validate account ID length."""
        if len(v) != 36:
            raise ValueError('Account ID must be exactly 36 characters')
        return v

    @validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        """Ensure amount is positive and has max 2 decimal places."""
        if v <= 0:
            raise ValueError('Amount must be positive')
        if v > 1000000:
            raise ValueError('Amount cannot exceed 1000000')
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount cannot have more than 2 decimal places')
        return v


class WithdrawalSchema(BaseModel):
    """Validate withdrawal transaction."""
    account_id: str
    amount: Decimal
    pin: str

    @validator('account_id')
    @classmethod
    def validate_account_id(cls, v: str) -> str:
        """Validate account ID length."""
        if len(v) != 36:
            raise ValueError('Account ID must be exactly 36 characters')
        return v

    @validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        """Ensure amount is positive and has max 2 decimal places."""
        if v <= 0:
            raise ValueError('Amount must be positive')
        if v > 1000000:
            raise ValueError('Amount cannot exceed 1000000')
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount cannot have more than 2 decimal places')
        return v

    @validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate PIN format."""
        if len(v) < 4 or len(v) > 6:
            raise ValueError('PIN must be between 4 and 6 characters')
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class TransferSchema(BaseModel):
    """Validate transfer transaction."""
    from_account: str
    to_account: str
    amount: Decimal
    pin: str

    @validator('from_account', 'to_account')
    @classmethod
    def validate_account_id(cls, v: str) -> str:
        """Validate account ID length."""
        if len(v) != 36:
            raise ValueError('Account ID must be exactly 36 characters')
        return v

    @validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        """Ensure amount is positive and has max 2 decimal places."""
        if v <= 0:
            raise ValueError('Amount must be positive')
        if v > 1000000:
            raise ValueError('Amount cannot exceed 1000000')
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount cannot have more than 2 decimal places')
        return v

    @validator('to_account')
    @classmethod
    def validate_different_accounts(cls, v: str, values) -> str:
        """Ensure sender and receiver are different."""
        if 'from_account' in values and v == values['from_account']:
            raise ValueError('Cannot transfer to the same account')
        return v

    @validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate PIN format."""
        if len(v) < 4 or len(v) > 6:
            raise ValueError('PIN must be between 4 and 6 characters')
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class CreateAccountSchema(BaseModel):
    """Validate new account creation."""
    account_type: str
    pin: str
    initial_deposit: float = 0.0

    @validator('account_type')
    @classmethod
    def validate_account_type(cls, v: str) -> str:
        """Validate account type."""
        if v not in ['savings', 'checking']:
            raise ValueError('Account type must be either "savings" or "checking"')
        return v

    @validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate PIN format."""
        if len(v) < 4 or len(v) > 6:
            raise ValueError('PIN must be between 4 and 6 characters')
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v

    @validator('initial_deposit')
    @classmethod
    def validate_initial_deposit(cls, v: float) -> float:
        """Validate initial deposit."""
        if v < 0:
            raise ValueError('Initial deposit cannot be negative')
        return v


class PasswordResetRequestSchema(BaseModel):
    """Validate password reset request."""
    email: EmailStr


class PasswordResetSchema(BaseModel):
    """Validate password reset completion."""
    token: str
    new_password: str

    @validator('token')
    @classmethod
    def validate_token(cls, v: str) -> str:
        """Validate token."""
        if len(v) < 1:
            raise ValueError('Token cannot be empty')
        return v

    @validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password has minimum security requirements."""
        if len(v) < 8 or len(v) > 255:
            raise ValueError('Password must be between 8 and 255 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UpdateProfileSchema(BaseModel):
    """Validate user profile updates."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None


class SetPinSchema(BaseModel):
    """Validate setting a PIN for an account."""
    account_id: str = Field(..., min_length=36, max_length=36, description="Account UUID")
    pin: str = Field(..., min_length=4, max_length=6, description="New PIN")

    @field_validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class ResetPinSchema(BaseModel):
    """Validate resetting a PIN for an account."""
    account_id: str = Field(..., min_length=36, max_length=36, description="Account UUID")
    new_pin: str = Field(..., min_length=4, max_length=6, description="New PIN")
    password: str = Field(..., min_length=1, description="User current password for verification")

    @field_validator('new_pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class BranchCreateSchema(BaseModel):
    """Validate admin branch creation."""
    branch_name: str = Field(..., min_length=2, max_length=100)
    branch_code: str = Field(..., min_length=3, max_length=20)
    location: Optional[str] = "Deep Space"
    manager_name: Optional[str] = "Automated AI"


class JoinAccountInviteSchema(BaseModel):
    """Validate invitation of a joint member."""
    account_id: str = Field(..., min_length=36, max_length=36)
    invitee_email: EmailStr = Field(..., description="Email of the user to invite")
    role: Optional[str] = Field(default="joint_owner", pattern="^(joint_owner|custodian)$")
