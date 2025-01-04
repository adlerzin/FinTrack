from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse
from database import Database
from models import User, Transaction, FinancialGoal, Category
import uuid
import cgi

# Criar diretório data se não existir
if not os.path.exists('data'):
    os.makedirs('data')

db = Database()
user_model = User(db)
transaction_model = Transaction(db)
goal_model = FinancialGoal(db)
category_model = Category(db)

class FinanceHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            # Servir arquivos estáticos
            if self.path == '/':
                self.path = '/static/index.html'
            elif self.path == '/dashboard':
                self.path = '/static/dashboard.html'
            return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404)

    def handle_api_get(self):
        if self.path.startswith('/api/transactions'):
            try:
                # Pegar user_id da query string
                query = urlparse(self.path).query
                params = parse_qs(query)
                user_id = params.get('user_id', [None])[0]
                
                if user_id:
                    transactions = transaction_model.get_transactions(int(user_id))
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(transactions).encode())
                else:
                    self.send_error(400, "Missing user_id parameter")
            except Exception as e:
                print(f"Erro ao processar requisição: {e}")
                self.send_error(500, str(e))

        elif self.path.startswith('/api/goals'):
            try:
                user_id = parse_qs(urlparse(self.path).query).get('user_id', [None])[0]
                if user_id:
                    goals = goal_model.get_goals(int(user_id))
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(goals).encode())
                else:
                    self.send_error(400, "Missing user_id parameter")
            except Exception as e:
                print(f"Erro ao processar requisição: {e}")
                self.send_error(500, str(e))

        elif self.path == '/api/categories':
            try:
                categories = category_model.get_categories()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(categories).encode())
            except Exception as e:
                print(f"Erro ao buscar categorias: {e}")
                self.send_error(500, str(e))

    def handle_file_upload(self, data):
        if 'receipt' not in data:
            return None
            
        receipt = data['receipt']
        if not receipt:
            return None
            
        # Criar diretório para uploads se não existir
        upload_dir = os.path.join('data', 'receipts')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
            
        # Gerar nome único para o arquivo
        file_ext = os.path.splitext(receipt.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Salvar arquivo
        with open(filepath, 'wb') as f:
            f.write(receipt.file.read())
            
        return os.path.join('receipts', filename)

    def handle_api_post(self):
        if self.path == '/api/transactions':
            try:
                # Processar dados do formulário
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST'}
                )
                
                # Processar upload do arquivo
                receipt_path = self.handle_file_upload(form)
                
                # Adicionar transação com caminho do comprovante
                transaction_model.add_transaction(
                    user_id=int(form.getvalue('user_id')),
                    category_id=int(form.getvalue('category_id')),
                    amount=float(form.getvalue('amount')),
                    description=form.getvalue('description'),
                    type=form.getvalue('type'),
                    receipt_path=receipt_path
                )
                
                self.send_response(201)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            except Exception as e:
                print(f"Erro ao adicionar transação: {e}")
                self.send_error(400)
        else:
            # Para outras rotas, continuar processando como JSON
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Verificar se é uma requisição JSON
            if self.headers.get('Content-Type') == 'application/json':
                data = json.loads(post_data.decode('utf-8'))
            
                if self.path == '/api/login':
                    user_id = user_model.verify_user(data['username'], data['password'])
                    if user_id:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'user_id': user_id}).encode())
                    else:
                        self.send_error(401)

                elif self.path == '/api/register':
                    if user_model.create_user(data['username'], data['password']):
                        self.send_response(201)
                        self.end_headers()
                    else:
                        self.send_error(400)

                elif self.path == '/api/transactions/update':
                    try:
                        transaction_model.update_transaction(
                            transaction_id=data['transaction_id'],
                            user_id=data['user_id'],
                            category_id=data['category_id'],
                            amount=data['amount'],
                            description=data['description'],
                            type=data['type']
                        )
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao atualizar transação: {e}")
                        self.send_error(400)

                elif self.path == '/api/transactions/delete':
                    try:
                        transaction_model.delete_transaction(
                            transaction_id=data['transaction_id'],
                            user_id=data['user_id']
                        )
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao excluir transação: {e}")
                        self.send_error(400)

                elif self.path == '/api/receipts':
                    try:
                        # Servir arquivo de comprovante
                        receipt_path = parse_qs(urlparse(self.path).query).get('path', [None])[0]
                        if receipt_path:
                            full_path = os.path.join('data', receipt_path)
                            if os.path.exists(full_path):
                                self.send_response(200)
                                self.send_header('Content-type', self.guess_type(full_path))
                                self.end_headers()
                                with open(full_path, 'rb') as f:
                                    self.wfile.write(f.read())
                                return
                        self.send_error(404)
                    except Exception as e:
                        print(f"Erro ao servir comprovante: {e}")
                        self.send_error(500)

                elif self.path == '/api/goals':
                    try:
                        goal_model.add_goal(
                            user_id=data['user_id'],
                            title=data['title'],
                            target_amount=data['target_amount'],
                            deadline=data['deadline'],
                            category_id=data['category_id']
                        )
                        self.send_response(201)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao adicionar meta: {e}")
                        self.send_error(400)

                elif self.path == '/api/goals/update':
                    try:
                        goal_model.update_goal(
                            goal_id=data['goal_id'],
                            user_id=data['user_id'],
                            title=data['title'],
                            target_amount=data['target_amount'],
                            deadline=data['deadline'],
                            category_id=data['category_id']
                        )
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao atualizar meta: {e}")
                        self.send_error(400)

                elif self.path == '/api/goals/delete':
                    try:
                        goal_model.delete_goal(
                            goal_id=data['goal_id'],
                            user_id=data['user_id']
                        )
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao excluir meta: {e}")
                        self.send_error(400)

                elif self.path == '/api/goals/add-amount':
                    try:
                        goal_model.add_to_goal(
                            goal_id=data['goal_id'],
                            user_id=data['user_id'],
                            amount=data['amount']
                        )
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao adicionar valor à meta: {e}")
                        self.send_error(400)

                elif self.path == '/api/categories/add':
                    try:
                        category_model.add_category(
                            name=data['name'],
                            type=data['type']
                        )
                        self.send_response(201)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao adicionar categoria: {e}")
                        self.send_error(400)

                elif self.path == '/api/categories/update':
                    try:
                        category_model.update_category(
                            category_id=data['category_id'],
                            name=data['name'],
                            type=data['type']
                        )
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao atualizar categoria: {e}")
                        self.send_error(400)

                elif self.path == '/api/categories/delete':
                    try:
                        category_model.delete_category(data['category_id'])
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except Exception as e:
                        print(f"Erro ao excluir categoria: {e}")
                        self.send_error(400)

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, FinanceHandler)
    print(f'Servidor rodando na porta {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server() 