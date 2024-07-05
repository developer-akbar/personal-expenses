document.addEventListener('DOMContentLoaded', async function () {
    const masterExpenses = await utility.initializeMasterData();

    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const typeSelect = document.getElementById('type');
    const nonTransferFields = document.getElementById('non-transfer-fields');
    const transferFields = document.getElementById('transfer-fields');
    const closeBtn = transactionModal.querySelector('.close-button');
    const accountField = document.getElementById('account');
    const categoryField = document.getElementById('category');
    const subcategoryField = document.getElementById('subcategory');
    const fromAccountField = document.getElementById('from-account');
    const toAccountField = document.getElementById('to-account');
    const cancelBtn = document.querySelector('.cancel-btn');

    document.getElementById('date').value = new Date().toISOString().substring(0, 10);

    let accounts = [];
    let categories = [];
    let subcategories = [];

    addTransactionBtn.addEventListener('click', () => {
        transactionModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        transactionModal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        transactionModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === transactionModal) {
            transactionModal.style.display = 'none';
        }
    });

    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'Transfer') {
            nonTransferFields.style.display = 'none';
            transferFields.style.display = 'block';
        } else {
            nonTransferFields.style.display = 'block';
            transferFields.style.display = 'none';
        }
        populateDropdowns();
    });

    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const transactionId = document.getElementById('transaction-id');
        transactionId.value = masterExpenses.length;
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;
        const account = document.getElementById(type === 'Transfer' ? 'from-account' : 'account').value;
        const category = type === 'Transfer' ? '' : document.getElementById('category').value;
        const subcategory = type === 'Transfer' ? '' : document.getElementById('subcategory').value;
        const note = document.getElementById('note').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;

        const newTransaction = {
            Date: convertDateFormat(date),
            Account: account,
            Category: category,
            Subcategory: subcategory,
            Note: note,
            INR: amount,
            'Income/Expense': type,
            Description: description,
            Amount: amount,
            Currency: 'INR',
            Account: account,
            ID: transactionId.value
        };

        masterExpenses.push(newTransaction);
        localStorage.setItem('masterExpenses', JSON.stringify(masterExpenses));
        fetchTransactionsFromLocalStorage();

        transactionModal.style.display = 'none';
    });

    function fetchTransactionsFromLocalStorage() {
        const storedData = JSON.parse(localStorage.getItem('masterExpenses')) || [];
        masterExpenses.length = 0; // Clear the array
        masterExpenses.push(...storedData);
    }

    fetchTransactionsFromLocalStorage();

    fetchDropdowns();

    function fetchDropdowns() {
        accounts = getAccountsOrCategories(masterExpenses, 'Account');
        categories = getAccountsOrCategories(masterExpenses, 'Category');
        populateDropdowns()
    }

    function populateDropdowns() {

        accountField.innerHTML = '';
        fromAccountField.innerHTML = '';
        toAccountField.innerHTML = '';
        categoryField.innerHTML = '';
        subcategoryField.innerHTML = '';

        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            accountField.appendChild(option);

            const fromOption = option.cloneNode(true);
            fromAccountField.appendChild(fromOption);

            const toOption = option.cloneNode(true);
            toAccountField.appendChild(toOption);
        });

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryField.appendChild(option);
        });
    }

    function getAccountsOrCategories(searchResults, key) {
        const result = [];

        searchResults.forEach(item => {
            const { Subcategory, INR } = item;
            const mainKey = item[key];
            const type = item["Income/Expense"];

            if (key === 'Category' && (type !== 'Expense' && type !== 'Income')) {
                return; // Skip if the key is 'Category' and the type is neither 'Expense' nor 'Income'
            }

            if (!result.includes(mainKey)) {
                result.push(mainKey);
                // result[mainKey] = { type: '', count: 0, total: 0, subcategories: {} };
            }
        });

        return result;
    }
});