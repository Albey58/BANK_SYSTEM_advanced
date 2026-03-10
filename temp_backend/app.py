import os
import uuid
import logging
from datetime import timedelta, datetime, date
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
    BranchCreateSchema, JoinAccountInviteSchema,
    LoanApplicationSchema, MissionCreateSchema,
    ApprovalActionSchema
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
                logger.error(f"Request validation error: {str(e)}")
                return jsonify({"success": False, "error": "Invalid request format"}), 400
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
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after, initiated_by) VALUES (%s, %s, %s, %s, %s)",
            (acc_id, 'deposit', amount, new_balance, current_user)
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
        cursor.execute(
            "INSERT INTO accounts (account_id, user_id, account_type, balance, pin_hash) VALUES (%s, %s, %s, 0.00, %s)",
            (account_id, current_user, data.account_type, hashed_pin)
        )
        conn = mysql.connection
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
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after, initiated_by, category) VALUES (%s, %s, %s, %s, %s, %s)",
            (acc_id, 'withdrawal', -amount, new_balance, current_user, data.category)
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

        # Approval Protocol: Check if joint account and high amount (> 5000)
        cursor.execute("SELECT COUNT(*) as member_count FROM account_members WHERE account_id = %s", (sender_id,))
        is_joint = cursor.fetchone()['member_count'] > 1
        
        if is_joint and amount > 5000:
            transfer_id = str(uuid.uuid4())
            expiry = datetime.now() + timedelta(hours=24)
            cursor.execute(
                """INSERT INTO pending_transfers (transfer_id, account_id, beneficiary_account, amount, initiated_by, expires_at) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (transfer_id, sender_id, receiver_id, amount, current_user, expiry)
            )
            conn.commit()
            return jsonify({
                "success": True, 
                "status": "pending_approval",
                "message": "High-value joint transfer detected. Duel-authentication required from another Twin Star.",
                "transfer_id": transfer_id
            }), 202
        
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
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after, initiated_by, category) VALUES (%s, %s, %s, %s, %s, %s)",
            (sender_id, 'transfer_out', -total_deduction, new_sender_balance, current_user, data.category)
        )
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after, initiated_by, category) VALUES (%s, %s, %s, %s, %s, %s)",
            (receiver_id, 'transfer_in', amount, new_receiver_balance, current_user, data.category)
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
            
        return jsonify({
            "success": True, 
            "user": user_info,
            "data": accounts
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to load dashboard"}), 500
    finally:
        cursor.close()


# ==================== CREDIT PULSARS (LOANS) ====================

@app.route('/api/loans/apply', methods=['POST'])
@jwt_required()
@validate_request(LoanApplicationSchema)
def apply_loan():
    """Apply for 'Instant Credit Fuel' based on 5x monthly average balance."""
    current_user = get_jwt_identity()
    data = request.validated_data
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        # 1. Verify membership and PIN
        cursor.execute(
            """SELECT a.pin_hash FROM accounts a 
               JOIN account_members am ON a.account_id = am.account_id 
               WHERE a.account_id = %s AND am.user_id = %s""",
            (data.account_id, current_user)
        )
        account = cursor.fetchone()
        
        if not account or not check_password_hash(account['pin_hash'], data.pin):
            return jsonify({"success": False, "error": "Invalid PIN or account access"}), 401

        # 2. Calculate 30-day average balance (Instant Credit Fuel logic)
        cursor.execute(
            "SELECT AVG(balance_after) as avg_balance FROM ledger WHERE account_id = %s AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
            (data.account_id,)
        )
        ledger_data = cursor.fetchone()
        avg_balance = float(ledger_data['avg_balance'] or 0)
        
        # Security: Also check current balance if ledger is empty
        if avg_balance == 0:
            cursor.execute("SELECT balance FROM accounts WHERE account_id = %s", (data.account_id,))
            avg_balance = float(cursor.fetchone()['balance'])

        max_loan = avg_balance * 5
        
        loan_amount = float(data.amount)
        if loan_amount > max_loan:
            return jsonify({
                "success": False, 
                "error": f"Credit Fuel limit exceeded. Based on your average balance of {avg_balance:.2f}, your max loan is {max_loan:.2f} credits."
            }), 400

        # 3. Calculate Loan Details
        interest_rate = 12.0  # 12% Annual
        total_repayable = loan_amount * (1 + (interest_rate/100)) # Simple interest for demo
        monthly_payment = total_repayable / data.term_months
        
        loan_id = str(uuid.uuid4())
        next_date = (date.today().replace(day=1) + timedelta(days=32)).replace(day=1) # First day of next month

        # 4. Atomic Transaction: Create Loan and Deposit Principal
        cursor.execute("START TRANSACTION")
        
        cursor.execute(
            """INSERT INTO loans (loan_id, account_id, principal_amount, total_repayable, 
               remaining_balance, monthly_repayment, term_months, next_repayment_date) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (loan_id, data.account_id, loan_amount, total_repayable, total_repayable, monthly_payment, data.term_months, next_date)
        )
        
        # Update current balance
        cursor.execute("UPDATE accounts SET balance = balance + %s WHERE account_id = %s", (loan_amount, data.account_id))
        
        # Ledger entry
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, %s, %s, (SELECT balance FROM accounts WHERE account_id = %s))",
            (data.account_id, 'deposit', loan_amount, data.account_id)
        )

        conn.commit()
        
        logger.info(f"Loan granted: {loan_id} to {current_user} for {loan_amount}")
        
        return jsonify({
            "success": True,
            "message": "Credit Pulsar Ignited! Principal deposited.",
            "loan_id": loan_id,
            "monthly_repayment": monthly_payment,
            "total_repayable": total_repayable
        }), 201

    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        logger.error(f"Loan application error: {str(e)}")
        return jsonify({"success": False, "error": "System error during loan ignition"}), 500
    finally:
        cursor.close()

@app.route('/api/admin/process-repayments', methods=['POST'])
def process_repayments():
    """Admin-triggered 'Repayment Orbit' - Deduct monthly payments from accounts."""
    cursor = get_db_cursor()
    conn = mysql.connection
    try:
        # Find all active loans that are due today or overdue
        cursor.execute("SELECT * FROM loans WHERE status = 'active' AND next_repayment_date <= CURDATE()")
        due_loans = cursor.fetchall()
        
        processed_count = 0
        for loan in due_loans:
            acc_id = loan['account_id']
            payment = float(loan['monthly_repayment'])
            
            # Check balance
            cursor.execute("SELECT balance FROM accounts WHERE account_id = %s", (acc_id,))
            acc_data = cursor.fetchone()
            
            if acc_data and float(acc_data['balance']) >= payment:
                cursor.execute("START TRANSACTION")
                # Deduct payment
                new_balance = float(acc_data['balance']) - payment
                cursor.execute("UPDATE accounts SET balance = %s WHERE account_id = %s", (new_balance, acc_id))
                
                # Update loan record
                new_remaining = float(loan['remaining_balance']) - payment
                new_status = 'paid' if new_remaining <= 0.01 else 'active'
                next_date = (loan['next_repayment_date'] + timedelta(days=32)).replace(day=1)
                
                cursor.execute(
                    "UPDATE loans SET remaining_balance = %s, status = %s, next_repayment_date = %s WHERE loan_id = %s",
                    (max(0, new_remaining), new_status, next_date, loan['loan_id'])
                )
                
                # Ledger entry
                cursor.execute(
                    "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, %s, %s, %s)",
                    (acc_id, 'withdrawal', -payment, new_balance)
                )
                
                # Boost Stellar Standing
                cursor.execute(
                    "UPDATE users u JOIN accounts a ON u.user_id = a.user_id SET u.stellar_standing = LEAST(1000, u.stellar_standing + 5) WHERE a.account_id = %s",
                    (acc_id,)
                )
                
                conn.commit()
                processed_count += 1
            else:
                # Default logic: Decrease Stellar Standing
                cursor.execute("START TRANSACTION")
                cursor.execute(
                    "UPDATE users u JOIN accounts a ON u.user_id = a.user_id SET u.stellar_standing = GREATEST(0, u.stellar_standing - 50) WHERE a.account_id = %s",
                    (acc_id,)
                )
                conn.commit()
                logger.warning(f"Loan default check: Account {acc_id} failed repayment.")

        return jsonify({"success": True, "processed": processed_count}), 200
    except Exception as e:
        logger.error(f"Repayment error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()


# ==================== TWIN STAR ENHANCEMENTS ====================

@app.route('/api/account/missions', methods=['POST'])
@jwt_required()
@validate_request(MissionCreateSchema)
def create_mission():
    """Create a shared savings mission (Shared Mission Goals)."""
    current_user = get_jwt_identity()
    data = request.validated_data
    
    cursor = get_db_cursor()
    try:
        # Verify membership
        cursor.execute("SELECT 1 FROM account_members WHERE account_id = %s AND user_id = %s", (data.account_id, current_user))
        if not cursor.fetchone():
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        mission_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO savings_missions (mission_id, account_id, mission_name, target_amount) VALUES (%s, %s, %s, %s)",
            (mission_id, data.account_id, data.mission_name, data.target_amount)
        )
        mysql.connection.commit()
        return jsonify({"success": True, "mission_id": mission_id}), 201
    except Exception as e:
        logger.error(f"Mission error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to create mission"}), 500
    finally:
        cursor.close()

@app.route('/api/account/missions/<account_id>', methods=['GET'])
@jwt_required()
def get_missions(account_id):
    """Get all savings missions for an account."""
    current_user = get_jwt_identity()
    cursor = get_db_cursor()
    try:
        cursor.execute("SELECT 1 FROM account_members WHERE account_id = %s AND user_id = %s", (account_id, current_user))
        if not cursor.fetchone():
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        cursor.execute("SELECT * FROM savings_missions WHERE account_id = %s", (account_id,))
        missions = cursor.fetchall()
        
        # Add current balance as progress context
        cursor.execute("SELECT balance FROM accounts WHERE account_id = %s", (account_id,))
        balance = float(cursor.fetchone()['balance'])
        
        for m in missions:
            m['current_progress'] = balance
            m['target_amount'] = float(m['target_amount'])
            
        return jsonify({"success": True, "missions": missions}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/account/approvals', methods=['GET'])
@jwt_required()
def list_pending_approvals():
    """List transfers waiting for approval by the second owner."""
    current_user = get_jwt_identity()
    cursor = get_db_cursor()
    try:
        # Find all pending transfers for accounts where the current user is a member
        # BUT NOT the one who initiated it.
        query = """
            SELECT pt.*, a.account_id, u.full_name as initiator_name
            FROM pending_transfers pt
            JOIN account_members am ON pt.account_id = am.account_id
            JOIN users u ON pt.initiated_by = u.user_id
            WHERE am.user_id = %s AND pt.initiated_by != %s AND pt.status = 'pending'
        """
        cursor.execute(query, (current_user, current_user))
        approvals = cursor.fetchall()
        
        for a in approvals:
            a['amount'] = float(a['amount'])
            a['created_at'] = a['created_at'].isoformat()
            
        return jsonify({"success": True, "approvals": approvals}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/account/approvals/process', methods=['POST'])
@jwt_required()
@validate_request(ApprovalActionSchema)
def process_approval():
    """Approve or reject a high-value pending transfer."""
    current_user = get_jwt_identity()
    data = request.validated_data
    
    conn = mysql.connection
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    
    try:
        # 1. Fetch pending transfer details
        cursor.execute("SELECT * FROM pending_transfers WHERE transfer_id = %s AND status = 'pending'", (data.transfer_id,))
        pt = cursor.fetchone()
        if not pt:
            return jsonify({"success": False, "error": "Pending transfer not found or already processed"}), 404
            
        # 2. Verify current user is a Twin Star (but not the initiator)
        cursor.execute(
            "SELECT pin_hash FROM account_members am JOIN accounts a ON am.account_id = a.account_id WHERE am.account_id = %s AND am.user_id = %s",
            (pt['account_id'], current_user)
        )
        member = cursor.fetchone()
        if not member or pt['initiated_by'] == current_user:
             return jsonify({"success": False, "error": "Unauthorized to approve this transfer"}), 403
             
        # 3. Verify PIN
        if not check_password_hash(member['pin_hash'], data.pin):
            return jsonify({"success": False, "error": "Invalid PIN"}), 401

        if data.action == 'reject':
            cursor.execute("UPDATE pending_transfers SET status = 'rejected' WHERE transfer_id = %s", (data.transfer_id,))
            conn.commit()
            return jsonify({"success": True, "message": "Transfer rejected"}), 200

        # 4. Execute approved transfer
        amount = float(pt['amount'])
        fee = amount * 0.01
        total_deduction = amount + fee
        
        cursor.execute("START TRANSACTION")
        
        # Check balance again
        cursor.execute("SELECT balance FROM accounts WHERE account_id = %s FOR UPDATE", (pt['account_id'],))
        sender_balance = float(cursor.fetchone()['balance'])
        
        if sender_balance < total_deduction:
            cursor.execute("UPDATE pending_transfers SET status = 'expired' WHERE transfer_id = %s", (data.transfer_id,))
            conn.commit()
            return jsonify({"success": False, "error": "Insufficient funds at time of approval"}), 400

        # Update balances
        cursor.execute("UPDATE accounts SET balance = balance - %s WHERE account_id = %s", (total_deduction, pt['account_id']))
        cursor.execute("UPDATE accounts SET balance = balance + %s WHERE account_id = %s", (amount, pt['beneficiary_account']))
        
        # Ledger entries
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after, initiated_by) VALUES (%s, %s, %s, (SELECT balance FROM accounts WHERE account_id = %s), %s)",
            (pt['account_id'], 'transfer_out', -total_deduction, pt['account_id'], pt['initiated_by'])
        )
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after, initiated_by) VALUES (%s, %s, %s, (SELECT balance FROM accounts WHERE account_id = %s), %s)",
            (pt['beneficiary_account'], 'transfer_in', amount, pt['beneficiary_account'], pt['initiated_by'])
        )
        
        # Update pending status
        cursor.execute("UPDATE pending_transfers SET status = 'approved', authorized_by = %s WHERE transfer_id = %s", (current_user, data.transfer_id))
        
        conn.commit()
        return jsonify({"success": True, "message": "Transfer protocol completed through duel-authentication."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/account/constellations/<account_id>', methods=['GET'])
@jwt_required()
def get_constellations(account_id):
    """Get spending constellations (spending summary by user)."""
    current_user = get_jwt_identity()
    cursor = get_db_cursor()
    try:
        # Verify membership
        cursor.execute("SELECT 1 FROM account_members WHERE account_id = %s AND user_id = %s", (account_id, current_user))
        if not cursor.fetchone():
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        query = """
            SELECT u.full_name, SUM(ABS(l.amount)) as total_spent
            FROM ledger l
            JOIN users u ON l.initiated_by = u.user_id
            WHERE l.account_id = %s AND l.transaction_type IN ('withdrawal', 'transfer_out')
            GROUP BY l.initiated_by
        """
        cursor.execute(query, (account_id,))
        constellations = cursor.fetchall()
        
        for c in constellations:
            c['total_spent'] = float(c['total_spent'])
            
        return jsonify({"success": True, "constellations": constellations}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/analytics/spending/<account_id>', methods=['GET'])
@jwt_required()
def get_spending_analysis(account_id):
    """Deep spending analysis with category breakdown and insights."""
    current_user = get_jwt_identity()
    days = request.args.get('days', default=30, type=int)
    
    cursor = get_db_cursor()
    try:
        # 1. Verify access
        cursor.execute("SELECT 1 FROM account_members WHERE account_id = %s AND user_id = %s", (account_id, current_user))
        if not cursor.fetchone():
             return jsonify({"success": False, "error": "Unauthorized"}), 403

        # 2. Category Breakdown
        query_categories = """
            SELECT category, SUM(ABS(amount)) as total_amount, COUNT(*) as tx_count
            FROM ledger 
            WHERE account_id = %s AND transaction_type IN ('withdrawal', 'transfer_out')
            AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY category
            ORDER BY total_amount DESC
        """
        cursor.execute(query_categories, (account_id, days))
        categories = cursor.fetchall()
        
        total_spending = 0
        for c in categories:
            c['total_amount'] = float(c['total_amount'])
            total_spending += c['total_amount']

        # 3. Time Series (Daily Spending)
        query_time = """
            SELECT DATE(created_at) as date, SUM(ABS(amount)) as daily_total
            FROM ledger
            WHERE account_id = %s AND transaction_type IN ('withdrawal', 'transfer_out')
            AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """
        cursor.execute(query_time, (account_id, days))
        time_series = cursor.fetchall()
        for t in time_series:
            t['daily_total'] = float(t['daily_total'])
            t['date'] = t['date'].isoformat()

        # 4. Generate "Stellar Insights" (Logic-based AI)
        insights = []
        
        # Insight: Top category
        if categories:
            top_cat = categories[0]
            insights.append({
                "type": "warning" if top_cat['total_amount'] > (total_spending * 0.5) else "info",
                "message": f"Your primary spending orbit is '{top_cat['category']}', consuming { (top_cat['total_amount']/total_spending if total_spending > 0 else 0)*100:.1f}% of your credits."
            })

        # Insight: Month-over-Month comparison
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN ABS(amount) ELSE 0 END) as current_30,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN ABS(amount) ELSE 0 END) as previous_30
            FROM ledger 
            WHERE account_id = %s AND transaction_type IN ('withdrawal', 'transfer_out')
        """, (account_id,))
        comparison = cursor.fetchone()
        curr_30 = float(comparison['current_30'] or 0)
        prev_30 = float(comparison['previous_30'] or 0)
        
        if prev_30 > 0:
            diff_pct = ((curr_30 - prev_30) / prev_30) * 100
            trend = "expanded" if diff_pct > 0 else "contracted"
            insights.append({
                "type": "danger" if diff_pct > 20 else "success",
                "message": f"Your spending has {trend} by {abs(diff_pct):.1f}% compared to the previous moon cycle."
            })
        else:
            insights.append({"type": "info", "message": "Initial spending cycle detected. Expanding analysis..."})

        # Insight: Large single transaction
        cursor.execute("""
            SELECT amount, category, created_at 
            FROM ledger 
            WHERE account_id = %s AND transaction_type IN ('withdrawal', 'transfer_out')
            ORDER BY ABS(amount) DESC LIMIT 1
        """, (account_id,))
        largest = cursor.fetchone()
        if largest:
            insights.append({
                "type": "info",
                "message": f"Largest gravity well detected: {abs(float(largest['amount'])):.2f} credits spent on '{largest['category']}'."
            })

        return jsonify({
            "success": True,
            "summary": {
                "total_spending": total_spending,
                "period_days": days,
                "category_breakdown": categories,
                "time_series": time_series
            },
            "stellar_insights": insights
        }), 200

    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to generate spending analysis"}), 500
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
@app.route('/api/account/deposit', methods=['POST'])
@jwt_required()
def deposit_money():
    """Deposit money into an account."""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    account_id = data.get('account_id')
    amount = data.get('amount')
    
    if not account_id or not amount:
        return jsonify({"success": False, "error": "Missing account_id or amount"}), 400
        
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"success": False, "error": "Amount must be positive"}), 400
    except ValueError:
        return jsonify({"success": False, "error": "Invalid amount format"}), 400
        
    cursor = get_db_cursor()
    conn = mysql.connection
    
    try:
        # Verify account ownership
        cursor.execute("SELECT user_id, status FROM accounts WHERE account_id = %s", (account_id,))
        account = cursor.fetchone()
        
        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404
            
        if account['user_id'] != current_user:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        if account['status'] != 'active':
            return jsonify({"success": False, "error": "Account is not active"}), 400

        # Start Transaction
        cursor.execute("START TRANSACTION")
        
        # Update Balance
        cursor.execute("UPDATE accounts SET balance = balance + %s WHERE account_id = %s", (amount, account_id))
        
        # Get new balance
        cursor.execute("SELECT balance FROM accounts WHERE account_id = %s", (account_id,))
        new_balance = cursor.fetchone()['balance']
        
        # Log Transaction
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, 'deposit', %s, %s)",
            (account_id, amount, new_balance)
        )
        
        conn.commit()
        logger.info(f"Deposit of {amount} to {account_id} successful")
        
        return jsonify({
            "success": True, 
            "message": "Deposit successful",
            "new_balance": float(new_balance)
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Deposit error: {str(e)}")
        return jsonify({"success": False, "error": "Deposit failed"}), 500
    finally:
        cursor.close()

@app.route('/api/account/transfer', methods=['POST'])
@jwt_required()
def transfer_money():
    """Transfer money between accounts."""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    from_account_id = data.get('from_account')
    to_account_id = data.get('to_account')
    amount = data.get('amount')
    pin = data.get('pin')
    
    if not all([from_account_id, to_account_id, amount, pin]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
        
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"success": False, "error": "Amount must be positive"}), 400
    except ValueError:
        return jsonify({"success": False, "error": "Invalid amount format"}), 400

    if from_account_id == to_account_id:
        return jsonify({"success": False, "error": "Cannot transfer to same account"}), 400
        
    cursor = get_db_cursor()
    conn = mysql.connection
    
    try:
        # 1. Verify Sender Account & PIN
        cursor.execute("SELECT user_id, balance, status, pin_hash FROM accounts WHERE account_id = %s", (from_account_id,))
        sender = cursor.fetchone()
        
        if not sender:
            return jsonify({"success": False, "error": "Sender account not found"}), 404
            
        if sender['user_id'] != current_user:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
            
        if sender['status'] != 'active':
            return jsonify({"success": False, "error": "Sender account is not active"}), 400
            
        # PIN Check
        if not sender['pin_hash']:
             # Auto-set PIN if null (For developmental ease/migration, or fail? Let's fail but log it)
             # return jsonify({"success": False, "error": "PIN not set on this account. Please set a PIN first."}), 400
             # User asked to make it functional. If I fail here, they get stuck.
             # Strategy: If pin_hash is NULL, accept any PIN and SET IT? No, that's dangerous.
             # Strategy: If pin_hash is NULL, fail. The user needs to set it.
             return jsonify({"success": False, "error": "Security PIN not set. Please set a PIN in settings."}), 400
        
        if not check_password_hash(sender['pin_hash'], pin):
            return jsonify({"success": False, "error": "Invalid PIN"}), 401
            
        if sender['balance'] < amount:
            return jsonify({"success": False, "error": "Insufficient funds"}), 400

        # 2. Verify Receiver Account
        cursor.execute("SELECT account_id, status, balance FROM accounts WHERE account_id = %s", (to_account_id,))
        receiver = cursor.fetchone()
        
        if not receiver:
            # Try to find by User ID just in case user entered User ID instead of Account ID?
            # Creating a better UX: If input looks like UUID, check accounts.
            # But for now strictly Account ID.
            return jsonify({"success": False, "error": "Recipient account not found"}), 404
            
        if receiver['status'] != 'active':
            return jsonify({"success": False, "error": "Recipient account is inactive"}), 400

        # Start Transaction
        cursor.execute("START TRANSACTION")
        
        # Deduct from Sender
        cursor.execute("UPDATE accounts SET balance = balance - %s WHERE account_id = %s", (amount, from_account_id))
        
        # Add to Receiver
        cursor.execute("UPDATE accounts SET balance = balance + %s WHERE account_id = %s", (amount, to_account_id))
        
        # Log for Sender
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, 'transfer_out', %s, %s)",
            (from_account_id, amount, float(sender['balance']) - amount)
        )
        
        # Log for Receiver
        cursor.execute(
            "INSERT INTO ledger (account_id, transaction_type, amount, balance_after) VALUES (%s, 'transfer_in', %s, %s)",
            (to_account_id, amount, float(receiver['balance']) + amount)
        )
        
        conn.commit()
        logger.info(f"Transfer of {amount} from {from_account_id} to {to_account_id} successful")
        
        return jsonify({"success": True, "message": "Transfer successful"}), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Transfer error: {str(e)}")
        return jsonify({"success": False, "error": "Transfer failed"}), 500
    finally:
        cursor.close()

@app.route('/api/account/set-pin', methods=['POST'])
@jwt_required()
def set_account_pin():
    """Set or Update Account PIN."""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    account_id = data.get('account_id')
    pin = data.get('pin')
    
    if not account_id or not pin:
        return jsonify({"success": False, "error": "Missing account_id or pin"}), 400
        
    if len(pin) < 4 or len(pin) > 6 or not pin.isdigit():
         return jsonify({"success": False, "error": "PIN must be 4-6 digits"}), 400
         
    cursor = get_db_cursor()
    conn = mysql.connection
    
    try:
        cursor.execute("SELECT user_id FROM accounts WHERE account_id = %s", (account_id,))
        account = cursor.fetchone()
        
        if not account or account['user_id'] != current_user:
            return jsonify({"success": False, "error": "Account not found or unauthorized"}), 404
            
        hashed_pin = generate_password_hash(pin)
        
        cursor.execute("UPDATE accounts SET pin_hash = %s WHERE account_id = %s", (hashed_pin, account_id))
        conn.commit()
        
        return jsonify({"success": True, "message": "PIN updated successfully"}), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Set PIN error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to set PIN"}), 500
    finally:
        cursor.close()

@app.route('/api/account/delete', methods=['POST'])
@jwt_required()
def delete_account():
    """Delete Account."""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    account_id = data.get('account_id')
    
    if not account_id:
        return jsonify({"success": False, "error": "Missing account_id"}), 400
        
    cursor = get_db_cursor()
    conn = mysql.connection
    
    try:
        cursor.execute("SELECT user_id FROM accounts WHERE account_id = %s", (account_id,))
        account = cursor.fetchone()
        
        if not account or account['user_id'] != current_user:
            return jsonify({"success": False, "error": "Account not found or unauthorized"}), 404
            
        cursor.execute("DELETE FROM accounts WHERE account_id = %s", (account_id,))
        conn.commit()
        
        return jsonify({"success": True, "message": "Account deleted successfully"}), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Delete account error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to delete account"}), 500
    finally:
        cursor.close()
