document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.getElementById('categories-container');
    const selectedCategoryContainer = document.getElementById('selected-category-container');
    const backButton = document.querySelector('.back-button');
    const categoryHeading = document.querySelector('.category-heading');
    const tabs = document.querySelectorAll('.tab-button');
    const currentPeriod = document.getElementById('current-period');
    const totalAmount = document.getElementById('total-amount');
    let currentMonthlyDate = new Date();
    let currentYearDate = new Date().getFullYear();
    let selectedCategory = null;
    let selectedSubcategory = null;
    let currentTab = 'monthly';

    function formatIndianCurrency(amount) {
        return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function setActiveTab(tabName) {
        tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
        currentTab = tabName;
        updateCategoryTotals();
    }

    function formatDate(date) {
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    }

    function updateCategoryTotals() {
        const categories = {};

        masterExpenses.forEach(expense => {
            if (expense["Income/Expense"] === "Expense") {
                const { Category, Subcategory, INR } = expense;
                const expenseDate = new Date(convertDateFormat(expense.Date));

                if (currentTab === 'monthly' && expenseDate.getMonth() === currentMonthlyDate.getMonth() && expenseDate.getFullYear() === currentMonthlyDate.getFullYear()) {
                    if (!categories[Category]) {
                        categories[Category] = { total: 0, subcategories: {} };
                    }
                    categories[Category].total += parseFloat(INR);
                    if (Subcategory) {
                        if (!categories[Category].subcategories[Subcategory]) {
                            categories[Category].subcategories[Subcategory] = 0;
                        }
                        categories[Category].subcategories[Subcategory] += parseFloat(INR);
                    }
                } else if (currentTab === 'yearly' && expenseDate.getFullYear() === currentYearDate) {
                    if (!categories[Category]) {
                        categories[Category] = { total: 0, subcategories: {} };
                    }
                    categories[Category].total += parseFloat(INR);
                    if (Subcategory) {
                        if (!categories[Category].subcategories[Subcategory]) {
                            categories[Category].subcategories[Subcategory] = 0;
                        }
                        categories[Category].subcategories[Subcategory] += parseFloat(INR);
                    }
                } else if (currentTab === 'total') {
                    if (!categories[Category]) {
                        categories[Category] = { total: 0, subcategories: {} };
                    }
                    categories[Category].total += parseFloat(INR);
                    if (Subcategory) {
                        if (!categories[Category].subcategories[Subcategory]) {
                            categories[Category].subcategories[Subcategory] = 0;
                        }
                        categories[Category].subcategories[Subcategory] += parseFloat(INR);
                    }
                }
            }
        });

        populateCategories(categories);
    }

    function populateCategories(categories) {
        categoriesContainer.innerHTML = '';

        Object.keys(categories).forEach(categoryName => {
            const category = categories[categoryName];
            const categoryElement = document.createElement('div');
            categoryElement.classList.add('category-row');
            categoryElement.innerHTML = `
                <div class="category">
                    <div class="back-button" style="display: none;">←</div>
                    <span title="categoryName">${categoryName}</span>
                    <span class="amount expense">${formatIndianCurrency(category.total)}</span>
                </div>
                <ul class="subcategory-list" style="display: none;">
                    <li class="subcategory all" data-subcategory="${categoryName}">
                        <span>All</span><span class="amount expense">${formatIndianCurrency(category.total)}</span>
                    </li>
                    ${Object.keys(category.subcategories).map(subcategoryName => `
                        <li class="subcategory" data-subcategory="${subcategoryName}">
                            <span>${subcategoryName}</span><span class="amount expense">${formatIndianCurrency(category.subcategories[subcategoryName])}</span>
                        </li>
                    `).join('')}
                </ul>
            `;

            const categoryDiv = categoryElement.querySelector('.category');
            const subcategoryList = categoryElement.querySelector('.subcategory-list');
            const backButton = categoryElement.querySelector('.back-button');

            const toggleDisplay = () => {
                const isSubcategoryListVisible = subcategoryList.style.display === 'block';
                subcategoryList.style.display = isSubcategoryListVisible ? 'none' : 'block';
                backButton.style.display = isSubcategoryListVisible ? 'none' : 'block';
                categoryElement.classList.toggle('full-width', !isSubcategoryListVisible);
                categoryDiv.style.justifyContent = !isSubcategoryListVisible ? 'flex-start' : 'space-between';

                if (!isSubcategoryListVisible) {
                    Array.from(categoriesContainer.children).forEach(child => {
                        if (child !== categoryElement) child.style.display = 'none';
                    });
                    selectedCategoryContainer.style.display = 'block';
                    selectedCategory = categoryName;
                    selectedSubcategory = null;
                    updateTransactions();
                } else {
                    Array.from(categoriesContainer.children).forEach(child => {
                        child.style.display = 'block';
                    });
                    selectedCategoryContainer.style.display = 'none';
                    document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('active'));
                }
            };

            categoryDiv.addEventListener('click', toggleDisplay);

            categoryElement.querySelectorAll('.subcategory').forEach(subcategoryElement => {
                subcategoryElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (subcategoryElement.classList.contains('all')) {
                        selectedCategory = categoryName;
                        selectedSubcategory = null;
                    } else {
                        selectedSubcategory = subcategoryElement.dataset.subcategory;
                    }
                    document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('active'));
                    subcategoryElement.classList.add('active');
                    updateTransactions();
                });
            });

            categoriesContainer.appendChild(categoryElement);
        });
    }

    function updateTransactions() {
        if (currentTab === 'monthly') {
            updateMonthlyTransactions();
        } else if (currentTab === 'yearly') {
            updateYearlyTransactions();
        } else if (currentTab === 'total') {
            updateTotalTransactions();
        }
    }

    function updateMonthlyTransactions() {
        const transactionsContainer = document.getElementById('transactions');
        transactionsContainer.innerHTML = '';

        const filteredTransactions = masterExpenses.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expense.Category === selectedCategory &&
                (!selectedSubcategory || expense.Subcategory === selectedSubcategory) &&
                expenseDate.getMonth() === currentMonthlyDate.getMonth() &&
                expenseDate.getFullYear() === currentMonthlyDate.getFullYear();
        });

        const transactionsByDay = filteredTransactions.reduce((acc, expense) => {
            const date = new Date(convertDateFormat(expense.Date)).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(expense);
            return acc;
        }, {});

        const tableElement = document.createElement('table');
        const tableBodyElement = document.createElement('tbody');

        for (const [date, transactions] of Object.entries(transactionsByDay)) {
            const dayContainer = tableElement.insertRow();
            dayContainer.className = 'transaction-day';

            const dayHeader = dayContainer.insertCell();
            dayHeader.classList.add('day-header');
            dayHeader.setAttribute('colspan', '5');

            const dayContent = document.createElement('h3');
            dayContent.classList.add('day-content');
            dayContent.textContent = date;

            const totals = calculateTotals(transactions);
            const dayTotals = document.createElement('div');
            dayTotals.classList.add('day-totals');
            dayTotals.innerHTML = `<p class="expense">${formatIndianCurrency(totals.expenses)}</p>`;
            dayContent.appendChild(dayTotals);
            dayHeader.appendChild(dayContent);
            dayContainer.appendChild(dayHeader);
            tableBodyElement.appendChild(dayContainer);

            transactions.forEach(expense => {
                const transactionRow = createTransactionRow(expense);
                tableBodyElement.appendChild(transactionRow);
            });
        }

        tableElement.appendChild(tableBodyElement);
        transactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateTotals(filteredTransactions);
        totalAmount.innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(monthlyTotals.expenses)}</p>`;
    }

    function updateYearlyTransactions() {
        const transactionsContainer = document.getElementById('transactions');
        transactionsContainer.innerHTML = '';

        const filteredTransactions = masterExpenses.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expense.Category === selectedCategory &&
                (!selectedSubcategory || expense.Subcategory === selectedSubcategory) &&
                expenseDate.getFullYear() === currentYearDate;
        });

        const transactionsByMonth = filteredTransactions.reduce((acc, expense) => {
            const month = new Date(convertDateFormat(expense.Date)).getMonth();
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(expense);
            return acc;
        }, {});

        const tableElement = document.createElement('table');
        const tableBodyElement = document.createElement('tbody');

        for (let i = 0; i < 12; i++) {
            const monthContainer = document.createElement('tr');
            monthContainer.className = 'transaction-row';
            monthContainer.dataset.month = i;

            const monthName = document.createElement('td');
            monthName.textContent = new Date(2024, i).toLocaleString('default', { month: 'short' });

            const totals = transactionsByMonth[i] ? calculateTotals(transactionsByMonth[i]) : { income: 0, expenses: 0 };
            const income = document.createElement('td');
            income.className = 'amount income';
            income.textContent = formatIndianCurrency(totals.income);
            const expenses = document.createElement('td');
            expenses.className = 'amount expense';
            expenses.textContent = formatIndianCurrency(totals.expenses);
            const balance = document.createElement('td');
            balance.className = 'amount balance';
            balance.textContent = formatIndianCurrency(totals.income - totals.expenses);

            monthContainer.appendChild(monthName);
            monthContainer.appendChild(income);
            monthContainer.appendChild(expenses);
            monthContainer.appendChild(balance);

            tableBodyElement.appendChild(monthContainer);
        }

        tableElement.appendChild(tableBodyElement);
        transactionsContainer.appendChild(tableElement);

        const yearlyTotals = calculateTotals(filteredTransactions);
        totalAmount.innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(yearlyTotals.expenses)}</p>`;
    }

    function updateTotalTransactions() {
        const transactionsContainer = document.getElementById('transactions');
        transactionsContainer.innerHTML = '';

        const filteredTransactions = masterExpenses.filter(expense => {
            return expense.Category === selectedCategory && (!selectedSubcategory || expense.Subcategory === selectedSubcategory);
        });

        const transactionsByYear = filteredTransactions.reduce((acc, expense) => {
            const year = new Date(convertDateFormat(expense.Date)).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(expense);
            return acc;
        }, {});

        const tableElement = document.createElement('table');
        const tableBodyElement = document.createElement('tbody');

        for (const [year, transactions] of Object.entries(transactionsByYear)) {
            const yearContainer = document.createElement('tr');
            yearContainer.className = 'transaction-row';
            yearContainer.dataset.year = year;

            const yearName = document.createElement('td');
            yearName.textContent = year;

            const totals = calculateTotals(transactions);
            const income = document.createElement('td');
            income.className = 'amount income';
            income.textContent = formatIndianCurrency(totals.income);
            const expenses = document.createElement('td');
            expenses.className = 'amount expense';
            expenses.textContent = formatIndianCurrency(totals.expenses);
            const balance = document.createElement('td');
            balance.className = 'amount balance';
            balance.textContent = formatIndianCurrency(totals.income - totals.expenses);

            yearContainer.appendChild(yearName);
            yearContainer.appendChild(income);
            yearContainer.appendChild(expenses);
            yearContainer.appendChild(balance);

            tableBodyElement.appendChild(yearContainer);
        }

        tableElement.appendChild(tableBodyElement);
        transactionsContainer.appendChild(tableElement);

        const totalTotals = calculateTotals(filteredTransactions);
        totalAmount.innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(totalTotals.expenses)}</p>`;
    }

    function calculateTotals(transactions) {
        return transactions.reduce((acc, expense) => {
            if (expense["Income/Expense"] === "Income") {
                acc.income += parseFloat(expense.INR);
            } else if (expense["Income/Expense"] === "Expense") {
                acc.expenses += parseFloat(expense.INR);
            }
            return acc;
        }, { income: 0, expenses: 0 });
    }

    function createTransactionRow(expense) {
        const row = document.createElement('tr');
        row.className = 'transaction-row';

        const checkboxCell = row.insertCell();
        const inputElement = document.createElement('input');
        inputElement.type = 'checkbox';
        inputElement.className = 'select-checkbox';
        inputElement.addEventListener('change', updateSelectedTotal);
        checkboxCell.appendChild(inputElement);

        const dateElement = row.insertCell();
        const dateCell = document.createElement('p');
        dateCell.textContent = new Date(convertDateFormat(expense.Date)).toDateString();
        dateCell.className = 'date';
        const categoryElement = document.createElement('p');
        categoryElement.classList.add('transaction-category');
        categoryElement.textContent = `${expense.Category}`;
        dateElement.appendChild(dateCell);
        dateElement.appendChild(categoryElement);

        const amountCell = row.insertCell();
        amountCell.textContent = formatIndianCurrency(parseFloat(expense.INR));
        amountCell.className = `amount ${expense['Income/Expense'].toLowerCase()}`;

        const noteCell = row.insertCell();
        noteCell.textContent = expense.Note;
        noteCell.className = 'note';
        const descriptionCell = row.insertCell();
        descriptionCell.textContent = expense.Description;
        descriptionCell.className = 'description';

        row.appendChild(checkboxCell);
        row.appendChild(dateElement);
        row.appendChild(noteCell);
        row.appendChild(amountCell);
        row.appendChild(descriptionCell);

        noteCell.addEventListener('click', () => {
            if (window.innerWidth <= 768) { // Mobile view
                rowDetails.innerHTML = `
                    <div><p>Date</p> <p>${new Date(convertDateFormat(expense.Date)).toDateString()}</p></div>
                    <div><p>Amount</p> <p>${formatIndianCurrency(parseFloat(expense.INR))}</p></div>
                    <div><p>Note</p> <p>${expense.Note}</p></div>
                    <div><p>Description</p> <p>${expense.Description}</p></div>
                `;
                rowPopup.style.display = 'block';
            }
        });

        return row;
    }

    function convertDateFormat(dateString) {
        const parts = dateString.includes('/') ? dateString.split("/") : dateString.split("-");
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            setActiveTab(tabName);
            if (tabName === 'monthly') {
                currentPeriod.textContent = formatDate(currentMonthlyDate);
                updateMonthlyTransactions();
            } else if (tabName === 'yearly') {
                currentPeriod.textContent = currentYearDate;
                updateYearlyTransactions();
            } else if (tabName === 'total') {
                updateTotalTransactions();
            }
        });
    });

    document.getElementById('prev-period').addEventListener('click', () => {
        if (currentTab === 'monthly') {
            currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() - 1);
            currentPeriod.textContent = formatDate(currentMonthlyDate);
            updateMonthlyTransactions();
        } else if (currentTab === 'yearly') {
            currentYearDate -= 1;
            currentPeriod.textContent = currentYearDate;
            updateYearlyTransactions();
        }
    });

    document.getElementById('next-period').addEventListener('click', () => {
        if (currentTab === 'monthly') {
            currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() + 1);
            currentPeriod.textContent = formatDate(currentMonthlyDate);
            updateMonthlyTransactions();
        } else if (currentTab === 'yearly') {
            currentYearDate += 1;
            currentPeriod.textContent = currentYearDate;
            updateYearlyTransactions();
        }
    });

    // backButton.addEventListener('click', () => {
    //     selectedCategoryContainer.style.display = 'none';
    //     categoriesContainer.style.display = 'block';
    // });

    document.addEventListener('masterExpensesLoaded', () => {
        currentPeriod.textContent = formatDate(currentMonthlyDate);
        updateCategoryTotals();

        // Initial setup
        setActiveTab('monthly');
    });
});
