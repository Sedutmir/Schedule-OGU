import { fetch } from "./fetch.js";

// Получить все факультеты и институты (для студенческих расписаний)
export async function getFaculties() {
    const faculties = await fetch("divisionlistforstuds");

    return rawToArray(faculties)
        .map(rawToFaculty)
        .map(e => {
            e.shortTitle = e.shortTitle.trim();
            return e;
        })
        .sort((a, b) => a.shortTitle.length - b.shortTitle.length);
}

// Получить все курсы доступные на факультете или в институте
export async function getCourses(faculty, double) {
    let courses = await fetch(`${faculty}/kurslist`);
    // Ещё небольшая часть костыля для объединения ЮИ
    if (double) {
        const courses_double = await fetch(`${double}/kurslist`);
        courses = courses.length > courses_double.length ? courses : courses_double;
    }

    return rawToArray(courses).map(el => rawToCourse(el, faculty, double));
}

// Получить все группы определенного курса на факультете или в институте
export async function getGroups(faculty, course) {
    const groups = await fetch(`${faculty}/${course}/grouplist`);

    return rawToArray(groups).map(rawToGroup);
}

// Получить расписание группы на неделю из метки времени
export async function getSchedule(group, timestamp) {
    const lessons = await fetch(`/${group}///${timestamp}/printschedule`);

    return rawToArray(lessons).map(rawToLesson);
}

// Получить все факультеты (для расписаний преподавателей)
export async function getFacultiesForTeachers() {
    const faculties = await fetch("divisionlistforpreps");

    return rawToArray(faculties)
    .map(rawToFaculty)
    .map(e => {
        e.shortTitle = e.shortTitle.trim();
        return e;
    })
    .sort((a, b) => a.shortTitle.length - b.shortTitle.length);
}

// Получить все кафедры на факультете или в институте
export async function getDepartments(faculty) {
    const departments = await fetch(`${faculty}/kaflist`);

    return rawToArray(departments).map(rawToDepartment).sort((a, b) => a.shortTitle.length - b.shortTitle.length);
}

// Получить всех преподавателей на кафедре
export async function getTeachers(department) {
    const teachers = await fetch(`${department}/preplist`);

    return rawToArray(teachers).map(rawToTeacher).sort();
}

// Получить распиание преподавателя на неделю из метки времени
export async function getScheduleForTeachers(teacher, timestamp) {
    const lessons = await fetch(`${teacher}////${timestamp}/printschedule`);

    return rawToArray(lessons).map(rawToLesson);
}

// Получить все корпуса ВУЗа
export async function getBuildings() {
    const buildings = await fetch("korpuslist");

    return rawToArray(buildings).map(rawToBuilding);
}

// Получить все аудитории корпуса ВУЗа
export async function getAuditoriums(building) {
    const auditoriums = await fetch(`${building}/auditlist`);

    return rawToArray(auditoriums).map(el => rawToAuditorium(el, building));
}

// Получить расписание для аудитории на неделю из метки времени
export async function getScheduleForAuditorium(building, auditorium, timestamp) {
    const lessons = await fetch(`//${building}/${auditorium}/${timestamp}/printschedule`);

    return rawToArray(lessons).map(rawToLesson);
}

function rawToArray(data) {
    return Object.entries(data).reduce((arr, [key, value]) => {
        if (Number.isInteger(Number(key))) {
            arr.push(value);
        }

        return arr;
    }, []);
}

function rawToFaculty(data) {
    return {
        id: data.idDivision,
        title: data.titleDivision,
        shortTitle: data.shortTitle,
        toString() { return this.shortTitle }
    };
}

function rawToCourse(data, faculty, double) {
    // И ещё небольшая часть костыля для объединения ЮИ
    return {
        course: data.kurs,
        faculty: { id: double ? [faculty, double] : faculty },
        toString() { return this.course.toString() }
    };
}

function rawToGroup(data) {
    return {
        id: data.idgruop,
        title: data.title,
        codeDirection: data.Codedirection,
        levelEducation: data.levelEducation,
        toString() { return this.title }
    };
}

function rawToDepartment(data) {
    return {
        id: data.idDivision,
        title: data.titleDivision,
        shortTitle: data.shortTitle,
        toString() { return this.shortTitle }
    };
}

function rawToTeacher(data) {
    return {
        id: data.employee_id,
        firstname: data.Family,
        name: data.Name,
        secondname: data.SecondName,
        toString() { return `${this.firstname} ${this.name[0]}. ${this.secondname[0]}.` }
    };
}

function rawToBuilding(data) {
    return {
        id: Number(data.Korpus),
        title: Number(data.Korpus) === 17 ? "Фундаментальная библиотека" : Number(data.Korpus),
        toString() { return this.title.toString() }
    }
}

function rawToAuditorium(data, building) {
    return {
        auditorium: data.NumberRoom,
        building,
        toString() { return this.auditorium }
    };
}

function rawToLesson(data) {
    return {
        subgroup: data.NumberSubGruop === 0 ? null : data.NumberSubGruop,
        title: data.TitleSubject,
        type: data.TypeLesson,
        numberLesson: data.NumberLesson,
        weekday: data.DayWeek,
        date: data.DateLesson,
        place: {
            building: data.Korpus,
            auditorium: data.NumberRoom
        },
        teacher: {
            id: data.employee_id,
            firstname: data.Family,
            name: data.Name,
            secondname: data.SecondName
        },
        group: {
            id: data.idGruop,
            title: data.title
        },
        toString() { return this.title }
    };
}

export function getStartOfWeek(timestamp) {
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Разница между днем недели и понедельником
    const mondayRaw = new Date(date.getTime() + diff * 24 * 60 * 60 * 1000); // Timestamp понедельника
    const mondayAtThree = new Date(mondayRaw.getFullYear(), mondayRaw.getMonth(), mondayRaw.getDate(), 3);
    return mondayAtThree.getTime();
}

export async function getAllGroups() {
    const faculties = await getFaculties();
    const courses = [];

    for (const faculty of faculties) {
        let data = await getCourses(faculty.id);
        courses.push(...data);
    }

    const groups = [];

    for (const course of courses) {
        let data = await getGroups(course.faculty.id, course.course);
        groups.push(...data);
    }

    return groups;
}

export async function getAllTeachers() {
    const faculties = await getFacultiesForTeachers();
    const departments = [];

    for (const faculty of faculties) {
        let data = await getDepartments(faculty.id);
        departments.push(...data);
    }

    const teachers = [];

    for (const department of departments) {
        let data = await getTeachers(department.id);
        teachers.push(...data);
    }

    return teachers;
}

export async function getAllAuditoriums() {
    const buildings = await getBuildings();
    const auditoriums = [];

    for (const building of buildings) {
        let data = await getAuditoriums(building.id);
        auditoriums.push(...data);
    }

    return auditoriums;
}
