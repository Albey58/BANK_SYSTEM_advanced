"""
Advanced Banking System API
Secure Flask application with JWT authentication, input validation, and transaction management.
"""

import os
import uuid
import logging
from datetime import timedelta
from functools import wraps
from decimal import Decimal

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
import MySQLdb.cursors
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from pydantic import ValidationError

from validators import (
    UserRegistrationSchema, LoginSchema, DepositSchema,
    WithdrawalSchema, TransferSchema, UpdateProfileSchema,
    CreateAccountSchema, SetPinSchema, ResetPinSchema,
    BranchCreateSchema, JoinAccountInviteSchema
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('banking_system.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ==================== CONFIGURATION ====================
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))

# Database configuration from environment
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'advanced_bank')

# Initialize extensions
mysql = MySQL(app)
jwt = JWTManager(app)

# JWT blocklist for logout functionality
jwt_blocklist = set()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if token has been revoked."""
    jti = jwt_payload['jti']
    return jti in jwt_blocklist


# ==================== HELPER FUNCTIONS ====================

def validate_request(schema_class):
    """Decorator to validate request data using Pydantic schemas."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                validated_data = schema_class(**data)
                request.validated_data = validated_data
                return f(*args, **kwargs)
            except ValidationError as e:
                logger.warning(f"Validation error: {e.errors()}")
                # Sanitize errors to remove non-serializable 'ctx' objects
                sanitized_errors = []
                for err in e.errors():
                    err_copy = err.copy()
                    if 'ctx' in err_copy:
                        del err_copy['ctx']
                    if 'url' in err_copy:
                        del err_copy['url']
                    sanitized_errors.append(err_copy)
                    
                return jsonify({
                    "success": False,
                    "error": "Validation failed",
                    "details": sanitized_errors
                }), 400
            except Exception as e:
                # If it's a validation error from Pydantic inside the function (unlikely but possible)
                if "validation" in str(e).lower():
                     logger.error(f"Request validation error: {str(e)}")
                     return jsonify({"success": False, "error": "Invalid request format"}), 400
                
                # For other errors (database, logic), re-raise to let Flask handle as 500
                raise e
        return decorated_function
    return decorator


def get_db_cursor(dictionary=True):
    """Get database cursor with context management."""
    cursor_type = MySQLdb.cursors.DictCursor if dictionary else MySQLdb.cursors.Cursor
    return mysql.connection.cursor(cursor_type)


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/auth/register', methods=['POST'])
@validate_request(UserRegistrationSchema)
def register_user():
    """
    Register a new user with full KYC integration.
    Creates User, Auth, KYC entry, and default Account in one atomic transaction.
    """
    data = request.validated_data
    user_id = str(uuid.uuid4())
    account_id = str(uuid.uuid4())
    
    try:
        hashed_pw = generate_password_hash(data.password)
        hashed_pin = generate_password_hash(data.initial_pin)
    except Exception as e:
        logger.error(f"Security processing error: {str(e)}")
        return jsonify({"success": False, "error": "Security processing failed"}), 500
    
    conn = mysql.connection
    cursor = conn.cursor()
    
    try:
        cursor.execute("START TRANSACTION")
        
        # 1. Insert into Users
        cursor.execute(
            "INSERT INTO users (user_id, full_name, email, tax_id) VALUES (%s, %s, %s, %s)",
            (user_id, data.full_name, data.email, data.tax_id)
        )
        
        # 2. Insert into Auth
        cursor.execute(
            "INSERT INTO user_auth (user_id, password_hash) VALUES (%s, %s)",
            (user_id, hashed_pw)
        )
        
        # 3. Create KYC Record
        cursor.execute(
            "INSERT INTO user_documents (user_id, document_type, document_number) VALUES (%s, %s, %s)",
            (user_id, data.doc_type, data.doc_num)
        )
        
        # 4. Create Initial Savings Account with PIN and Branch
        cursor.execute(
            "INSERT INTO accounts (account_id, user_id, account_type, balance, pin_hash, branch_id) VALUES (%s, %s, 'savings', 0.00, %s, %s)",
            (account_id, user_id, hashed_pin, data.branch_id)
        )

        # 5. Add to Account Members (Ownership Link)
        cursor.execute(
            "INSERT INTO account_members (account_id, user_id, role) VALUES (%s, %s, 'primary')",
            (account_id, user_id)
        )
        
        conn.commit()
        logger.info(f"New user registered: {user_id} - {data.email}")
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "user_id": user_id,
            "account_id": account_id
        }), 201
        
    except MySQLdb.IntegrityError as e:
        conn.rollback()
        logger.warning(f"Registration failed - duplicate entry: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Email or Tax ID already registered"
        }), 409
    except Exception as e:
        conn.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"success": False, "error": "Registration failed"}), 500
    finally:
        cursor.close()


@app.route('/api/auth/login', methods=['POST'])
@validate_request(LoginSchema)
def login():
    """
    Authenticate user and return JWT tokens.
    """
    data = request.validated_data
    
    cursor = get_db_cursor()
    
    try:
        # Get user and password hash
        cursor.execute(
            """
            SELECT u.user_id, u.full_name, u.email, a.password_hash, a.is_locked
            FROM users u
            JOIN user_auth a ON u.user_id = a.user_id
            WHERE u.email = %s
            """,
            (data.email,)
        )
        user = cursor.fetchone()
        
        if not user:
            logger.warning(f"Login attempt for non-existent user: {data.email}")
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
        
        if user['is_locked']:
            logger.warning(f"Login attempt for locked account: {data.email}")
            return jsonify({"success": False, "error": "Account is locked"}), 403
        
        # Verify password
        if not check_password_hash(user['password_hash'], data.password):
            logger.warning(f"Failed login attempt: {data.email}")
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
        
        # Create tokens
        access_token = create_access_token(identity=user['user_id'])
        refresh_token = create_refresh_token(identity=user['user_id'])
        
        logger.info(f"Successful login: {user['email']}")
        
        return jsonify({
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "user_id": user['user_id'],
                "full_name": user['full_name'],
                "email": user['email']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"success": False, "error": "Login failed"}), 500
    finally:
        cursor.close()


@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    
    return jsonify({
        "success": True,
        "access_token": access_token
    }), 200


@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user by revoking JWT token."""
    jti = get_jwt()['jti']
    jwt_blocklist.add(jti)
    
    logger.info(f"User logged out: {get_jwt_identity()}")
    
    return jsonify({
        "success": True,
        "message": "Successfully logged out"
    }), 200


# ==================== BANKING OPERATIONS ====================

@app.route('/api/account/deposit', methods=['POST'])
@jwt_required()
@validate_request(DepositSchema)
def deposit():
    """Deposit funds into an account."""
    data = request.validated_data
    current_user = get_jwt_identity()
    
    amount = float(data.amount)
    acc_id = data.account_id
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        # Verify user is a member of the account
        cursor.execute(
            """
            SELECT a.balance FROM accounts a
            JOIN account_members am ON a.account_id = am.account_id
            WHERE a.account_id = %s AND am.user_id = %s
            """,
            (acc_id, current_user)
        )
        account = cursor.fetchone()
        
        if not account:
            logger.warning(f"Unauthorized deposit attempt by {current_user} to {acc_id}")
            return jsonify({"success": False, "error": "Unauthorized or account not found"}), 403
        
        current_balance = float(account['balance'])
        new_balance = current_balance + amount
        
        # Update balance
        cursor.execute(
            "UPDATE accounts SET balance = %s WHERE account_id = %s",
            (new_balance, acc_id)
        )
        
        # Insert ledger entry
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, %s, %s, %s)",
            (acc_id, 'deposit', amount, new_balance)
        )
        
        conn.commit()
        
        status = 'completed' if amount < 10000 else 'flagged_for_review'
        logger.info(f"Deposit: {amount} to {acc_id}, new balance: {new_balance}, status: {status}")
        
        return jsonify({
            "success": True,
            "new_balance": new_balance,
            "status": status
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Deposit error: {str(e)}")
        return jsonify({"success": False, "error": "Deposit failed"}), 500
    finally:
        cursor.close()


@app.route('/api/account/create', methods=['POST'])
@jwt_required()
@validate_request(CreateAccountSchema)
def create_new_account():
    """Open a new bank account."""
    current_user = get_jwt_identity()
    data = request.validated_data
    account_id = str(uuid.uuid4())
    
    try:
        hashed_pin = generate_password_hash(data.pin)
    except Exception as e:
        return jsonify({"success": False, "error": "PIN processing failed"}), 500
        
    cursor = get_db_cursor()
    try:
        conn = mysql.connection
        
        initial_balance = float(getattr(data, 'initial_deposit', 0) or 0)
        
        cursor.execute(
            "INSERT INTO accounts (account_id, user_id, account_type, balance, pin_hash) VALUES (%s, %s, %s, %s, %s)",
            (account_id, current_user, data.account_type, initial_balance, hashed_pin)
        )
        
        # Add user as primary member so account appears on dashboard
        cursor.execute(
            "INSERT INTO account_members (account_id, user_id, role) VALUES (%s, %s, 'primary')",
            (account_id, current_user)
        )
        
        conn.commit()
        
        logger.info(f"New {data.account_type} account opened for {current_user}")
        
        return jsonify({
            "success": True,
            "message": f"New {data.account_type} account created successfully",
            "account_id": account_id
        }), 201
    except Exception as e:
        logger.error(f"Account creation error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to create account"}), 500
    finally:
        cursor.close()


@app.route('/api/account/set-pin', methods=['POST'])
@jwt_required()
@validate_request(SetPinSchema)
def set_account_pin():
    """Set PIN for an account that does not have one."""
    current_user = get_jwt_identity()
    data = request.validated_data
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        cursor.execute(
            "SELECT user_id, pin_hash FROM accounts WHERE account_id = %s",
            (data.account_id,)
        )
        account = cursor.fetchone()
        
        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404
            
        if account['user_id'] != current_user:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        if account['pin_hash']:
            return jsonify({"success": False, "error": "PIN already set"}), 409
            
        hashed_pin = generate_password_hash(data.pin)
        
        cursor.execute(
            "UPDATE accounts SET pin_hash = %s WHERE account_id = %s",
            (hashed_pin, data.account_id)
        )
        conn.commit()
        
        logger.info(f"PIN set for account {data.account_id} by {current_user}")
        
        return jsonify({"success": True, "message": "PIN set successfully"}), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Set PIN error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to set PIN"}), 500
    finally:
        cursor.close()


@app.route('/api/account/reset-pin', methods=['POST'])
@jwt_required()
@validate_request(ResetPinSchema)
def reset_account_pin():
    """Reset PIN for an account (requires password verification)."""
    current_user = get_jwt_identity()
    data = request.validated_data
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        # Get account and user's password hash
        cursor.execute(
            """
            SELECT a.user_id, a.pin_hash, au.password_hash 
            FROM accounts a 
            JOIN user_auth au ON a.user_id = au.user_id 
            WHERE a.account_id = %s
            """,
            (data.account_id,)
        )
        account = cursor.fetchone()
        
        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404
            
        if account['user_id'] != current_user:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        # Verify Password
        if not check_password_hash(account['password_hash'], data.password):
            return jsonify({"success": False, "error": "Invalid password"}), 401
            
        hashed_pin = generate_password_hash(data.new_pin)
        
        cursor.execute(
            "UPDATE accounts SET pin_hash = %s WHERE account_id = %s",
            (hashed_pin, data.account_id)
        )
        conn.commit()
        
        logger.info(f"PIN reset for account {data.account_id} by {current_user}")
        
        return jsonify({"success": True, "message": "PIN reset successfully"}), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Reset PIN error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to reset PIN"}), 500
    finally:
        cursor.close()


@app.route('/api/account/withdraw', methods=['POST'])
@jwt_required()
@validate_request(WithdrawalSchema)
def withdraw():
    """Withdraw funds from an account."""
    data = request.validated_data
    current_user = get_jwt_identity()
    
    amount = float(data.amount)
    acc_id = data.account_id
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        # Verify user is a member of the account and has sufficient funds
        cursor.execute(
            """
            SELECT a.balance, a.status, a.pin_hash FROM accounts a
            JOIN account_members am ON a.account_id = am.account_id
            WHERE a.account_id = %s AND am.user_id = %s
            """,
            (acc_id, current_user)
        )
        account = cursor.fetchone()
        
        if not account:
            logger.warning(f"Unauthorized withdrawal attempt by {current_user} from {acc_id}")
            return jsonify({"success": False, "error": "Unauthorized or account not found"}), 403
        
        if account['status'] != 'active':
            return jsonify({"success": False, "error": "Account is not active"}), 403
            
        # Verify PIN
        if not account['pin_hash'] or not check_password_hash(account['pin_hash'], data.pin):
            return jsonify({"success": False, "error": "Invalid PIN"}), 401
        
        current_balance = float(account['balance'])
        
        if current_balance < amount:
            return jsonify({"success": False, "error": "Insufficient funds"}), 400
        
        new_balance = current_balance - amount
        
        # Update balance
        cursor.execute(
            "UPDATE accounts SET balance = %s WHERE account_id = %s",
            (new_balance, acc_id)
        )
        
        # Insert ledger entry
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, %s, %s, %s)",
            (acc_id, 'withdrawal', -amount, new_balance)
        )
        
        conn.commit()
        logger.info(f"Withdrawal: {amount} from {acc_id}, new balance: {new_balance}")
        
        return jsonify({
            "success": True,
            "new_balance": new_balance,
            "amount_withdrawn": amount
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Withdrawal error: {str(e)}")
        return jsonify({"success": False, "error": "Withdrawal failed"}), 500
    finally:
        cursor.close()


@app.route('/api/account/transfer', methods=['POST'])
@jwt_required()
@validate_request(TransferSchema)
def transfer():
    """Transfer money between accounts with 1% service fee."""
    data = request.validated_data
    current_user = get_jwt_identity()
    
    sender_id = data.from_account
    receiver_id = data.to_account
    amount = float(data.amount)
    
    # Calculate 1% fee
    fee = amount * 0.01
    total_deduction = amount + fee
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        cursor.execute("START TRANSACTION")
        
        # Verify sender account membership
        cursor.execute(
            """
            SELECT a.balance, a.status, a.pin_hash, u.full_name 
            FROM accounts a 
            JOIN users u ON a.user_id = u.user_id 
            JOIN account_members am ON a.account_id = am.account_id
            WHERE a.account_id = %s AND am.user_id = %s
            FOR UPDATE
            """,
            (sender_id, current_user)
        )
        sender = cursor.fetchone()
        
        if not sender:
            conn.rollback()
            logger.warning(f"Unauthorized transfer attempt by {current_user} from {sender_id}")
            return jsonify({"success": False, "error": "Unauthorized or sender account not found"}), 403
            
        # Verify PIN
        if not sender['pin_hash'] or not check_password_hash(sender['pin_hash'], data.pin):
            conn.rollback()
            return jsonify({"success": False, "error": "Invalid PIN"}), 401
        
        if sender['status'] != 'active':
            conn.rollback()
            return jsonify({"success": False, "error": "Sender account is not active"}), 403
        
        sender_balance = float(sender['balance'])
        
        if sender_balance < total_deduction:
            conn.rollback()
            return jsonify({
                "success": False,
                "error": f"Insufficient funds (including 1% fee of {fee:.2f})"
            }), 400
        
        # Verify receiver account
        cursor.execute(
            "SELECT a.balance, a.status, u.full_name FROM accounts a JOIN users u ON a.user_id = u.user_id WHERE a.account_id = %s FOR UPDATE",
            (receiver_id,)
        )
        receiver = cursor.fetchone()
        
        if not receiver:
            conn.rollback()
            return jsonify({"success": False, "error": "Receiver account not found"}), 404
        
        if receiver['status'] != 'active':
            conn.rollback()
            return jsonify({"success": False, "error": "Receiver account is not active"}), 403
        
        receiver_balance = float(receiver['balance'])
        
        # Calculate new balances
        new_sender_balance = sender_balance - total_deduction
        new_receiver_balance = receiver_balance + amount
        
        # Update sender
        cursor.execute(
            "UPDATE accounts SET balance = %s WHERE account_id = %s",
            (new_sender_balance, sender_id)
        )
        
        # Update receiver
        cursor.execute(
            "UPDATE accounts SET balance = %s WHERE account_id = %s",
            (new_receiver_balance, receiver_id)
        )
        
        # Ledger entries
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, %s, %s, %s)",
            (sender_id, 'transfer_out', -total_deduction, new_sender_balance)
        )
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, %s, %s, %s)",
            (receiver_id, 'transfer_in', amount, new_receiver_balance)
        )

        # Audit Log for Transfer Context (Rich Log)
        transfer_desc = f"Transfer to {receiver['full_name']}"
        cursor.execute(
            "INSERT INTO audit_log (table_name, record_id, action_type, column_name, old_value, new_value) VALUES (%s, %s, %s, %s, %s, %s)",
            ('accounts', sender_id, 'TRANSFER', transfer_desc, amount, fee)
        )
        
        conn.commit()
        logger.info(f"Transfer: {amount} from {sender_id} to {receiver_id}, fee: {fee}")
        
        return jsonify({
            "success": True,
            "message": "Transfer completed successfully",
            "transfer_amount": amount,
            "fee_charged": fee,
            "total_deducted": total_deduction,
            "new_balance": new_sender_balance
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Transfer error: {str(e)}")
        return jsonify({"success": False, "error": "Transfer failed"}), 500
    finally:
        cursor.close()



# ==================== BRANCH & NETWORK MANAGEMENT ====================

@app.route('/api/branches', methods=['GET'])
def list_branches():
    """List all available banking sectors/branches."""
    cursor = get_db_cursor()
    try:
        cursor.execute("SELECT branch_id, branch_name, branch_code, location, status FROM branches WHERE status != 'decommissioned'")
        branches = cursor.fetchall()
        return jsonify({"success": True, "branches": branches}), 200
    except Exception as e:
        logger.error(f"Error fetching branches: {str(e)}")
        return jsonify({"success": False, "error": "Could not load branches"}), 500
    finally:
        cursor.close()

@app.route('/api/account/invite', methods=['POST'])
@jwt_required()
@validate_request(JoinAccountInviteSchema)
def invite_joint_member():
    """Invite another user to join an account as a Twin Star (Joint Owner)."""
    current_user = get_jwt_identity()
    data = request.validated_data
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        # 1. Verify account ownership (only Primary can invite)
        cursor.execute(
            "SELECT 1 FROM account_members WHERE account_id = %s AND user_id = %s AND role = 'primary'",
            (data.account_id, current_user)
        )
        if not cursor.fetchone():
            return jsonify({"success": False, "error": "Only primary owner can invite members"}), 403
            
        # 2. Find invitee by email
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (data.invitee_email,))
        invitee = cursor.fetchone()
        if not invitee:
            return jsonify({"success": False, "error": "User with this email not found"}), 404
            
        # 3. Add record to account_members
        cursor.execute(
            "INSERT INTO account_members (account_id, user_id, role) VALUES (%s, %s, %s)",
            (data.account_id, invitee['user_id'], data.role)
        )
        conn.commit()
        
        logger.info(f"User {invitee['user_id']} invited to account {data.account_id} by {current_user}")
        return jsonify({"success": True, "message": "Twin Star invited successfully"}), 201
        
    except MySQLdb.IntegrityError:
        return jsonify({"success": False, "error": "User is already a member of this account"}), 409
    except Exception as e:
        conn.rollback()
        logger.error(f"Invite error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to send invitation"}), 500
    finally:
        cursor.close()


# ==================== USER & ACCOUNT MANAGEMENT ====================

@app.route('/api/user/dashboard/<user_id>', methods=['GET'])
@jwt_required()
def get_dashboard(user_id):
    """Get user dashboard with account information and data masking."""
    current_user = get_jwt_identity()
    
    if current_user != user_id:
        logger.warning(f"Unauthorized dashboard access attempt by {current_user} for {user_id}")
        return jsonify({"success": False, "error": "Unauthorized"}), 403
    
    cursor = get_db_cursor()
    
    try:
        # 1. Fetch User Info
        cursor.execute("SELECT full_name, email, tax_id FROM users WHERE user_id = %s", (user_id,))
        user_info = cursor.fetchone()
        if not user_info:
            return jsonify({"success": False, "error": "User not found"}), 404

        # 2. Fetch all accounts where the user is a member (Primary or Joint)
        query = """
            SELECT a.account_id, a.account_type, a.balance, a.status, 
                   am.role AS membership_role, b.branch_name, b.location AS branch_location,
                   k.verification_status, k.document_type
            FROM accounts a
            JOIN account_members am ON a.account_id = am.account_id
            LEFT JOIN branches b ON a.branch_id = b.branch_id
            LEFT JOIN user_documents k ON a.user_id = k.user_id
            WHERE am.user_id = %s
        """
        cursor.execute(query, (user_id,))
        accounts = cursor.fetchall()
        
        # Data masking for security
        for row in accounts:
            row['balance'] = float(row['balance'])
            raw_id = row['account_id']
            row['account_id_masked'] = f"{raw_id[:8]}****{raw_id[-8:]}"
        
        # Compute total balance
        total_balance = sum(acc['balance'] for acc in accounts)
        
        # Get verification status from accounts (from user_documents join) or default
        verification_status = 'pending'
        for acc in accounts:
            if acc.get('verification_status'):
                verification_status = acc['verification_status']
                break
            
        return jsonify({
            "success": True, 
            "user": {
                "full_name": user_info['full_name'],
                "email": user_info['email'],
                "tax_id": user_info['tax_id'],
                "verification_status": verification_status
            },
            "accounts": accounts,
            "total_balance": total_balance
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to load dashboard"}), 500
    finally:
        cursor.close()


@app.route('/api/account/statement/<account_id>', methods=['GET'])
@jwt_required()
def get_statement(account_id):
    """Get account statement with date filtering."""
    current_user = get_jwt_identity()
    days = request.args.get('days', default=30, type=int)
    
    # Limit days to prevent excessive queries
    if days > 365:
        days = 365
    
    cursor = get_db_cursor()
    
    try:
        # Verify account belongs to user
        cursor.execute(
            "SELECT user_id FROM accounts WHERE account_id = %s",
            (account_id,)
        )
        account = cursor.fetchone()
        
        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404
        
        if account['user_id'] != current_user:
            logger.warning(f"Unauthorized statement access by {current_user} for {account_id}")
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        query = """
            SELECT transaction_id, transaction_type, amount, balance_after, created_at 
            FROM ledger 
            WHERE account_id = %s AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            ORDER BY created_at DESC
        """
        cursor.execute(query, (account_id, days))
        statement = cursor.fetchall()
        
        for row in statement:
            row['amount'] = float(row['amount'])
            row['balance_after'] = float(row['balance_after'])
            row['created_at'] = row['created_at'].isoformat() if row['created_at'] else None
        
        return jsonify({
            "success": True,
            "account_id": account_id,
            "history": statement,
            "period_days": days
        }), 200
        
    except Exception as e:
        logger.error(f"Statement error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to retrieve statement"}), 500
    finally:
        cursor.close()


@app.route('/api/user/profile/<user_id>', methods=['PUT'])
@jwt_required()
@validate_request(UpdateProfileSchema)
def update_profile(user_id):
    """Update user profile information."""
    current_user = get_jwt_identity()
    
    if current_user != user_id:
        return jsonify({"success": False, "error": "Unauthorized"}), 403
    
    data = request.validated_data
    
    conn = mysql.connection
    cursor = conn.cursor()
    
    try:
        updates = []
        params = []
        
        if data.full_name:
            updates.append("full_name = %s")
            params.append(data.full_name)
        
        if data.email:
            updates.append("email = %s")
            params.append(data.email)
        
        if not updates:
            return jsonify({"success": False, "error": "No updates provided"}), 400
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s"
        
        cursor.execute(query, tuple(params))
        conn.commit()
        
        logger.info(f"Profile updated for user: {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully"
        }), 200
        
    except MySQLdb.IntegrityError:
        conn.rollback()
        return jsonify({"success": False, "error": "Email already in use"}), 409
    except Exception as e:
        conn.rollback()
        logger.error(f"Profile update error: {str(e)}")
        return jsonify({"success": False, "error": "Update failed"}), 500
    finally:
        cursor.close()


# ==================== ADMIN OPERATIONS ====================

@app.route('/api/admin/apply-interest', methods=['POST'])
@jwt_required()
def apply_interest():
    """Apply daily interest to all active savings accounts (Admin only)."""
    # TODO: Add admin role verification
    
    conn = mysql.connection
    cursor = conn.cursor()
    interest_rate = 0.04 / 365  # 4% annual, daily application
    
    try:
        cursor.execute("START TRANSACTION")
        
        # Update balances
        cursor.execute(
            """
            UPDATE accounts 
            SET balance = balance + (balance * %s) 
            WHERE account_type = 'savings' AND status = 'active'
            """,
            (interest_rate,)
        )
        
        # Insert ledger entries with CORRECT balance_after (FIXED BUG)
        cursor.execute(
            """
            INSERT INTO ledger (account_id, transaction_type, amount, balance_after) 
            SELECT account_id, 'deposit', (balance * %s), balance 
            FROM accounts 
            WHERE account_type = 'savings' AND status = 'active'
            """,
            (interest_rate,)
        )
        
        conn.commit()
        
        affected_rows = cursor.rowcount
        logger.info(f"Interest applied to {affected_rows} savings accounts")
        
        return jsonify({
            "success": True,
            "message": f"Interest applied to {affected_rows} accounts",
            "rate": f"{interest_rate * 100:.4f}%"
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Interest application error: {str(e)}")
        return jsonify({"success": False, "error": "Interest application failed"}), 500
    finally:
        cursor.close()


@app.route('/api/admin/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Fetch audit logs (Admin only)."""
    # TODO: Add admin role verification
    
    cursor = get_db_cursor()
    
    try:
        limit = request.args.get('limit', default=50, type=int)
        if limit > 200:
            limit = 200
        
        # Join with accounts and users to get owner name
        query = """
            SELECT a.*, u.full_name as owner_name, acc.account_type
            FROM audit_log a
            LEFT JOIN accounts acc ON a.table_name = 'accounts' AND a.record_id = acc.account_id
            LEFT JOIN users u ON acc.user_id = u.user_id
            ORDER BY a.changed_at DESC LIMIT %s
        """
        cursor.execute(query, (limit,))
        logs = cursor.fetchall()
        
        # Convert decimals to floats for JSON serialization
        for log in logs:
            if log.get('old_value') is not None:
                log['old_value'] = float(log['old_value'])
            if log.get('new_value') is not None:
                log['new_value'] = float(log['new_value'])
            if log.get('changed_at'):
                log['changed_at'] = log['changed_at'].isoformat()
        
        return jsonify({
            "success": True,
            "count": len(logs),
            "logs": logs
        }), 200
        
    except Exception as e:
        logger.error(f"Audit log error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to retrieve audit logs"}), 500
    finally:
        cursor.close()


# ==================== UTILITY ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected"
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }), 503


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({"success": False, "error": "Internal server error"}), 500


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handle expired JWT tokens."""
    return jsonify({
        "success": False,
        "error": "Token has expired",
        "message": "Please refresh your token"
    }), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid JWT tokens."""
    return jsonify({
        "success": False,
        "error": "Invalid token",
        "message": "Authentication required"
    }), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing JWT tokens."""
    return jsonify({
        "success": False,
        "error": "Authorization required",
        "message": "Missing authentication token"
    }), 401


# ==================== APPLICATION ENTRY POINT ====================

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('FLASK_PORT', 5000))
    
    logger.info(f"Starting Banking System API on port {port} (debug={debug_mode})")
    app.run(debug=debug_mode, port=port, host='0.0.0.0')
