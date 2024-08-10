document.addEventListener('DOMContentLoaded', async () => {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

    const addAccountGroupBtn = document.getElementById('add-account-group-btn');
    const addAccountBtn = document.getElementById('add-account-btn');
    const accountGroupsList = document.getElementById('account-groups-list');
    const accountsList = document.getElementById('accounts-list');
    const groupModal = document.getElementById('group-modal');
    const modalTitle = document.getElementById('modal-title');
    const groupForm = document.getElementById('group-form');
    const groupNameInput = document.getElementById('group-name');
    const groupIdInput = document.getElementById('group-id');
    const closeGroupBtn = groupModal.querySelector('.close-group-btn');
    const cancelGroupBtn = groupForm.querySelector('.cancel-group-btn');
    const deleteGroupBtn = groupForm.querySelector('.delete-group-btn');
    const unmappedHeading = document.getElementById('unmapped-accounts-heading');

    const accountModal = document.getElementById('account-modal');
    const accountModalTitle = document.getElementById('account-modal-title');
    const accountForm = document.getElementById('account-form');
    const accountIdInput = document.getElementById('account-id');
    const accountNameInput = document.getElementById('account-name');
    const accountGroupSelect = document.getElementById('account-group-select');
    const closeAccountBtn = accountModal.querySelector('.close-account-btn');
    const cancelAccountBtn = accountForm.querySelector('.cancel-account-btn');
    const deleteAccountBtn = accountForm.querySelector('.delete-account-btn');

    const categoriesList = document.getElementById('categories-list');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const subcategoryModal = document.getElementById('subcategory-modal');
    const subcategoryForm = document.getElementById('subcategory-form');
    const subcategoryNameInput = document.getElementById('subcategory-name');
    const closeCategoryBtn = categoryModal.querySelector('.close-category-btn');
    const closeSubcategoryBtn = subcategoryModal.querySelector('.close-subcategory-btn');
    const cancelCategoryBtn = categoryForm.querySelector('.cancel-category-btn');
    const cancelSubcategoryBtn = subcategoryForm.querySelector('.cancel-subcategory-btn');
    const groupSelectModal = document.getElementById('group-select-modal');
    const groupSelectList = document.getElementById('group-select-list');
    const closeGroupSelectBtn = groupSelectModal.querySelector('.close-group-select-btn');
    const deleteCategoryBtn = categoryModal.querySelector('.delete-category-btn');
    const deleteSubcategoryBtn = subcategoryModal.querySelector('.delete-subcategory-btn');
    const parentCategorySelect = document.getElementById('parent-category-select');
    const unmappedSubcategoriesHeading = document.getElementById('unmapped-subcategories-heading');
    const subcategoriesList = document.getElementById('subcategories-list');

    const unmappedSubcategorySelectModal = document.getElementById('unmapped-subcategory-select-modal');
    const closeUnmappedSubcategorySelectBtn = unmappedSubcategorySelectModal.querySelector('.close-unmapped-subcategory-select-btn');
    const unmappedSubcategoryTitle = document.getElementById('unmapped-subcategory-title');
    const deleteUnmappedSubcategoryBtn = document.getElementById('delete-unmapped-subcategory-btn');
    const unmappedSubcategoryNameSpan = document.getElementById('unmapped-subcategory-name');
    const unmappedSubcategorySelectList = document.getElementById('unmapped-subcategory-select-list');

    const unmappedAccountSelectModal = document.getElementById('unmapped-account-select-modal');
    const closeUnmappedAccountSelectBtn = unmappedAccountSelectModal.querySelector('.close-unmapped-account-select-btn');
    const unmappedAccountTitle = document.getElementById('unmapped-account-title');
    const deleteUnmappedAccountBtn = document.getElementById('delete-unmapped-account-btn');
    const unmappedAccountNameSpan = document.getElementById('unmapped-account-name');
    const unmappedAccountSelectList = document.getElementById('unmapped-account-select-list');

    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    let selectedAccount = null;
    let selectedSubcategory = null;

    let accountGroups = JSON.parse(localStorage.getItem('accountGroups')) || [];
    let accounts = JSON.parse(localStorage.getItem('accounts')) || getAccountsFromMasterExpenses();
    let accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || {};
    let categoriesWithSubcategories = JSON.parse(localStorage.getItem('categories')) || getCategoriesFromMasterExpenses();

    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('categories', JSON.stringify(categoriesWithSubcategories));

    function getAccountsFromMasterExpenses() {
        const accountBalances = masterExpenses.reduce((acc, expense) => {
            const account = expense.Account;
            if (!acc.includes(account)) {
                acc.push(account);
            }
            if (expense["Income/Expense"] === "Transfer-Out") {
                const targetAccount = expense.Category;
                if (!acc.includes(targetAccount)) {
                    acc.push(targetAccount);
                }
            }
            return acc;
        }, []);

        return accountBalances;
    }

    function getCategoriesFromMasterExpenses() {
        const categories = {};
        masterExpenses.forEach(expense => {
            if (expense["Income/Expense"] === 'Expense') {
                if (!categories[expense.Category]) {
                    categories[expense.Category] = { subcategories: [] };
                }
                if (expense.Subcategory && !categories[expense.Category].subcategories.includes(expense.Subcategory)) {
                    categories[expense.Category].subcategories.push(expense.Subcategory);
                }
            }
        });
        return categories;
    }

    function renderGroups() {
        accountGroupsList.innerHTML = '';
        accountGroups.forEach(group => {
            const groupBox = document.createElement('div');
            groupBox.classList.add('group-box');
            groupBox.dataset.id = group.id;
            groupBox.innerHTML = `<h3>${group.name}<span class="edit-group">&#9997;</span></h3><ul class="mapped-accounts" id="group-${group.id}"></ul>`;
            accountGroupsList.appendChild(groupBox);

            if (accountMappings[group.name]) {
                accountMappings[group.name].forEach(account => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="account-name">${account}</span>`;
                    li.dataset.account = account;

                    li.addEventListener('click', () => openAccountModal('edit', group.name, account));
                    groupBox.querySelector('.mapped-accounts').appendChild(li);
                });
            }

            const sortableElement = groupBox.querySelector('.mapped-accounts');
            new Sortable(sortableElement, {
                group: {
                    name: 'mapped-accounts',
                    pull: false,
                },
                onEnd: function (evt) {
                    const groupName = accountGroups.find(group => group.id == groupBox.dataset.id).name;
                    const targetElement = evt.to;

                    if (targetElement && targetElement.children) {
                        const items = Array.from(targetElement.children);
                        accountMappings[groupName] = items.map(item => item.dataset.account);
                        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

                        const uniqueAccounts = [...new Set(accountMappings[groupName])];
                        accountMappings[groupName] = uniqueAccounts;
                        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
                        renderGroups();
                    } else {
                        console.warn('Sortable event target is null or has no children');
                    }
                },
                delay: 300,
                delayOnTouchOnly: true,
                touchStartThreshold: 3
            });

            groupBox.addEventListener('dragover', handleDragOver);
            groupBox.addEventListener('drop', handleDrop);
        });

        renderUnmappedAccounts();
    }

    function renderUnmappedAccounts() {
        accountsList.innerHTML = '';

        const mappedAccounts = Object.values(accountMappings).flat();
        const unmappedAccounts = accounts.filter(account => !mappedAccounts.includes(account));

        const combinedUnmappedAccounts = unmappedAccounts.concat(accountMappings['Unmapped Accounts'] || []);

        combinedUnmappedAccounts.forEach(account => {
            const div = document.createElement('div');
            div.textContent = account;
            div.classList.add('account-item');
            div.dataset.account = account;
            div.setAttribute('draggable', true);
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('click', handleAccountClick);
            accountsList.appendChild(div);
        });

        unmappedHeading.style.display = combinedUnmappedAccounts.length ? 'block' : 'none';

        new Sortable(accountsList, {
            group: {
                name: 'unmapped-accounts',
                pull: 'clone',
                put: false,
            },
            sort: false
        });
    }

    function openModal(group = {}) {
        groupModal.style.display = 'flex';
        modalTitle.textContent = group.id ? 'Edit Group' : 'Add Group';
        groupNameInput.value = group.name || '';

        if (modalTitle.textContent === 'Edit Group') {
            deleteGroupBtn.style.display = 'inline';
            document.querySelector('.save-group-btn').style.display = 'none';
        } else {
            deleteGroupBtn.style.display = 'none';
            document.querySelector('.save-group-btn').style.display = 'inline';
        }

        groupForm.querySelectorAll('.field').forEach(field => {
            field.addEventListener('input', () => {
                deleteGroupBtn.style.display = 'none';
                document.querySelector('.save-group-btn').style.display = 'inline';
            });
        });

        groupIdInput.value = group.id || '';
    }

    function closeModal(modal, form) {
        modal.style.display = 'none';
        form.reset();
    }

    function saveGroup(event) {
        event.preventDefault();

        const id = groupIdInput.value ? parseInt(groupIdInput.value, 10) : Date.now();
        const name = groupNameInput.value.trim();

        const groupIndex = accountGroups.findIndex(group => group.id === id);
        if (groupIndex > -1) {
            const oldName = accountGroups[groupIndex].name;
            accountGroups[groupIndex].name = name;
            accountMappings[name] = accountMappings[oldName];
            delete accountMappings[oldName];
        } else {
            accountGroups.push({ id, name });
        }

        localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal(groupModal, groupForm);
    }

    function handleGroupClick(event) {
        if (event.target.classList.contains('edit-group')) {
            const groupId = parseInt(event.target.closest('.group-box').dataset.id, 10);
            const group = accountGroups.find(group => group.id === groupId);
            openModal(group);
        }
    }

    function handleDragStart(event) {
        if (event.target.closest('#accounts-list')) {
            event.dataTransfer.setData('text/plain', event.target.dataset.account);
        } else {
            event.preventDefault();
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        const account = event.dataTransfer.getData('text/plain');
        const groupId = event.target.closest('.group-box').dataset.id;
        const groupName = accountGroups.find(group => group.id == groupId).name;

        if (accountMappings['Unmapped Accounts']) {
            const index = accountMappings['Unmapped Accounts'].indexOf(account);
            if (index > -1) {
                accountMappings['Unmapped Accounts'].splice(index, 1);
                if (accountMappings['Unmapped Accounts'].length === 0) {
                    delete accountMappings['Unmapped Accounts'];
                }
            }
        }

        if (!accountMappings[groupName]) {
            accountMappings[groupName] = [];
        }

        if (!accounts.includes(account)) accounts.push(account);
        localStorage.setItem('accounts', JSON.stringify(accounts));

        accountMappings[groupName].push(account);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
    }

    function handleAccountClick(event) {
        selectedAccount = event.target.dataset.account;
        openUnmappedAccountSelectModal();
    }

    function openUnmappedAccountSelectModal() {
        unmappedAccountSelectList.innerHTML = '';
        unmappedAccountTitle.textContent = 'Move or Delete Account';
        unmappedAccountNameSpan.textContent = selectedAccount;
        deleteUnmappedAccountBtn.textContent = `Delete ${selectedAccount}`;

        accountGroups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.addEventListener('click', () => selectGroupForAccount(group.name));
            unmappedAccountSelectList.appendChild(li);
        });
        unmappedAccountSelectModal.style.display = 'flex';
    }

    function closeGroupSelectModal() {
        groupSelectModal.style.display = 'none';
    }

    function selectGroupForAccount(groupName) {
        if (accountMappings['Unmapped Accounts']) {
            const index = accountMappings['Unmapped Accounts'].indexOf(selectedAccount);
            if (index > -1) {
                accountMappings['Unmapped Accounts'].splice(index, 1);
                if (accountMappings['Unmapped Accounts'].length === 0) {
                    delete accountMappings['Unmapped Accounts'];
                }
            }
        }

        if (!accountMappings[groupName]) {
            accountMappings[groupName] = [];
        }

        if (!accounts.includes(selectedAccount)) accounts.push(selectedAccount);
        localStorage.setItem('accounts', JSON.stringify(accounts));

        accountMappings[groupName].push(selectedAccount);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        selectedAccount = null;
        closeGroupSelectModal();
        closeUnmappedAccountSelectModal();
        renderGroups();
    }

    addAccountBtn.addEventListener('click', () => {
        openAccountModal();
    });

    // Open modal to create or edit an account
    function openAccountModal(mode, groupName = '', account = '') {
        accountModal.style.display = 'flex';

        if (mode === 'edit') {
            accountModalTitle.textContent = 'Edit Account';
            accountNameInput.value = account;
            accountIdInput.value = account;
            deleteAccountBtn.style.display = 'inline';
            document.querySelector('.save-account-btn').style.display = 'none';

            accountForm.querySelectorAll('.field').forEach(field => {
                field.addEventListener('input', () => {
                    deleteAccountBtn.style.display = 'none';
                    document.querySelector('.save-account-btn').style.display = 'inline';
                });
            });
        } else {
            accountModalTitle.textContent = 'Add New Account';
            accountNameInput.value = '';
            accountIdInput.value = '';
            deleteAccountBtn.style.display = 'none';
            document.querySelector('.save-account-btn').style.display = 'inline';
        }

        accountGroupSelect.innerHTML = '<option value="" disabled selected>Select Group</option>';
        accountGroups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.name;
            option.textContent = group.name;
            if (group.name === groupName) {
                option.selected = true;
            }
            accountGroupSelect.appendChild(option);
        });
    }

    // Close the account modal
    closeAccountBtn.addEventListener('click', () => closeModal(accountModal, accountForm));

    cancelAccountBtn.addEventListener('click', () => closeModal(accountModal, accountForm));

    // Handle account creation and editing
    accountForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const accountId = accountIdInput.value.trim();
        const accountName = accountNameInput.value.trim();
        const selectedGroup = accountGroupSelect.value;

        // Remove account from old group if editing
        if (accountId) {
            for (const group in accountMappings) {
                const index = accountMappings[group].indexOf(accountId);
                if (index > -1) {
                    accountMappings[group].splice(index, 1);
                    if (accountMappings[group].length === 0) {
                        delete accountMappings[group];
                    }
                    break;
                }
            }
        }

        if (!accountMappings[selectedGroup]) {
            accountMappings[selectedGroup] = [];
        }

        accountMappings[selectedGroup].push(accountName);

        if (!accountId) {
            accounts.push(accountName);
        } else {
            accounts = accounts.map(acc => acc === accountId ? accountName : acc);
        }

        localStorage.setItem('accounts', JSON.stringify(accounts));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        closeModal(accountModal, accountForm);
        renderGroups();
    });

    // Delete group and move accounts to unmapped
    function deleteGroup() {
        const groupId = parseInt(groupIdInput.value, 10);
        const groupName = groupNameInput.value.trim();

        // Check if the group has any mappings
        if (accountMappings[groupName]) {
            accountMappings['Unmapped Accounts'] = accountMappings['Unmapped Accounts'] || [];
            accountMappings['Unmapped Accounts'].push(...accountMappings[groupName]);
            delete accountMappings[groupName];
        }

        // Delete the group from the accountGroups array
        accountGroups = accountGroups.filter(group => group.id !== groupId);

        // Update localStorage
        localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal(groupModal, groupForm);
    }

    deleteGroupBtn.addEventListener('click', deleteGroup);

    // Function to remove account
    function removeAccount() {
        const accountName = accountIdInput.value.trim();

        accounts = accounts.filter(acc => acc !== accountName);
        for (const group in accountMappings) {
            accountMappings[group] = accountMappings[group].filter(acc => acc !== accountName);
        }
        accountMappings['Unmapped Accounts'] = accountMappings['Unmapped Accounts'] || [];
        accountMappings['Unmapped Accounts'].push(accountName);

        localStorage.setItem('accounts', JSON.stringify(accounts));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal(accountModal, accountForm);
    }

    deleteAccountBtn.addEventListener('click', removeAccount);

    addAccountGroupBtn.addEventListener('click', () => openModal());
    groupForm.addEventListener('submit', saveGroup);
    closeGroupBtn.addEventListener('click', () => closeModal(groupModal, groupForm));
    cancelGroupBtn.addEventListener('click', () => closeModal(groupModal, groupForm));
    accountGroupsList.addEventListener('click', handleGroupClick);
    closeGroupSelectBtn.addEventListener('click', closeGroupSelectModal);

    renderGroups();

    function renderCategories() {
        categoriesList.innerHTML = '';
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        Object.keys(storedCategories).forEach(category => {
            const categoryBox = document.createElement('div');
            categoryBox.classList.add('group-box');
            categoryBox.dataset.id = category;
            categoryBox.innerHTML = `<h3>${category}<span class="edit-group edit-category">&#9997;</span></h3><ul class="mapped-subcategories" id="category-${category.replace(' ', '-').toLowerCase()}"></ul>`;
            categoriesList.appendChild(categoryBox);

            const subcategoryBox = categoryBox.querySelector('.mapped-subcategories');

            storedCategories[category].subcategories && storedCategories[category].subcategories.forEach(subcategory => {
                const li = document.createElement('li');
                li.classList.add('subcategory-item');
                li.innerHTML = `<span class="subcategory-name">${subcategory}</span>`;
                li.dataset.subcategory = subcategory;

                li.addEventListener('click', () => openSubcategoryModal('edit', category, subcategory));
                categoryBox.querySelector('.mapped-subcategories').appendChild(li);
            });

            new Sortable(subcategoryBox, {
                group: {
                    name: 'mapped-subcategories',
                    pull: false,
                },
                onEnd: function (evt) {
                    const targetElement = evt.to;
                    const items = Array.from(targetElement.children);
                    storedCategories[category].subcategories = items.map(item => item.dataset.subcategory);
                    localStorage.setItem('categories', JSON.stringify(storedCategories));
                    renderCategories();
                },
                delay: 300,
                delayOnTouchOnly: true,
                touchStartThreshold: 3
            });

            categoryBox.querySelector('.edit-category').addEventListener('click', () => {
                openCategoryModal('edit', category);
            });
        });

        renderUnmappedSubcategories();
    }

    function renderUnmappedSubcategories() {
        subcategoriesList.innerHTML = '';

        const mappedSubcategories = Object.values(categoriesWithSubcategories).flatMap(cat => cat.subcategories);
        const unmappedSubcategories = categoriesWithSubcategories['Unmapped Subcategories'] || [];
        // const unmappedSubcategories = Object.keys(categoriesWithSubcategories).flatMap(category =>
        //     categoriesWithSubcategories[category].subcategories.filter(subcat => !mappedSubcategories.includes(subcat))
        // );

        unmappedSubcategories.forEach(subcategory => {
            const div = document.createElement('div');
            div.textContent = subcategory;
            div.classList.add('subcategory-item');
            div.dataset.subcategory = subcategory;
            div.setAttribute('draggable', true);
            div.addEventListener('dragstart', handleDragStartSubcategory);
            div.addEventListener('click', handleSubcategoryClick);
            subcategoriesList.appendChild(div);
        });

        unmappedSubcategoriesHeading.style.display = unmappedSubcategories.length ? 'block' : 'none';

        new Sortable(subcategoriesList, {
            group: {
                name: 'unmapped-subcategories',
                pull: 'clone',
                put: false,
            },
            sort: false
        });
    }

    function openCategoryModal(mode, categoryName = '') {
        if (mode === 'edit') {
            categoryModal.querySelector('h2').textContent = 'Edit Category';
            categoryNameInput.value = categoryName;
            deleteCategoryBtn.style.display = 'inline';
            document.querySelector('.save-category-btn').style.display = 'none';
            categoryForm.querySelectorAll('.field').forEach(field => {
                field.addEventListener('input', () => {
                    deleteCategoryBtn.style.display = 'none';
                    document.querySelector('.save-category-btn').style.display = 'inline';
                });
            });
        } else {
            categoryModal.querySelector('h2').textContent = 'Add Category';
            categoryNameInput.value = '';
            deleteCategoryBtn.style.display = 'none';
        }
        categoryModal.style.display = 'flex';
    }

    function openSubcategoryModal(mode, categoryName = '', subcategoryName = '') {
        if (mode === 'edit') {
            subcategoryModal.querySelector('h2').textContent = 'Edit Subcategory';
            subcategoryNameInput.value = subcategoryName;
            deleteSubcategoryBtn.style.display = 'inline';
            document.querySelector('.save-subcategory-btn').style.display = 'none';
            subcategoryForm.querySelectorAll('.field').forEach(field => {
                field.addEventListener('input', () => {
                    deleteSubcategoryBtn.style.display = 'none';
                    document.querySelector('.save-subcategory-btn').style.display = 'inline';
                });
            });
        } else {
            subcategoryModal.querySelector('h2').textContent = 'Add Subcategory';
            subcategoryNameInput.value = '';
            deleteSubcategoryBtn.style.display = 'none';
        }
        subcategoryModal.dataset.category = categoryName;
        subcategoryModal.dataset.subcategory = subcategoryName;
        subcategoryModal.style.display = 'flex';
        parentCategorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
        Object.keys(categoriesWithSubcategories).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === categoryName) {
                option.selected = true;
            }
            parentCategorySelect.appendChild(option);
        });
    }

    function handleDragStartSubcategory(event) {
        if (event.target.closest('#subcategories-list')) {
            event.dataTransfer.setData('text/plain', event.target.dataset.subcategory);
        } else {
            event.preventDefault();
        }
    }

    function handleSubcategoryClick(event) {
        selectedSubcategory = event.target.dataset.subcategory;
        openUnmappedSubcategorySelectModal();
    }

    function openUnmappedSubcategorySelectModal() {
        unmappedSubcategorySelectList.innerHTML = '';
        unmappedSubcategoryTitle.textContent = 'Move or Delete Subcategory';
        unmappedSubcategoryNameSpan.textContent = selectedSubcategory;
        deleteUnmappedSubcategoryBtn.textContent = `Delete ${selectedSubcategory}`;

        Object.keys(categoriesWithSubcategories).forEach(category => {
            const li = document.createElement('li');
            li.textContent = category;
            li.addEventListener('click', () => selectCategoryForSubcategory(category));
            unmappedSubcategorySelectList.appendChild(li);
        });
        const deleteButton = document.createElement('button');
        deleteButton.textContent = `Delete ${selectedSubcategory}`;
        deleteButton.addEventListener('click', () => deleteUnmappedSubcategory());
        unmappedSubcategorySelectModal.querySelector('.modal-content').appendChild(deleteButton);
        unmappedSubcategorySelectModal.style.display = 'flex';
    }

    function deleteUnmappedAccount() {
        const storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const unmappedAccounts = accountMappings['Unmapped Accounts'] || [];
        const accountIndex = unmappedAccounts.indexOf(selectedAccount);
        if (accountIndex > -1) {
            unmappedAccounts.splice(accountIndex, 1);
        }

        const accountIndexInAccounts = storedAccounts.indexOf(selectedAccount);
        if (accountIndexInAccounts > -1) {
            storedAccounts.splice(accountIndexInAccounts, 1);
        }

        localStorage.setItem('accounts', JSON.stringify(storedAccounts));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        renderGroups();
        closeUnmappedAccountSelectModal();
    }

    function deleteUnmappedSubcategory() {
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};
        const index = storedCategories['Unmapped Subcategories'].indexOf(selectedSubcategory);
        if (index > -1) {
            storedCategories['Unmapped Subcategories'].splice(index, 1);
            localStorage.setItem('categories', JSON.stringify(storedCategories));
            renderCategories();
            closeUnmappedSubcategorySelectModal();
        }
    }

    function openCategorySelectModal() {
        groupSelectList.innerHTML = '';
        Object.keys(categoriesWithSubcategories).forEach(category => {
            const li = document.createElement('li');
            li.textContent = category;
            li.addEventListener('click', () => selectCategoryForSubcategory(category));
            groupSelectList.appendChild(li);
        });
        groupSelectModal.style.display = 'flex';
    }

    function selectCategoryForSubcategory(categoryName) {
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        if (!storedCategories[categoryName].subcategories.includes(selectedSubcategory)) {
            storedCategories[categoryName].subcategories.push(selectedSubcategory);
        }

        if (accountMappings['Unmapped Categories']) {
            const index = accountMappings['Unmapped Categories'].indexOf(selectedSubcategory);
            if (index > -1) {
                accountMappings['Unmapped Categories'].splice(index, 1);
                if (accountMappings['Unmapped Categories'].length === 0) {
                    delete accountMappings['Unmapped Categories'];
                }
            }
        }

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        selectedSubcategory = null;
        closeUnmappedSubcategorySelectModal();
        renderCategories();
    }

    function closeUnmappedSubcategorySelectModal() {
        unmappedSubcategorySelectModal.style.display = 'none';
    }

    function closeUnmappedAccountSelectModal() {
        unmappedAccountSelectModal.style.display = 'none';
    }

    function closeGroupSelectModal() {
        groupSelectModal.style.display = 'none';
    }

    function saveCategory(event) {
        event.preventDefault();
        const categoryName = categoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        if (categoryModal.querySelector('h2').textContent === 'Add Category') {
            storedCategories[categoryName] = { subcategories: [] };
        } else {
            const oldCategoryName = categoryModal.querySelector('h2').dataset.category;
            if (oldCategoryName !== categoryName) {
                storedCategories[categoryName] = storedCategories[oldCategoryName];
                delete storedCategories[oldCategoryName];
            }
        }

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(categoryModal, categoryForm);
    }

    function saveSubcategory(event) {
        event.preventDefault();
        const categoryName = parentCategorySelect.value;
        const subcategoryName = subcategoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        if (subcategoryModal.querySelector('h2').textContent === 'Add Subcategory') {
            if (!storedCategories[categoryName].subcategories.includes(subcategoryName)) {
                storedCategories[categoryName].subcategories.push(subcategoryName);
            }
        } else {
            const oldCategoryName = subcategoryModal.dataset.category;
            const oldSubcategoryName = subcategoryModal.dataset.subcategory;
            const subcategoryIndex = storedCategories[oldCategoryName].subcategories.indexOf(oldSubcategoryName);
            if (subcategoryIndex > -1) {
                storedCategories[oldCategoryName].subcategories.splice(subcategoryIndex, 1);
            }

            if (!storedCategories[categoryName].subcategories.includes(subcategoryName)) {
                storedCategories[categoryName].subcategories.push(subcategoryName);
            }
        }

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(subcategoryModal, subcategoryForm);
    }

    function deleteCategory() {
        const categoryName = categoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};
        delete storedCategories[categoryName];
        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(categoryModal, categoryForm);
    }

    function deleteSubcategory() {
        const categoryName = subcategoryModal.dataset.category;
        const subcategoryName = subcategoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        const subcategoryIndex = storedCategories[categoryName].subcategories.indexOf(subcategoryName);
        if (subcategoryIndex > -1) {
            storedCategories[categoryName].subcategories.splice(subcategoryIndex, 1);
        }

        if (!storedCategories['Unmapped Subcategories']) {
            storedCategories['Unmapped Subcategories'] = [];
        }
        storedCategories['Unmapped Subcategories'].push(subcategoryName);

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(subcategoryModal, subcategoryForm);
    }

    deleteUnmappedSubcategoryBtn.addEventListener('click', () => {
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        for (const category in storedCategories) {
            if (storedCategories[category].subcategories) {
                const subcategoryIndex = storedCategories[category].subcategories.indexOf(selectedSubcategory);
                if (subcategoryIndex > -1) {
                    storedCategories[category].subcategories.splice(subcategoryIndex, 1);
                    if (storedCategories[category].subcategories.length === 0) {
                        delete storedCategories[category];
                    }
                    break;
                }
            }
        }

        if (categoriesWithSubcategories['Unmapped Subcategories']) {
            const index = categoriesWithSubcategories['Unmapped Subcategories'].indexOf(selectedSubcategory);
            if (index > -1) {
                categoriesWithSubcategories['Unmapped Subcategories'].splice(index, 1);
                if (categoriesWithSubcategories['Unmapped Subcategories'].length === 0) {
                    delete categoriesWithSubcategories['Unmapped Subcategories'];
                }
            }
        }

        localStorage.setItem('categories', JSON.stringify(storedCategories));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        selectedSubcategory = null;
        closeUnmappedSubcategorySelectModal();
        renderCategories();
    });

    categoryForm.addEventListener('submit', saveCategory);
    subcategoryForm.addEventListener('submit', saveSubcategory);
    deleteCategoryBtn.addEventListener('click', deleteCategory);
    deleteSubcategoryBtn.addEventListener('click', deleteSubcategory);
    closeCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    closeSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));
    cancelCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    cancelSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));
    closeUnmappedSubcategorySelectBtn.addEventListener('click', closeUnmappedSubcategorySelectModal);
    closeUnmappedAccountSelectBtn.addEventListener('click', closeUnmappedAccountSelectModal);
    deleteUnmappedAccountBtn.addEventListener('click', deleteUnmappedAccount);

    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal('add'));
    document.getElementById('add-subcategory-btn').addEventListener('click', () => openSubcategoryModal('add'));

    renderCategories();
});
