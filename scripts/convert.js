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

        // Show loader
        document.getElementById('loader').style.display = 'block';

        // Load XLSX library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js';
        script.onload = () => {
            checkForExistingData(file);
        };
        document.body.appendChild(script);
    });

    function checkForExistingData(file) {
        const existingData = localStorage.getItem('masterExpenses');
        if (existingData) {
            // Show modal if data already exists
            showConsentModal(file);
        } else {
            // No existing data, proceed to convert
            convertToCSV(file);
        }
    }

    function showConsentModal(file) {
        const modal = document.getElementById('consent-modal');
        const closeButton = modal.querySelector('.close-button');
        const mergeButton = document.getElementById('mergeButton');
        const overrideButton = document.getElementById('overrideButton');

        // Show the modal
        modal.style.display = 'flex';

        // Close the modal
        closeButton.onclick = () => {
            modal.style.display = 'none';
            // Hide loader if the modal is closed without action
            document.getElementById('loader').style.display = 'none';
        };

        // When user clicks merge
        mergeButton.onclick = () => {
            modal.style.display = 'none';
            convertToCSV(file, 'merge');
        };

        // When user clicks override
        overrideButton.onclick = () => {
            modal.style.display = 'none';
            convertToCSV(file, 'override');
        };
    }

    async function convertToCSV(file, mode = 'override') {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            try {
                // Convert worksheet to CSV data, replacing line breaks in cells
                let csvData = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n', strip: false });

                // Handle line breaks within cells
                csvData = csvData.replace(/"([^"]*)"/g, function (match, p1) {
                    return p1.replace(/\n/g, '|new-line|').replace(/,/g, '|comma|');
                });

                // Now split the CSV into rows
                const rows = csvData.split('\n').map((row, index) => {
                    return row.length > 0
                        ? transformString(row, index).split(',').map(cell => `${cell.replace(/,/g, ';')}`).join(',')
                        : '';
                }).join('\n');

                // Process the CSV data without saving it
                await utility.updateMasterExpensesFromCSV(rows, mode);

                // Save CSV conversion status and update time in local storage
                const csvConversionDetails = {
                    updated_at: new Date().toLocaleString(),
                    isCSVProcessed: false
                };
                localStorage.setItem('csvConversionDetails', JSON.stringify(csvConversionDetails));

                alert('Data processed successfully.');
                location.reload();
            } catch (err) {
                alert('Error processing data:', err.message);
                console.error('Error processing data:', err);
            } finally {
                // Hide loader after processing is done
                document.getElementById('loader').style.display = 'none';
            }
        };
        reader.readAsArrayBuffer(file);
    }


    // This function helps to replace commas(,) which are delimiter in csv conversion.
    // Not to break the excel file structure when converting to csv
    // Replace line breaks inside the quoted text with a pipe symbol
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