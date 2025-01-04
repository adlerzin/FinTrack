import hashlib
from datetime import datetime
from database import Database

class User:
    def __init__(self, db):
        self.db = db

    def create_user(self, username, password):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        try:
            cursor.execute(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                (username, hashed_password)
            )
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    def verify_user(self, username, password):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute(
            'SELECT id FROM users WHERE username = ? AND password = ?',
            (username, hashed_password)
        )
        
        user = cursor.fetchone()
        conn.close()
        
        return user[0] if user else None

class Transaction:
    def __init__(self, db):
        self.db = db

    def add_transaction(self, user_id, category_id, amount, description, type, receipt_path=None):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO transactions (user_id, category_id, amount, description, type, receipt_path)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, category_id, amount, description, type, receipt_path))
        
        conn.commit()
        conn.close()

    def get_transactions(self, user_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT 
                    t.id,
                    t.amount,
                    t.description,
                    t.date,
                    t.type,
                    c.name as category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = ?
                ORDER BY t.date DESC
            ''', (user_id,))
            
            # Converter para lista de dicionários
            columns = [column[0] for column in cursor.description]
            transactions = []
            for row in cursor.fetchall():
                transactions.append(dict(zip(columns, row)))
                
            return transactions
        except Exception as e:
            print(f"Erro ao buscar transações: {e}")
            return []
        finally:
            conn.close() 

    def update_transaction(self, transaction_id, user_id, category_id, amount, description, type):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE transactions 
                SET category_id = ?, amount = ?, description = ?, type = ?
                WHERE id = ? AND user_id = ?
            ''', (category_id, amount, description, type, transaction_id, user_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao atualizar transação: {e}")
            return False
        finally:
            conn.close() 

    def delete_transaction(self, transaction_id, user_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                DELETE FROM transactions 
                WHERE id = ? AND user_id = ?
            ''', (transaction_id, user_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao excluir transação: {e}")
            return False
        finally:
            conn.close() 

class FinancialGoal:
    def __init__(self, db):
        self.db = db

    def add_goal(self, user_id, title, target_amount, deadline, category_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO financial_goals (user_id, title, target_amount, deadline, category_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, title, target_amount, deadline, category_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao adicionar meta: {e}")
            return False
        finally:
            conn.close()

    def get_goals(self, user_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT 
                    g.*,
                    c.name as category_name,
                    g.current_amount as saved_amount
                FROM financial_goals g
                LEFT JOIN categories c ON g.category_id = c.id
                WHERE g.user_id = ?
                ORDER BY g.deadline ASC
            ''', (user_id,))
            
            columns = [column[0] for column in cursor.description]
            goals = []
            for row in cursor.fetchall():
                goals.append(dict(zip(columns, row)))
            
            return goals
        except Exception as e:
            print(f"Erro ao buscar metas: {e}")
            return []
        finally:
            conn.close()

    def update_goal(self, goal_id, user_id, title, target_amount, deadline, category_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE financial_goals 
                SET title = ?, target_amount = ?, deadline = ?, category_id = ?
                WHERE id = ? AND user_id = ?
            ''', (title, target_amount, deadline, category_id, goal_id, user_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao atualizar meta: {e}")
            return False
        finally:
            conn.close()

    def delete_goal(self, goal_id, user_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                DELETE FROM financial_goals 
                WHERE id = ? AND user_id = ?
            ''', (goal_id, user_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao excluir meta: {e}")
            return False
        finally:
            conn.close() 

    def add_to_goal(self, goal_id, user_id, amount):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            # Iniciar transação
            cursor.execute('BEGIN TRANSACTION')
            
            # Buscar informações da meta
            cursor.execute('''
                SELECT g.title, g.category_id 
                FROM financial_goals g 
                WHERE g.id = ? AND g.user_id = ?
            ''', (goal_id, user_id))
            
            goal_info = cursor.fetchone()
            if not goal_info:
                raise Exception("Meta não encontrada")
            
            goal_title, category_id = goal_info
            
            # Adicionar transação negativa (saída do saldo)
            cursor.execute('''
                INSERT INTO transactions (user_id, category_id, amount, type, description)
                VALUES (?, ?, ?, 'expense', ?)
            ''', (user_id, category_id, amount, f"Valor adicionado à meta: {goal_title}"))
            
            # Atualizar valor atual da meta
            cursor.execute('''
                UPDATE financial_goals 
                SET current_amount = current_amount + ?
                WHERE id = ? AND user_id = ?
            ''', (amount, goal_id, user_id))
            
            # Confirmar transação
            cursor.execute('COMMIT')
            return True
        except Exception as e:
            cursor.execute('ROLLBACK')
            print(f"Erro ao adicionar valor à meta: {e}")
            return False
        finally:
            conn.close() 

class Category:
    def __init__(self, db):
        self.db = db

    def get_categories(self):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM categories ORDER BY type, name')
            
            columns = [column[0] for column in cursor.description]
            categories = []
            for row in cursor.fetchall():
                categories.append(dict(zip(columns, row)))
            
            return categories
        except Exception as e:
            print(f"Erro ao buscar categorias: {e}")
            return []
        finally:
            conn.close()

    def add_category(self, name, type):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO categories (name, type)
                VALUES (?, ?)
            ''', (name, type))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao adicionar categoria: {e}")
            return False
        finally:
            conn.close()

    def update_category(self, category_id, name, type):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE categories 
                SET name = ?, type = ?
                WHERE id = ?
            ''', (name, type, category_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao atualizar categoria: {e}")
            return False
        finally:
            conn.close()

    def delete_category(self, category_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar se a categoria está em uso
            cursor.execute('''
                SELECT COUNT(*) FROM transactions 
                WHERE category_id = ?
            ''', (category_id,))
            
            if cursor.fetchone()[0] > 0:
                raise Exception("Categoria em uso, não pode ser excluída")
            
            cursor.execute('DELETE FROM categories WHERE id = ?', (category_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"Erro ao excluir categoria: {e}")
            return False
        finally:
            conn.close() 