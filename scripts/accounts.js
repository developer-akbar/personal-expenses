// accounts.js

document.addEventListener('DOMContentLoaded', async () => {
    const accountsLink = document.getElementById('accounts-link');
    const accountsSection = document.getElementById('accounts-section');
    const dailyTransactionsSection = document.getElementById('daily-transactions-section');
    const selectedAccountDisplay = document.getElementById('selected-account');
    const currentPeriod = document.getElementById('current-period');
    const backButton = document.getElementById('back-button');

    let currentDailyDate = new Date();
    let selectedAccount = null;
    
    const masterData = await utility.initializeMasterData();
    currentPeriod.textContent = formatDate(currentDailyDate);
    updateAccountBalances();

    function formatDate(date) {
        return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    }

    function formatIndianCurrency(amount) {
        return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function calculateAccountBalance(account, date) {
        return masterData.reduce((acc, expense) => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            if (expenseDate > date) return acc;

            const amount = parseFloat(expense.INR);
            if (expense.Account === account) {
                if (expense["Income/Expense"] === "Income") {
                    acc += amount;
                } else if (expense["Income/Expense"] === "Expense") {
                    acc -= amount;
                } else if (expense["Income/Expense"] === "Transfer-Out") {
                    acc -= amount;
                }
            }
            if (expense.Category === account && expense["Income/Expense"] === "Transfer-Out") {
                acc += amount;
            }
            return acc;
        }, 0);
    }

    function updateAccountBalances() {
        const accountsBalancesContainer = document.getElementById('accounts-balances');
        accountsBalancesContainer.innerHTML = ''; // Clear previous balances

        // Calculate account balances
        const accountBalances = masterData.reduce((acc, expense) => {
            const account = expense.Account;
            const amount = parseFloat(expense.INR);
            if (!acc[account]) {
                acc[account] = 0;
            }
            if (expense["Income/Expense"] === "Income") {
                acc[account] += amount;
            } else if (expense["Income/Expense"] === "Expense") {
                acc[account] -= amount;
            } else if (expense["Income/Expense"] === "Transfer-Out") {
                acc[account] -= amount;
                const targetAccount = expense.Category;
                if (!acc[targetAccount]) {
                    acc[targetAccount] = 0;
                }
                acc[targetAccount] += amount;
            }
            return acc;
        }, {});

        let assets = 0;
        let liabilities = 0;

        // Display account balances
        for (const [account, balance] of Object.entries(accountBalances)) {
            const accountContainer = document.createElement('div');
            accountContainer.className = 'account-row';
            accountContainer.dataset.account = account;

            const accountName = document.createElement('span');
            accountName.title = account;
            accountName.textContent = account;

            const accountBalance = document.createElement('span');
            accountBalance.className = 'amount';
            accountBalance.textContent = formatIndianCurrency(balance);
            if (balance >= 0) {
                accountBalance.classList.add('positive');
                assets += balance;
            } else {
                accountBalance.classList.add('negative');
                liabilities += Math.abs(balance);
            }

            accountContainer.appendChild(accountName);
            accountContainer.appendChild(accountBalance);

            accountsBalancesContainer.appendChild(accountContainer);
        }

        const balance = assets - liabilities;

        document.getElementById('assets').innerHTML = `<p>Assets</p><p>${formatIndianCurrency(assets)}</p>`;
        document.getElementById('liabilities').innerHTML = `<p>Liabilities</p><p>${formatIndianCurrency(liabilities)}</p>`;
        document.getElementById('balance').innerHTML = `<p>Liabilities</p><p>${formatIndianCurrency(balance)}</p>`;

        // Add click event listener for each account row to switch to Daily tab with filtered transactions
        const accountRows = document.querySelectorAll('.account-row');
        accountRows.forEach(row => {
            row.addEventListener('click', () => {
                selectedAccount = row.dataset.account;
                selectedAccountDisplay.textContent = `Transactions for ${selectedAccount}`;
                localStorage.setItem('selectedAccount', selectedAccount);
                currentDailyDate = new Date(); // Reset to current month
                updateAccountTransactions();
                accountsSection.style.display = 'none';
                dailyTransactionsSection.style.display = 'block';
            });
        });
    }

    function updateAccountTransactions() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';

        const accountTransactionsContainer = document.getElementById('account-transactions');
        accountTransactionsContainer.innerHTML = ''; // Clear previous transactions

        // Filter transactions for the current month and year for the selected account
        const filteredTransactions = masterData.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            const matchesDate = expenseDate.getMonth() === currentDailyDate.getMonth() && expenseDate.getFullYear() === currentDailyDate.getFullYear();
            const matchesAccount = expense.Account === selectedAccount || (expense["Income/Expense"] === "Transfer-Out" && expense.Category === selectedAccount);
            return matchesDate && matchesAccount;
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
            const dayContainer = document.createElement('tr');
            dayContainer.className = 'transaction-day';

            const dayHeader = dayContainer.insertCell();
            dayHeader.classList.add('day-header');
            dayHeader.setAttribute('colspan', '5');

            const dayContent = document.createElement('h3');
            dayContent.classList.add('day-content');
            dayContent.textContent = date;

            const totals = calculateAccountTotals(transactions);
            const dayTotals = document.createElement('div');
            dayTotals.classList.add('day-totals');
            dayTotals.innerHTML = `<p class="deposits">${formatIndianCurrency(totals.deposits)}</p> <p class="withdrawal">${formatIndianCurrency(totals.withdrawal)}</p>`;
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
        accountTransactionsContainer.appendChild(tableElement);

        const monthlyTotals = calculateAccountTotals(filteredTransactions);
        document.getElementById('account-deposits').innerHTML = `<p>Deposits</p><p>${formatIndianCurrency(monthlyTotals.deposits)}</p>`;
        document.getElementById('account-withdrawal').innerHTML = `<p>Withdrawal</p><p>${formatIndianCurrency(monthlyTotals.withdrawal)}</p>`;
        document.getElementById('account-total').innerHTML = `<p>Total</p><p>${formatIndianCurrency(monthlyTotals.deposits - monthlyTotals.withdrawal)}</p>`;
        document.getElementById('account-balance').innerHTML = `<p>Balance</p><p>${formatIndianCurrency(calculateMonthEndBalance(selectedAccount, currentDailyDate))}</p>`;

        selectedAccountDisplay.textContent = `${selectedAccount}`;
    }

    function calculateMonthEndBalance(account, date) {
        const transactions = masterData.filter(expense => {
            const expenseDate = new Date(convertDateFormat(expense.Date));
            return expenseDate <= date && (expense.Account === account || (expense["Income/Expense"] === "Transfer-Out" && expense.Category === account));
        });

        return transactions.reduce((acc, expense) => {
            const amount = parseFloat(expense.INR);
            if (expense.Account === account) {
                if (expense["Income/Expense"] === "Income") {
                    acc += amount;
                } else if (expense["Income/Expense"] === "Expense") {
                    acc -= amount;
                } else if (expense["Income/Expense"] === "Transfer-Out") {
                    acc -= amount;
                }
            }
            if (expense.Category === account && expense["Income/Expense"] === "Transfer-Out") {
                acc += amount;
            }
            return acc;
        }, 0);
    }

    function calculateAccountTotals(transactions) {
        return transactions.reduce((acc, expense) => {
            const amount = parseFloat(expense.INR);
            if (expense["Income/Expense"] === "Income") {
                acc.deposits += amount;
            } else if (expense["Income/Expense"] === "Expense") {
                acc.withdrawal += amount;
            } else if (expense["Income/Expense"] === "Transfer-Out") {
                if (expense.Account === selectedAccount) {
                    acc.withdrawal += amount;
                }
                if (expense.Category === selectedAccount) {
                    acc.deposits += amount;
                }
            }
            return acc;
        }, { deposits: 0, withdrawal: 0 });
    }

    function calculateAccountTotals(transactions) {
        return transactions.reduce((acc, expense) => {
            const amount = parseFloat(expense.INR);
            if (expense["Income/Expense"] === "Expense") {
                acc.withdrawal += amount;
            } else {
                acc.deposits += amount;
            }
            return acc;
        }, { deposits: 0, withdrawal: 0 });
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
        amountCell.className = `amount ${expense['Income/Expense'].toLowerCase() === 'transfer-out' ? 'income' : 'expense'}`;

        const noteCell = row.insertCell();
        noteCell.textContent = expense.Note;
        noteCell.className = 'note';

        noteCell.addEventListener('click', () => {
            if (window.innerWidth <= 768) { // Mobile view
                rowDetails.innerHTML = `
                    <table>
                        <tr><td>Date</td> <td>${new Date(convertDateFormat(expense.Date)).toDateString()}</td></tr>
                        <tr><td>Amount</td> <td>${formatIndianCurrency(parseFloat(expense.INR))}</td></tr>
                        <tr><td>Note</td> <td>${expense.Note}</td></tr>
                        <tr><td>Description</td> <td>${expense.Description}</td></tr>
                    </table>
                `;
                rowPopup.style.display = 'block';
            }
        });

        const descriptionCell = row.insertCell();
        descriptionCell.textContent = expense.Description;
        descriptionCell.className = 'description';

        row.appendChild(checkboxCell);
        row.appendChild(dateElement);
        row.appendChild(noteCell);
        row.appendChild(amountCell);
        row.appendChild(descriptionCell);

        return row;
    }

    // Event listeners for period navigation
    document.getElementById('prev-period').addEventListener('click', () => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() - 1);
        updateAccountTransactions();
        currentPeriod.textContent = formatDate(currentDailyDate);
    });

    document.getElementById('next-period').addEventListener('click', () => {
        currentDailyDate.setMonth(currentDailyDate.getMonth() + 1);
        updateAccountTransactions();
        currentPeriod.textContent = formatDate(currentDailyDate);
    });

    // Back button event listener
    backButton.addEventListener('click', () => {
        accountsSection.style.display = 'block';
        dailyTransactionsSection.style.display = 'none';
    });

    // Wait for masterExpenses to be loaded
    // document.addEventListener('masterExpensesLoaded', () => {
    //     currentPeriod.textContent = formatDate(currentDailyDate);
    //     updateAccountBalances();
    // });
});

function convertDateFormat(dateString) {
    const parts = dateString.includes('/') ? dateString.split("/") : dateString.split("-");
    const convertedDate = `${parts[1]}/${parts[0]}/${parts[2]}`;
    return convertedDate;
}
