// transactions.js

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentPeriod = document.getElementById('current-period');
    const currentYear = document.getElementById('current-year');

    let currentDate = new Date();
    let currentDailyDate = new Date();
    let currentMonthlyDate = new Date();

    function setActiveTab(tabName) {
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    function formatDate(date) {
        return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    }

    function formatYear(date) {
        return date.getFullYear().toString();
    }

    function formatIndianCurrency(amount) {
        return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function updateDailyTransactions() {
        const dailyTransactionsContainer = document.getElementById('daily-transactions');
        dailyTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Filter transactions for the current month and year
        const filteredTransactions = masterExpenses.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expenseDate.getMonth() === currentDailyDate.getMonth() && expenseDate.getFullYear() === currentDailyDate.getFullYear();
        });

        // Group transactions by day
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

        // Display transactions grouped by day
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
            const dayTotals = document.createElement('span');
            dayTotals.innerHTML = `Income: ${formatIndianCurrency(totals.income)} Expenses: ${formatIndianCurrency(totals.expenses)}`;
            dayContent.appendChild(dayTotals);
            dayHeader.appendChild(dayContent);
            dayContainer.appendChild(dayHeader);
            tableBodyElement.appendChild(dayContainer);

            transactions.forEach(expense => {
                const row = createTransactionRow(expense);
                tableBodyElement.appendChild(row);
            });
        }

        tableElement.appendChild(tableBodyElement);
        dailyTransactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateTotals(filteredTransactions);
        document.getElementById('daily-income').textContent = `Income: ${formatIndianCurrency(monthlyTotals.income)}`;
        document.getElementById('daily-expenses').textContent = `Expenses: ${formatIndianCurrency(monthlyTotals.expenses)}`;
        document.getElementById('daily-balance').textContent = `Balance: ${formatIndianCurrency(monthlyTotals.income - monthlyTotals.expenses)}`;
    }

    function updateMonthlyTransactions() {
        const monthlyTransactionsContainer = document.getElementById('monthly-transactions');
        monthlyTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Filter transactions for the current year
        const filteredTransactions = masterExpenses.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expenseDate.getFullYear() === currentMonthlyDate.getFullYear();
        });

        // Group transactions by month
        const transactionsByMonth = filteredTransactions.reduce((acc, expense) => {
            const month = new Date(convertDateFormat(expense.Date)).getMonth();
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(expense);
            return acc;
        }, {});

        // Display transactions grouped by month
        for (let i = 0; i < 12; i++) {
            const monthContainer = document.createElement('div');
            monthContainer.className = 'transaction-row';
            monthContainer.dataset.month = i; // Add this line to store the month index

            const monthName = document.createElement('span');
            monthName.textContent = new Date(2024, i).toLocaleString('default', { month: 'short' });

            const totals = transactionsByMonth[i] ? calculateTotals(transactionsByMonth[i]) : { income: 0, expenses: 0 };
            const income = document.createElement('span');
            income.className = 'amount income';
            income.textContent = formatIndianCurrency(totals.income);
            const expenses = document.createElement('span');
            expenses.className = 'amount expense';
            expenses.textContent = formatIndianCurrency(totals.expenses);
            const balance = document.createElement('span');
            balance.className = 'amount balance';
            balance.textContent = formatIndianCurrency(totals.income - totals.expenses);

            monthContainer.appendChild(monthName);
            monthContainer.appendChild(income);
            monthContainer.appendChild(expenses);
            monthContainer.appendChild(balance);

            monthlyTransactionsContainer.appendChild(monthContainer);
        }

        const yearlyTotals = calculateTotals(filteredTransactions);
        document.getElementById('monthly-income').textContent = `Income: ${formatIndianCurrency(yearlyTotals.income)}`;
        document.getElementById('monthly-expenses').textContent = `Expenses: ${formatIndianCurrency(yearlyTotals.expenses)}`;
        document.getElementById('monthly-balance').textContent = `Balance: ${formatIndianCurrency(yearlyTotals.income - yearlyTotals.expenses)}`;

        // Add click event listener for each month row to switch to Daily tab
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

    function updateTotalTransactions() {
        const totalTransactionsContainer = document.getElementById('total-transactions');
        totalTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Group transactions by year
        const transactionsByYear = masterExpenses.reduce((acc, expense) => {
            const year = new Date(convertDateFormat(expense.Date)).getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(expense);
            return acc;
        }, {});

        // Display transactions grouped by year
        for (const [year, transactions] of Object.entries(transactionsByYear)) {
            const yearContainer = document.createElement('div');
            yearContainer.className = 'transaction-row';
            yearContainer.dataset.year = year; // Add this line to store the year

            const yearName = document.createElement('span');
            yearName.textContent = year;

            const totals = calculateTotals(transactions);
            const income = document.createElement('span');
            income.className = 'amount income';
            income.textContent = formatIndianCurrency(totals.income);
            const expenses = document.createElement('span');
            expenses.className = 'amount expense';
            expenses.textContent = formatIndianCurrency(totals.expenses);
            const balance = document.createElement('span');
            balance.className = 'amount balance';
            balance.textContent = formatIndianCurrency(totals.income - totals.expenses);

            yearContainer.appendChild(yearName);
            yearContainer.appendChild(income);
            yearContainer.appendChild(expenses);
            yearContainer.appendChild(balance);

            totalTransactionsContainer.appendChild(yearContainer);
        }

        const totalTotals = calculateTotals(masterExpenses);
        document.getElementById('total-income').textContent = `Income: ${formatIndianCurrency(totalTotals.income)}`;
        document.getElementById('total-expenses').textContent = `Expenses: ${formatIndianCurrency(totalTotals.expenses)}`;
        document.getElementById('total-balance').textContent = `Balance: ${formatIndianCurrency(totalTotals.income - totalTotals.expenses)}`;

        // Add click event listener for each year row to switch to Monthly tab
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

        const inputTd = row.insertCell();
        const checkboxCell = document.createElement('input');
        checkboxCell.type = 'checkbox';
        checkboxCell.className = 'select-checkbox';
        inputTd.appendChild(checkboxCell);

        const rowCell = row.insertCell();
        const dateCell = document.createElement('p');
        dateCell.textContent = new Date(convertDateFormat(expense.Date)).toDateString();
        dateCell.className = 'date';
        const accountCategoryElement = document.createElement('p');
        accountCategoryElement.classList.add('account-category');
        accountCategoryElement.textContent = `${expense.Account} - ${expense.Category}`;
        rowCell.appendChild(dateCell);
        rowCell.appendChild(accountCategoryElement);

        const amountCell = row.insertCell();
        amountCell.textContent = formatIndianCurrency(parseFloat(expense.INR));
        amountCell.className = `amount ${expense['Income/Expense'].toLowerCase()}`;

        const noteCell = row.insertCell();
        noteCell.textContent = expense.Note;
        noteCell.className = 'note';

        const descriptionCell = row.insertCell();
        descriptionCell.textContent = expense.Description;
        descriptionCell.className = 'description';

        row.appendChild(inputTd);
        row.appendChild(rowCell);
        row.appendChild(amountCell);
        row.appendChild(noteCell);
        row.appendChild(descriptionCell);

        return row;
    }

    // Event listeners for period navigation
    document.getElementById('prev-period').addEventListener('click', () => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() - 1);
        updateDailyTransactions();
        currentPeriod.textContent = formatDate(currentDailyDate);
    });

    document.getElementById('next-period').addEventListener('click', () => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() + 1);
        updateDailyTransactions();
        currentPeriod.textContent = formatDate(currentDailyDate);
    });

    document.getElementById('prev-year').addEventListener('click', () => {
        currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() - 1);
        updateMonthlyTransactions();
        currentYear.textContent = formatYear(currentMonthlyDate);
    });

    document.getElementById('next-year').addEventListener('click', () => {
        currentMonthlyDate.setFullYear(currentMonthlyDate.getFullYear() + 1);
        updateMonthlyTransactions();
        currentYear.textContent = formatYear(currentMonthlyDate);
    });

    // Initial setup
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            setActiveTab(tabName);
            if (tabName === 'daily') {
                currentPeriod.textContent = formatDate(currentDailyDate);
                updateDailyTransactions();
            } else if (tabName === 'monthly') {
                currentYear.textContent = formatYear(currentMonthlyDate);
                updateMonthlyTransactions();
            } else if (tabName === 'total') {
                updateTotalTransactions();
            }
        });
    });

    // Wait for masterExpenses to be loaded
    document.addEventListener('masterExpensesLoaded', () => {
        currentPeriod.textContent = formatDate(currentDailyDate);
        currentYear.textContent = formatYear(currentMonthlyDate);
        updateDailyTransactions();
    });
});

function convertDateFormat(dateString) {
    const parts = dateString.includes('/') ? dateString.split("/") : dateString.split("-");
    const convertedDate = `${parts[1]}/${parts[0]}/${parts[2]}`;
    return convertedDate;
}
