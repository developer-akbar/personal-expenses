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
        convertToCSV(file);
    };
    document.body.appendChild(script);
});

async function convertToCSV(file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to CSV and replace commas within cell data
        const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n', strip: false })
            .split('\n')
            .map(row =>
                transformString(row).split(',')
                    .map(cell => `${cell.replace(/,/g, ';')}`) // replace commas within cell data and quote the cell
                    .join(',')
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
            await writable.close();
            alert('File successfully saved as CSV.');
        } catch (err) {
            alert('Error saving file:', err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// this function helps to replace commas(,) which are delimiter in csv conversion.
// Not to break the excel file structure when converting to csv
function transformString(inputString) {
    // Find all quoted texts after commas and replace them accordingly
    const outputString = inputString.replace(/,"([^"]*)"/g, function (match, p1) {
        // Replace commas with semicolons inside the quoted text
        let transformedText = p1.replace(/,/g, ';');
        return ',' + transformedText;
    });

    return outputString;
}