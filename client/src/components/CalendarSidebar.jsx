import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function CalendarSidebar({ value, onChange }) {
  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  function tileClassName({ date, view }) {
    if (view !== "month") return undefined;
    const cls = ["rounded-3"];
    if (isWeekend(date)) cls.push("is-weekend");
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    if (isToday) cls.push("react-calendar__tile--now");
    return cls.join(" ");
  }

  function tileDisabled({ date, view }) {
    if (view !== "month") return false;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const isPast =
      date.getFullYear() < d.getFullYear() ||
      (date.getFullYear() === d.getFullYear() && date.getMonth() < d.getMonth()) ||
      (date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth() && date.getDate() < d.getDate());
    return isPast || isWeekend(date);
  }

  function tileContent({ date, view }) {
    if (view !== "month") return null;
    if (isWeekend(date)) return <span title="Weekend" />;
    return null;
  }

  return (
    <div className="card shadow-sm rounded-4 lift-hover h-100">
      <div className="card-body">
        <Calendar
          value={value}
          onChange={(d) => onChange && onChange(d)}
          tileClassName={tileClassName}
          tileDisabled={tileDisabled}
          tileContent={tileContent}
          showNeighboringMonth={false}
          next2Label={null}
          prev2Label={null}
          calendarType="gregory"
        />
      </div>
    </div>
  );
}

export default CalendarSidebar;
