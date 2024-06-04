document.addEventListener('DOMContentLoaded', () => {
    const searchLink = document.getElementById('search-link');
    const searchSection = document.getElementById('search-section');
    const clearFiltersButton = document.getElementById('clear-filters');
    const suggestionsDiv = document.getElementById('suggestions');
    const period = document.getElementById('period');
    const periodNavigation = document.getElementById('period-navigation');
    const currentPeriod = document.getElementById('current-period');
    const prevPeriodButton = document.getElementById('prev-period');
    const nextPeriodButton = document.getElementById('next-period');
    const filterToggle = document.getElementById('filter-toggle');
    const filterWrapper = document.getElementById('filter-wrapper');

    document.getElementById('searchInput').focus();
    
    let periodType = 'all';
    let currentDate = new Date();


    document.getElementById('searchInput').addEventListener('input', showSuggestions);
    document.getElementById('searchInput').addEventListener('keydown', navigateSuggestions);
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            let searchResults = performSearch();

            // Show the filter options after performing the search
            if (searchResults.length > 0) {
                clearFiltersButton.style.display = 'inline-block';
                populateFilterOptions(searchResults);
            }
        }
    });
    document.getElementById('searchButton').addEventListener('click', (e) => {
        e.preventDefault();

        // Clear existing options first
        document.getElementById('account-select').querySelector('.custom-options').innerHTML = '<div class="custom-option"><input type="checkbox" value="all"> All</div>';
        document.getElementById('category-select').querySelector('.custom-options').innerHTML = '<div class="custom-option"><input type="checkbox" value="all"> All</div>';

        let searchResults = performSearch();

        // Show the filter options after performing the search
        if (searchResults.length > 0) {
            clearFiltersButton.style.display = 'inline-block';
            populateFilterOptions(searchResults);
        }
    });

    period.addEventListener('change', toggleCustomPeriod);
    period.addEventListener('change', updatePeriodDisplay);
    prevPeriodButton.addEventListener('click', () => changePeriod(-1));
    nextPeriodButton.addEventListener('click', () => changePeriod(1));
    filterToggle.addEventListener('click', () => {
        if (filterWrapper.style.display === 'none' || filterWrapper.style.display === '') {
            filterWrapper.style.display = 'flex';
        } else {
            filterWrapper.style.display = 'none';
        }
    });

    document.getElementById('account-select').addEventListener('change', performSearch);
    document.getElementById('category-select').addEventListener('change', performSearch);
    document.getElementById('incomeExpense-select').addEventListener('change', performSearch);
    document.getElementById('min-amount').addEventListener('change', performSearch);
    document.getElementById('max-amount').addEventListener('change', performSearch);

    document.getElementById('custom-start').addEventListener('change', () => {
        if (document.getElementById('custom-start').value && document.getElementById('custom-end').value) {
            performSearch();
        }
    });
    document.getElementById('custom-end').addEventListener('change', () => {
        if (document.getElementById('custom-start').value && document.getElementById('custom-end').value) {
            performSearch();
        }
    });

    // Initialize custom dropdowns
    initializeCustomSelect('account-select');
    initializeCustomSelect('category-select');
    initializeCustomSelect('incomeExpense-select');

    // Clear all filters
    clearFiltersButton.addEventListener('click', clearAllFilters);

    function toggleCustomPeriod() {
        // periodNavigation.style.display = 'flex';
        const customStart = document.getElementById('custom-start');
        const customEnd = document.getElementById('custom-end');
        if (period.value === 'custom') {
            customStart.style.display = 'inline';
            customEnd.style.display = 'inline';
            periodNavigation.style.display = 'none';
        } else if (['weekly', 'monthly', 'annually'].includes(period.value)) {
            customStart.style.display = 'none';
            customEnd.style.display = 'none';
            periodNavigation.style.display = 'flex';
        } else {
            customStart.style.display = 'none';
            customEnd.style.display = 'none';
            periodNavigation.style.display = 'none';
        }
    }

    function updatePeriodDisplay() {
        periodType = period.value;
        currentDate = new Date(); // Reset to current date on period change
        updatePeriodLabel();
        performSearch();
    }

    function changePeriod(direction) {
        if (periodType === 'weekly') {
            currentDate.setDate(currentDate.getDate() + (direction * 7));
        } else if (periodType === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + direction);
        } else if (periodType === 'annually') {
            currentDate.setFullYear(currentDate.getFullYear() + direction);
        }
        updatePeriodLabel();
        performSearch();
    }

    function updatePeriodLabel() {
        if (periodType === 'weekly') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            currentPeriod.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        } else if (periodType === 'monthly') {
            const month = currentDate.toLocaleString('default', { month: 'long' });
            currentPeriod.textContent = `${month} ${currentDate.getFullYear()}`;
        } else if (periodType === 'annually') {
            currentPeriod.textContent = `${currentDate.getFullYear()}`;
        }
    }

    function showSuggestions() {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = '';

        if (searchInput.length === 0) {
            return;
        }

        const notesSet = new Set();
        const regex = /^[a-zA-Z\s]+$/; // Only letters and spaces

        masterExpenses.forEach(expense => {
            if (regex.test(expense.Note) && expense.Note.toLowerCase().includes(searchInput)) {
                notesSet.add(expense.Note);
            }
        });

        const suggestions = Array.from(notesSet); // Array.from(notesSet).slice(0, 10) Limit to n suggestions
        const suggestionsList = document.createElement('ul');

        suggestions.forEach(suggestion => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion;
            listItem.className = 'suggestion-item';

            listItem.addEventListener('click', () => {
                document.getElementById('searchInput').value = suggestion;
                const searchResults = performSearch();

                // Show the filter options after performing the search
                if (searchResults.length > 0) {
                    clearFiltersButton.style.display = 'inline-block';
                    populateFilterOptions(searchResults);
                }
                suggestionsDiv.innerHTML = '';
            });
            suggestionsList.appendChild(listItem);
        });
        suggestionsDiv.appendChild(suggestionsList);
    }

    function navigateSuggestions(e) {
        const suggestions = document.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;

        let index = Array.from(suggestions).findIndex(item => item.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (index !== -1) {
                suggestions[index].classList.remove('selected');
            }
            index = (index + 1) % suggestions.length;
            suggestions[index].classList.add('selected');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index !== -1) {
                suggestions[index].classList.remove('selected');
            }
            index = (index - 1 + suggestions.length) % suggestions.length;
            suggestions[index].classList.add('selected');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (index !== -1) {
                suggestions[index].click();
            }
        }
    }

    function performSearch() {
        document.querySelector('.selected-total-wrapper').style.display = 'none';

        filterToggle.style.display = 'block';
        
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        const period = document.getElementById('period').value;
        const selectedAccounts = getSelectedCheckboxValues('account-select');
        const selectedCategory = getSelectedCheckboxValues('category-select');
        const selectedIncomeExpense = getSelectedCheckboxValues('incomeExpense-select');
        const customStart = document.getElementById('custom-start').value;
        const customEnd = document.getElementById('custom-end').value;
        const minAmount = document.getElementById('min-amount').value;
        const maxAmount = document.getElementById('max-amount').value;

        let searchResults = masterExpenses.filter(expense => {
            const description = expense.Description.toLowerCase();
            const note = expense.Note.toLowerCase();
            return description.includes(searchInput) || note.includes(searchInput);
        });

        if (period !== 'all') {
            searchResults = searchResults.filter(expense => {
                const expenseDate = new Date(convertDateFormat(expense.Date));
                if (period === 'weekly') {
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
                } else if (period === 'monthly') {
                    return expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear();
                } else if (period === 'annually') {
                    return expenseDate.getFullYear() === currentDate.getFullYear();
                } else if (period === 'custom' && customStart && customEnd) {
                    return expenseDate >= new Date(customStart) && expenseDate <= new Date(customEnd);
                }
            });
        }

        if (selectedAccounts.length > 0) {
            if (selectedAccounts.includes('all')) {
                searchResults = searchResults.filter(expense => true);
            } else {
                searchResults = searchResults.filter(expense => selectedAccounts.includes(expense.Account));
            }
        }

        if (selectedCategory.length > 0) {
            if (selectedCategory.includes('all')) {
                searchResults = searchResults.filter(expense => true);
            } else {
                searchResults = searchResults.filter(expense => selectedCategory.includes(expense.Category));
            }
        }

        if (minAmount || maxAmount) {
            searchResults = searchResults.filter(expense => {
                const price = parseFloat(expense.INR);
                return (!minAmount || price >= minAmount) && (!maxAmount || price <= maxAmount);
            });
        }

        if (selectedIncomeExpense.length > 0) {
            if (selectedIncomeExpense.includes('all')) {
                searchResults = searchResults.filter(expense => true);
            } else {
                searchResults = searchResults.filter(expense => selectedIncomeExpense.includes(expense["Income/Expense"]));
            }
        }

        displaySearchResults(searchResults);
        displaySelectedFilters();

        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = '';

        return searchResults;
    }

    function displaySearchResults(results) {
        // clear previous results
        if (document.getElementById('selected-total')) {
            document.getElementById('selected-total').textContent = '';
        }

        // clear previous results
        document.getElementById('total-income').textContent = `Income: 0.00`;
        document.getElementById('total-expenses').textContent = `Expenses: 0.00`;
        document.getElementById('total-transfers').textContent = `Transfer: 0.00`;

        const searchResultsDiv = document.getElementById('searchResults');
        searchResultsDiv.innerHTML = ''; // Clear previous results

        if (results.length === 0) {
            searchResultsDiv.textContent = 'No matching results found.';
            return;
        } else {
            const resultCountElement = document.createElement('p');
            resultCountElement.classList.add('search-count');
            resultCountElement.innerHTML = `Showing ${results.length} results.`;
            searchResultsDiv.appendChild(resultCountElement);
        }

        const table = document.createElement('table');
        const headerRow = table.insertRow();
        ['Select', 'Date', 'Amount', 'Note', 'Description'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.classList.add(headerText.toLowerCase());
            headerRow.appendChild(th);
        });

        let totalIncome = results.filter(expense => expense["Income/Expense"] === "Income")
            .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);
        let totalExpenses = results.filter(expense => expense["Income/Expense"] === "Expense")
            .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);
        let totalTransfer = results.filter(expense => expense["Income/Expense"] === "Transfer-Out")
            .reduce((total, expense) => total + parseFloat(expense.INR), 0).toFixed(2);

        document.getElementById('total-income').textContent = `Income: ${totalIncome}`;
        document.getElementById('total-expenses').textContent = `Expenses: ${totalExpenses}`;
        document.getElementById('total-transfers').textContent = `Transfer: ${totalTransfer}`;

        results.forEach(result => {
            const row = table.insertRow();

            // Add a checkbox for each row
            const selectCell = row.insertCell();
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'select-checkbox';
            checkbox.addEventListener('change', updateSelectedTotal);
            selectCell.appendChild(checkbox);

            const rowCell = row.insertCell();
            const dateElement = document.createElement('p');
            dateElement.textContent = new Date(convertDateFormat(result.Date)).toDateString();
            dateElement.classList.add('date');
            const accountCategoryElement = document.createElement('p');
            accountCategoryElement.classList.add('account-category');
            accountCategoryElement.textContent = `${result.Account} - ${result.Category}`;
            rowCell.appendChild(dateElement);
            rowCell.appendChild(accountCategoryElement);

            const amountCell = row.insertCell();
            amountCell.textContent = result.INR;
            const type = result['Income/Expense'] === 'Expense' ? 'expense' : result['Income/Expense'] === 'Income' ? 'income' : 'transfer-out';
            amountCell.classList.add('amount', type);
            const noteCell = row.insertCell();
            noteCell.textContent = result.Note;
            noteCell.classList.add('note');
            const descriptionCell = row.insertCell();
            descriptionCell.textContent = result.Description;
            descriptionCell.classList.add('description');
        });

        searchResultsDiv.appendChild(table);
    }

    function updateSelectedTotal() {
        const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
        let selectedTotal = 0;
        selectedCheckboxes.forEach(checkbox => {
            const amountCell = checkbox.closest('tr').querySelector('.amount');
            if (amountCell.classList.contains('expense')) {
                selectedTotal -= parseFloat(amountCell.textContent);
            }
            if (amountCell.classList.contains('income')) {
                selectedTotal += parseFloat(amountCell.textContent);
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

    function populateFilterOptions(searchResults) {
        const accountSet = new Set();
        const categorySet = new Set();

        searchResults.forEach(expense => {
            accountSet.add(expense.Account);
            categorySet.add(expense.Category);
        });

        const accountSelect = document.getElementById('account-select').querySelector('.custom-options');
        const categorySelect = document.getElementById('category-select').querySelector('.custom-options');

        // Clear existing options first
        accountSelect.innerHTML = '<div class="custom-option"><input type="checkbox" value="all"> All</div>';
        categorySelect.innerHTML = '<div class="custom-option"><input type="checkbox" value="all"> All</div>';

        accountSet.forEach(account => {
            const option = document.createElement('div');
            option.className = 'custom-option';
            option.innerHTML = `<input type="checkbox" id="account-${account}" value="${account}"><label for="account-${account}">${account}</label>`;
            accountSelect.appendChild(option);
        });

        categorySet.forEach(category => {
            const option = document.createElement('div');
            option.className = 'custom-option';
            option.innerHTML = `<input type="checkbox" id="category-${category}" value="${category}"><label for="category-${category}">${category}</label>`;
            categorySelect.appendChild(option);
        });

        // Reinitialize custom selects
        initializeCustomSelect('account-select');
        initializeCustomSelect('category-select');
    }

    function getSelectedCheckboxValues(selectId) {
        const checkboxes = document.getElementById(selectId).querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    }

    function initializeCustomSelect(selectId) {
        const selectWrapper = document.getElementById(selectId);
        const options = selectWrapper.querySelectorAll('.custom-option input[type="checkbox"]');

        options.forEach(option => {
            option.addEventListener('change', (event) => {
                performSearch();
            });
        });
    }

    function displaySelectedFilters() {
        const selectedFiltersDiv = document.getElementById('selected-filters');
        selectedFiltersDiv.innerHTML = '';

        const selectedFilters = [
            { id: 'period', name: 'Period', element: document.getElementById('period') },
            { id: 'account-select', name: 'Account', element: document.getElementById('account-select').querySelector('.custom-options') },
            { id: 'category-select', name: 'Category', element: document.getElementById('category-select').querySelector('.custom-options') },
            { id: 'incomeExpense-select', name: 'Type', element: document.getElementById('incomeExpense-select').querySelector('.custom-options') },
            { id: 'min-amount', name: 'Min Amount', element: document.getElementById('min-amount') },
            { id: 'max-amount', name: 'Max Amount', element: document.getElementById('max-amount') }
        ];

        selectedFilters.forEach(filter => {
            let value = '';

            if (filter.element.tagName === 'SELECT') {
                if (filter.element.multiple) {
                    value = getSelectedCheckboxValues(filter.id).join(', ');
                } else {
                    value = filter.element.options[filter.element.selectedIndex].text;
                }
            } else if (filter.element.tagName === 'DIV' && filter.element.querySelectorAll('input[type="checkbox"]:checked').length > 0) {
                value = getSelectedCheckboxValues(filter.id).join(', ');
            } else {
                value = filter.element.value;
            }

            if (value && value !== 'all' && value !== '') {
                const filterSpan = document.createElement('span');
                filterSpan.textContent = `${filter.name}: ${value}`;
                const removeFilter = document.createElement('span');
                removeFilter.textContent = '✖';
                removeFilter.classList.add('remove-filter');
                removeFilter.addEventListener('click', () => {
                    if (filter.element.tagName === 'SELECT') {
                        if (filter.element.multiple) {
                            Array.from(filter.element.querySelectorAll('input[type="checkbox"]:checked')).forEach(checkbox => {
                                checkbox.checked = false;
                            });
                        } else {
                            filter.element.value = 'all';
                        }
                    } else if (filter.element.tagName === 'DIV') {
                        Array.from(filter.element.querySelectorAll('input[type="checkbox"]:checked')).forEach(checkbox => {
                            checkbox.checked = false;
                        });
                    } else {
                        filter.element.value = '';
                    }
                    performSearch();
                });
                filterSpan.appendChild(removeFilter);
                selectedFiltersDiv.appendChild(filterSpan);
            }
        });
    }

    function clearAllFilters() {
        document.getElementById('period').value = 'all';
        document.getElementById('custom-start').value = '';
        document.getElementById('custom-end').value = '';
        document.getElementById('min-amount').value = '';
        document.getElementById('max-amount').value = '';
        document.getElementById('period-navigation').style.display = 'none';

        Array.from(document.querySelectorAll('.custom-select-wrapper input[type="checkbox"]:checked')).forEach(checkbox => {
            checkbox.checked = false;
        });

        performSearch();
    }
});
