"""
Request validation schemas using Pydantic.
Ensures data integrity and security for all API endpoints.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re
from decimal import Decimal


class UserRegistrationSchema(BaseModel):
    """Validate user registration data."""
    full_name: str = Field(..., min_length=2, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=255, description="Password (min 8 chars)")
    tax_id: str = Field(..., min_length=5, max_length=20, description="Tax ID or SSN")
    doc_type: Optional[str] = Field(default="National_ID", description="Document type for KYC")
    doc_num: Optional[str] = Field(default="PENDING", description="Document number")
    initial_pin: str = Field(..., min_length=4, max_length=6, description="4-6 digit transaction PIN")
    branch_id: Optional[str] = Field(None, min_length=36, max_length=36, description="Branch UUID")

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password has minimum security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @field_validator('tax_id')
    @classmethod
    def validate_tax_id(cls, v: str) -> str:
        """Validate tax ID format (alphanumeric only)."""
        if not re.match(r'^[A-Za-z0-9\-]+$', v):
            raise ValueError('Tax ID must contain only letters, numbers, and hyphens')
        return v.upper()

    @field_validator('initial_pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        """Validate PIN is numeric."""
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class LoginSchema(BaseModel):
    """Validate login credentials."""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="User password")


class DepositSchema(BaseModel):
    """Validate deposit transaction."""
    account_id: str = Field(..., min_length=36, max_length=36, description="Account UUID")
    amount: Decimal = Field(..., gt=0, le=1000000, description="Deposit amount (positive)")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        """Ensure amount has max 2 decimal places."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount cannot have more than 2 decimal places')
        return v


class WithdrawalSchema(BaseModel):
    """Validate withdrawal transaction."""
    account_id: str = Field(..., min_length=36, max_length=36, description="Account UUID")
    amount: Decimal = Field(..., gt=0, le=1000000, description="Withdrawal amount (positive)")
    pin: str = Field(..., min_length=4, max_length=6, description="Transaction PIN")


    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        """Ensure amount has max 2 decimal places."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount cannot have more than 2 decimal places')
        return v


class TransferSchema(BaseModel):
    """Validate transfer transaction."""
    from_account: str = Field(..., min_length=36, max_length=36, description="Sender account UUID")
    to_account: str = Field(..., min_length=36, max_length=36, description="Receiver account UUID")
    amount: Decimal = Field(..., gt=0, le=1000000, description="Transfer amount (positive)")
    pin: str = Field(..., min_length=4, max_length=6, description="Transaction PIN")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        """Ensure amount has max 2 decimal places."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount cannot have more than 2 decimal places')
        return v

    @field_validator('to_account')
    @classmethod
    def validate_different_accounts(cls, v: str, info) -> str:
        """Ensure sender and receiver are different."""
        if 'from_account' in info.data and v == info.data['from_account']:
            raise ValueError('Cannot transfer to the same account')
        return v


class CreateAccountSchema(BaseModel):
    """Validate new account creation."""
    account_type: str = Field(..., pattern="^(savings|checking)$", description="Account Type")
    pin: str = Field(..., min_length=4, max_length=6, description="Account PIN")
    initial_deposit: float = Field(0.0, ge=0, description="Initial deposit amount")

    @field_validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('PIN must contain only numbers')
        return v


class PasswordResetRequestSchema(BaseModel):
    """Validate password reset request."""
    email: EmailStr = Field(..., description="User email for password reset")


class PasswordResetSchema(BaseModel):
    """Validate password reset completion."""
    token: str = Field(..., min_length=1, description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=255, description="New password")

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password has minimum security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
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
