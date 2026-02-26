function getReferenceMonday() {
    const reference = new Date("2026-02-23"); // Monday of Week 1
    reference.setHours(0, 0, 0, 0);
    return reference;
}

function getWorkingDate(date) {
    const reference = getReferenceMonday();
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const diffTime = selectedDate - reference;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekOffset = Math.floor(diffDays / 7);

    const isWeek1 = weekOffset % 2 === 0;

    const day = selectedDate.getDay();

    if (isWeek1) {
        if (day >= 1 && day <= 3) return "B1";
        if (day === 4 || day === 5) return "B2";
    } else {
        if (day >= 1 && day <= 3) return "B2";
        if (day === 4 || day === 5) return "B1";
    }

    return null; // weekend
}
export default getWorkingDate;