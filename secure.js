/******* CONFIG *******/
const API = "https://script.google.com/macros/s/AKfycbwwOhhkig1m-JXJ1XFEt6socZENmHbxD6jUj6XZzqxq46_LYSoAxaQuODTrYOjHCNfWWw/exec";
const PAGE = document.body.getAttribute("data-page"); // p1, p2...
const TIME_LIMIT = 4 * 60; // ⏱️ 4 minutes per page

/******* TEAM LOAD *******/
let team = localStorage.getItem("team");
if (!team) {
  document.body.innerHTML = "<h1>❌ INVALID ACCESS</h1>";
  throw new Error("No team");
}
team = team.trim().toUpperCase();

/******* DEVICE ID *******/
let device = localStorage.getItem("device_id");
if (!device) {
  device = "dvc_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("device_id", device);
}

/******* DISQUALIFY FUNCTION *******/
function disqualify(reason) {
  fetch(${API}?action=disqualify&team=${team}&page=${PAGE}&reason=${reason});
  document.body.innerHTML = "<h1>❌ DISQUALIFIED</h1>";
  throw new Error("Disqualified");
}

/******* STATUS CHECK *******/
fetch(${API}?action=check&team=${team})
  .then(r => r.text())
  .then(status => {
    if (status !== "ACTIVE") disqualify("STATUS");
  });

/******* CONNECT DEVICE *******/
fetch(${API}?action=connect&team=${team}&device=${device}&page=${PAGE});

/******* HEARTBEAT *******/
setInterval(() => {
  fetch(${API}?action=heartbeat&team=${team}&device=${device});
}, 10000);

/******* PROTECTION *******/
let protectionActive = false;

function enableProtection() {
  protectionActive = true;

  window._ctx = e => e.preventDefault();
  window._sel = e => e.preventDefault();
  window._copy = e => e.preventDefault();
  window._key = e => {
    if (e.ctrlKey && ["c", "a", "s", "p"].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  };
  window._vis = () => {
    if (document.hidden && protectionActive) {
      disqualify("TAB_SWITCH");
    }
  };

  document.addEventListener("contextmenu", window._ctx);
  document.addEventListener("selectstart", window._sel);
  document.addEventListener("copy", window._copy);
  document.addEventListener("keydown", window._key);
  document.addEventListener("visibilitychange", window._vis);
}

function disableProtection() {
  protectionActive = false;

  document.removeEventListener("contextmenu", window._ctx);
  document.removeEventListener("selectstart", window._sel);
  document.removeEventListener("copy", window._copy);
  document.removeEventListener("keydown", window._key);
  document.removeEventListener("visibilitychange", window._vis);
}

/******* TIMER + AUTO-SKIP *******/
let timeLeft = TIME_LIMIT;
let timerStopped = false;
const timerEl = document.getElementById("timer");

const timerInterval = setInterval(() => {
  if (timerStopped) return;

  timeLeft--;
  if (timerEl) timerEl.innerText = ⏳ Time left: ${timeLeft}s;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    autoSkip();
  }
}, 1000);

function autoSkip() {
  // stop protection so no accidental DQ during transition
  disableProtection();

  fetch(${API}?action=skip&team=${team}&page=${PAGE})
    .then(() => {
      document.body.innerHTML = `
        <h1>⏭️ Time Up</h1>
        <p>You are moved to the next location with a penalty.</p>
      `;
    });
}

/******* PUBLIC HELPERS FOR pX.html *******/
function onSolveSuccess() {
  timerStopped = true;
  clearInterval(timerInterval);
  disableProtection();
}

/******* START PROTECTION ON LOAD *******/
window.addEventListener("load", () => {
  enableProtection();
});
