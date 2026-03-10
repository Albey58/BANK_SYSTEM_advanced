
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
