document.addEventListener('DOMContentLoaded', async () => {
    const masterExpenses = JSON.parse(localStorage.getItem('masterExpenses')) || [];

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

    const categoriesWithSubcategories = getCategoriesWithSubcategories();
    localStorage.setItem('categories', JSON.stringify(categoriesWithSubcategories));

    const categoriesList = document.getElementById('categories-list');
    const categoryModal = document.getElementById('category-modal');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const closeCategoryBtn = categoryModal.querySelector('.close-category-btn');
    const deleteCategoryBtn = categoryModal.querySelector('.delete-category-btn');
    const subcategoryModal = document.getElementById('subcategory-modal');
    const subcategoryForm = document.getElementById('subcategory-form');
    const subcategoryNameInput = document.getElementById('subcategory-name');
    const closeSubcategoryBtn = subcategoryModal.querySelector('.close-subcategory-btn');
    const deleteSubcategoryBtn = subcategoryModal.querySelector('.delete-subcategory-btn');

    function renderCategories() {
        categoriesList.innerHTML = '';
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        Object.keys(storedCategories).forEach(category => {
            const categoryBox = document.createElement('div');
            categoryBox.classList.add('category-box');
            categoryBox.dataset.id = category;
            categoryBox.innerHTML = `
                <h3>${category}<span class="edit-category">&#9997;</span></h3>
                <div class="subcategory-list" id="category-${category}"></div>
            `;
            categoriesList.appendChild(categoryBox);

            const subcategoryBox = categoryBox.querySelector('.subcategory-list');

            storedCategories[category].subcategories.forEach(subcategory => {
                const subcategoryDiv = document.createElement('div');
                subcategoryDiv.classList.add('subcategory-item');
                subcategoryDiv.dataset.subcategory = subcategory;
                subcategoryDiv.innerHTML = `
                    <span>${subcategory}</span>
                    <span class="edit-subcategory">&#9997;</span>
                `;
                subcategoryBox.appendChild(subcategoryDiv);

                subcategoryDiv.querySelector('.edit-subcategory').addEventListener('click', () => {
                    openSubcategoryModal('edit', category, subcategory);
                });
            });

            categoryBox.querySelector('.edit-category').addEventListener('click', () => {
                openCategoryModal('edit', category);
            });
        });
    }

    function openCategoryModal(mode, categoryName = '') {
        if (mode === 'edit') {
            categoryModal.querySelector('h2').textContent = 'Edit Category';
            categoryNameInput.value = categoryName;
            deleteCategoryBtn.style.display = 'inline';
        } else {
            categoryModal.querySelector('h2').textContent = 'Add Category';
            categoryNameInput.value = '';
            deleteCategoryBtn.style.display = 'none';
        }
        categoryModal.style.display = 'flex';
    }

    function openSubcategoryModal(mode, categoryName, subcategoryName = '') {
        if (mode === 'edit') {
            subcategoryModal.querySelector('h2').textContent = 'Edit Subcategory';
            subcategoryNameInput.value = subcategoryName;
            deleteSubcategoryBtn.style.display = 'inline';
        } else {
            subcategoryModal.querySelector('h2').textContent = 'Add Subcategory';
            subcategoryNameInput.value = '';
            deleteSubcategoryBtn.style.display = 'none';
        }
        subcategoryModal.dataset.category = categoryName;
        subcategoryModal.style.display = 'flex';
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
            const oldCategoryName = categoryModal.querySelector('h2').dataset.oldCategoryName;
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
        const categoryName = subcategoryModal.dataset.category;
        const subcategoryName = subcategoryNameInput.value.trim();
        const storedCategories = JSON.parse(localStorage.getItem('categories')) || {};

        if (subcategoryModal.querySelector('h2').textContent === 'Add Subcategory') {
            storedCategories[categoryName].subcategories.push(subcategoryName);
        } else {
            const oldSubcategoryName = subcategoryModal.querySelector('h2').dataset.oldSubcategoryName;
            const subcategoryIndex = storedCategories[categoryName].subcategories.indexOf(oldSubcategoryName);
            storedCategories[categoryName].subcategories[subcategoryIndex] = subcategoryName;
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

    categoryForm.addEventListener('submit', saveCategory);
    subcategoryForm.addEventListener('submit', saveSubcategory);
    deleteCategoryBtn.addEventListener('click', deleteCategory);
    deleteSubcategoryBtn.addEventListener('click', deleteSubcategory);
    closeCategoryBtn.addEventListener('click', () => closeModal(categoryModal, categoryForm));
    closeSubcategoryBtn.addEventListener('click', () => closeModal(subcategoryModal, subcategoryForm));

    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal('add'));

    renderCategories();
});
