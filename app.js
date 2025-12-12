const SAMPLE_CITY = "New York City";

const events = [
  {
    id: "e1",
    type: "Workout",
    title: "Rooftop HIIT and Coffee",
    dateISO: daysFromNowISO(7, 18, 30),
    durationMins: 60,
    address: "55 W 26th St, New York, NY 10010",
    neighborhood: "NoMad",
    price: "$12",
    capacity: 24,
    spotsLeft: 7,
    host: "Pulse Collective",
    whatToBring: "Water, towel, comfy shoes",
    cancellation: "Cancel up to 12 hours before for a full refund",
    vibe: "High energy, beginner friendly",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=55+W+26th+St+New+York+NY+10010",
    description:
      "Fast workout, fun playlist, zero judgment. Stay after for coffee and a quick mingle so you actually meet people."
  },
  {
    id: "e2",
    type: "Trivia",
    title: "Trivia Night: Pop Culture Edition",
    dateISO: daysFromNowISO(7, 19, 0),
    durationMins: 120,
    address: "201 W 14th St, New York, NY 10011",
    neighborhood: "Chelsea",
    price: "Free",
    capacity: 60,
    spotsLeft: 18,
    host: "Westside Social",
    whatToBring: "Your brain and a tiny competitive spirit",
    cancellation: "Walk ins welcome, RSVP helps us reserve tables",
    vibe: "Chill, loud, social",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=201+W+14th+St+New+York+NY+10011",
    description:
      "Come solo or with friends. We match solo RSVPs into friendly teams so you never feel out of place."
  },
  {
    id: "e3",
    type: "Networking",
    title: "Creative People Meetup: 10 Minute Intros",
    dateISO: daysFromNowISO(7, 18, 0),
    durationMins: 90,
    address: "88 Essex St, New York, NY 10002",
    neighborhood: "Lower East Side",
    price: "$8",
    capacity: 40,
    spotsLeft: 5,
    host: "MeetIRL",
    whatToBring: "One thing you’re building or curious about",
    cancellation: "Cancel up to 24 hours before",
    vibe: "Warm, structured, low pressure",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=88+Essex+St+New+York+NY+10002",
    description:
      "Light structure so it’s not random small talk. Everyone does quick intros, then we do guided pairing."
  }
];

const els = {
  eventsList: document.getElementById("eventsList"),
  eventDetail: document.getElementById("eventDetail"),
  useLocationBtn: document.getElementById("useLocationBtn"),
  zipInput: document.getElementById("zipInput"),
  searchBtn: document.getElementById("searchBtn"),
  alertsBtn: document.getElementById("alertsBtn"),
  alertsCount: document.getElementById("alertsCount"),
  alertsPanel: document.getElementById("alertsPanel"),
  alertsList: document.getElementById("alertsList"),
  closeAlertsBtn: document.getElementById("closeAlertsBtn"),
  clearAlertsBtn: document.getElementById("clearAlertsBtn"),
  backdrop: document.getElementById("modalBackdrop"),

  joinSheet: document.getElementById("joinSheet"),
  joinedSheet: document.getElementById("joinedSheet"),
  joinEventTitle: document.getElementById("joinEventTitle"),
  closeJoinBtn: document.getElementById("closeJoinBtn"),
  enablePushBtn: document.getElementById("enablePushBtn"),
  pushStatus: document.getElementById("pushStatus"),
  addToCalendarBtn: document.getElementById("addToCalendarBtn"),
  confirmJoinBtn: document.getElementById("confirmJoinBtn"),

  soloContent: document.getElementById("soloContent"),

  joinedSubtitle: document.getElementById("joinedSubtitle"),
  timeline: document.getElementById("timeline"),
  closeJoinedBtn: document.getElementById("closeJoinedBtn"),
  attendedBtn: document.getElementById("attendedBtn"),
  noshowBtn: document.getElementById("noshowBtn"),
  nextEventBtn: document.getElementById("nextEventBtn")
};

let selectedEvent = null;
let joinedEventId = load("joinedEventId", null);
let metrics = load("metrics", {
  joins: 0,
  attended: 0,
  noShow: 0,
  calendarAdds: 0,
  pushEnabled: 0,
  soloIcebreakers: 0,
  soloExpect: 0,
  buddyCopied: 0
});

init();

function init(){
  renderEvents(events);

  els.useLocationBtn.addEventListener("click", handleLocation);
  els.searchBtn.addEventListener("click", handleSearch);

  els.alertsBtn.addEventListener("click", openAlerts);
  els.closeAlertsBtn.addEventListener("click", closeAllSheets);
  els.clearAlertsBtn.addEventListener("click", () => {
    save("alerts", []);
    refreshAlertsUI();
    toast("Cleared alerts");
  });

  els.closeJoinBtn.addEventListener("click", closeAllSheets);
  els.enablePushBtn.addEventListener("click", enablePush);
  els.addToCalendarBtn.addEventListener("click", () => {
    if(!selectedEvent) return;
    metrics.calendarAdds += 1;
    save("metrics", metrics);
    openCalendar(selectedEvent);
    addAlert("Calendar added", `Nice. Your calendar has ${selectedEvent.title}.`);
  });
  els.confirmJoinBtn.addEventListener("click", confirmJoin);

  els.closeJoinedBtn.addEventListener("click", closeAllSheets);
  els.attendedBtn.addEventListener("click", () => recordOutcome("attended"));
  els.noshowBtn.addEventListener("click", () => recordOutcome("noshow"));
  els.nextEventBtn.addEventListener("click", () => {
    closeAllSheets();
    addAlert("Next event energy", "Pick one more. Small wins compound.");
  });

  document.querySelectorAll("[data-solo]").forEach(btn => {
    btn.addEventListener("click", () => handleSolo(btn.dataset.solo));
  });

  document.addEventListener("click", (e) => {
    if(e.target === els.backdrop) closeAllSheets();
  });

  refreshAlertsUI();

  if(joinedEventId){
    const ev = events.find(x => x.id === joinedEventId);
    if(ev){
      addAlert("You’re already locked in", `Upcoming: ${ev.title}. Your reminders are set.`);
      selectedEvent = ev;
      openJoinedSheet(ev);
    }
  }
}

function handleLocation(){
  if(!navigator.geolocation){
    addAlert("Location not supported", "No stress. Use ZIP or neighborhood instead.");
    return;
  }

  addAlert("Checking location", "Finding nearby events...");
  navigator.geolocation.getCurrentPosition(
    () => {
      addAlert("Nearby events ready", `Showing events near you in ${SAMPLE_CITY}.`);
      renderEvents(events);
    },
    () => {
      addAlert("Location blocked", "Use ZIP or neighborhood, or try again.");
    },
    { enableHighAccuracy: false, timeout: 8000 }
  );
}

function handleSearch(){
  const q = (els.zipInput.value || "").trim();
  if(!q){
    addAlert("Type something", "Try a ZIP like 10001 or a neighborhood like Chelsea.");
    return;
  }
  addAlert("Searching", `Showing events near: ${q}`);
  renderEvents(events);
}

function renderEvents(list){
  els.eventsList.innerHTML = "";
  list.forEach(ev => {
    const d = new Date(ev.dateISO);
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${ev.title}</div>
          <div class="item-meta">${ev.type} · ${ev.neighborhood} · ${fmtDateTime(d)}</div>
        </div>
        <div class="tag">${ev.spotsLeft} spots</div>
      </div>
    `;
    item.addEventListener("click", () => openEvent(ev));
    els.eventsList.appendChild(item);
  });
}

function openEvent(ev){
  selectedEvent = ev;
  const d = new Date(ev.dateISO);

  els.eventDetail.className = "detail";
  els.eventDetail.innerHTML = `
    <h2>${ev.title}</h2>
    <div class="muted">${ev.type} · ${ev.vibe}</div>

    <div class="kv">
      <div class="box">
        <div class="label">Date and time</div>
        <div class="value">${fmtDateTime(d)}</div>
      </div>
      <div class="box">
        <div class="label">Duration</div>
        <div class="value">${ev.durationMins} mins</div>
      </div>

      <div class="box">
        <div class="label">Neighborhood</div>
        <div class="value">${ev.neighborhood}</div>
      </div>
      <div class="box">
        <div class="label">Price</div>
        <div class="value">${ev.price}</div>
      </div>

      <div class="box">
        <div class="label">Host</div>
        <div class="value">${ev.host}</div>
      </div>
      <div class="box">
        <div class="label">Capacity</div>
        <div class="value">${ev.capacity} · ${ev.spotsLeft} left</div>
      </div>

      <div class="box">
        <div class="label">Address</div>
        <div class="value">${ev.address}</div>
      </div>
      <div class="box">
        <div class="label">What to bring</div>
        <div class="value">${ev.whatToBring}</div>
      </div>

      <div class="box">
        <div class="label">Cancellation</div>
        <div class="value">${ev.cancellation}</div>
      </div>
      <div class="box">
        <div class="label">About</div>
        <div class="value">${ev.description}</div>
      </div>
    </div>

    <div class="actions">
      <a class="btn" href="${ev.mapUrl}" target="_blank" rel="noopener">Open map</a>
      <button class="btn primary" id="joinBtn">Join</button>
    </div>
  `;

  const joinBtn = document.getElementById("joinBtn");
  joinBtn.addEventListener("click", () => openJoinSheet(ev));
}

function openJoinSheet(ev){
  els.joinEventTitle.textContent = `${ev.title} · ${fmtDateTime(new Date(ev.dateISO))}`;
  els.soloContent.textContent = "Pick a chip above. I’ll give you a quick plan.";
  openSheet(els.joinSheet);
}

function confirmJoin(){
  if(!selectedEvent) return;

  metrics.joins += 1;
  save("metrics", metrics);

  joinedEventId = selectedEvent.id;
  save("joinedEventId", joinedEventId);

  const plan = document.querySelector("input[name='plan']:checked")?.value || "standard";
  scheduleReminders(selectedEvent, plan);

  addAlert("You’re in", `Saved: ${selectedEvent.title}. Reminders are set.`);
  openJoinedSheet(selectedEvent);
}

function openJoinedSheet(ev){
  els.joinedSubtitle.textContent = `${ev.title} · ${fmtDateTime(new Date(ev.dateISO))}`;
  renderTimeline(ev);
  openSheet(els.joinedSheet);
}

function renderTimeline(ev){
  const plan = load("reminderPlan", "standard");
  const items = buildReminderSchedule(ev, plan);
  els.timeline.innerHTML = "";
  items.forEach(x => {
    const row = document.createElement("div");
    row.className = "tl-item";
    row.innerHTML = `
      <div>
        <div style="font-weight:850">${x.title}</div>
        <div class="muted small">${x.body}</div>
      </div>
      <div class="muted small">${fmtDateTime(new Date(x.atISO))}</div>
    `;
    els.timeline.appendChild(row);
  });
}

function recordOutcome(type){
  if(!joinedEventId){
    addAlert("Nothing to check in", "Join an event first.");
    return;
  }

  if(type === "attended"){
    metrics.attended += 1;
    addAlert("Love that for you", "Next time will feel even easier.");
  }else{
    metrics.noShow += 1;
    addAlert("All good", "Tell me what happened next time. I’ll adjust reminders.");
  }
  save("metrics", metrics);

  const noShowRate = computeNoShowRate(metrics);
  addAlert("North Star update", `No show rate: ${pct(noShowRate)} based on your check-ins.`);

  save("joinedEventId", null);
  joinedEventId = null;
}

function computeNoShowRate(m){
  if(m.joins <= 0) return 0;
  return m.noShow / m.joins;
}

function scheduleReminders(ev, plan){
  save("reminderPlan", plan);

  const schedule = buildReminderSchedule(ev, plan);
  save("scheduledReminders", schedule);

  // Clear any old timers
  window.__timers = window.__timers || [];
  window.__timers.forEach(t => clearTimeout(t));
  window.__timers = [];

  const now = Date.now();
  schedule.forEach(item => {
    const at = new Date(item.atISO).getTime();
    const delay = at - now;

    if(delay > 0){
      const t = setTimeout(() => {
        addAlert(item.title, item.body);
        tryNotify(item.title, item.body);
      }, delay);
      window.__timers.push(t);
    }
  });
}

function buildReminderSchedule(ev, plan){
  const eventTime = new Date(ev.dateISO).getTime();

  const reminders = [
    {
      key: "d3",
      offsetMs: 3 * 24 * 60 * 60 * 1000,
      title: "3 day heads up",
      body: `Upcoming: ${ev.title}. Quick plan: decide outfit, route, and your +1 question.`
    },
    {
      key: "d1",
      offsetMs: 1 * 24 * 60 * 60 * 1000,
      title: "Tomorrow",
      body: `You’re set for ${ev.title}. Map is ready. Your only job is to show up.`
    },
    {
      key: "h3",
      offsetMs: 3 * 60 * 60 * 1000,
      title: "3 hours",
      body: `Future you will thank you. Grab what you need and head out with time.`
    },
    {
      key: "h1",
      offsetMs: 1 * 60 * 60 * 1000,
      title: "1 hour",
      body: `Go time. Arrive 5 mins early, say hi to the host, and you’re in.`
    }
  ];

  let chosen = reminders;

  if(plan === "gentle"){
    chosen = reminders.filter(r => r.key === "d3" || r.key === "d1");
  }

  if(plan === "extra"){
    chosen = reminders.concat([{
      key: "h2confidence",
      offsetMs: 2 * 60 * 60 * 1000,
      title: "Quick confidence check",
      body: "If anxiety shows up, do this: breathe, walk in, ask one person what brought them here."
    }]);
  }

  return chosen
    .map(r => ({
      ...r,
      atISO: new Date(eventTime - r.offsetMs).toISOString()
    }))
    .sort((a,b) => new Date(a.atISO) - new Date(b.atISO));
}

async function enablePush(){
  if(!("Notification" in window)){
    els.pushStatus.textContent = "Push not supported in this browser";
    addAlert("Push not supported", "No stress. In app alerts still work.");
    return;
  }

  const perm = await Notification.requestPermission();
  if(perm === "granted"){
    els.pushStatus.textContent = "Push enabled";
    metrics.pushEnabled = 1;
    save("metrics", metrics);
    addAlert("Push enabled", "You’ll get nudges at the right times.");
    tryNotify("Push enabled", "You’re good. I’ll remind you.");
  }else{
    els.pushStatus.textContent = "Push not enabled";
    addAlert("Push not enabled", "You can still rely on in app alerts.");
  }
}

function tryNotify(title, body){
  if(!("Notification" in window)) return;
  if(Notification.permission !== "granted") return;

  try{
    new Notification(title, { body });
  }catch(e){
    // Some browsers require user gesture or block this
  }
}

function handleSolo(kind){
  if(!selectedEvent) return;

  if(kind === "icebreakers"){
    metrics.soloIcebreakers += 1;
    save("metrics", metrics);
    els.soloContent.innerHTML = `
      <div style="font-weight:850">3 easy icebreakers</div>
      <ul>
        <li>What made you pick this event?</li>
        <li>Are you from around here or new to the area?</li>
        <li>What are you excited about this month?</li>
      </ul>
      <div class="small muted">Pro tip: ask the host first. It’s the easiest win.</div>
    `;
    addAlert("Solo help used", "Icebreakers ready. You walk in with a plan.");
  }

  if(kind === "whatToExpect"){
    metrics.soloExpect += 1;
    save("metrics", metrics);
    els.soloContent.innerHTML = `
      <div style="font-weight:850">What to expect</div>
      <ul>
        <li>Arrive 5 minutes early, it lowers social pressure</li>
        <li>Say hi to the host, they can introduce you</li>
        <li>Your goal is one good convo, not 20</li>
      </ul>
      <div class="small muted">This is not a performance. It’s a hang.</div>
    `;
    addAlert("Solo help used", "Expectation set. Less anxiety, more vibes.");
  }

  if(kind === "buddyLink"){
    const url = `${location.origin}${location.pathname}#event=${selectedEvent.id}`;
    navigator.clipboard?.writeText(url);
    metrics.buddyCopied += 1;
    save("metrics", metrics);
    els.soloContent.innerHTML = `
      <div style="font-weight:850">Bring a buddy</div>
      <div>Copied a link. Send it to one person you trust. Going together makes showing up automatic.</div>
      <div class="small muted">If copy didn’t work, just grab the URL from the address bar.</div>
    `;
    addAlert("Buddy link copied", "Nice. Accountability hack unlocked.");
  }
}

function openAlerts(){
  refreshAlertsUI();
  openSheet(els.alertsPanel);
}

function refreshAlertsUI(){
  const alerts = load("alerts", []);
  els.alertsCount.textContent = String(alerts.length);
  els.alertsList.innerHTML = "";

  if(alerts.length === 0){
    els.alertsList.innerHTML = `<div class="muted">No alerts yet. Join an event and I’ll start nudging you.</div>`;
    return;
  }

  alerts.slice().reverse().forEach(a => {
    const div = document.createElement("div");
    div.className = "alert";
    div.innerHTML = `
      <div class="t">${escapeHtml(a.title)}</div>
      <div class="d">${escapeHtml(a.body)}</div>
      <div class="muted small" style="margin-top:6px">${fmtDateTime(new Date(a.atISO))}</div>
    `;
    els.alertsList.appendChild(div);
  });
}

function addAlert(title, body){
  const alerts = load("alerts", []);
  alerts.push({ title, body, atISO: new Date().toISOString() });
  save("alerts", alerts);
  refreshAlertsUI();
}

function openSheet(sheetEl){
  els.backdrop.classList.remove("hidden");
  closeSheetsOnly();
  sheetEl.classList.remove("hidden");
}

function closeSheetsOnly(){
  [els.alertsPanel, els.joinSheet, els.joinedSheet].forEach(x => x.classList.add("hidden"));
}

function closeAllSheets(){
  closeSheetsOnly();
  els.backdrop.classList.add("hidden");
}

function openCalendar(ev){
  const start = new Date(ev.dateISO);
  const end = new Date(start.getTime() + ev.durationMins * 60 * 1000);

  const ics = buildICS({
    title: ev.title,
    description: `${ev.description}\n\nWhat to bring: ${ev.whatToBring}\nHost: ${ev.host}\nCancellation: ${ev.cancellation}`,
    location: ev.address,
    start,
    end
  });

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "vibeup-event.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function buildICS({ title, description, location, start, end }){
  const dt = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };

  const uid = `${Math.random().toString(16).slice(2)}@vibeup`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VibeUp//JoinRemindMVP//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

function escapeICS(s){
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function daysFromNowISO(days, hour, minute){
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function fmtDateTime(d){
  const opts = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  return d.toLocaleString(undefined, opts);
}

function pct(x){
  const v = Math.round(x * 100);
  return `${v}%`;
}

function toast(msg){
  addAlert("Update", msg);
}

function save(k, v){
  localStorage.setItem(k, JSON.stringify(v));
}

function load(k, fallback){
  try{
    const raw = localStorage.getItem(k);
    if(raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  }catch{
    return fallback;
  }
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[c]));
}
