document.getElementById('searchInput').addEventListener('input', showSuggestions);
document.getElementById('searchButton').addEventListener('click', (e) => {
    e.preventDefault();

    // Clear existing options first
    document.getElementById('account').innerHTML = '<option value="all">All</option>';
    document.getElementById('category').innerHTML = '<option value="all">All</option>';

    let searchResults = performSearch();

    // Show the filter options after performing the search
    if (searchResults.length > 0) {
        document.querySelector('.filter-wrapper').style.display = 'flex';
        populateFilterOptions(searchResults);
    }
});

document.getElementById('period').addEventListener('change', toggleCustomPeriod);
document.getElementById('account').addEventListener('change', performSearch);
document.getElementById('category').addEventListener('change', performSearch);
document.getElementById('incomeExpense').addEventListener('change', performSearch);

document.getElementById('custom-start').addEventListener('change', () => {
    if (document.getElementById('custom-start').value && document.getElementById('custom-end').value) {
        performSearch();
    }
});
document.getElementById('custom-end').addEventListener('change', () => {
    if (document.getElementById('custom-start').value && document.getElementById('custom-end').value) {
        performSearch();
    }
});

function toggleCustomPeriod() {
    const period = document.getElementById('period').value;
    const customStart = document.getElementById('custom-start');
    const customEnd = document.getElementById('custom-end');
    if (period === 'custom') {
        customStart.style.display = 'inline';
        customEnd.style.display = 'inline';
    } else {
        customStart.style.display = 'none';
        customEnd.style.display = 'none';
        // performSearch();
    }
}

function showSuggestions() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';

    if (searchInput.length === 0) {
        return;
    }

    const notesSet = new Set();
    const regex = /^[a-zA-Z\s]+$/; // Only letters and spaces

    masterExpenses.forEach(expense => {
        if (regex.test(expense.Note) && expense.Note.toLowerCase().includes(searchInput)) {
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
            document.getElementById('searchInput').value = suggestion;
            performSearch();
            listItem.innerHTML = '';
        });
        suggestionsList.appendChild(listItem);
    });
    suggestionsDiv.appendChild(suggestionsList);
}

function performSearch() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const period = document.getElementById('period').value;
    const account = document.getElementById('account').value;
    const category = document.getElementById('category').value;
    const incomeExpense = document.getElementById('incomeExpense').value;
    const customStart = document.getElementById('custom-start').value;
    const customEnd = document.getElementById('custom-end').value;

    let searchResults = masterExpenses.filter(expense => {
        const description = expense.Description.toLowerCase();
        const note = expense.Note.toLowerCase();
        return description.includes(searchInput) || note.includes(searchInput);
    });

    if (period !== 'all') {
        const currentDate = new Date();
        searchResults = searchResults.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            if (period === 'weekly') {
                const oneWeekAgo = new Date(currentDate.setDate(currentDate.getDate() - 7));
                return expenseDate >= oneWeekAgo;
            } else if (period === 'monthly') {
                const oneMonthAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
                return expenseDate >= oneMonthAgo;
            } else if (period === 'annually') {
                const oneYearAgo = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
                return expenseDate >= oneYearAgo;
            } else if (period === 'custom' && customStart && customEnd) {
                return expenseDate >= new Date(customStart) && expenseDate <= new Date(customEnd);
            }
        });
    }

    if (account !== 'all') {
        searchResults = searchResults.filter(expense => expense.Account === account);
    }

    if (category !== 'all') {
        searchResults = searchResults.filter(expense => expense.Category === category);
    }

    if (incomeExpense !== 'all') {
        searchResults = searchResults.filter(expense => expense["Income/Expense"] === incomeExpense);
    }

    displaySearchResults(searchResults);

    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';

    return searchResults;
}

function displaySearchResults(results) {
    // clear previous results
    if (document.getElementById('selected-total')) {
        document.getElementById('selected-total').textContent = '';
    }

    // clear previous results
    document.getElementById('total-income').textContent = `Income: 0.00`;
    document.getElementById('total-expenses').textContent = `Expenses: 0.00`;
    document.getElementById('total-transfers').textContent = `Transfer: 0.00`;

    const searchResultsDiv = document.getElementById('searchResults');
    searchResultsDiv.innerHTML = ''; // Clear previous results

    if (results.length === 0) {
        searchResultsDiv.textContent = 'No matching results found.';
        return;
    }

    const table = document.createElement('table');
    const headerRow = table.insertRow();
    ['Select', 'Date', 'Amount', 'Note', 'Description'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.classList.add(headerText.toLowerCase());
        headerRow.appendChild(th);
    });

    let totalIncome = results.filter(expense => expense["Income/Expense"] === "Income")
        .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);
    let totalExpenses = results.filter(expense => expense["Income/Expense"] === "Expense")
        .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);
    let totalTransfer = results.filter(expense => expense["Income/Expense"] === "Transfer-Out")
        .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);

    document.getElementById('total-income').textContent = `Income: ${totalIncome}`;
    document.getElementById('total-expenses').textContent = `Expenses: ${totalExpenses}`;
    document.getElementById('total-transfers').textContent = `Transfer: ${totalTransfer}`;

    results.forEach(result => {
        const row = table.insertRow();

        // Add a checkbox for each row
        const selectCell = row.insertCell();
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'select-checkbox';
        checkbox.addEventListener('change', updateSelectedTotal);
        selectCell.appendChild(checkbox);

        const rowCell = row.insertCell();
        const dateElement = document.createElement('p');
        dateElement.textContent = new Date(convertDateFormat(result.Date)).toDateString();
        dateElement.classList.add('date');
        const accountCategoryElement = document.createElement('p');
        accountCategoryElement.classList.add('account-category');
        accountCategoryElement.textContent = `${result.Account} - ${result.Category}`;
        rowCell.appendChild(dateElement);
        rowCell.appendChild(accountCategoryElement);


        const amountCell = row.insertCell();
        amountCell.textContent = result.INR;
        const type = result['Income/Expense'] === 'Expense' ? 'expense' : result['Income/Expense'] === 'Income' ? 'income' : 'transfer-out';
        amountCell.classList.add('amount', type);
        const noteCell = row.insertCell();
        noteCell.textContent = result.Note;
        noteCell.classList.add('note');
        const descriptionCell = row.insertCell();
        descriptionCell.textContent = result.Description;
        descriptionCell.classList.add('description');
    });

    searchResultsDiv.appendChild(table);
}

function updateSelectedTotal() {
    const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
    let selectedTotal = 0;
    selectedCheckboxes.forEach(checkbox => {
        const amountCell = checkbox.closest('tr').querySelector('.amount');
        if(amountCell.classList.contains('expense')) {
            selectedTotal -= parseFloat(amountCell.textContent);
        }
        if(amountCell.classList.contains('income')) {
            selectedTotal += parseFloat(amountCell.textContent);
        }
    });
    document.getElementById('selected-total').textContent = `Selected Total: ${selectedTotal.toFixed(2)}`;
}

function populateFilterOptions(searchResults) {
    const accountSet = new Set();
    const categorySet = new Set();

    searchResults.forEach(expense => {
        accountSet.add(expense.Account);
        categorySet.add(expense.Category);
    });

    const accountSelect = document.getElementById('account');
    const categorySelect = document.getElementById('category');

    // Clear existing options first
    accountSelect.innerHTML = '<option value="all">All</option>';
    categorySelect.innerHTML = '<option value="all">All</option>';

    accountSet.forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        accountSelect.appendChild(option);
    });

    categorySet.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}
