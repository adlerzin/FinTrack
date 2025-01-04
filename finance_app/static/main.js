// Verificar se estamos na página de login ou dashboard
const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/index.html';

if (isLoginPage) {
    // Código para a página de login
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerFormElement');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.parentElement.style.display = 'none';
        registerForm.parentElement.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.parentElement.style.display = 'block';
        registerForm.parentElement.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user_id', data.user_id);
                window.location.href = '/dashboard';
            } else {
                alert('Usuário ou senha inválidos');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao fazer login');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                alert('Registro realizado com sucesso!');
                showLoginLink.click();
            } else {
                alert('Erro ao registrar usuário');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao registrar usuário');
        }
    });
} else {
    // Código para a dashboard
    let pieChart, barChart;

    // Verificar autenticação
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = '/';
    }

    // Inicializar gráficos
    function initCharts() {
        const pieCtx = document.getElementById('expensePieChart').getContext('2d');
        const barCtx = document.getElementById('monthlyBarChart').getContext('2d');

        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribuição de Despesas'
                    }
                }
            }
        });

        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Receitas',
                    data: [],
                    backgroundColor: '#36A2EB'
                }, {
                    label: 'Despesas',
                    data: [],
                    backgroundColor: '#FF6384'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Receitas e Despesas por Mês'
                    }
                }
            }
        });
    }

    // Função para atualizar gráficos
    function updateCharts(transactions) {
        // Dados para o gráfico de pizza (despesas por categoria)
        const expensesByCategory = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category_name] = (expensesByCategory[t.category_name] || 0) + t.amount;
            });

        pieChart.data.labels = Object.keys(expensesByCategory);
        pieChart.data.datasets[0].data = Object.values(expensesByCategory);
        pieChart.update();

        // Dados para o gráfico de barras (receitas e despesas por mês)
        const monthlyData = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0 };
            }
            
            if (t.type === 'income') {
                monthlyData[monthYear].income += t.amount;
            } else {
                monthlyData[monthYear].expense += t.amount;
            }
        });

        const months = Object.keys(monthlyData);
        barChart.data.labels = months;
        barChart.data.datasets[0].data = months.map(m => monthlyData[m].income);
        barChart.data.datasets[1].data = months.map(m => monthlyData[m].expense);
        barChart.update();
    }

    // Função para carregar categorias
    async function loadCategories(selectElement = null, selectedType = null) {
        // Usar o select fornecido ou buscar o padrão
        const categorySelect = selectElement || document.getElementById('category');
        const typeSelect = selectedType || document.getElementById('type').value;
        
        // Categorias padrão
        const categories = [
            { id: 1, name: 'Salário', type: 'income' },
            { id: 2, name: 'Investimentos', type: 'income' },
            { id: 3, name: 'Freelance', type: 'income' },
            { id: 4, name: 'Bônus', type: 'income' },
            { id: 5, name: 'Rendimentos', type: 'income' },
            { id: 6, name: 'Outros', type: 'income' },
            { id: 7, name: 'Gastos', type: 'expense' },
            { id: 8, name: 'Gastos Fixos', type: 'expense' },
            { id: 9, name: 'Gastos Variáveis', type: 'expense' },
            { id: 10, name: 'Gastos Recorrentes', type: 'expense' },
            { id: 11, name: 'Gastos Emergenciais', type: 'expense' },
            { id: 12, name: 'Gastos de Viagem', type: 'expense' },
            { id: 13, name: 'Gastos de Saúde', type: 'expense' },
            { id: 14, name: 'Gastos de Educação', type: 'expense' },
            { id: 15, name: 'Gastos de Lazer', type: 'expense' },
            { id: 16, name: 'Gastos de Presentes', type: 'expense' },
        ];

        // Limpar select
        categorySelect.innerHTML = '';

        // Filtrar categorias pelo tipo selecionado
        const filteredCategories = categories.filter(cat => cat.type === typeSelect);
        
        // Adicionar opções
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    // Função para filtrar e ordenar transações
    function filterAndSortTransactions(transactions) {
        const periodFilter = document.getElementById('periodFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const valueOperator = document.getElementById('valueOperator').value;
        const valueFilter = parseFloat(document.getElementById('valueFilter').value);
        const sortBy = document.getElementById('sortBy').value;

        // Aplicar filtros
        let filtered = transactions.filter(transaction => {
            let passesFilters = true;

            // Filtro de período
            if (periodFilter !== 'all') {
                const transactionDate = new Date(transaction.date);
                const today = new Date();
                const diffDays = (today - transactionDate) / (1000 * 60 * 60 * 24);

                switch (periodFilter) {
                    case 'day':
                        passesFilters = diffDays < 1;
                        break;
                    case 'week':
                        passesFilters = diffDays < 7;
                        break;
                    case 'month':
                        passesFilters = diffDays < 30;
                        break;
                    case 'year':
                        passesFilters = diffDays < 365;
                        break;
                }
            }

            // Filtro de categoria
            if (categoryFilter !== 'all' && passesFilters) {
                passesFilters = transaction.category_name === categoryFilter;
            }

            // Filtro de valor
            if (!isNaN(valueFilter) && passesFilters) {
                switch (valueOperator) {
                    case 'greater':
                        passesFilters = transaction.amount > valueFilter;
                        break;
                    case 'less':
                        passesFilters = transaction.amount < valueFilter;
                        break;
                    case 'equal':
                        passesFilters = Math.abs(transaction.amount - valueFilter) < 0.01;
                        break;
                }
            }

            return passesFilters;
        });

        // Aplicar ordenação
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'category':
                    return a.category_name.localeCompare(b.category_name);
                default:
                    return 0;
            }
        });

        return filtered;
    }

    // Atualizar dados
    async function updateDashboard() {
        try {
            const response = await fetch(`/api/transactions?user_id=${userId}`);
            if (!response.ok) throw new Error('Erro ao carregar transações');
            
            const data = await response.json();
            
            // Aplicar filtros e ordenação
            const filteredData = filterAndSortTransactions(data);
            
            // Atualizar sumário com dados não filtrados
            updateSummary(data);
            
            // Atualizar gráficos com dados não filtrados
            updateCharts(data);
            
            // Atualizar tabela com dados filtrados
            updateTransactionsTable(filteredData);
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        }
    }

    // Função para atualizar sumário
    function updateSummary(transactions) {
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpenses += transaction.amount;
            }
        });

        document.getElementById('totalIncome').textContent = `R$ ${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `R$ ${totalExpenses.toFixed(2)}`;
        document.getElementById('balance').textContent = `R$ ${(totalIncome - totalExpenses).toFixed(2)}`;
    }

    // Função para atualizar tabela
    function updateTransactionsTable(transactions) {
        const tbody = document.querySelector('#transactionsTable tbody');
        tbody.innerHTML = '';

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category_name}</td>
                <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
                    R$ ${transaction.amount.toFixed(2)}
                </td>
                <td>
                    ${transaction.receipt_path ? 
                        `<a href="/api/receipts?path=${transaction.receipt_path}" 
                            target="_blank" class="receipt-link">📎</a>` : 
                        ''}
                    <button class="edit-btn" data-id="${transaction.id}">
                        ✏️ Editar
                    </button>
                </td>
            `;
            tbody.appendChild(row);

            // Adicionar evento de clique no botão de editar
            const editBtn = row.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => openEditModal(transaction));
        });
    }

    // Funções para gerenciar o modal de edição
    function openEditModal(transaction) {
        const modal = document.getElementById('editModal');
        const editType = document.getElementById('editType');
        const editCategory = document.getElementById('editCategory');
        const editAmount = document.getElementById('editAmount');
        const editDescription = document.getElementById('editDescription');
        const editTransactionId = document.getElementById('editTransactionId');

        // Preencher o formulário com os dados atuais
        editType.value = transaction.type;
        editAmount.value = transaction.amount;
        editDescription.value = transaction.description;
        editTransactionId.value = transaction.id;

        // Carregar categorias e selecionar a atual
        loadCategories(editCategory, transaction.type);
        setTimeout(() => {
            editCategory.value = transaction.category_id;
        }, 100);

        // Mostrar modal
        modal.style.display = 'block';
    }

    // Função para gerenciar o tema
    function initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        
        // Verificar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(themeIcon, savedTheme);
        
        // Adicionar evento de toggle
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(themeIcon, newTheme);
            
            // Atualizar gráficos com novas cores
            if (pieChart && barChart) {
                updateChartsTheme(newTheme);
            }
        });
    }

    // Função para atualizar o ícone do tema
    function updateThemeIcon(iconElement, theme) {
        iconElement.textContent = theme === 'light' ? '🌞' : '🌙';
    }

    // Função para atualizar cores dos gráficos
    function updateChartsTheme(theme) {
        const gridColor = theme === 'light' ? '#ddd' : '#404040';
        const textColor = theme === 'light' ? '#2c3e50' : '#ffffff';
        
        // Atualizar configurações dos gráficos
        const chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    color: textColor
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                }
            }
        };
        
        // Aplicar configurações aos gráficos
        barChart.options = {...barChart.options, ...chartOptions};
        pieChart.options.plugins = chartOptions.plugins;
        
        // Atualizar gráficos
        barChart.update();
        pieChart.update();
    }

    // Funções para gerenciar metas
    async function loadGoals() {
        try {
            const response = await fetch(`/api/goals?user_id=${userId}`);
            if (!response.ok) throw new Error('Erro ao carregar metas');
            
            const goals = await response.json();
            updateGoalsDisplay(goals);
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    function updateGoalsDisplay(goals) {
        const container = document.getElementById('goalsContainer');
        container.innerHTML = '';

        goals.forEach(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const deadline = new Date(goal.deadline).toLocaleDateString();
            
            // Determinar a classe de progresso
            let progressClass = 'high';
            if (progress < 33) {
                progressClass = 'low';
            } else if (progress < 66) {
                progressClass = 'medium';
            }
            
            const card = document.createElement('div');
            card.className = 'goal-card';
            card.innerHTML = `
                <h3>${goal.title}</h3>
                <button class="edit-goal-btn">✏️</button>
                <div class="goal-info">
                    <span>Meta: R$ ${goal.target_amount.toFixed(2)}</span>
                    <span>Atual: R$ ${goal.current_amount.toFixed(2)}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar ${progressClass}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="goal-info">
                    <span class="goal-deadline">Prazo: ${deadline}</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>
                <button class="add-to-goal-btn">Adicionar Valor</button>
            `;
            
            container.appendChild(card);

            // Event listeners
            const editBtn = card.querySelector('.edit-goal-btn');
            editBtn.addEventListener('click', () => openGoalModal(goal));

            const addToGoalBtn = card.querySelector('.add-to-goal-btn');
            addToGoalBtn.addEventListener('click', () => openAddToGoalModal(goal));
        });
    }

    function openGoalModal(goal = null) {
        const modal = document.getElementById('goalModal');
        const form = document.getElementById('goalForm');
        const deleteBtn = document.getElementById('deleteGoalBtn');
        const modalTitle = document.getElementById('goalModalTitle');
        const goalCategory = document.getElementById('goalCategory');

        // Carregar categorias
        loadCategories(goalCategory, 'exchange'); // Carregar todas as categorias de gasto

        if (goal) {
            modalTitle.textContent = 'Editar Meta';
            document.getElementById('goalId').value = goal.id;
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalAmount').value = goal.target_amount;
            document.getElementById('goalCategory').value = goal.category_id;
            document.getElementById('goalDeadline').value = goal.deadline;
            deleteBtn.style.display = 'block';
        } else {
            modalTitle.textContent = 'Nova Meta';
            form.reset();
            document.getElementById('goalId').value = '';
            deleteBtn.style.display = 'none';
        }

        modal.style.display = 'block';
    }

    function openAddToGoalModal(goal) {
        const modal = document.getElementById('addToGoalModal');
        const form = document.getElementById('addToGoalForm');
        
        document.getElementById('addToGoalId').value = goal.id;
        document.getElementById('addToGoalAmount').value = '';
        
        modal.style.display = 'block';
    }

    // Inicializar dashboard
    document.addEventListener('DOMContentLoaded', () => {
        initCharts();
        loadCategories();
        updateDashboard();
        initTheme(); // Adicionar inicialização do tema

        // Event listener para mudança de tipo
        document.getElementById('type').addEventListener('change', loadCategories);

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('user_id');
            window.location.href = '/';
        });

        // Formulário de nova transação
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('category_id', document.getElementById('category').value);
            formData.append('amount', document.getElementById('amount').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('type', document.getElementById('type').value);
            
            const receiptFile = document.getElementById('receipt').files[0];
            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            try {
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    e.target.reset();
                    updateDashboard();
                    alert('Transação adicionada com sucesso!');
                } else {
                    throw new Error('Erro ao adicionar transação');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao adicionar transação');
            }
        });

        // Event listeners para filtros
        const filterElements = [
            'periodFilter',
            'categoryFilter',
            'valueOperator',
            'valueFilter',
            'sortBy'
        ];

        filterElements.forEach(elementId => {
            document.getElementById(elementId).addEventListener('change', updateDashboard);
        });

        // Configurar modal de edição
        const modal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        const editForm = document.getElementById('editTransactionForm');
        const editType = document.getElementById('editType');
        const deleteBtn = document.getElementById('deleteTransactionBtn');

        // Fechar modal
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        // Event listener para mudança de tipo no formulário de edição
        editType.addEventListener('change', () => {
            loadCategories(document.getElementById('editCategory'), editType.value);
        });

        // Manipular submissão do formulário de edição
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                transaction_id: parseInt(document.getElementById('editTransactionId').value),
                user_id: parseInt(userId),
                category_id: parseInt(document.getElementById('editCategory').value),
                amount: parseFloat(document.getElementById('editAmount').value),
                description: document.getElementById('editDescription').value,
                type: document.getElementById('editType').value
            };

            try {
                const response = await fetch('/api/transactions/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    modal.style.display = 'none';
                    updateDashboard();
                    alert('Transação atualizada com sucesso!');
                } else {
                    throw new Error('Erro ao atualizar transação');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao atualizar transação');
            }
        });

        // Adicionar evento para o botão de excluir
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir esta transação?')) {
                const transactionId = document.getElementById('editTransactionId').value;
                
                try {
                    const response = await fetch('/api/transactions/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            transaction_id: parseInt(transactionId),
                            user_id: parseInt(userId)
                        })
                    });

                    if (response.ok) {
                        modal.style.display = 'none';
                        updateDashboard();
                        alert('Transação excluída com sucesso!');
                    } else {
                        throw new Error('Erro ao excluir transação');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Erro ao excluir transação');
                }
            }
        });

        // Inicializar metas
        loadGoals();
        
        // Botão de adicionar meta
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            const goalCategory = document.getElementById('goalCategory');
            loadCategories(goalCategory, 'income'); // Carregar categorias de receita
            openGoalModal();
        });

        // Modal de meta
        const goalModal = document.getElementById('goalModal');
        const goalForm = document.getElementById('goalForm');
        const deleteGoalBtn = document.getElementById('deleteGoalBtn');

        // Fechar modal
        goalModal.querySelector('.close').onclick = () => goalModal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == goalModal) {
                goalModal.style.display = 'none';
            }
        };

        // Salvar meta
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const goalId = document.getElementById('goalId').value;
            const formData = {
                user_id: parseInt(userId),
                title: document.getElementById('goalTitle').value,
                target_amount: parseFloat(document.getElementById('goalAmount').value),
                category_id: parseInt(document.getElementById('goalCategory').value),
                deadline: document.getElementById('goalDeadline').value
            };

            try {
                const url = goalId ? '/api/goals/update' : '/api/goals';
                if (goalId) {
                    formData.goal_id = parseInt(goalId);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    goalModal.style.display = 'none';
                    loadGoals();
                    alert(goalId ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!');
                } else {
                    throw new Error(goalId ? 'Erro ao atualizar meta' : 'Erro ao criar meta');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert(error.message);
            }
        });

        // Excluir meta
        deleteGoalBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir esta meta?')) {
                const goalId = document.getElementById('goalId').value;
                
                try {
                    const response = await fetch('/api/goals/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            goal_id: parseInt(goalId),
                            user_id: parseInt(userId)
                        })
                    });

                    if (response.ok) {
                        goalModal.style.display = 'none';
                        loadGoals();
                        alert('Meta excluída com sucesso!');
                    } else {
                        throw new Error('Erro ao excluir meta');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    alert(error.message);
                }
            }
        });

        // Event listener para mudança de tipo no formulário de nova transação
        document.getElementById('type').addEventListener('change', function() {
            loadCategories(document.getElementById('category'), this.value);
        });

        // Event listener para mudança de tipo no formulário de edição
        document.getElementById('editType').addEventListener('change', function() {
            loadCategories(document.getElementById('editCategory'), this.value);
        });

        // Carregar categorias iniciais baseadas no tipo selecionado
        loadCategories(document.getElementById('category'), document.getElementById('type').value);

        // Modal de adicionar valor à meta
        const addToGoalModal = document.getElementById('addToGoalModal');
        const addToGoalForm = document.getElementById('addToGoalForm');

        // Fechar modal
        addToGoalModal.querySelector('.close').onclick = () => addToGoalModal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == addToGoalModal) {
                addToGoalModal.style.display = 'none';
            }
        };

        // Adicionar valor à meta
        addToGoalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                goal_id: parseInt(document.getElementById('addToGoalId').value),
                user_id: parseInt(userId),
                amount: parseFloat(document.getElementById('addToGoalAmount').value)
            };

            try {
                const response = await fetch('/api/goals/add-amount', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    addToGoalModal.style.display = 'none';
                    updateDashboard();
                    loadGoals();
                    alert('Valor adicionado com sucesso!');
                } else {
                    throw new Error('Erro ao adicionar valor à meta');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert(error.message);
            }
        });
    });
} 