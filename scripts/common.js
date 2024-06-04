// common.js

const AMOUNT_COLUMN_NAME = "INR";
document.addEventListener('DOMContentLoaded', function () {
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

