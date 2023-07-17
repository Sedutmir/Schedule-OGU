import { fetch, setHeaders } from "./fetch.js";
import * as data from "./data.js";
import * as redom from "./libs/redom.js";
globalThis.data = data;
globalThis.redom = redom;

globalThis.tabs_button = Array.from(document.querySelectorAll('.weekday-item'));
globalThis.date_header = document.querySelector('#date');
globalThis.schedule = document.querySelector('#schedule');
globalThis.loader = document.querySelector('#loader-wrapper');
globalThis.content = document.getElementById("content");
globalThis.weekdays = document.querySelector('.weekdays');

globalThis.calendar_btn = document.querySelector('#calendar-btn');
globalThis.calendar = document.querySelector('#calendar');
globalThis.calendar_close = document.querySelector('#calendar-close');
globalThis.calendar_prev = document.querySelector('#calendar-prev');
globalThis.calendar_next = document.querySelector('#calendar-next');

globalThis.now = new Date();
globalThis.start_week = new Date(data.getStartOfWeek(now));
globalThis.current_date = now;

globalThis.tracking_observer = new IntersectionObserver(scrollTracking, {
    root: schedule,
	threshold: 0.75,
});

document.addEventListener('deviceready', onDeviceReady, false);

async function onDeviceReady() {
    await setHeaders();

    main();
}

async function main() {
    buildTabs(now);

    if (getWeekday(current_date) !== 6) {
        let section = document.querySelector(`section[data-tab="${getWeekday(current_date)}"]`);
        schedule.scrollTo(section.getBoundingClientRect().left, 0)
    }

    document.querySelectorAll('#schedule section').forEach(el => tracking_observer.observe(el));

    document.querySelector('.weekdays-list').addEventListener('click', ev => {
        let btn = ev.target.closest('.weekday-item');
        if (btn) {
            let index = Number(btn.dataset.index);
            setActiveTab(index);
            current_date = start_week.addDays(index);
            setDateHeader(current_date);
        }
    });

    calendar_btn.addEventListener('click', () => {
        calendar.classList.remove('hidden');
        content.classList.remove('hidden');
        calendar_close.classList.remove('hidden');
        schedule.classList.add('hidden');
        calendar_btn.classList.add('hidden');
        weekdays.classList.add('hidden');
        buildCalendar(current_date);
    });

    calendar_close.addEventListener('click', () => {
        calendar.classList.add('hidden');
        content.classList.add('hidden');
        calendar_close.classList.add('hidden');
        schedule.classList.remove('hidden');
        calendar_btn.classList.remove('hidden');
        weekdays.classList.remove('hidden');
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
            buildTabs(date);
            calendar_close.click();
        }
    });
}

function buildTabs(date) {
    start_week = new Date(data.getStartOfWeek(date));

    if (getWeekday(date) === 6) {
        start_week = start_week.addDays(7);
    }

    for (const [index, btn] of tabs_button.entries()) {
        btn.querySelector('.day').textContent = start_week.addDays(index).getDate();
    }

    setActiveTab(getWeekday(date));
    setDateHeader(date);
}

function getWeekday(date) {
    return (date.getDay() + 6) % 7;
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
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

function scrollTracking(entries) {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            let index = Number(entry.target.dataset.tab);
            setActiveTab(index);
            current_date = start_week.addDays(index);
            setDateHeader(current_date);
        }
    }
}
