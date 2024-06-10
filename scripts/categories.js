document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.getElementById('categories-container');
    const transactionsContainer = document.getElementById('category-transactions-container');
    const backButton = document.querySelector('.back-button');
    const categoryHeading = document.querySelector('.category-heading');
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentPeriod = document.getElementById('current-period');
    const currentYear = document.getElementById('current-year');
    const dailyTotal = document.getElementById('daily-total');
    const monthlyTotal = document.getElementById('monthly-total');
    const yearlyTotal = document.getElementById('yearly-total');

    let currentDailyDate = new Date();
    let currentMonthlyDate = new Date();
    let selectedCategory = null;
    let selectedSubcategory = null;

    function formatIndianCurrency(amount) {
        return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function setActiveTab(tabName) {
        tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
        tabContents.forEach(content => content.classList.toggle('active', content.id === tabName));
    }

    function formatDate(date) {
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    }

    function formatYear(date) {
        return date.getFullYear().toString();
    }

    function updateCategoryTotals() {
        const categories = {};

        masterExpenses.forEach(expense => {
            if (expense["Income/Expense"] === "Expense") {
                const { Category, Subcategory, INR } = expense;
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
        });

        return categories;
    }

    function populateCategories() {
        const categories = updateCategoryTotals();
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
                    transactionsContainer.style.display = 'block';
                    // categoryHeading.textContent = categoryName;
                    selectedCategory = categoryName;
                    selectedSubcategory = null;
                    updateTransactions();
                } else {
                    Array.from(categoriesContainer.children).forEach(child => {
                        child.style.display = 'block';
                    });
                    transactionsContainer.style.display = 'none';
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
                    // categoryHeading.textContent = `${categoryName} - ${selectedSubcategory}`;
                    document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('active'));
                    subcategoryElement.classList.add('active');
                    updateTransactions();
                });
            });

            categoriesContainer.appendChild(categoryElement);
        });
    }

    function updateTransactions() {
        updateDailyTransactions();
        updateMonthlyTransactions();
        updateYearlyTransactions();
    }

    function updateDailyTransactions() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';

        const dailyTransactionsContainer = document.getElementById('daily-transactions');
        dailyTransactionsContainer.innerHTML = ''; // Clear previous transactions

        const filteredTransactions = masterExpenses.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expense.Category === selectedCategory &&
                (!selectedSubcategory || expense.Subcategory === selectedSubcategory) &&
                expenseDate.getMonth() === currentDailyDate.getMonth() &&
                expenseDate.getFullYear() === currentDailyDate.getFullYear();
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
            dayHeader.setAttribute('colspan', '5'); // Adjusted for mobile view

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
        dailyTransactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateTotals(filteredTransactions);
        document.getElementById('daily-total').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(monthlyTotals.expenses)}</p>`;
    }

    function updateMonthlyTransactions() {
        const monthlyTransactionsContainer = document.getElementById('monthly-transactions');
        monthlyTransactionsContainer.innerHTML = ''; // Clear previous transactions

        const filteredTransactions = masterExpenses.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expense.Category === selectedCategory &&
                (!selectedSubcategory || expense.Subcategory === selectedSubcategory) &&
                expenseDate.getFullYear() === currentMonthlyDate.getFullYear();
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
        monthlyTransactionsContainer.appendChild(tableElement);

        const yearlyTotals = calculateTotals(filteredTransactions);
        document.getElementById('monthly-total').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(yearlyTotals.expenses)}</p>`;

        const monthRows = document.querySelectorAll('#monthly-transactions .transaction-row');
        monthRows.forEach(row => {
            row.addEventListener('click', () => {
                currentDailyDate = new Date(currentMonthlyDate.getFullYear(), row.dataset.month);
                setActiveTab('daily');
                currentPeriod.textContent = formatDate(currentDailyDate);
                updateDailyTransactions();
            });
        });
    }

    function updateYearlyTransactions() {
        const totalTransactionsContainer = document.getElementById('total-transactions');
        totalTransactionsContainer.innerHTML = ''; // Clear previous transactions

        const filteredYearlyTransactions = masterExpenses.filter(expense => expense.Category === selectedCategory &&
            (!selectedSubcategory || expense.Subcategory === selectedSubcategory));

        const transactionsByYear = filteredYearlyTransactions.reduce((acc, expense) => {
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
        totalTransactionsContainer.appendChild(tableElement);

        const totalTotals = calculateTotals(filteredYearlyTransactions);
        document.getElementById('yearly-total').innerHTML = `<p>Expenses</p> <p>${formatIndianCurrency(totalTotals.expenses)}</p>`;

        const yearRows = document.querySelectorAll('#total-transactions .transaction-row');
        yearRows.forEach(row => {
            row.addEventListener('click', () => {
                currentMonthlyDate = new Date(row.dataset.year);
                setActiveTab('monthly');
                currentYear.textContent = formatYear(currentMonthlyDate);
                updateMonthlyTransactions();
            });
        });
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
            if (tabName === 'daily') {
                currentPeriod.textContent = `${new Date(currentDailyDate).toLocaleString('default', { month: 'long' })} ${currentDailyDate.getFullYear()}`;
                updateDailyTransactions();
            } else if (tabName === 'monthly') {
                currentYear.textContent = currentMonthlyDate.getFullYear();
                updateMonthlyTransactions();
            } else if (tabName === 'total') {
                updateYearlyTransactions();
            }
        });
    });

    document.getElementById('prev-period').addEventListener('click', () => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() - 1);
        updateDailyTransactions();
        currentPeriod.textContent = `${new Date(currentDailyDate).toLocaleString('default', { month: 'long' })} ${currentDailyDate.getFullYear()}`;
    });

    document.getElementById('next-period').addEventListener('click', () => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() + 1);
        updateDailyTransactions();
        currentPeriod.textContent = `${new Date(currentDailyDate).toLocaleString('default', { month: 'long' })} ${currentDailyDate.getFullYear()}`;
    });

    document.getElementById('prev-year').addEventListener('click', () => {
        currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() - 1);
        updateMonthlyTransactions();
        currentYear.textContent = currentMonthlyDate.getFullYear();
    });

    document.getElementById('next-year').addEventListener('click', () => {
        currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() + 1);
        updateMonthlyTransactions();
        currentYear.textContent = currentMonthlyDate.getFullYear();
    });

    document.addEventListener('masterExpensesLoaded', () => {
        currentPeriod.textContent = `${new Date(currentDailyDate).toLocaleString('default', { month: 'long' })} ${currentDailyDate.getFullYear()}`;
        currentYear.textContent = currentMonthlyDate.getFullYear();
        populateCategories();
    });
});

