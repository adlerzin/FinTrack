Tech Stack Atualizado
Frontend

    HTML5: Para estruturar o conteúdo das páginas.
    CSS3: Para estilização e design responsivo.
    JavaScript (puro):
        Para gerenciar interatividade e chamadas assíncronas ao backend usando fetch API.
    Chart.js:
        Biblioteca leve para gráficos dinâmicos na dashboard.

Backend

    Python:
        Biblioteca http.server para criar o servidor HTTP.
        Biblioteca sqlite3 para interação direta com o banco de dados SQLite.
        Backend simples organizado em módulos para rotas, lógica e persistência.

Banco de Dados

    SQLite:
        Banco de dados leve e embutido no Python, ideal para desenvolvimento local e aplicativos simples.
        Arquivo .db único para armazenar os dados.

Funcionalidades

    Cadastro e Autenticação:
        Sistema básico de login e registro usando SQLite.
        Hash de senhas para segurança.
    Gerenciamento de Transações:
        Inserir receitas e despesas com categorias, valores e datas.
        Listar e filtrar transações.
    Dashboard:
        Gráficos:
            Gráfico de pizza: Distribuição de despesas por categoria.
            Gráfico de barras: Comparação de receitas e despesas por mês.
            Gráfico de linha: Evolução do saldo ao longo do tempo.
    Configurações:
        Alterar categorias de transações.
        Preferências de moeda e tema.

Estrutura do Projeto

finance_app/
├── server.py           # Servidor HTTP e rotas
├── database.py         # Conexão e manipulação do banco de dados
├── models.py           # Classes e lógica de negócios
├── static/             # Arquivos HTML, CSS, JS e gráficos
│   ├── index.html
│   ├── dashboard.html
│   ├── style.css
│   └── main.js
└── data/
    └── finance.db      # Arquivo do banco SQLite

Detalhamento da Interface
Dashboard

    Elementos:
        Resumo:
            Total de receitas, despesas e saldo atual.
        Gráficos:
            Pizza: Distribuição de despesas.
            Barras: Receitas e despesas mensais.
            Linha: Evolução do saldo.
        Tabela:
            Últimas transações com filtro por categoria e período.
    Estilo:
        Design limpo e responsivo.
        Tema claro/escuro ajustável.