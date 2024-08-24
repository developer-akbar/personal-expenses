document.addEventListener('DOMContentLoaded', function () {
    const csvConversionDetails = JSON.parse(localStorage.getItem('csvConversionDetails'));
    const updatedElement = document.querySelector('.csv-updated-at');
    if (csvConversionDetails) {
        updatedElement.parentElement.style.display = 'block';
        const updatedAt = csvConversionDetails.updated_at;
        const timeAgoText = timeAgo(updatedAt);
        updatedElement.textContent = timeAgoText;
        updatedElement.title = new Date(updatedAt).toLocaleString(); // Full date and time
    } else {
        updatedElement.parentElement.style.display = 'none';
    }

    document.getElementById('convertButton').addEventListener('click', async () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select an Excel file first.');
            return;
        }

        // Load XLSX library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js';
        script.onload = () => {
            if (existingMasterExpenses.length > 0) {
                const userConsent = confirm('There are already transactions available. Do you want to Merge or Override with new data? Click OK to Merge or Cancel to Override.');
                if (userConsent) {
                    convertToCSV(file, 'merge');
                } else {
                    convertToCSV(file, 'override');
                }
            } else {
                convertToCSV(file, 'override');
            }
        };
        document.body.appendChild(script);

        const existingMasterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];


    });

    async function convertToCSV(file, mode) {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert worksheet to CSV and replace commas within cell data
            const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n', strip: false })
                .split('\n')
                .map((row, index) =>
                    row.length > 0 ? transformString(row, index).split(',')
                        .map(cell => `${cell.replace(/,/g, ';')}`) // replace commas within cell data and quote the cell
                        .join(',') : ''
                ).join('\n');

            // Save the CSV file using the File System Access API
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'personal-expenses.csv',
                    types: [
                        {
                            description: 'CSV File',
                            accept: { 'text/csv': ['.csv'] },
                        },
                    ],
                });

                const writable = await handle.createWritable();
                await writable.write(csv);

                // Add csv conversion status and updated time in localstorage
                const csvConversionDetails = {
                    updated_at: new Date().toLocaleString(),
                    isCSVProcessed: false
                };
                localStorage.setItem('csvConversionDetails', JSON.stringify(csvConversionDetails));

                // Process the CSV data according to the selected mode
                utility.updateMasterExpensesFromCSV(mode);

                await writable.close();
                alert('File successfully saved as CSV.');
            } catch (err) {
                alert('Error saving file:', err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // This function helps to replace commas(,) which are delimiter in csv conversion.
    // Not to break the excel file structure when converting to csv
    function transformString(inputString, index) {
        // Find all quoted texts after commas and replace them accordingly
        let outputString = inputString.replace(/,"([^"]*)"/g, function (match, p1) {
            // Replace commas with semicolons inside the quoted text
            let transformedText = p1.replace(/,/g, ';');
            return ',' + transformedText;
        });
        outputString = outputString + ',' + (index === 0 ? 'ID' : '' + index);
        return outputString;
    }

    // util function to find timeago timestamps
    function timeAgo(updatedAt) {
        const now = new Date();
        const updatedTime = new Date(updatedAt);
        const elapsedTime = now - updatedTime; // Time difference in milliseconds

        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (days < 7) {
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else if (weeks < 4) {
            return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        } else if (months < 12) {
            return `${months} month${months === 1 ? '' : 's'} ago`;
        } else {
            return `${years} year${years === 1 ? '' : 's'} ago`;
        }
    }
});