document.addEventListener('DOMContentLoaded', async function () {
    const masterExpenses = await utility.initializeMasterData();

    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const typeOptions = document.getElementById('type-options');
    const dateField = document.getElementById('date');
    const nonTransferFields = document.getElementById('non-transfer-fields');
    const transferFields = document.getElementById('transfer-fields');
    const accountBtn = document.getElementById('account-btn');
    const categoryBtn = document.getElementById('category-btn');
    const subcategoryBtn = document.getElementById('subcategory-btn');
    const fromAccountBtn = document.getElementById('from-account-btn');
    const toAccountBtn = document.getElementById('to-account-btn');
    const accountGrid = document.getElementById('account-grid');
    const categoryGrid = document.getElementById('category-grid');
    const subcategoryGrid = document.getElementById('subcategory-grid');
    const fromAccountGrid = document.getElementById('from-account-grid');
    const noteElement = document.getElementById('note');
    const toAccountGrid = document.getElementById('to-account-grid');
    const cancelBtn = document.querySelector('.cancel-btn');
    const suggestionsDiv = document.getElementById('suggestions');

    dateField.value = new Date().toISOString().substring(0, 10);

    let accounts = [];
    let categories = [];
    let subcategories = [];

    function resetTransactionForm() {
        document.querySelectorAll('.type-option').forEach(option => option.classList.remove('active'));
        typeOptions.querySelector('.type-option[data-value="Expense"]').classList.add('active');
        accountBtn.textContent = '';
        categoryBtn.textContent = '';
        subcategoryBtn.textContent = '';
        fromAccountBtn.textContent = '';
        toAccountBtn.textContent = '';
        dateField.value = new Date().toISOString().substring(0, 10);
        noteElement.value = '';
        suggestionsDiv.innerHTML = '';
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
    }

    function toggleGrid(grid) {
        hideAllGrids();
        grid.classList.toggle('active');
    }

    function hideAllGrids() {
        document.querySelectorAll('.grid').forEach(grid => grid.classList.remove('active'));
    }

    function populateDropdowns() {
        const type = document.querySelector('.type-option.active').dataset.value;

        accountGrid.innerHTML = createGridHeader('Account');
        fromAccountGrid.innerHTML = createGridHeader('From Account');
        toAccountGrid.innerHTML = createGridHeader('To Account');
        categoryGrid.innerHTML = createGridHeader('Category');
        subcategoryGrid.innerHTML = '';

        accounts.forEach(account => {
            appendGridSpan(accountGrid, account);
            appendGridSpan(fromAccountGrid, account);
            appendGridSpan(toAccountGrid, account);
        });

        const filteredCategories = categories.filter(category =>
            masterExpenses.some(expense => expense.Category === category && expense['Income/Expense'] === type)
        );

        filteredCategories.forEach(category => appendGridSpan(categoryGrid, category));
        populateSubcategories();
    }

    function populateSubcategories() {
        const selectedCategory = categoryBtn.textContent;
        subcategories = getSubcategories(selectedCategory);

        subcategoryGrid.innerHTML = '';
        if (subcategories.length > 0) {
            subcategoryGrid.innerHTML = createGridHeader('Subcategories');
            subcategories.forEach(subcategory => appendGridSpan(subcategoryGrid, subcategory));
            document.getElementById('subcategory-row').style.display = 'flex';
        } else {
            document.getElementById('subcategory-row').style.display = 'none';
            document.getElementById('amount').focus(); // Automatically focus on the amount field if no subcategories
        }
    }

    function createGridHeader(label) {
        const header = document.createElement('div');
        header.className = 'grid-header';
        header.textContent = label;
        return header.outerHTML;
    }

    function appendGridSpan(grid, text) {
        const span = document.createElement('span');
        span.textContent = text;
        grid.appendChild(span);
    }

    function getAccountsOrCategories(data, key) {
        return [...new Set(data.map(item => item[key]))];
    }

    function getSubcategories(category) {
        return [...new Set(masterExpenses.filter(expense => expense.Category === category && expense.Subcategory).map(expense => expense.Subcategory))];
    }

    addTransactionBtn.addEventListener('click', () => {
        resetTransactionForm();
        populateDropdowns();
        transactionModal.style.display = 'block';
        document.querySelector('.type-option[data-value="Expense"]').classList.add('active');
        toggleGrid(accountGrid);
    });

    cancelBtn.addEventListener('click', () => transactionModal.style.display = 'none');
    window.addEventListener('click', event => { if (event.target === transactionModal) transactionModal.style.display = 'none'; });

    typeOptions.addEventListener('click', event => {
        if (event.target.classList.contains('type-option')) {
            document.querySelectorAll('.type-option').forEach(option => option.classList.remove('active'));
            event.target.classList.add('active');
            const isTransfer = event.target.dataset.value === 'Transfer';
            nonTransferFields.style.display = isTransfer ? 'none' : 'block';
            transferFields.style.display = isTransfer ? 'block' : 'none';
            if (isTransfer) {
                fromAccountBtn.textContent = accountBtn.textContent;
                toAccountBtn.textContent = '';
                toggleGrid(fromAccountGrid);
            } else {
                categoryBtn.textContent = '';
                subcategoryBtn.textContent = '';
                document.getElementById('subcategory-row').style.display = 'none';
                toggleGrid(accountGrid);
                populateDropdowns();
            }
        }
    });

    dateField.addEventListener('change', () => {
        accountBtn.focus();
        toggleGrid(accountGrid);
    });

    const gridButtons = [
        { button: accountBtn, grid: accountGrid, nextFocus: categoryBtn, nextGrid: categoryGrid },
        { button: categoryBtn, grid: categoryGrid, nextFocus: subcategoryBtn, nextGrid: subcategoryGrid },
        { button: subcategoryBtn, grid: subcategoryGrid, nextFocus: document.getElementById('amount') },
        { button: fromAccountBtn, grid: fromAccountGrid, nextFocus: toAccountBtn, nextGrid: toAccountGrid },
        { button: toAccountBtn, grid: toAccountGrid, nextFocus: document.getElementById('amount') }
    ];

    gridButtons.forEach(({ button, grid, nextFocus, nextGrid }) => {
        button.addEventListener('click', () => toggleGrid(grid));
        grid.addEventListener('click', event => {
            if (event.target.tagName === 'SPAN') {
                button.textContent = event.target.textContent;
                grid.classList.remove('active');
                if (nextFocus) {
                    nextFocus.focus();
                    if (nextGrid && button !== subcategoryBtn) {
                        toggleGrid(nextGrid);
                    } else if (button === subcategoryBtn && document.getElementById('subcategory-row').style.display === 'none') {
                        document.getElementById('amount').focus();
                    }
                }
                if (button === categoryBtn) {
                    populateSubcategories();
                }
            }
        });
    });

    ['amount', 'note', 'description'].forEach(id => document.getElementById(id).addEventListener('focus', hideAllGrids));

    noteElement.addEventListener('input', showSuggestions);

    // hide suggestions list when focus out
    document.addEventListener('click', function(event) {
        if (!noteElement.contains(event.target) && !suggestionsDiv.contains(event.target)) {
            suggestionsDiv.innerHTML = '';
        }
    });

    transactionForm.addEventListener('submit', event => {
        event.preventDefault();

        const type = document.querySelector('.type-option.active').dataset.value;
        const date = dateField.value;
        const account = document.getElementById(type === 'Transfer' ? 'from-account-btn' : 'account-btn').textContent;
        const category = type === 'Transfer' ? document.getElementById('to-account-btn').textContent : categoryBtn.textContent;
        const subcategory = type === 'Transfer' ? '' : subcategoryBtn.textContent;
        const note = noteElement.value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;

        if (!date || !account || (type !== 'Transfer' && !category) || (type === 'Transfer' && !category) || !amount) {
            alert('Please fill all mandatory fields.');
            return;
        }

        const newTransaction = {
            Date: formatDateInput(date),
            Account: account,
            Category: category,
            Subcategory: subcategory,
            Note: note,
            INR: amount,
            'Income/Expense': type,
            Description: description,
            Amount: amount,
            Currency: 'INR',
            ID: masterExpenses.length
        };

        masterExpenses.push(newTransaction);
        localStorage.setItem('masterExpenses', JSON.stringify(masterExpenses));
        fetchTransactionsFromLocalStorage();
        transactionModal.style.display = 'none';

        // Add the transaction and update the UI
        if (window.addTransaction) {
            window.addTransaction(newTransaction);
        }
    });

    function fetchTransactionsFromLocalStorage() {
        const storedData = JSON.parse(localStorage.getItem('masterExpenses')) || [];
        masterExpenses.length = 0; // Clear the array
        masterExpenses.push(...storedData);
    }

    function fetchDropdowns() {
        accounts = getAccountsOrCategories(masterExpenses, 'Account');
        categories = getAccountsOrCategories(masterExpenses, 'Category');
        populateDropdowns();
    }

    fetchTransactionsFromLocalStorage();
    fetchDropdowns();

    function showSuggestions() {
        const noteInput = noteElement.value.toLowerCase();
        suggestionsDiv.innerHTML = '';

        if (noteInput.length === 0) {
            return;
        }

        const notesSet = new Set();
        const regex = /^[a-zA-Z\s]+$/; // Only letters and spaces

        masterExpenses.forEach(expense => {
            if (regex.test(expense.Note) && expense.Note.toLowerCase().includes(noteInput)) {
                notesSet.add(expense.Note);
            }
        });

        const suggestions = Array.from(notesSet); // Array.from(notesSet).slice(0, 10) Limit to n suggestions
        const suggestionsList = document.createElement('ul');

        suggestions.forEach(suggestion => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion;
            listItem.className = 'suggestion-item';

            listItem.addEventListener('click', () => {
                noteElement.value = suggestion;
                suggestionsDiv.innerHTML = '';
            });
            suggestionsList.appendChild(listItem);
        });
        suggestionsDiv.appendChild(suggestionsList);
    }

    function formatDateInput(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
});
