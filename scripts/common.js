// common.js

const AMOUNT_COLUMN_NAME = "INR";

const transactionModal = document.getElementById('transaction-modal');
const closeButtons = document.querySelectorAll('.close-button');
const mobileNavButtons = document.querySelectorAll('.mobile-nav-button');
const rowDetails = document.querySelector('.row-details');

// Close the popup
if (closeButtons.length > 0) {
    closeButtons.forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            transactionModal.style.display = 'none';
        });
    });
}

// Highlighting current page navigation item
document.querySelectorAll('.navigation ul>li a').forEach(navItem => {
    if(navItem.getAttribute('href') === location.pathname.replace('/', '')) {
        navItem.parentElement.classList.add('active');
    }
});

window.onload = () => {
    // adding minHeight for viewable-content so that swiping can be done on the container.
    if (!document.querySelector('body') && !document.querySelector('.sticky-container') && document.querySelector('.sticky-container').getClientRects().length > 0 && !document.querySelector('.mobile-nav')) {
        document.querySelector('.viewable-content').style.minHeight = document.querySelector('body').getClientRects()[0].height
            - document.querySelector('.sticky-container').getClientRects()[0].bottom
            - document.querySelector('.mobile-nav').getClientRects()[0].height + 'px';
    }
}

function scrollToTop() {
    window.scrollTo(0, 0);
}

document.addEventListener('scroll', () => {
    var scrolled = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;

    // toggling scroll to top button when certain scroll to bottom
    if (scrolled > 799) {
        document.querySelector('.scroll-to-top').style.display = 'block';
    } else {
        document.querySelector('.scroll-to-top').style.display = 'none';
    }
});

// Event listeners for mobile navigation
if (mobileNavButtons != undefined && mobileNavButtons.length > 0) {
    mobileNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            mobileNavButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to the clicked button
            button.classList.add('active');

            // Navigate to the clicked page
            window.location.href = button.dataset.page;
        });

        // Optionally, you can highlight the active button based on the current URL
        const currentPage = window.location.pathname.split('/').pop();
        mobileNavButtons.forEach(button => {
            if (button.dataset.page === currentPage) {
                button.classList.add('active');
            }
        });
    });
}

function getRandomHslColor() {
    const h = Math.floor(Math.random() * 360); // Random hue (0-359)
    const s = Math.floor(Math.random() * 30) + 20 + '%'; // Low to medium saturation (20-50%)
    const l = Math.floor(Math.random() * 20) + 70 + '%'; // High lightness (70-90%)
    return `hsl(${h}, ${s}, ${l})`;
}

function formatIndianCurrency(amount) {
    if (amount === undefined || isNaN(amount)) amount = 0;
    return '₹ ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date) {
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
}

function formatYear(date) {
    return date.getFullYear().toString();
}

function convertDateFormat(dateString) {
    const parts = dateString.includes('/') ? dateString.split("/") : dateString.split("-");
    return `${parts[1]}/${parts[0]}/${parts[2]}`;
}

function updateSelectedTotal() {
    const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
    let selectedTotal = 0;
    let totalSelectedTransfers = 0;

    selectedCheckboxes.forEach(checkbox => {
        const amountCell = checkbox.closest('tr').querySelector('.amount');
        const amount = parseFloat(amountCell.textContent.replace(/[^\d.]/g, ''));

        if (amountCell.classList.contains('expense')) {
            selectedTotal -= amount;
        } else if (amountCell.classList.contains('income')) {
            selectedTotal += amount;
        } else if (amountCell.classList.contains('transfer-out')) {
            totalSelectedTransfers += amount;
        }
    });

    const selectedTotalWrapper = document.querySelector('.selected-total-wrapper');
    const selectedTotalElement = document.getElementById('selected-total');
    const totalSelectedTransfersElement = document.getElementById('total-selected-transfers');
    const deleteSelectedTransactionsElement = document.getElementById('delete-selected-transactions');

    selectedTotalWrapper.style.display = 'block';

    selectedTotalElement.style.display = selectedTotal ? 'block' : 'none';
    selectedTotalElement.textContent = `Selected Total: ${formatIndianCurrency(parseFloat(selectedTotal))}`;

    totalSelectedTransfersElement.style.display = totalSelectedTransfers ? 'block' : 'none';
    totalSelectedTransfersElement.textContent = `Total Transfers: ${formatIndianCurrency(parseFloat(totalSelectedTransfers))}`;

    deleteSelectedTransactionsElement.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';

    deleteSelectedTransactionsElement.addEventListener('click', () => {
        const idsToDelete = Array.from(document.querySelectorAll('.select-checkbox:checked')).map(checkbox => parseInt(checkbox.dataset.id));

        if (idsToDelete.length > 0) {
            deleteTransaction(idsToDelete);
        }
    });
}

function createTransactionRow(expense) {
    const row = document.createElement('tr');
    row.className = 'transaction-row';
    row.id = `transaction-${expense.ID}`;

    const checkboxCell = row.insertCell();
    const inputElement = document.createElement('input');
    inputElement.type = 'checkbox';
    inputElement.className = 'select-checkbox';
    inputElement.setAttribute('data-id', expense.ID)
    inputElement.addEventListener('change', updateSelectedTotal);
    checkboxCell.appendChild(inputElement);

    const dateElement = row.insertCell();
    const dateCell = document.createElement('p');
    dateCell.textContent = new Date(convertDateFormat(expense.Date)).toDateString();
    dateCell.className = 'date';
    const categoryElement = document.createElement('p');
    categoryElement.classList.add('transaction-category', 'line-clamp');
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
    row.appendChild(descriptionCell);
    row.appendChild(amountCell);

    row.addEventListener('click', (event) => {
        // Check if the clicked element is not a checkbox
        if (!event.target.matches('input[type="checkbox"]')) {
            typeof editTransaction === 'undefined' ? showTransactionDetails(expense) : editTransaction(expense.ID);
        }
    });

    return row;
}

function showTransactionDetails(expense) {
    rowDetails.innerHTML = `
        <table>
            <tr hidden><td>ID</td> <td>${expense.ID}</td></tr>
            <tr><td>Type</td> <td>${expense["Income/Expense"]}</td></tr>
            <tr><td>Date</td> <td>${new Date(convertDateFormat(expense.Date)).toDateString()}</td></tr>
            <tr><td>Account</td> <td>${expense.Account}</td></tr>
            <tr><td>Category</td> <td>${expense.Category}</td></tr>
            <tr><td>Amount</td> <td>${formatIndianCurrency(parseFloat(expense.INR))}</td></tr>
            <tr><td>Note</td> <td>${expense.Note}</td></tr>
            <tr><td>Description</td> <td>${expense.Description}</td></tr>
        </table>
        <div class="cta-buttons flex">
            <!--<button class="edit-button" onClick="editTransaction(${expense.ID})">Edit</button>-->
            <button class="delete-button" onClick="deleteTransaction(${expense.ID})">Delete</button>
        </div>
    `;
    transactionModal.style.display = 'flex';
}

function deleteTransaction(ids) {
    let masterData = JSON.parse(localStorage.getItem('masterExpenses'));

    if (!Array.isArray(ids)) {
        ids = [ids]; // Convert single ID to an array
    }

    ids.forEach(id => {
        let transactionIndex = masterData.findIndex(transaction => parseInt(transaction.ID) === id);
        if (transactionIndex > -1) {
            const deletedTransaction = masterData[transactionIndex];

            masterData.splice(transactionIndex, 1);

            // Find the row in the DOM and add the 'deleting' class
            const transactionRow = document.querySelector(`.transaction-row .select-checkbox[data-id="${id}"]`).closest('tr');
            transactionRow.classList.add('deleting');

            // Wait for the transition to finish before removing the row from the DOM
            transactionRow.addEventListener('transitionend', () => {
                const dayWrapper = transactionRow.closest('.transaction-day-wrapper');

                transactionRow.remove();

                // Check if the transaction-day-wrapper has no more transaction rows
                if (dayWrapper && dayWrapper.querySelectorAll('.transaction-row').length === 0) {
                    dayWrapper.classList.add('deleting');
                    dayWrapper.addEventListener('transitionend', () => {
                        dayWrapper.remove();
                    });
                }
            });

            localStorage.setItem('masterExpenses', JSON.stringify(masterData));

            if (window.showModifiedTransactionPeriod) {
                window.showModifiedTransactionPeriod(deletedTransaction);
            }

            document.querySelector('.selected-total-wrapper').style.display = 'none';
        }
    });

    if (ids.length === 1 && transactionModal != undefined) {
        transactionModal.style.display = 'none'; // Close modal popup if a single transaction was deleted
    }
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

document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth <= 768) { // Mobile view
        if (document.querySelector('.mobile-nav')) document.querySelector('.mobile-nav').style.display = 'flex';
        if (document.querySelector('.search')) document.querySelector('.search').style.display = 'block';
    }

    // Function to load CSV data
    const utility = (function () {
        function loadCSV() {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            resolve(xhr.responseText);
                        } else {
                            reject('Failed to load CSV file');
                        }
                    }
                };
                xhr.open('GET', 'data/personal-expenses.csv', true); // provide csv file path
                xhr.send(null);
            });
        }

        // Function to parse CSV data
        function parseCSV(csv) {
            // Parse CSV string into array of objects
            var rows = csv.trim().split('\n');
            var data = rows.map(function (row) {
                return row.split(',');
            });

            // Assuming first row contains headers
            var headers = data.shift();

            // Find index of 'Amount' field
            var amountIndex = headers.indexOf(AMOUNT_COLUMN_NAME);

            // Convert data into array of objects
            var expenses = data.map(function (row) {
                var obj = {};
                for (var i = 0; i < headers.length; i++) {
                    // Map each header to its corresponding value in the row
                    if (!Array.from(Object.keys(obj)).includes(headers[i])) {
                        obj[headers[i]] = row[i];
                    }
                }
                // Extract amount field
                obj[AMOUNT_COLUMN_NAME] = parseFloat(row[amountIndex]); // Convert amount to float
                return obj;
            });

            return expenses;
        }

        function storeDataInLocalStorage(data) {
            try {
                const jsonData = JSON.stringify(data);
                localStorage.setItem('masterExpenses', jsonData);
                console.log('Data stored in localStorage:', data);
            } catch (e) {
                console.error('Error storing data in localStorage', e);
            }
        }

        function getDataFromLocalStorage() {
            try {
                const jsonData = localStorage.getItem('masterExpenses');
                if (jsonData) {
                    return JSON.parse(jsonData);
                }
                return null;
            } catch (e) {
                console.error('Error retrieving data from localStorage', e);
                return null;
            }
        }

        async function updateMasterExpensesFromCSV() {
            try {
                const csv = await loadCSV();
                const parsedData = parseCSV(csv);
                if (parsedData) {
                    storeDataInLocalStorage(parsedData);
                }
            } catch (error) {
                console.error(error);
            }
        }

        // Initialize masterExpenses
        async function initializeMasterData() {
            let masterExpenses;

            // Check if csv file processed already. if not, procss csv and update latest masterExpenses object into localStorage
            const csvConversionDetails = JSON.parse(localStorage.getItem('csvConversionDetails'));
            if (csvConversionDetails != undefined && !csvConversionDetails.isCSVProcessed) {
                await updateMasterExpensesFromCSV();
                masterExpenses = getDataFromLocalStorage();
                csvConversionDetails.isCSVProcessed = true;
                localStorage.setItem('csvConversionDetails', JSON.stringify(csvConversionDetails));
            } else { // else get masterExpenses object from localstorage
                masterExpenses = getDataFromLocalStorage();
                if (!masterExpenses) { // still if not found, update masterExpenses object from csv file (here we may get outdated data).
                    await updateMasterExpensesFromCSV();
                    masterExpenses = getDataFromLocalStorage();
                }
            }
            return masterExpenses;
        }

        // Expose the utility functions to use in other files
        return {
            initializeMasterData
        };
    })();

    // This makes `utility` available globally
    window.utility = utility;
});