/* Mobile-first, unambiguous birth date and time selectors. */
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
  const monthNames = Array.from({length:12}, (_, index) =>
    new Intl.DateTimeFormat("hi-IN", {month:"long"}).format(new Date(2020, index, 1))
  );
  for (let n = 1; n <= 12; n++) month.append(option(n, monthNames[n - 1]));
  const currentYear = new Date().getFullYear();
  for (let n = currentYear; n >= 1900; n--) year.append(option(n));
  for (let n = 1; n <= 12; n++) hour.append(option(n, String(n).padStart(2, "0")));
  for (let n = 0; n <= 59; n++) minute.append(option(String(n).padStart(2, "0")));

  function updateDays() {
    const previous = day.value;
    const m = Number(month.value), y = Number(year.value);
    const max = m && y ? new Date(Date.UTC(y, m, 0)).getUTCDate() : 31;
    day.replaceChildren(option("", "दिन चुनें"));
    for (let n = 1; n <= max; n++) day.append(option(n, String(n).padStart(2, "0")));
    day.value = Number(previous) <= max ? previous : "";
  }
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
  day.addEventListener("change", syncDate);
  month.addEventListener("change", () => { updateDays(); syncDate(); });
  year.addEventListener("change", () => { updateDays(); syncDate(); });
  [hour, minute, period].forEach(field => field.addEventListener("change", syncTime));

  function setDate(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/) || (() => {
      const dmy = raw.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);
      return dmy ? [dmy[0], dmy[3], String(dmy[2]).padStart(2,"0"), String(dmy[1]).padStart(2,"0")] : null;
    })();
    if (!match) { day.value = month.value = year.value = ""; dateValue.value = ""; return; }
    year.value = String(Number(match[1]));
    month.value = String(Number(match[2]));
    updateDays();
    day.value = String(Number(match[3]));
    syncDate();
  }
  function setTime(value) {
    const raw = String(value || "").trim().toLowerCase();
    let match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/);
    if (!match) { hour.value = minute.value = period.value = ""; timeValue.value = ""; return; }
    let h = Number(match[1]);
    const suffix = match[3];
    if (suffix === "pm" && h < 12) h += 12;
    if (suffix === "am" && h === 12) h = 0;
    if (h < 0 || h > 23 || Number(match[2]) > 59) { hour.value = minute.value = period.value = ""; timeValue.value = ""; return; }
    hour.value = String(h % 12 || 12);
    minute.value = match[2];
    period.value = h >= 12 ? "PM" : "AM";
    syncTime();
  }
  window.AstroBirthInputs = { setDate, setTime, syncDate, syncTime };
  updateDays();
  syncDate();
  syncTime();
})();
