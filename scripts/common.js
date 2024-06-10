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

// Event listeners for mobile navigation
mobileNavButtons.forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = button.dataset.page;
    });
});

function formatIndianCurrency(amount) {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateSelectedTotal() {
    const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
    let selectedTotal = 0;
    selectedCheckboxes.forEach(checkbox => {
        const amountCell = checkbox.closest('tr').querySelector('.amount');
        let amount = amountCell.textContent.replace(/,/g, '');
        if (amountCell.classList.contains('expense')) {
            selectedTotal -= parseFloat(amount);
        }
        if (amountCell.classList.contains('income')) {
            selectedTotal += parseFloat(amount);
        }
    });
    const selectedTotalWrapper = document.querySelector('.selected-total-wrapper');
    const selectedTotalElement = document.getElementById('selected-total');
    if (selectedTotal === 0) {
        selectedTotalWrapper.style.display = 'none';
    } else {
        selectedTotalWrapper.style.display = 'block';
        selectedTotalElement.textContent = `Selected Total: ${selectedTotal.toFixed(2)}`;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth <= 768) { // Mobile view
        if(document.querySelector('.mobile-nav')) document.querySelector('.mobile-nav').style.display = 'flex';
        if(document.querySelector('.search')) document.querySelector('.search').style.display = 'block';
    }

    // Function to load CSV data
    function loadCSV(callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    callback(xhr.responseText);
                } else {
                    console.error('Failed to load CSV file');
                }
            }
        };
        xhr.open('GET', 'data/personal-expenses.csv', true); // provide csv file path
        xhr.send(null);
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

    // Load CSV data and process
    loadCSV(function (csv) {
        masterExpenses = parseCSV(csv);

        // Dispatch an event to notify that masterExpenses is loaded
        document.dispatchEvent(new Event('masterExpensesLoaded'));
        // convertAmountToINR();

    });
});

function convertDateFormat(dateString) {
    const parts = dateString.includes('/') ? dateString.split("/") : dateString.split("-");
    const convertedDate = `${parts[1]}/${parts[0]}/${parts[2]}`;
    return convertedDate;
}

function convertAmountToINR() {
    document.querySelectorAll('.amount').forEach(amt => {
        amt.textContent = parseFloat(amt.textContent).toLocaleString('en-IN', {
            // maximumFractionDigits: 2,
            // style: 'currency',
            // currency: 'INR'
        });
    });
}

