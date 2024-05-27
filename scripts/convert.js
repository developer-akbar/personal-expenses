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
        const csv = XLSX.utils.sheet_to_csv(worksheet);

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
            console.error('Error saving file:', err);
        }
    };
    reader.readAsArrayBuffer(file);
}
