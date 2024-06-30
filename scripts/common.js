// common.js

const AMOUNT_COLUMN_NAME = "INR";

const rowPopup = document.getElementById('rowPopup');
const closeButton = document.querySelector('.close-button');
const mobileNavButtons = document.querySelectorAll('.mobile-nav-button');
const rowDetails = document.querySelector('.row-details');

// Close the popup
closeButton.addEventListener('click', () => {
    rowPopup.style.display = 'none';
});

window.onload = () => {
    // adding minHeight for viewable-content so that swiping can be done on the container.
    if (document.querySelector('body') != undefined && document.querySelector('.sticky-container').getClientRects().length > 0 && document.querySelector('.mobile-nav') != undefined) {
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

    selectedTotalWrapper.style.display = 'block';

    selectedTotalElement.style.display = selectedTotal ? 'block' : 'none';
    selectedTotalElement.textContent = `Selected Total: ${formatIndianCurrency(parseFloat(selectedTotal))}`;

    totalSelectedTransfersElement.style.display = totalSelectedTransfers ? 'block' : 'none';
    totalSelectedTransfersElement.textContent = `Total Transfers: ${formatIndianCurrency(parseFloat(totalSelectedTransfers))}`;
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
    row.appendChild(amountCell);
    row.appendChild(descriptionCell);

    noteCell.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            showTransactionDetails(expense);
        }
    });

    return row;
}

function showTransactionDetails(expense) {
    rowDetails.innerHTML = `
        <table>
            <tr><td>Type</td> <td>${expense["Income/Expense"]}</td></tr>
            <tr><td>Date</td> <td>${new Date(convertDateFormat(expense.Date)).toDateString()}</td></tr>
            <tr><td>Account</td> <td>${expense.Account}</td></tr>
            <tr><td>Category</td> <td>${expense.Category}</td></tr>
            <tr><td>Amount</td> <td>${formatIndianCurrency(parseFloat(expense.INR))}</td></tr>
            <tr><td>Note</td> <td>${expense.Note}</td></tr>
            <tr><td>Description</td> <td>${expense.Description}</td></tr>
        </table>
    `;
    rowPopup.style.display = 'flex';
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
            let masterExpenses = getDataFromLocalStorage();
            if (!masterExpenses) {
                await updateMasterExpensesFromCSV();
                masterExpenses = getDataFromLocalStorage();
            }
            return masterExpenses;
        }

        // Expose the utiltiy functions to use in other files
        return {
            initializeMasterData
        };
    })();

    // This makes `utility` available globally
    window.utility = utility;
});