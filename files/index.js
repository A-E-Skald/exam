
//ФУНКЦИИ ДЛЯ РАБОТЫ КУРСОВ

//загрузка курсов с апи

async function fetchCourses() {
    const apiUrl = "http://exam-api-courses.std-900.ist.mospolytech.ru/api/courses?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd";
    try {
        const response = await fetch(apiUrl);
        allCourses = await response.json();
    } catch (error) {
        console.error("Ошибка при загрузке данных из API:", error);
    }
}

//вывод курсов

function renderCourses(courses, page) {
    const coursesContainer = document.querySelector("#courses .row"); 
    coursesContainer.innerHTML = "";

    //с какой страницы выводить, список получается не больше 3
    const startIndex = (page - 1) * 3;
    const endIndex = startIndex + 3;

    const coursesToRender = courses.slice(startIndex, endIndex);

    if (coursesToRender.length === 0) {
        coursesContainer.innerHTML = "<p>Курсы не найдены.</p>";
        return;
    }

    // создаем карточки по каждому из элементов
    coursesToRender.forEach(course => {
        const courseCard = document.createElement("div");
        courseCard.className = "col-md-4 mb-3";

        courseCard.innerHTML = `
        <div class="card dark-lighted">
            <div class="card-body">
                <h5 class="card-title">${course.name}</h5>
                <p class="card-text"><strong>Уровень:</strong> ${course.level}</p>
                <div class="buttonStack form1">
                    <button class="btn red-button btn-view-details" data-id="${course.id}">Подробнее</button>
                    <button type="button" onclick="updateCourseDetails(${course.id});" class="btn d-flex justify-content-center align-items-center red-button form1" data-bs-toggle="modal" data-bs-target="#applyModal">Подать заявку на курс</button>
                </div>
            </div>
        </div>
        `;

        coursesContainer.appendChild(courseCard);
    });


    // вешаем по обработчику на каждую кнопку подробнее
    document.querySelectorAll(".btn-view-details").forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault(); 
            const courseId = parseInt(e.target.getAttribute("data-id"));
            showCourseDetails(courseId);
        });
    });
}

// вывод кнопок пагинации

function setupPagination(data) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(data.length / 3); 

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement("li");
        pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
        
        pageItem.innerHTML = `
            <a href="#" class="page-link">${i}</a>
        `;

        if (i === currentPage) {
            pageItem.querySelector("a").classList.add("red-button");
        } else {
            pageItem.querySelector("a").classList.add("dark-lighted");
        }

        pageItem.addEventListener("click", (e) => {
            e.preventDefault();
            currentPage = i;
            renderCourses(data, currentPage); 
            setupPagination(data);
        });

        paginationContainer.appendChild(pageItem);
    }
}

//фильтрация курсов по уровню

function filterCoursesByLevel(level) {
    if (level === "allCourses") {
        filteredCourses = [...allCourses];
    } else {
        filteredCourses = allCourses.filter(course => course.level === level); 
    }

    currentPage = 1; //переносим на первую страницу
    setupPagination(filteredCourses); 
    renderCourses(filteredCourses, currentPage);
}


// обновление информации о курсе в модульном окне при выборе
function updateCourseDetails(valueId) {
    let selectedCourseId;
    //если вызвано кнопкой в карточке курса, то показывает курс с карточки, если просто обновляется, берет курс из выпадающего поля
    if(valueId.type != 'change') {
        selectedCourseId = valueId;
    }
    else {
        selectedCourseId = parseInt(document.getElementById("courseSelect").value);
    }
    const selectedCourse = allCourses.find(course => course.id === selectedCourseId);
    console.log(selectedCourseId);
    
    if (selectedCourse) {
        document.getElementById("courseName").value = selectedCourse.name;
        document.getElementById("teacherName").value = selectedCourse.teacher;
        document.getElementById("courseDuration").value = `${selectedCourse.total_length} недель`;

        // даты начала курса
        const startDateSelect = document.getElementById("startDate");
        startDateSelect.innerHTML = ""; 


        const uniqueDates = new Set();

        selectedCourse.start_dates.forEach(date => {
            const onlyDate = date.slice(0, 10); // "2025-02-01"
            if (!uniqueDates.has(onlyDate)) {
                uniqueDates.add(onlyDate);
        
                const option = document.createElement("option");
                option.value = date; // сохраняем полную дату со временем: "2025-02-01T09:00:00"
                option.textContent = new Date(onlyDate).toLocaleDateString(); // отображаем только дату: "01.02.2025"
                startDateSelect.appendChild(option);
            }
        });
        

        // oбновляем стоимость курса
        const personsCount = parseInt(document.getElementById("personsCount").value) || 1;
        document.getElementById("totalPrice").value = `${calculateTotalPrice(selectedCourse, personsCount)} руб.`;
    }
}

// для расчета стоимости курса с учетом всех параметров
function calculateTotalPrice(course, persons) {
    if (!course) return 0;

    const durationWeeks = course.total_length;
    const pricePerHour = course.course_fee_per_hour;
    let basePrice = durationWeeks * course.week_length * pricePerHour * persons;

    // скидка за раннюю регистрациюЖ:
    const startDateInput = document.getElementById("startDate");
    const startDate = startDateInput ? new Date(startDateInput.value) : null;
    const currentDate = "2025-04-20";
    let discountMultiplier = 1; 
    // проверка региастрации за месяц до курса - все равно не применится, потому что все курсы начались месяца два назад
    if (startDate && (startDate - currentDate) / (1000 * 60 * 60 * 24) >= 30) { 
        discountMultiplier *= 0.9; 
    }
    // за групповую запись
    if (persons >= 5) {
        discountMultiplier *= 0.85; 
    }
    basePrice *= discountMultiplier; 

    // за интенсивный курс 
    const intensiveCourseCheckbox = document.getElementById("intensiveCourse");
    if (intensiveCourseCheckbox?.checked) {
        basePrice *= 1.2;
    }
    // за доп учебные материалы
    const supplementaryCheckbox = document.getElementById("supplementary");
    if (supplementaryCheckbox?.checked) {
        basePrice += 2000 * persons;
    }
    // за индивидуальные занятия 
    const personalizedCheckbox = document.getElementById("personalized");
    if (personalizedCheckbox?.checked) {
        basePrice += 1500 * durationWeeks;
    }
    // культурные экскурсии 
    const excursionsCheckbox = document.getElementById("excursions");
    if (excursionsCheckbox?.checked) {
        basePrice *= 1.25;
    }
    // оценка уровня владения языком 
    const assessmentCheckbox = document.getElementById("assessment");
    if (assessmentCheckbox?.checked) {
        basePrice += 300;
    }
    // за онлайн-платформу
    const interactiveCheckbox = document.getElementById("interactive");
    if (interactiveCheckbox?.checked) {
        basePrice *= 1.5;
    }

    return Math.round(basePrice); 
}

// очистка формы после успешной отправки формы
function clearForm() {
    document.getElementById("applicationForm").reset();
}

// отображение уведомления об отправке формы
function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = "alert";
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.getElementById("notifications").appendChild(notification);
}

// модальное окно с информацией о курсе
function showCourseDetails(courseId) {
    const selectedCourse = allCourses.find(course => course.id === courseId);

    const modalContent = `
      <div class="modal-header dark-theme">
          <h5 class="modal-title">${selectedCourse.name}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body dark-theme">
          <p><strong>Описание:</strong> ${selectedCourse.description}</p>
          <p><strong>Преподаватель:</strong> ${selectedCourse.teacher}</p>
          <p><strong>Уровень:</strong> ${selectedCourse.level}</p>
          <p><strong>Длительность:</strong> ${selectedCourse.total_length} недель</p>
          <p><strong>Часы в неделю:</strong> ${selectedCourse.week_length}</p>
          <p><strong>Стоимость за час:</strong> ${selectedCourse.course_fee_per_hour} руб.</p>
          <p><strong>Доступные даты начала:</strong></p>
          <ul>${selectedCourse.start_dates.map(date => `<li>${new Date(date).toLocaleString()}</li>`).join("")}</ul>
      </div>`;
    
      document.querySelector("#courseModal .modal-content").innerHTML = modalContent;

      const modalInstance = new bootstrap.Modal(document.getElementById("courseModal"));
      modalInstance.show();
}















// ФУНКЦИИ ДЛЯ РАБОТЫ РЕПЕТИТОРОВ

// инфу о репетиторах тоже получаем через апи
async function fetchTutors() {
    const apiUrl = "http://exam-api-courses.std-900.ist.mospolytech.ru/api/tutors?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd";

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        allTutors = await response.json(); 
        console.log("Данные о репетиторах успешно загружены:", allTutors);
    } catch (error) {
        console.error("Ошибка при загрузке данных о репетиторах:", error);
        alert("Не удалось загрузить данные о репетиторах. Попробуйте позже.");
    }
}

// вывод преподов
function renderTutors(tutors) {
    const tutorContainer = document.getElementById("tutor-container");
    tutorContainer.innerHTML = "";

    tutors.forEach(tutor => {
        const tutorCard = document.createElement("div");
        tutorCard.className = "col-md-4"; // используем bootstrap grid по тз

        tutorCard.innerHTML = `
            <div class="card h-100 dark-lighted">
                <div class="card-body tutors">
                    <h5 class="card-title">${tutor.name}</h5>
                    <p><strong>Опыт:</strong> ${tutor.work_experience} лет</p>
                    <p><strong>Языки, которые знает:</strong> ${tutor.languages_spoken.join(", ")}</p>
                    <p><strong>Языки, которые преподаёт:</strong> ${tutor.languages_offered.join(", ")}</p>
                    <p><strong>Уровень:</strong> ${tutor.language_level}</p>
                    <p><strong>Цена за час:</strong> ${tutor.price_per_hour} руб.</p>
                    <div class="buttonStack">
                        <button class="btn red-button" data-bs-toggle="modal" data-bs-target="#bookingModal" 
                            onclick="openBookingForm('${tutor.name}', ${tutor.price_per_hour})">
                            Записаться на занятие
                        </button>
                    </div>
                </div>
            </div>
        `;

        tutorContainer.appendChild(tutorCard);
    });
}

// фильтрация по уровню языка при изменении выпадающего окошка
function filterTutorsByLevel(level) {
    if (level === "allTutors") {
        filteredTutors = [...allTutors]; 
    } else {
        filteredTutors = allTutors.filter(tutors => tutors.language_level === level); 
    }

    renderTutors(filteredTutors); 
}

// фильтрация по годам при изменении окошка с опытом
function filterTutorsByExperience(minExperience) {
    if (isNaN(minExperience) || minExperience <= 0) {
        filteredTutors = [...allTutors]; 
    } else {
        filteredTutors = allTutors.filter(tutor => tutor.work_experience >= minExperience); 
    }

    renderTutors(filteredTutors); 
}


// модальное окно записи к репетитору
function openBookingForm(tutorName, pricePerHour) {
    // установка значений соответсвующего репетитора в форму
    document.getElementById("bookingTutorName").value = tutorName;
    document.getElementById("bookingPrice").value = `${pricePerHour} руб.`;
    
}

// отправка данных из формы записи к репетитору
async function submitBookingForm(event) {
    event.preventDefault(); 

    const formData = {
        tutor_id:  2,
        course_id: 7, 
        date_start: document.getElementById("bookingDate")?.value || "2025-02-15",
        time_start: document.getElementById("bookingTime")?.value || "16:08:00",
        duration:  2, // занятия в часах
        persons: 1, 
        price: parseFloat(document.getElementById("bookingPrice")?.value.replace(" руб.", "")) || 0,
        early_registration: false,
        early_registration: false, 
        supplementary: false,
        personalized: false,
        excursions: false,
        assessment: false,
        group_enrollment: false,
        interactive: false,
        intensive_course: false
    };

    // все ли заполнено
    if (!formData.tutor_id || !formData.date_start || !formData.time_start || formData.price < 0) {
        alert("Пожалуйста, заполните все обязательные поля!");
        return;
    }

    try {
        // отправка данных на сервер
        const response = await fetch(
            "http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            }
        );

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Ошибка сервера:", errorDetails);
            throw new Error(`Ошибка ${response.status}: ${errorDetails.message}`);
        }

        alert("Вы успешно записались на занятие!");

        // закрываем модальное окно и сбрасываем формы
        const modal = bootstrap.Modal.getInstance(document.getElementById("bookingModal"));
        if (modal) modal.hide();
        document.getElementById("bookingForm").reset();
    } catch (error) {
        console.error(error);
        alert(`Произошла ошибка при записи. ${error.message}`);
    }
}














// переменные для хранения данных
let allCourses = []; 
let filteredCourses = []; 
let currentPage = 1; // текущая страница в меню с курсами
let allTutors = []; 
let filteredTutors = []; 


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("bookingForm").addEventListener("submit", function (event) {
        event.preventDefault();
        submitBookingForm(event);
    });
});

//вывод курсов
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCourses(); 
    setupPagination(allCourses);
    renderCourses(allCourses, currentPage); 
});

//фильтр курсов по уровню
document.getElementById("search-level").addEventListener("change", (event) => {
    const selectedLevel = event.target.value;
    filterCoursesByLevel(selectedLevel); 
});

// отправка на сервер заявки на курс 
document.getElementById("applicationForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const courseSelect = document.getElementById("courseSelect");
        const startDate = document.getElementById("startDate");
        const timeStart = document.getElementById("timeStart");
        const courseDuration = document.getElementById("courseDuration");
        const personsCount = document.getElementById("personsCount");
        const totalPrice = document.getElementById("totalPrice");

        // достаем данные из формы
        const requestData = {
            id: 1,
            tutor_id: parseInt(document.getElementById("tutorId")?.value) || 0,
            course_id: parseInt(courseSelect.value),
            date_start: startDate.value,
            time_start: timeStart.value,
            duration: parseInt(courseDuration.value.split(' ')[0]),
            persons: parseInt(personsCount.value),
            price: parseFloat(totalPrice.value.replace(' руб.', '')),
            early_registration: document.getElementById("earlyRegistration")?.checked || false,
            group_enrollment: false,
            intensive_course: document.getElementById("intensiveCourse")?.checked || false,
            supplementary: document.getElementById("supplementary")?.checked || false,
            personalized: document.getElementById("personalized")?.checked || false,
            excursions: document.getElementById("excursions")?.checked || false,
            assessment: document.getElementById("assessment")?.checked || false,
            interactive: document.getElementById("interactive")?.checked || false,
        };

        console.log(requestData);

        const response = await fetch(
            "http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders?api_key=cff8ac16-8306-46e8-92c0-02dbd4dd28bd",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            }
        );

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Ошибка сервера:", errorDetails);
            throw new Error(errorDetails.message || `HTTP ${response.status}`);
        }

        // по тз уведомление об успешной отправке
        showNotification("Заявка успешно отправлена!", "success");

        const modal = bootstrap.Modal.getInstance(document.getElementById("applyModal"));
        if (modal) modal.hide();

        // по тз очищаем форму после успешной отправки 
        clearForm();
    } catch (error) {
        console.error(error);
        showNotification(`Ошибка при отправке заявки. ${error.message}`, "danger");
    }
});

// вывод репетиторов с инфы с апишки
document.addEventListener("DOMContentLoaded", async () => {
    await fetchTutors();

    renderTutors(allTutors); 
});

// обработчик изменения уровня в выпадающем списке
document.getElementById("qualification-filter").addEventListener("change", (event) => {
    const selectedLevel = event.target.value;
    filterTutorsByLevel(selectedLevel); 
});

// обработчик изменения минимального опыта
document.getElementById("experience-filter").addEventListener("input", (event) => {
    const minExperience = parseInt(event.target.value);
    filterTutorsByExperience(minExperience); 
});


// обработчик отправки формы заявки на курс
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCourses(); 

    const courseSelect = document.getElementById("courseSelect");
    courseSelect.innerHTML = ""; 

    allCourses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
    });

    // cмена данных при смене курса
    courseSelect.addEventListener("change", updateCourseDetails);
    
    // пересчет стоимости при изменении полей
    document.getElementById("personsCount").addEventListener("input", updateCourseDetails);
    const checkboxes = document.querySelectorAll(".form-check-input");
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateCourseDetails);
    });

});
