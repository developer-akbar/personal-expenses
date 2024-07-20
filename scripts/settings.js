document.addEventListener('DOMContentLoaded', async () => {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses'));

    const addAccountGroupBtn = document.getElementById('add-account-group-btn');
    const accountGroupsList = document.getElementById('account-groups-list');
    const accountsList = document.getElementById('accounts-list');
    const groupModal = document.getElementById('group-modal');
    const modalTitle = document.getElementById('modal-title');
    const groupForm = document.getElementById('group-form');
    const groupNameInput = document.getElementById('group-name');
    const groupIdInput = document.getElementById('group-id');
    const closeBtn = document.querySelector('.close-button');
    const cancelBtn = document.querySelector('.cancel-btn');
    const unmappedHeading = document.getElementById('unmapped-heading');

    // New elements for group selection modal
    const groupSelectModal = document.getElementById('group-select-modal');
    const groupSelectList = document.getElementById('group-select-list');
    const groupSelectCloseBtn = groupSelectModal.querySelector('.close-button');

    let selectedAccount = null;

    let accountGroups = JSON.parse(localStorage.getItem('accountGroups')) || [];
    let accounts = getAccountsOrCategories(masterExpenses, 'Account');
    let accountMappings = JSON.parse(localStorage.getItem('accountMappings')) || {};

    function renderGroups() {
        accountGroupsList.innerHTML = '';
        accountGroups.forEach(group => {
            const groupBox = document.createElement('div');
            groupBox.classList.add('group-box');
            groupBox.dataset.id = group.id;
            groupBox.innerHTML = `<h3>${group.name}<span class="edit-group">&#9997;</span></h3><ul class="mapped-accounts" id="group-${group.id}"></ul>`;
            accountGroupsList.appendChild(groupBox);

            // Render mapped accounts
            if (accountMappings[group.name]) {
                accountMappings[group.name].forEach(account => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="account-name">${account}</span><span class="remove-btn">X</span>`;
                    li.dataset.account = account;

                    li.querySelector('.remove-btn').addEventListener('click', () => removeAccountFromGroup(group.name, account));
                    groupBox.querySelector('.mapped-accounts').appendChild(li);
                });
            }

            // Initialize sortable for the account group
            const sortableElement = groupBox.querySelector('.mapped-accounts');
            new Sortable(sortableElement, {
                group: {
                    name: 'mapped-accounts',
                    pull: false, // Prevent accounts from being dragged out of the group
                },
                onEnd: function (evt) {
                    const groupName = accountGroups.find(group => group.id == groupBox.dataset.id).name;
                    const targetElement = evt.to;

                    if (targetElement && targetElement.children) {
                        const items = Array.from(targetElement.children);
                        accountMappings[groupName] = items.map(item => item.dataset.account);
                        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

                        // Remove duplicates
                        const uniqueAccounts = [...new Set(accountMappings[groupName])];
                        accountMappings[groupName] = uniqueAccounts;
                        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
                        renderGroups();
                    } else {
                        console.warn('Sortable event target is null or has no children');
                    }
                },
                delay: 300, // Add a delay to activate sorting
                delayOnTouchOnly: true, // Only apply the delay to touch devices
                touchStartThreshold: 3 // Increase threshold to avoid accidental activation
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

        unmappedAccounts.forEach(account => {
            const div = document.createElement('div');
            div.textContent = account;
            div.classList.add('account-item');
            div.dataset.account = account;
            div.setAttribute('draggable', true);
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('click', handleAccountClick); // Add click event for popup
            accountsList.appendChild(div);
        });

        unmappedHeading.style.display = unmappedAccounts.length ? 'block' : 'none';

        // Initialize sortable for the unmapped accounts
        new Sortable(accountsList, {
            group: {
                name: 'unmapped-accounts',
                pull: 'clone', // Allow accounts to be dragged out and cloned
                put: false, // Prevent accounts from being dropped back into the unmapped list
            },
            sort: false
        });
    }

    function openModal(group = {}) {
        modalTitle.textContent = group.id ? 'Edit Group' : 'Add Group';
        groupNameInput.value = group.name || '';
        groupIdInput.value = group.id || '';
        groupModal.style.display = 'flex';
    }

    function closeModal() {
        groupModal.style.display = 'none';
        groupForm.reset();
    }

    function saveGroup(event) {
        event.preventDefault();

        const id = groupIdInput.value ? parseInt(groupIdInput.value, 10) : Date.now();
        const name = groupNameInput.value.trim();

        const groupIndex = accountGroups.findIndex(group => group.id === id);
        if (groupIndex > -1) {
            const oldName = accountGroups[groupIndex].name;
            accountGroups[groupIndex].name = name;

            // Update mappings with new group name
            accountMappings[name] = accountMappings[oldName];
            delete accountMappings[oldName];
        } else {
            accountGroups.push({ id, name });
        }

        localStorage.setItem('accountGroups', JSON.stringify(accountGroups));
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
        closeModal();
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

        if (!accountMappings[groupName]) {
            accountMappings[groupName] = [];
        }

        accountMappings[groupName].push(account);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));

        renderGroups();
    }

    function removeAccountFromGroup(groupName, account) {
        const index = accountMappings[groupName].indexOf(account);
        if (index > -1) {
            accountMappings[groupName].splice(index, 1);
            if (accountMappings[groupName].length === 0) {
                delete accountMappings[groupName];
            }
            localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
            renderGroups();
        }
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
        if (!accountMappings[groupName]) {
            accountMappings[groupName] = [];
        }

        accountMappings[groupName].push(selectedAccount);
        localStorage.setItem('accountMappings', JSON.stringify(accountMappings));
        selectedAccount = null;
        closeGroupSelectModal();
        renderGroups();
    }

    addAccountGroupBtn.addEventListener('click', () => openModal());
    groupForm.addEventListener('submit', saveGroup);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    accountGroupsList.addEventListener('click', handleGroupClick);
    groupSelectCloseBtn.addEventListener('click', closeGroupSelectModal);

    renderGroups();

    function getAccountsOrCategories(data, key) {
        const result = [];
        data.forEach(item => {
            if (!result.includes(item[key])) {
                result.push(item[key]);
            }
        });
        return result;
    }
});
