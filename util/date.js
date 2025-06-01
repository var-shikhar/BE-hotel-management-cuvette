// Converts date and time to a formatted UTC Date object.
export function getFormattedDate(date, time) {
    const dateObj = new Date(date);
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();
    const [hours, minutes] = time.split(":").map(Number);

    const formattedDate = new Date(Date.UTC(year, month, day, hours, minutes));
    return formattedDate;
}


// Converts a Date object to a 12-hour format string.
export function formatTo12Hour(date) {
    const timeString = date.toISOString().split("T")[1].substring(0, 5);
    let [hour, minute] = timeString.split(":").map(Number);
    let period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // Convert 0 to 12 for AM times
    return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
}

