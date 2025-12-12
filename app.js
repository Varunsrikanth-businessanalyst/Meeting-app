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
  items.forE
