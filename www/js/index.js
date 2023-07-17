import { fetch, setHeaders } from "./fetch.js";
import * as data from "./data.js";
import * as redom from "./libs/redom.js";
globalThis.data = data;
globalThis.redom = redom;

document.addEventListener('deviceready', onDeviceReady, false);

async function onDeviceReady() {
    await setHeaders();

    if (window.localStorage.getItem("current_schedule") && window.localStorage.getItem("select_mode?") !== "true") {
        window.location = "schedule.html";
    }

    main();
}

async function main() {
    globalThis.content = document.getElementById("content");
    globalThis.back = document.getElementById("back-btn");
    globalThis.title = document.querySelector(".title");
    globalThis.search_btn = document.getElementById("search-btn");
    globalThis.close_btn = document.getElementById("search-close");
    globalThis.search = document.getElementById("search-input");

    globalThis.back_hidden = true;

    globalThis.select = new Select();
    globalThis.search_select = new SearchSelect();

    back.onclick = () => {
        if (select.points.length > 1)
            select.points.pop();
            select.render();

        if (select.points.length == 1)
            back.classList.add('hidden');
    };

    document.getElementById('teacher').addEventListener('click', async function() {
        content.classList.add('hidden');
        back.classList.add('hidden');
        title.textContent = "Факультет/институт";
        setTimeout(async () => {
            select.points = [{data: await data.getFacultiesForTeachers(), type: "facultiesForTeachers"}];
            content.classList.remove('hidden');
            select.render();
        }, 10)
    });

    document.getElementById('group').addEventListener('click', async function() {
        content.classList.add('hidden');
        back.classList.add('hidden');
        title.textContent = "Факультет/институт";
        setTimeout(async () => {
            select.points = [{data: await data.getFaculties(), type: "faculties"}];
            select.render();
            content.classList.remove('hidden');
        }, 10)
    });

    document.getElementById('auditorium').addEventListener('click', async function() {
        content.classList.add('hidden');
        back.classList.add('hidden');
        title.textContent = "Корпус";
        setTimeout(async () => {
            select.points = [{data: await data.getBuildings(), type: "buildings"}];
            select.render();
            content.classList.remove('hidden');
        }, 10)
    });

    document.querySelector("#content").addEventListener('click', ev => {
        if (ev.target.closest("button")) {
            content.classList.add("hidden");
        }
    });

    search_btn.onclick = () => {
        title.classList.add('hidden');
        search.classList.remove('hidden');

        close_btn.classList.remove('hidden');
        search_btn.classList.add('hidden');

        document.querySelector('footer').classList.add('hidden');

        content.classList.add('hidden');

        back_hidden = back.classList.contains('hidden');
        back.classList.add('hidden');

        setTimeout(() => {
            redom.unmount(content, select);
            redom.mount(content, search_select);

            if (search_select.elements.length > 0)
                search_select.render();
        }, 10);
    };

    close_btn.onclick = () => {
        title.classList.remove('hidden');
        search.classList.add('hidden');

        close_btn.classList.add('hidden');
        search_btn.classList.remove('hidden');

        document.querySelector('footer').classList.remove('hidden');

        if (back_hidden)
            back.classList.add('hidden');

        setTimeout(() => {
            redom.unmount(content, search_select);
            redom.mount(content, select);
            if (select.points.length > 0)
                content.classList.remove('hidden');
        }, 10);
    };

    search.addEventListener("input", () => {
        if (search_select.elements.length > 0)
            search_select.render();
    });

    redom.mount(content, select);
}

class Select {
    points = [];
    next_callback = {
        "facultiesForTeachers": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    let layer = {type: 'departments'};
                    this.points.push(layer);
                    back.classList.remove('hidden');
                    title.textContent = "Кафедра";

                    let departments;
                    if (Array.isArray(el.id)) {
                        departments = await data.getDepartments(el.id[0]);
                        departments = departments.concat(await data.getDepartments(el.id[1]))
                            .sort((a, b) => a.toString().length - b.toString().length);
                    } else {
                        departments = await data.getDepartments(el.id);
                    }

                    layer.data = departments;
                    this.render();
                }
            });

            title.textContent = "Факультет/институт";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },
        "departments": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    let layer = {type: 'teachers'};
                    this.points.push(layer);
                    back.classList.remove('hidden');
                    title.textContent = "Преподаватель";

                    layer.data = await data.getTeachers(el.id);
                    this.render();
                }
            });

            title.textContent = "Кафедра";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },
        "teachers": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    /* save schedule */
                    window.localStorage.setItem('current_schedule', JSON.stringify({data: el, type: "teacher"}));
                    window.localStorage.setItem("select_mode?", false);

                    globalThis.location = "schedule.html"
                }
            });

            title.textContent = "Преподаватель";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },

        ///////////////////

        "faculties": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    let layer = {type: 'courses'};
                    this.points.push(layer);
                    back.classList.remove('hidden');
                    title.textContent = "Курс";


                    // Небольшая часть костыля для объединения ЮИ
                    layer.data = await ((Array.isArray(el.id)) ? data.getCourses(...el.id) : data.getCourses(el.id));

                    this.render();
                }
            });

            title.textContent = "Факультет/институт";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },
        "courses": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    let layer = {type: 'groups'};
                    this.points.push(layer);
                    back.classList.remove('hidden');
                    title.textContent = "Группа";

                    // Небольшая часть костыля для объединения ЮИ
                    let groups;
                    if (Array.isArray(el.faculty.id)) {
                        groups = await data.getGroups(el.faculty.id[0], el.course)
                        groups = (await data.getGroups(el.faculty.id[1], el.course)).concat(groups);
                    } else {
                        groups = await data.getGroups(el.faculty.id, el.course)
                    }

                    layer.data = groups;
                    this.render();
                }
            });

            title.textContent = "Курс";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },
        "groups": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    /* save schedule */
                    window.localStorage.setItem('current_schedule', JSON.stringify({data: el, type: "group"}));
                    window.localStorage.setItem("select_mode?", false);

                    globalThis.location = "schedule.html"
                }
            });

            title.textContent = "Группа";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },

        ///////////////////

        "buildings": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    let layer = {type: 'auditoriums'};
                    this.points.push(layer);
                    back.classList.remove('hidden');
                    title.textContent = "Аудитория";
                    layer.data = await data.getAuditoriums(el.id);
                    this.render();
                }
            });

            title.textContent = "Корпус";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },
        "auditoriums": (el) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    /* save schedule */
                    window.localStorage.setItem('current_schedule', JSON.stringify({data: el, type: "auditorium"}));
                    window.localStorage.setItem("select_mode?", false);

                    globalThis.location = "schedule.html"
                }
            });

            title.textContent = "Аудитория";

            redom.setChildren(btn, redom.text(el.toString().trim()));
            return btn;
        },
    };

    constructor() {
        this.el = redom.list("ul.items", Item);
        this.content = document.getElementById('content');

        data.getFaculties().then(faculties => {
            this.points.push({ data: faculties, type: "faculties" });
            this.render();
        });
    }

    update({data, type}, index, items, context) {
        const cb = this.next_callback[type];

        /* Начало костыля для реального объединения 2-х ЮИ */
        if ((type === 'faculties' || type === 'facultiesForTeachers') && data.filter(el => el.toString() === 'ЮИ').length > 1) {
            let one = data.find(el => el.toString() === 'ЮИ');
            let double = data.splice(data.findLastIndex(el => el.toString() === 'ЮИ'), 1)[0];

            one.id = [one.id, double.id];
        }
        /* Конец */

        this.el.update(data.map(el => {
            return {data: el, callback: cb};
        }));

        this.content.classList.remove('hidden');
    }

    render() {
        if (this.points.length > 1) back.classList.remove('hidden');
        this.update(this.points.at(-1));
    }
}

class Item {
    constructor() {
        this.el = redom.el("li.item");
    }

    update({data, callback}) {
        redom.setChildren(this.el, callback(data));
    }
}

class SearchSelect {
    elements = [];
    callbacks = {
        'group': (data) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    /* save schedule */
                    window.localStorage.setItem('current_schedule', JSON.stringify({data: data, type: "group"}));
                    window.localStorage.setItem("select_mode?", false);

                    globalThis.location = "schedule.html"
                }
            });

            redom.setChildren(btn, redom.text(`${data.title}`.trim()));
            return btn;
        },
        'teacher': (data) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    /* save schedule */
                    window.localStorage.setItem('current_schedule', JSON.stringify({data: data, type: "teacher"}));
                    window.localStorage.setItem("select_mode?", false);

                    globalThis.location = "schedule.html"
                }
            });

            redom.setChildren(btn, redom.text(`${data.firstname} ${data.name[0]}. ${data.secondname[0]}.`));
            return btn;
        },
        'auditorium': (data) => {
            const btn = redom.el('button', {
                onclick: async () => {
                    /* save schedule */
                    window.localStorage.setItem('current_schedule', JSON.stringify({data: data, type: "auditorium"}));
                    window.localStorage.setItem("select_mode?", false);

                    globalThis.location = "schedule.html"
                }
            });

            redom.setChildren(btn, redom.text(`${data.building === 17 ? 'Фб' : data.building} - ${data.auditorium}`));
            return btn;
        }
    };

    constructor() {
        this.el = redom.list("ul.items", Item);

        if (window.localStorage.getItem("select_all")) {
            this.elements = JSON.parse(window.localStorage.getItem("select_all"));
        } else {
            Promise.all([data.getAllGroups(), data.getAllTeachers(), data.getAllAuditoriums()]).then(([groups, teachers, auditoriums]) => {
                this.elements = [
                    ...groups.map(data => { return {data, type: 'group'}}),
                    ...teachers.map(data => { return {data, type: 'teacher'}}),
                    ...auditoriums.map(data => { return {data, type: 'auditorium'}}),
                ];

                window.localStorage.setItem("select_all", JSON.stringify(this.elements));

                this.render();
            });
        }
    }

    update(data, index, items, context) {
        this.el.update(data.map(({data, type}) => {return {data: data, callback: this.callbacks[type]}}));

        content.classList.remove('hidden');
    }

    render() {
        content.classList.add('hidden');

        setTimeout(() => {
            let filtered = this.elements.filter(({data, type}) => {
                let text;
                switch (type) {
                    case 'group':
                        text = `${data.title}`;
                        break;

                    case 'teacher':
                        text = `${data.firstname} ${data.name[0]}. ${data.secondname[0]}.`;
                        break;

                    case 'auditorium':
                        text = `${data.building === 17 ? 'Фб' : data.building} - ${data.auditorium}`;
                        break;
                }

                return text.toLowerCase().includes(search.value.toLowerCase());
            });

            this.update(filtered);
            content.classList.remove('hidden');
        }, 10)
    }
}
