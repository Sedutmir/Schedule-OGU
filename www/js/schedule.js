import { fetch, setHeaders } from "./fetch.js";
import * as data from "./data.js";
import * as redom from "./libs/redom.js";

// globalThis.data = data;
// globalThis.redom = redom;


document.addEventListener('deviceready', onDeviceReady, false);

async function onDeviceReady() {
    await setHeaders();

    globalThis.tabs_button = Array.from(document.querySelectorAll('.weekday-item'));
    globalThis.date_header = document.querySelector('#date');
    globalThis.loader = document.querySelector('#loader-wrapper');
    globalThis.content = document.getElementById("content");
    globalThis.weekdays = document.querySelector('.weekdays');

    globalThis.schedule = document.querySelector('#schedule');
    globalThis.schedule_tabs = Array.from(schedule.querySelectorAll('.schedule-tab'));
    globalThis.control_tabs = Array.from(schedule.querySelectorAll('.control-tab'));

    let active_tab_observer = new IntersectionObserver(activeTabObserve, { threshold: .6 } );
    schedule_tabs.forEach(tab => active_tab_observer.observe(tab));

    globalThis.control_tab_active = false;
    let constrol_tab_observer = new IntersectionObserver(controlTabObserve, { threshold: 1 });
    control_tabs.forEach(tab => constrol_tab_observer.observe(tab));

    globalThis.now = new Date();
    globalThis.start_week = new Date(data.getStartOfWeek(now));
    globalThis.current_date = now;

    globalThis.current_schedule = JSON.parse(localStorage.getItem('current_schedule'));
    globalThis.current_schedule_data = null;

    let title;

    switch (current_schedule.type) {
        case "group":
            globalThis.get_schedule = bind(data.getSchedule, null, current_schedule.data.id);
            title = current_schedule.data.title;
            break;

        case "teacher":
            globalThis.get_schedule = bind(data.getSchedule, null, current_schedule.data.id);
            title = `${current_schedule.data.firstname} ${current_schedule.data.name[0]}. ${current_schedule.data.secondname[0]}.`;
            break;

        case "auditorium":
            globalThis.get_schedule = bind(data.getSchedule, null, current_schedule.data.building, current_schedule.data.auditorium);
            title = `${current_schedule.data.building === 17 ? 'Фб' : current_schedule.data.building} - ${current_schedule.data.auditorium}`;
            break;

        default:
            title = 'Расписание';
            break;
    }

    document.querySelector('.title').textContent = title;

    main();
}

async function main() {
    buildSchedule(now);

    if (getWeekday(current_date) === 6) {
        schedule_tabs.at(0).scrollIntoView({block: "start"});
    } else {
        schedule_tabs.at(getWeekday(current_date)).scrollIntoView({block: "start"});
    }

    document.querySelector('.weekdays-list').addEventListener('click', ev => {
        let btn = ev.target.closest('.weekday-item');
        if (btn) {
            let index = Number(btn.dataset.index);
            schedule_tabs.at(index).scrollIntoView({block: "start", behavior: "smooth"});
        }
    });

    document.querySelector('#back-btn').addEventListener('click', () => {
        localStorage.setItem('select_mode?', true);
        window.location = 'index.html';
    });

    initCalendar();
}


/* TABS */

function buildTabs(date) {
    for (const [index, btn] of tabs_button.entries()) {
        btn.querySelector('.day').textContent = start_week.addDays(index).getDate();

        let icons = Array.from(btn.querySelectorAll('.icons li'));

        icons.forEach(icon => icon.classList.add('hidden'));

        for (const lesson of current_schedule_data[index]) {
            icons[lesson.numberLesson - 1]?.classList.remove('hidden');
        }
    }

    setDateHeader(date);
}


async function buildSchedule(date) {
    start_week = new Date(data.getStartOfWeek(date));

    if (getWeekday(date) === 6) {
        start_week = start_week.addDays(7);
    }

    schedule_tabs.forEach(tab => {
        tab.innerHTML = `
        <div class="centered" id="loader-wrapper">
            <span class="loader"></span>
        </div>
        `;
    });

    current_schedule_data = data.lessonsToFormat(await get_schedule(Number(start_week)));

    buildTabs(date);

    schedule_tabs.forEach((tab, i) => {
        let lessons = current_schedule_data[i];

        tab.innerHTML = lessons.map(lesson =>
            `
            <div class="lesson">
                <div class="lesson-header">
                    <span><time>${lesson.time.start}</time> - <time>${lesson.time.end}</time></span>
                    <span>${lesson.group.title}</span>
                    ${lesson.subgroup === null ? "" : "<span>Подгруппа: " + lesson.subgroup + "</span>"}
                    <span>${lesson.type}</span>
                </div>
                <h3>${lesson.title}</h3>
                ${lesson.special === null ? "" : ["<h4>", lesson.special, "</h4>"].join('')}
                <div class="lesson-footer">
                    <div class="lesson-footer-item">
                        <div class="icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V19C5 16.2386 7.23858 14 10 14H14C16.7614 14 19 16.2386 19 19V20M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="inherit" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span>${lesson.teacher.firstname + " " + lesson.teacher.name[0] + ". " + lesson.teacher.secondname[0] + "."}</span>
                    </div>
                    <div class="lesson-footer-item">
                        <div class="icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 9.92285C5 14.7747 9.24448 18.7869 11.1232 20.3252C11.3921 20.5454 11.5281 20.6568 11.7287 20.7132C11.8849 20.7572 12.1148 20.7572 12.271 20.7132C12.472 20.6567 12.6071 20.5463 12.877 20.3254C14.7557 18.7871 18.9999 14.7751 18.9999 9.9233C18.9999 8.08718 18.2625 6.32605 16.9497 5.02772C15.637 3.72939 13.8566 3 12.0001 3C10.1436 3 8.36301 3.7295 7.05025 5.02783C5.7375 6.32616 5 8.08674 5 9.92285Z" stroke="inherit" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10 9C10 10.1046 10.8954 11 12 11C13.1046 11 14 10.1046 14 9C14 7.89543 13.1046 7 12 7C10.8954 7 10 7.89543 10 9Z" stroke="inherit" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span>${lesson.place.building} - ${lesson.place.auditorium}</span>
                    </div>
                </div>
            </div>
        `).join("");
    });
}

function activeTabObserve(entries) {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.tab);
            current_date = start_week.addDays(index);
            setActiveTab(index);
            setDateHeader(current_date);
        }
    }
}

function controlTabObserve(entries) {
    for (const entry of entries) {
        if (entry.isIntersecting && !control_tab_active) {
            control_tab_active = true;

            const action = entry.target.dataset.action;

            if (action === 'prev') {
                start_week = start_week.addDays(-7);
                current_date = start_week.addDays(5);
            } else {
                start_week = start_week.addDays(7);
                current_date = start_week.addDays(0);
            }

            let index = getWeekday(current_date);
            schedule_tabs.at(index).scrollIntoView({block: "start"});

            buildSchedule(current_date);

            setTimeout(() => {
                control_tab_active = false;
            }, 100)
        }
    }
}

function setActiveTab(index) {
    tabs_button[0].closest('ul').querySelector('.active')?.classList.remove('active');
    if (index === 6) return;
    tabs_button[index].classList.add('active');
}

function setDateHeader(date) {
    const weekdays = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    date_header.textContent = `${weekdays[getWeekday(date)]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`
}


/* CALENDAR */

function initCalendar() {
    let calendar_btn = document.querySelector('#calendar-btn');
    let calendar = document.querySelector('#calendar');
    let calendar_close = document.querySelector('#calendar-close');
    globalThis.calendar_prev = document.querySelector('#calendar-prev');
    globalThis.calendar_next = document.querySelector('#calendar-next');

    calendar_btn.addEventListener('click', () => {
        calendar.classList.remove('hidden');
        calendar_close.classList.remove('hidden');

        schedule.classList.add('hidden');
        calendar_btn.classList.add('hidden');
        weekdays.classList.add('hidden');

        buildCalendar(current_date);
    });

    calendar_close.addEventListener('click', () => {
        schedule.classList.remove('hidden');
        calendar_btn.classList.remove('hidden');
        weekdays.classList.remove('hidden');

        calendar.classList.add('hidden');
        calendar_close.classList.add('hidden');
    });

    calendar_prev.addEventListener('click', function() {
        let date = new Date(this.dataset.date);
        buildCalendar(date);
    });

    calendar_next.addEventListener('click', function() {
        let date = new Date(this.dataset.date);
        buildCalendar(date);
    });

    calendar.querySelector('.date-grid').addEventListener('click', function(ev) {
        let btn = ev.target.closest('button');

        if (btn) {
            let date = new Date(btn.dataset.date);
            current_date = date;
            buildSchedule(date);
            calendar_close.click();
        }
    });
}

function buildCalendar(date) {
    date = new Date(date);
    date.setDate(1);

    const getDays = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const indicator = document.querySelector('.month-indicator h2');
    const dates = document.querySelector('.date-grid');

    dates.innerHTML = '';

    indicator.textContent = `${months[date.getMonth()]}, ${date.getFullYear()}`;

    const days = getDays(date);

    for (let d = 1; d <= days; d++) {
        const html = `
            <button data-date="${date.addDays(d - 1)}">
                <time class="${new Date(date.getFullYear(), date.getMonth(), d).getTime() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()  ? 'current-date' : ''}" datetime="${date.getFullYear()}-${date.getMonth()}-${d}">${d}</time>
            </button>
        `;

        dates.insertAdjacentHTML('beforeend', html);
    }

    dates.children[0].style = `grid-column: ${getWeekday(new Date(date.getFullYear(), date.getMonth(), 1)) + 1}`;

    let date_prev = new Date(date);
    let date_next = new Date(date);

    date_prev.setMonth(date.getMonth() - 1, 1);
    date_next.setMonth(date.getMonth() + 1, 1);

    calendar_prev.dataset.date = date_prev;
    calendar_next.dataset.date = date_next;
}

/* OTHER */

function getWeekday(date) {
    return (date.getDay() + 6) % 7;
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


function bind(func, context = null, ...args) {
    return function(...args2) {
      return func.call(context, ...args, ...args2);
    }
}
