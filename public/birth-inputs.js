/* Mobile-friendly birth date/time selectors for the Kundli form. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("kundliForm");
  if (!form) return;

  const day = $("dobDay"), month = $("dobMonth"), year = $("dobYear");
  const hour = $("birthHour"), minute = $("birthMinute"), period = $("birthAmPm");
  const dateValue = $("dob"), timeValue = $("birthTime");
  if (![day, month, year, hour, minute, period, dateValue, timeValue].every(Boolean)) return;

  const option = (value, label) => {
    const node = document.createElement("option");
    node.value = String(value);
    node.textContent = label == null ? String(value) : label;
    return node;
  };
  for (let n = 1; n <= 31; n++) day.append(option(n, String(n).padStart(2, "0")));
  for (let n = 1; n <= 12; n++) month.append(option(n, new Intl.DateTimeFormat("hi-IN", {month:"long"}).format(new Date(2020, n - 1, 1))));
  const currentYear = new Date().getFullYear();
  for (let n = currentYear; n >= 1900; n--) year.append(option(n));
  for (let n = 1; n <= 12; n++) hour.append(option(n, String(n).padStart(2, "0")));
  for (let n = 0; n <= 59; n++) minute.append(option(String(n).padStart(2, "0")));

  function syncDate() {
    const d = Number(day.value), m = Number(month.value), y = Number(year.value);
    if (!d || !m || !y) { dateValue.value = ""; return; }
    const candidate = new Date(Date.UTC(y, m - 1, d));
    if (candidate.getUTCFullYear() !== y || candidate.getUTCMonth() !== m - 1 || candidate.getUTCDate() !== d) {
      dateValue.value = "";
      day.setCustomValidity("कृपया सही दिन, महीना और साल चुनें।");
      return;
    }
    day.setCustomValidity("");
    dateValue.value = [y, String(m).padStart(2,"0"), String(d).padStart(2,"0")].join("-");
  }
  function syncTime() {
    if (!hour.value || minute.value === "" || !period.value) { timeValue.value = ""; return; }
    let h = Number(hour.value) % 12;
    if (period.value === "PM") h += 12;
    timeValue.value = String(h).padStart(2,"0") + ":" + minute.value;
  }
  [day, month, year].forEach(field => field.addEventListener("change", syncDate));
  [hour, minute, period].forEach(field => field.addEventListener("change", syncTime));

  function setDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) { day.value = month.value = year.value = ""; dateValue.value = ""; return; }
    year.value = String(Number(match[1]));
    month.value = String(Number(match[2]));
    day.value = String(Number(match[3]));
    syncDate();
  }
  function setTime(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) { hour.value = minute.value = period.value = ""; timeValue.value = ""; return; }
    const h = Number(match[1]);
    hour.value = String(h % 12 || 12);
    minute.value = match[2];
    period.value = h >= 12 ? "PM" : "AM";
    syncTime();
  }
  window.AstroBirthInputs = { setDate, setTime, syncDate, syncTime };
  syncDate();
  syncTime();
})();