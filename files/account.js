const apiUrl = "http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd"; // URL API для получения заказов
let currentPage = 1; // текущая страница для пагинации
const ordersPerPage = 5; 

// для загрузки заказов с учетом пагинации
async function loadOrders(page = 1) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки данных: ${response.status}`);
        }

        const orders = await response.json();

        const totalPages = Math.ceil(orders.length / ordersPerPage);

        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const paginatedOrders = orders.slice(startIndex, endIndex);

        displayOrders(paginatedOrders);
        displayPagination(page, totalPages);
    } catch (error) {
        console.error("Ошибка при загрузке заказов:", error);
    }
}


// для получения названия курса по его ID

async function fetchCourseName(courseId) {
    if (courseId == 7) {
        return "Занятие с репетитором";
    }
    const course = allCourses.find(course => course.id === courseId).name;
    if (!course) {
        return "Курс не найден";
    }
    return course;
}



// для отображения заказов в таблице
async function displayOrders(orders) {
    const tableBody = document.getElementById("ordersTableBody");
    tableBody.innerHTML = ""; 

    for (const order of orders) {
        const courseName = await fetchCourseName(order.course_id);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="dark-lighted">${order.id}</td>
            <td class="dark-lighted">${courseName}</td>
            <td class="dark-lighted">${order.date_start}</td>
            <td class="dark-lighted">${order.price} руб.</td>
            <td class="dark-lighted">
                <button class="btn red-button btn-sm" onclick="showDetails(${order.id})">Подробнее</button>
                <button class="btn red-button btn-sm" onclick="editOrder(${order.id})">Изменить</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${order.id})">Удалить</button>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

//смена страницы через пагинацию

function changePage(page) {
    currentPage = page;
    loadOrders(page); 
}

// для отображения кнопок пагинации
function displayPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = ""; 

    const prevButton = document.createElement("li");
    prevButton.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevButton.innerHTML = `<a class="page-link dark-lighted" href="#" onclick="changePage(${currentPage - 1})">Предыдущая</a>`;
    paginationContainer.appendChild(prevButton);

    for (let page = 1; page <= totalPages; page++) {
        const pageButton = document.createElement("li");
        pageButton.className = `page-item ${page === currentPage ? "active" : ""}`;
        pageButton.innerHTML = `<a class="page-link dark-lighted" href="#" onclick="changePage(${page})">${page}</a>`;
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement("li");
    nextButton.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextButton.innerHTML = `<a class="page-link dark-lighted" href="#" onclick="changePage(${currentPage + 1})">Следующая</a>`;
    paginationContainer.appendChild(nextButton);
}

// для отображения деталей заказа
async function showDetails(orderId) {
    const apiUrl = `http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders/${orderId}?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd`;

    try {

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const order = await response.json();
        const courseName = await fetchCourseName(order.course_id);

        const modalBody = document.querySelector("#detailsModal .modal-body");
        modalBody.innerHTML = `
            <p><strong>ID заказа:</strong> ${order.id}</p>
            <p><strong>Название курса:</strong> ${courseName}</p>
            <p><strong>Дата начала:</strong> ${order.date_start}</p>
            <p><strong>Стоимость:</strong> ${order.price} руб.</p>
            <p><strong>Количество участников:</strong> ${order.persons}</p>
            <p><strong>Дополнительные опции:</strong></p>
            <ul>
                <li><strong>Ранняя регистрация:</strong> ${order.earlyRegistration ? "Да" : "Нет"}</li>
                <li><strong>Групповое обучение:</strong> ${order.groupEnrollment ? "Да" : "Нет"}</li>
            </ul>
        `;

        const detailsModal = new bootstrap.Modal(document.getElementById("detailsModal"));
        detailsModal.show();
    } catch (error) {
        console.error("Ошибка при загрузке деталей заказа:", error);
        alert("Не удалось загрузить детали заказа. Попробуйте позже.");
    }
}


let orderIdToEdit = null; // хранит ID заказа, который нужно редактировать

async function editOrder(orderId) {
    orderIdToEdit = orderId; 

    try {
        const response = await fetch(`http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders/${orderId}?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd`);
        if (!response.ok) {
            throw new Error(`Ошибка получения данных заказа: ${response.status}`);
        }

        const order = await response.json();
        const courseName = await fetchCourseName(order.course_id);

        document.getElementById("editCourseName").value = courseName;
        document.getElementById("editDateStart").value = order.date_start;
        document.getElementById("editTimeStart").value = order.time_start;
        document.getElementById("editDuration").value = order.duration;
        document.getElementById("editPersons").value = order.persons;
        document.getElementById("editPrice").value = order.price;

        const editModal = new bootstrap.Modal(document.getElementById("editModal"));
        editModal.show();
    } catch (error) {
        console.error("Ошибка при загрузке данных для редактирования:", error);
        alert("Не удалось загрузить данные заказа. Попробуйте снова.");
    }
}

// для сохранения изменений
async function saveOrderChanges(event) {
    event.preventDefault(); 

    if (!orderIdToEdit) return;

    try {
        // собираем данные из формы
        const updatedData = {};
        updatedData.date_start = document.getElementById("editDateStart").value;
        updatedData.time_start = document.getElementById("editTimeStart").value;
        updatedData.duration = parseInt(document.getElementById("editDuration").value, 10);
        updatedData.persons = parseInt(document.getElementById("editPersons").value, 10);
        updatedData.price = parseFloat(document.getElementById("editPrice").value);
        
        const response = await fetch(`http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders/${orderIdToEdit}?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error(`Ошибка сохранения изменений: ${response.status}`);
        }

        const result = await response.json();
        console.log(`Изменён заказ с ID: ${result.id}`);

        const editModal = bootstrap.Modal.getInstance(document.getElementById("editModal"));
        editModal.hide();

        // уведомление об успешном редактировании
        const successToastEdit = new bootstrap.Toast(document.getElementById("successToastEdit"));
        successToastEdit.show();

        loadOrders();
    } catch (error) {
        console.error("Ошибка при сохранении изменений:", error);
        alert("Не удалось сохранить изменения. Попробуйте снова.");
    }
}

let orderIdToDelete = null; // хранит ID заказа, который нужно удалить

// для показа модального окна удаления
function confirmDelete(orderId) {
    orderIdToDelete = orderId; 
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show(); 
}

// для удаления заказа
async function deleteOrder() {
    if (!orderIdToDelete) return;

    try {
        const response = await fetch(`http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders/${orderIdToDelete}?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd`, 
        { method: "DELETE" });

        if (!response.ok) {
            throw new Error(`Ошибка удаления заказа: ${response.status}`);
        }

        const result = await response.json();
        console.log(`Удалён заказ с ID: ${result.id}`);

        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        deleteModal.hide();

        const successToast = new bootstrap.Toast(document.getElementById('successToast'));
        successToast.show();

        loadOrders();
    } catch (error) {
        console.error("Ошибка при удалении заказа:", error);
        alert("Не удалось удалить заказ. Попробуйте снова.");
    }
}




// чтобы потом доставать название курса по айдишнику
async function fetchCourses() {
    const apiUrl = "http://exam-api-courses.std-900.ist.mospolytech.ru/api/courses?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd";
    try {
        const response = await fetch(apiUrl);
        allCourses = await response.json();
    } catch (error) {
        console.error("Ошибка при загрузке данных из API:", error);
    }
}


let allCourses = []; 

// подгрузка заказов при загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCourses();
    loadOrders(); 
});


// привязываем обработчик к форме редактирования
document.getElementById("editOrderForm").addEventListener("submit", saveOrderChanges);

// привязываем обработчик к кнопке подтверждения удаления
document.getElementById('confirmDeleteButton').addEventListener('click', deleteOrder);



