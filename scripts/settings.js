document.addEventListener('DOMContentLoaded', async () => {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses'));

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
    const unmappedHeading = document.getElementById('unmapped-heading');

    const accountModal = document.getElementById('account-modal');
    const accountModalTitle = document.getElementById('account-modal-title');
    const accountForm = document.getElementById('account-form');
    const accountIdInput = document.getElementById('account-id');
    const accountNameInput = document.getElementById('account-name');
    const accountGroupSelect = document.getElementById('account-group-select');
    const closeAccountBtn = accountModal.querySelector('.close-account-btn');
    const cancelAccountBtn = accountForm.querySelector('.cancel-account-btn');
    const deleteAccountBtn = accountForm.querySelector('.delete-account-btn');

    const groupSelectModal = document.getElementById('group-select-modal');
    const groupSelectList = document.getElementById('group-select-list');
    const closeGroupSelectBtn = groupSelectModal.querySelector('.close-group-select-btn');

    let selectedAccount = null;

    let accountGroups = JSON.parse(localStorage.getItem('accountGroups')) || [];
    let accounts = JSON.parse(localStorage.getItem('accounts')) || getAccounts(); //getAccountsOrCategories(masterExpenses, 'Account');
    let accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || {};

    localStorage.setItem('accounts', JSON.stringify(accounts));

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

        accountMappings[groupName].push(account);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
    }

    function handleAccountClick(event) {
        selectedAccount = event.target.dataset.account;
        openGroupSelectModal();
    }

    function openGroupSelectModal() {
        groupSelectList.innerHTML = '';
        accountGroups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.addEventListener('click', () => selectGroupForAccount(group.name));
            groupSelectList.appendChild(li);
        });
        groupSelectModal.style.display = 'flex';
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

        accountMappings[groupName].push(selectedAccount);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        selectedAccount = null;
        closeGroupSelectModal();
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

    function getAccounts() {
        // const result = [];
        // data.forEach(item => {
        //     if (!result.includes(item[key])) {
        //         console.log(item[key] === 'PPF')
        //         result.push(item[key]);
        //     }
        // });
        // return result;

        const accountBalances = JSON.parse(localStorage.getItem('masterExpenses')).reduce((acc, expense) => {
            const account = expense.Account;
            const amount = parseFloat(expense.INR);
            if (!acc[account]) {
                acc[account] = 0;
            }
            if (expense["Income/Expense"] === "Income") {
                acc[account] += amount;
            } else if (expense["Income/Expense"] === "Expense") {
                acc[account] -= amount;
            } else if (expense["Income/Expense"] === "Transfer-Out") {
                acc[account] -= amount;
                const targetAccount = expense.Category;
                if (!acc[targetAccount]) {
                    acc[targetAccount] = 0;
                }
                acc[targetAccount] += amount;
            }
            return acc;
        }, {});

        return Object.keys(accountBalances).flat();
    }
});
