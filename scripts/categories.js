document.addEventListener('DOMContentLoaded', async () => {
    const categoriesContainer = document.getElementById('categories-container');
    const selectedCategoryContainer = document.getElementById('selected-category-container');
    const mainTabs = document.querySelectorAll('.main-tab-button');
    const tabs = document.querySelectorAll('.tab-button');
    const currentPeriod = document.getElementById('current-period');
    const totalAmount = document.getElementById('total-amount');
    let currentMonthlyDate = new Date();
    let currentYearDate = new Date().getFullYear();
    let selectedCategory = null;
    let selectedSubcategory = null;
    let currentTab = 'monthly';
    let isSubcategoryView = false;
    let currentMainTab = 'expense';
    
    currentPeriod.textContent = formatDate(currentMonthlyDate);
    const masterExpenses = await utility.initializeMasterData();
    updateCategoryTotals();
    setActiveMainTab('expense');
    setActiveTab('monthly');

    function setActiveMainTab(tabName) {
        mainTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
        currentMainTab = tabName;
        selectedCategory = null;
        categoriesContainer.style.display = 'flex';
        document.getElementById('transactions').innerHTML = '';
        updateCategoryTotals();
    }

    function setActiveTab(tabName) {
        tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
        currentTab = tabName;
        updateCategoryTotals();
    }

    function updateCategoryTotals() {
        const categories = {};

        masterExpenses.forEach(expense => {
            if (expense["Income/Expense"] === (currentMainTab === 'expense' ? 'Expense' : 'Income')) {
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
                } else if (currentTab === 'yearly' && expenseDate.getFullYear() === currentMonthlyDate.getFullYear()) {
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

        if (selectedCategory === null || (selectedCategory !== null && categories.hasOwnProperty(selectedCategory))) {
            populateCategories(categories);
        }
    }

    function populateCategories(categories) {
        let totalSum = 0;

        for (let category in categories) {
            if (categories.hasOwnProperty(category)) {
                totalSum += categories[category].total;
            }
        }
        totalAmount.className = currentMainTab;
        totalAmount.innerHTML = `<p>${currentMainTab.charAt(0).toUpperCase() + currentMainTab.slice(1)}</p> <p>${formatIndianCurrency(totalSum)}</p>`;

        categoriesContainer.innerHTML = '';

        Object.keys(categories).forEach(categoryName => {
            const category = categories[categoryName];
            const categoryElement = document.createElement('div');
            categoryElement.classList.add('category-row');
            categoryElement.innerHTML = `
                <div class="category">
                    <div class="back-button" style="display: none;">←</div>
                    <span title="categoryName">${categoryName}</span>
                    <span class="amount ${currentMainTab}">${formatIndianCurrency(category.total)}</span>
                </div>
                <ul class="subcategory-list" style="display: none;">
                    <li class="subcategory all" data-subcategory="${categoryName}">
                        <span>All</span><span class="amount ${currentMainTab}">${formatIndianCurrency(category.total)}</span>
                    </li>
                    ${Object.keys(category.subcategories).map(subcategoryName => `
                        <li class="subcategory" data-subcategory="${subcategoryName}">
                            <span>${subcategoryName}</span><span class="amount ${currentMainTab}">${formatIndianCurrency(category.subcategories[subcategoryName])}</span>
                        </li>
                    `).join('')}
                </ul>
            `;

            const categoryDiv = categoryElement.querySelector('.category');
            const subcategoryList = categoryElement.querySelector('.subcategory-list');

            const toggleDisplay = () => {
                document.querySelector('.selected-total-wrapper').style.display = 'none';
                const isSubcategoryListVisible = subcategoryList.style.display === 'block';
                subcategoryList.style.display = isSubcategoryListVisible ? 'none' : 'block';
                categoryElement.querySelector('.back-button').style.display = isSubcategoryListVisible ? 'none' : 'block';
                categoryElement.classList.toggle('full-width', !isSubcategoryListVisible);
                categoryDiv.style.justifyContent = !isSubcategoryListVisible ? 'flex-start' : 'space-between';

                if (!isSubcategoryListVisible) {
                    Array.from(categoriesContainer.children).forEach(child => {
                        if (child !== categoryElement) child.style.display = 'none';
                    });
                    selectedCategoryContainer.style.display = 'block';
                    selectedCategory = categoryName;
                    selectedSubcategory = null;
                    isSubcategoryView = true;
                    updateTransactions();
                } else {
                    Array.from(categoriesContainer.children).forEach(child => {
                        child.style.display = 'block';
                    });
                    selectedCategoryContainer.style.display = 'none';
                    selectedCategory = null;
                    isSubcategoryView = false;
                    document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('active'));
                    updateCategoryTotals(); 
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

        if (isSubcategoryView && selectedCategory) {
            const selectedCategoryElement = Array.from(categoriesContainer.children).find(child =>
                child.querySelector('.category span[title="categoryName"]').textContent === selectedCategory);
            if (selectedCategoryElement) {
                const subcategoryList = selectedCategoryElement.querySelector('.subcategory-list');
                subcategoryList.style.display = 'block';
                selectedCategoryElement.querySelector('.back-button').style.display = 'block';
                selectedCategoryElement.classList.add('full-width');
                selectedCategoryElement.querySelector('.category').style.justifyContent = 'flex-start';
                Array.from(categoriesContainer.children).forEach(child => {
                    if (child !== selectedCategoryElement) child.style.display = 'none';
                });
                selectedCategoryContainer.style.display = 'block';
                if (selectedSubcategory) {
                    const selectedSubcategoryElement = selectedCategoryElement.querySelector(`.subcategory[data-subcategory="${selectedSubcategory}"]`);
                    if (selectedSubcategoryElement) {
                        selectedSubcategoryElement.classList.add('active');
                    }
                }
            }
        }
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
        document.querySelector('.selected-total-wrapper').style.display = 'none';

        document.getElementById('period-navigation').style.display = 'flex';
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

        if (Object.entries(transactionsByDay).length > 0) {
            categoriesContainer.style.display = 'flex';
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
                dayTotals.innerHTML = `<p class="${currentMainTab}">${formatIndianCurrency(totals[currentMainTab])}</p>`;
                dayContent.appendChild(dayTotals);
                dayHeader.appendChild(dayContent);
                dayContainer.appendChild(dayHeader);
                tableBodyElement.appendChild(dayContainer);

                transactions.forEach(expense => {
                    const transactionRow = createTransactionRow(expense);
                    tableBodyElement.appendChild(transactionRow);
                });
            }
        } else {
            categoriesContainer.style.display = 'none';
            tableBodyElement.innerHTML = `<tr>No transactions for <b>${selectedCategory} ${selectedSubcategory != null ? '- ' + selectedSubcategory : ''}</b> in <b>${formatDate(currentMonthlyDate)}</b></tr>`;
        }

        tableElement.appendChild(tableBodyElement);
        transactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateTotals(filteredTransactions);
        totalAmount.innerHTML = `<p>${currentMainTab.charAt(0).toUpperCase() + currentMainTab.slice(1)}</p> <p>${formatIndianCurrency(monthlyTotals[currentMainTab])}</p>`;
    }

    function updateYearlyTransactions() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';
        document.getElementById('period-navigation').style.display = 'flex';
        const transactionsContainer = document.getElementById('transactions');
        transactionsContainer.innerHTML = '';

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

        if (Object.entries(transactionsByMonth).length > 0) {
            categoriesContainer.style.display = 'flex';
            for (let i = 0; i < 12; i++) {
                const monthContainer = document.createElement('tr');
                monthContainer.className = 'transaction-row';
                monthContainer.dataset.month = i;

                const monthName = document.createElement('td');
                monthName.textContent = new Date(2024, i).toLocaleString('default', { month: 'short' });

                const totals = transactionsByMonth[i] ? calculateTotals(transactionsByMonth[i]) : { income: 0, expense: 0 };
                const expenses = document.createElement('td');
                expenses.className = `amount ${currentMainTab}`;
                expenses.textContent = formatIndianCurrency(totals[currentMainTab]);

                monthContainer.appendChild(monthName);
                monthContainer.appendChild(expenses);

                tableBodyElement.appendChild(monthContainer);
            }
        } else {
            categoriesContainer.style.display = 'none';
            tableBodyElement.innerHTML = `<tr>No transactions for <b>${selectedCategory}</b> in <b>${currentYearDate}</b></tr>`;
        }

        tableElement.appendChild(tableBodyElement);
        transactionsContainer.appendChild(tableElement);

        const yearlyTotals = calculateTotals(filteredTransactions);
        totalAmount.innerHTML = `<p>${currentMainTab.charAt(0).toUpperCase() + currentMainTab.slice(1)}</p> <p>${formatIndianCurrency(yearlyTotals[currentMainTab])}</p>`;

        const monthRows = document.querySelectorAll('#transactions .transaction-row');
        monthRows.forEach(row => {
            row.addEventListener('click', () => {
                if (document.querySelector('.tabs .active').dataset.tab === 'yearly') {
                    currentMonthlyDate = new Date(currentMonthlyDate.getFullYear(), row.dataset.month);
                    setActiveTab('monthly');
                    currentMonthlyDate.setMonth(currentMonthlyDate.getMonth());
                    currentPeriod.textContent = formatDate(currentMonthlyDate);
                    // updateCategoryTotals();
                    updateMonthlyTransactions();
                }
            });
        });
    }

    function updateTotalTransactions() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';
        document.getElementById('period-navigation').style.display = 'none';

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
            categoriesContainer.style.display = 'flex';
            const yearContainer = document.createElement('tr');
            yearContainer.className = 'transaction-row';
            yearContainer.dataset.year = year;

            const yearName = document.createElement('td');
            yearName.textContent = year;

            const totals = calculateTotals(transactions);
            const expenses = document.createElement('td');
            expenses.className = `amount ${currentMainTab}`;
            expenses.textContent = formatIndianCurrency(totals[currentMainTab]);

            yearContainer.appendChild(yearName);
            yearContainer.appendChild(expenses);

            tableBodyElement.appendChild(yearContainer);
        }

        tableElement.appendChild(tableBodyElement);
        transactionsContainer.appendChild(tableElement);

        const totalTotals = calculateTotals(filteredTransactions);
        totalAmount.innerHTML = `<p>${currentMainTab.charAt(0).toUpperCase() + currentMainTab.slice(1)}</p> <p>${formatIndianCurrency(totalTotals[currentMainTab])}</p>`;

        const yearRows = document.querySelectorAll('#transactions .transaction-row');
        yearRows.forEach(row => {
            row.addEventListener('click', () => {
                if (document.querySelector('.tabs .active').dataset.tab === 'total') {
                    currentMonthlyDate = new Date(row.dataset.year);
                    setActiveTab('yearly');
                    currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear());
                    currentPeriod.textContent = formatYear(currentMonthlyDate);
                    updateYearlyTransactions();
                }
            });
        });
    }

    function calculateTotals(transactions) {
        return transactions.reduce((acc, expense) => {
            if (expense["Income/Expense"] === "Income") {
                acc.income += parseFloat(expense.INR);
            } else if (expense["Income/Expense"] === "Expense") {
                acc.expense += parseFloat(expense.INR);
            }
            return acc;
        }, { income: 0, expense: 0 });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            setActiveTab(tabName);
            if (tabName === 'monthly') {
                document.getElementById('period-navigation').style.display = 'flex';
                currentPeriod.textContent = formatDate(currentMonthlyDate);
                if (selectedCategory != null) {
                    updateMonthlyTransactions();
                }
            } else if (tabName === 'yearly') {
                document.getElementById('period-navigation').style.display = 'flex';
                currentYearDate = currentMonthlyDate.getFullYear();
                currentPeriod.textContent = currentMonthlyDate.getFullYear();
                if (selectedCategory != null) {
                    updateYearlyTransactions();
                }
            } else if (tabName === 'total') {
                document.getElementById('period-navigation').style.display = 'none';
                if (selectedCategory != null) {
                    updateTotalTransactions();
                }
            }
        });
    });

    mainTabs.forEach(mainTab => {
        mainTab.addEventListener('click', () => {
            document.querySelector('.selected-total-wrapper').style.display = 'none';
            const mainTabName = mainTab.dataset.tab;
            setActiveMainTab(mainTabName);
            setActiveTab('monthly');
            currentPeriod.textContent = formatDate(currentMonthlyDate);
        });
    });

    document.getElementById('prev-period').addEventListener('click', () => {
        if (currentTab === 'monthly') {
            currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() - 1);
            currentPeriod.textContent = formatDate(currentMonthlyDate);
            updateCategoryTotals();
            if (selectedCategory != null) {
                updateMonthlyTransactions();
            }
        } else if (currentTab === 'yearly') {
            currentYearDate = currentMonthlyDate.getFullYear() - 1;
            currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() - 1);
            currentPeriod.textContent = formatYear(currentMonthlyDate);
            updateCategoryTotals();
            if (selectedCategory != null) {
                updateYearlyTransactions();
            }
        }
    });

    document.getElementById('next-period').addEventListener('click', () => {
        if (currentTab === 'monthly') {
            currentMonthlyDate.setMonth(currentMonthlyDate.getMonth() + 1);
            currentPeriod.textContent = formatDate(currentMonthlyDate);
            updateCategoryTotals();
            if (selectedCategory != null) {
                updateMonthlyTransactions();
            }
        } else if (currentTab === 'yearly') {
            currentYearDate = currentMonthlyDate.getFullYear() + 1;
            currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() + 1);
            currentPeriod.textContent = formatYear(currentMonthlyDate);
            updateCategoryTotals();
            if (selectedCategory != null) {
                updateYearlyTransactions();
            }
        }
    });
});
