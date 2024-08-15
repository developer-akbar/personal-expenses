document.addEventListener('DOMContentLoaded', async () => {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

    const categoriesList = document.getElementById('categories-list');
    const subcategoriesList = document.getElementById('subcategories-list');
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
    const deleteCategoryBtn = categoryModal.querySelector('.delete-category-btn');
    const deleteSubcategoryBtn = subcategoryModal.querySelector('.delete-subcategory-btn');
    const parentCategorySelect = document.getElementById('parent-category-select');
    const unmappedHeading = document.getElementById('unmapped-heading');

    let selectedSubcategory = null;

    function getCategoriesWithSubcategories() {
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

    const categoriesWithSubcategories = JSON.parse(localStorage.getItem('categories')) || getCategoriesWithSubcategories();
    localStorage.setItem('categories', JSON.stringify(categoriesWithSubcategories));

    function renderCategories() {
        categoriesList.innerHTML = '';
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        Object.keys(storedCategories).forEach(category => {
            const categoryBox = document.createElement('div');
            categoryBox.classList.add('group-box');
            categoryBox.dataset.id = category;
            categoryBox.innerHTML = `
                <h3>${category}<span class="edit-category">&#9997;</span></h3>
                <ul class="mapped-subcategories" id="category-${category}"></ul>
            `;
            categoriesList.appendChild(categoryBox);

            const subcategoryBox = categoryBox.querySelector('.mapped-subcategories');

            storedCategories[category].subcategories.forEach(subcategory => {
                const li = document.createElement('li');
                li.classList.add('subcategory-item');
                li.innerHTML = `<span class="subcategory-name">${subcategory}</span>`;
                li.dataset.subcategory = subcategory;

                li.addEventListener('click', () => openSubcategoryModal('edit', category, subcategory));
                subcategoryBox.appendChild(li);
            });

            const sortableElement = subcategoryBox;
            new Sortable(sortableElement, {
                group: {
                    name: 'mapped-subcategories',
                    pull: false,
                },
                onEnd: function (evt) {
                    const categoryName = categoryBox.dataset.id;
                    const targetElement = evt.to;

                    if (targetElement && targetElement.children) {
                        const items = Array.from(targetElement.children);
                        categoriesWithSubcategories[categoryName].subcategories = items.map(item => item.dataset.subcategory);
                        localStorage.setItem('categories', JSON.stringify(categoriesWithSubcategories));
                        renderCategories();
                    } else {
                        console.warn('Sortable event target is null or has no children');
                    }
                },
                delay: 300,
                delayOnTouchOnly: true,
                touchStartThreshold: 3
            });

            categoryBox.addEventListener('dragover', handleDragOver);
            categoryBox.addEventListener('drop', handleDrop);
            categoryBox.querySelector('.edit-category').addEventListener('click', () => openCategoryModal('edit', category));
        });

        renderUnmappedSubcategories();
    }

    function renderUnmappedSubcategories() {
        subcategoriesList.innerHTML = '';

        const mappedSubcategories = Object.values(categoriesWithSubcategories).flatMap(category => category.subcategories);
        const unmappedSubcategories = Object.keys(categoriesWithSubcategories).flatMap(category => categoriesWithSubcategories[category].subcategories).filter(subcategory => !mappedSubcategories.includes(subcategory));

        unmappedSubcategories.forEach(subcategory => {
            const div = document.createElement('div');
            div.textContent = subcategory;
            div.classList.add('subcategory-item');
            div.dataset.subcategory = subcategory;
            div.setAttribute('draggable', true);
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('click', handleSubcategoryClick);
            subcategoriesList.appendChild(div);
        });

        unmappedHeading.style.display = unmappedSubcategories.length ? 'block' : 'none';

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

    function closeModal(modal, form) {
        modal.style.display = 'none';
        form.reset();
    }

    function saveCategory(event) {
        event.preventDefault();
        const categoryName = categoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        if (categoryModal.querySelector('h2').textContent === 'Add Category') {
            storedCategories[categoryName] = { subcategories: [] };
        } else {
            const oldCategoryName = categoryModal.dataset.category;
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
            storedCategories[categoryName].subcategories.push(subcategoryName);
        } else {
            const oldCategoryName = subcategoryModal.dataset.category;
            const oldSubcategoryName = subcategoryModal.dataset.subcategory;
            const subcategoryIndex = storedCategories[oldCategoryName].subcategories.indexOf(oldSubcategoryName);
            if (oldCategoryName === categoryName) {
                storedCategories[categoryName].subcategories[subcategoryIndex] = subcategoryName;
            } else {
                storedCategories[oldCategoryName].subcategories.splice(subcategoryIndex, 1);
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
        storedCategories[categoryName].subcategories.splice(subcategoryIndex, 1);
        localStorage.setItem('categories', JSON.stringify(storedCategories));
        renderCategories();
        closeModal(subcategoryModal, subcategoryForm);
    }

    function handleDragStart(event) {
        if (event.target.closest('#subcategories-list')) {
            event.dataTransfer.setData('text/plain', event.target.dataset.subcategory);
        } else {
            event.preventDefault();
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        const subcategory = event.dataTransfer.getData('text/plain');
        const categoryId = event.target.closest('.group-box').dataset.id;
        const categoryName = categoryId;

        if (categoriesWithSubcategories['Unmapped Subcategories']) {
            const index = categoriesWithSubcategories['Unmapped Subcategories'].indexOf(subcategory);
            if (index > -1) {
                categoriesWithSubcategories['Unmapped Subcategories'].splice(index, 1);
                if (categoriesWithSubcategories['Unmapped Subcategories'].length === 0) {
                    delete categoriesWithSubcategories['Unmapped Subcategories'];
                }
            }
        }

        if (!categoriesWithSubcategories[categoryName]) {
            categoriesWithSubcategories[categoryName] = { subcategories: [] };
        }

        categoriesWithSubcategories[categoryName].subcategories.push(subcategory);
        localStorage.setItem('categories', JSON.stringify(categoriesWithSubcategories));

        renderCategories();
    }

    function handleSubcategoryClick(event) {
        selectedSubcategory = event.target.dataset.subcategory;
        openSubcategorySelectModal();
    }

    function openSubcategorySelectModal() {
        subcategorySelectList.innerHTML = '';
        Object.keys(categoriesWithSubcategories).forEach(category => {
            const li = document.createElement('li');
            li.textContent = category;
            li.addEventListener('click', () => selectCategoryForSubcategory(category));
            subcategorySelectList.appendChild(li);
        });
        subcategorySelectModal.style.display = 'flex';
    }

    function closeSubcategorySelectModal() {
        subcategorySelectModal.style.display = 'none';
    }

    function selectCategoryForSubcategory(categoryName) {
        if (categoriesWithSubcategories['Unmapped Subcategories']) {
            const index = categoriesWithSubcategories['Unmapped Subcategories'].indexOf(selectedSubcategory);
            if (index > -1) {
                categoriesWithSubcategories['Unmapped Subcategories'].splice(index, 1);
                if (categoriesWithSubcategories['Unmapped Subcategories'].length === 0) {
                    delete categoriesWithSubcategories['Unmapped Subcategories'];
                }
            }
        }

        if (!categoriesWithSubcategories[categoryName]) {
            categoriesWithSubcategories[categoryName] = { subcategories: [] };
        }

        categoriesWithSubcategories[categoryName].subcategories.push(selectedSubcategory);
        localStorage.setItem('categories', JSON.stringify(categoriesWithSubcategories));
        selectedSubcategory = null;
        closeSubcategorySelectModal();
        renderCategories();
    }

    categoryForm.addEventListener('submit', saveCategory);
    subcategoryForm.addEventListener('submit', saveSubcategory);
    deleteCategoryBtn.addEventListener('click', deleteCategory);
    deleteSubcategoryBtn.addEventListener('click', deleteSubcategory);
    closeCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    closeSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));
    cancelCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    cancelSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));

    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal('add'));
    document.getElementById('add-subcategory-btn').addEventListener('click', () => openSubcategoryModal('add'));

    renderCategories();
});
