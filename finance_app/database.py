import sqlite3
import hashlib
from datetime import datetime

class Database:
    def __init__(self, db_file="data/finance.db"):
        self.db_file = db_file
        self.init_database()

    def get_connection(self):
        return sqlite3.connect(self.db_file)

    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Criar tabela de usuários
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Criar tabela de categorias
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL
        )
        ''')

        # Criar tabela de transações com a coluna receipt_path
        cursor.execute('''
        DROP TABLE IF EXISTS transactions
        ''')
        
        cursor.execute('''
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category_id INTEGER,
            amount REAL,
            description TEXT,
            type TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            receipt_path TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
        ''')

        # Criar tabela de metas financeiras
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS financial_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline DATE,
            category_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'in_progress',
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
        ''')

        # Inserir categorias padrão
        default_categories = [
            ('Salário', 'income'),
            ('Alimentação', 'expense'),
            ('Transporte', 'expense'),
            ('Moradia', 'expense'),
            ('Lazer', 'expense'),
            ('Investimentos', 'income'),
            ('Freelance', 'income'),
            ('Bônus', 'income'),
            ('Rendimentos', 'income'),
            ('Outros', 'income')
        ]

        cursor.executemany(
            'INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)',
            default_categories
        )

        conn.commit()
        conn.close() 