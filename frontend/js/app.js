// ===== GLOBAL ELEMENTS =====
const sidebarMenu = document.getElementById("sidebar-menu");
const dashboardCards = document.getElementById("dashboard-cards");
const mainSection = document.getElementById("main-section");
const toggleBtn = document.getElementById("themeToggle");

// ===== CURRENT USER =====
const currentUser = {
  role: localStorage.getItem("userRole") || "EMPLOYEE",
  username: localStorage.getItem("username") || "guest"
};

const TOTAL_LEAVE_BALANCE = 20;

// ===== SIDEBAR =====
function renderSidebar(role) {
  if (!sidebarMenu) return;
  sidebarMenu.innerHTML = "";

  let menu =
    role === "EMPLOYEE"
      ? ["Dashboard", "Apply Leave", "My Leaves", "Logout"]
      : role === "MANAGER"
      ? ["Dashboard", "Approve Leaves", "Logout"]
      : ["Dashboard", "Manage Users", "Logout"];

  menu.forEach(item => {
    const li = document.createElement("li");
    li.innerText = item;
    li.onclick = () => handleMenuClick(item);
    sidebarMenu.appendChild(li);
  });
}

// ===== MENU HANDLER =====
function handleMenuClick(menu) {
  if (menu === "Logout") {
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    location.href = "index.html";
    return;
  }

  if (menu === "Manage Users") {
    location.href = "manage-users.html";
    return;
  }

  mainSection.innerHTML = "";
  dashboardCards.style.display = "none";

  if (menu === "Dashboard") {
    dashboardCards.style.display = "flex";
    renderDashboard();
  }

  if (menu === "Apply Leave") renderApplyLeave();
  if (menu === "My Leaves") renderMyLeaves();
  if (menu === "Approve Leaves") renderManagerLeaves();
}

// ===== DASHBOARD =====
function renderDashboard() {
  if (!dashboardCards) return;

  const leaves = JSON.parse(localStorage.getItem("leaves")) || [];

  // 🕒 Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" :
    hour < 17 ? "Good Afternoon" :
    "Good Evening";

  // ===== EMPLOYEE DASHBOARD =====
  if (currentUser.role === "EMPLOYEE") {
    const myLeaves = leaves.filter(l => l.username === currentUser.username);

    const total = myLeaves.length;
    const pending = myLeaves.filter(l => l.status === "PENDING").length;
    const approved = myLeaves.filter(l => l.status === "APPROVED").length;
    const remaining = Math.max(0, TOTAL_LEAVE_BALANCE - approved);

    dashboardCards.innerHTML = `
      <div class="dashboard-header">
        <h2>${greeting}, ${currentUser.username} 👋</h2>
        <p>Here’s a quick overview of your leave activity</p>
      </div>

      <div class="card">
        <h3>📅 Total Leaves</h3>
        <p>${total}</p>
      </div>

      <div class="card">
        <h3>⏳ Pending Requests</h3>
        <p>${pending}</p>
      </div>

      <div class="card">
        <h3>✅ Leave Balance</h3>
        <p>${remaining}</p>
      </div>
    `;
  }

  // ===== MANAGER DASHBOARD =====
  else if (currentUser.role === "MANAGER") {
    const pending = leaves.filter(l => l.status === "PENDING").length;

    dashboardCards.innerHTML = `
      <div class="dashboard-header">
        <h2>${greeting}, Manager 👋</h2>
        <p>You have ${pending} requests awaiting action</p>
      </div>

      <div class="card">
        <h3>📄 Total Requests</h3>
        <p>${leaves.length}</p>
      </div>

      <div class="card">
        <h3>⏳ Pending</h3>
        <p>${pending}</p>
      </div>

      <div class="card action-card">
        <button onclick="handleMenuClick('Approve Leaves')">
          🔍 Review Leave Requests
        </button>
      </div>
    `;
  }

  // ===== ADMIN DASHBOARD =====
  else {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const pending = leaves.filter(l => l.status === "PENDING").length;

    dashboardCards.innerHTML = `
      <div class="dashboard-header">
        <h2>${greeting}, Admin 👋</h2>
        <p>System overview at a glance</p>
      </div>

      <div class="card">
        <h3>👥 Total Users</h3>
        <p>${users.length || 1}</p>
      </div>

      <div class="card">
        <h3>📊 Total Leaves</h3>
        <p>${leaves.length}</p>
      </div>

      <div class="card">
        <h3>⏳ Pending Requests</h3>
        <p>${pending}</p>
      </div>
    `;
  }
}


// ===== APPLY LEAVE =====
function renderApplyLeave() {
  mainSection.innerHTML = `
    <div class="form-box">
      <h2>Apply Leave</h2>
      <input type="date" id="from">
      <input type="date" id="to">
      <select id="type">
        <option>Casual</option>
        <option>Sick</option>
      </select>
      <button id="submitLeave">Submit</button>
    </div>
  `;

  document.getElementById("submitLeave").onclick = applyLeave;
}

function applyLeave() {
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const type = document.getElementById("type").value;

  if (!from || !to) {
    alert("Fill all fields");
    return;
  }

  fetch("http://backend:5000/api/leaves", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: currentUser.username,
    from,
    to,
    type
  })
})
.then(res => res.json())
.then(() => {
  alert("Leave Applied");
  renderMyLeaves();
  renderDashboard();
});


 showToast("Leave applied successfully ✅");

  renderMyLeaves();
  renderDashboard();
}
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}


// ===== MY LEAVES =====
function renderMyLeaves() {
  const leaves = JSON.parse(localStorage.getItem("leaves")) || [];
  const myLeaves = leaves.filter(l => l.username === currentUser.username);

  mainSection.innerHTML = `
    <table class="leave-table">
      <tr><th>Type</th><th>From</th><th>To</th><th>Status</th></tr>
      ${
        myLeaves.length === 0
          ? `<tr><td colspan="4">No leaves</td></tr>`
          : myLeaves.map(l => `
              <tr>
                <td>${l.type}</td>
                <td>${l.from}</td>
                <td>${l.to}</td>
                <td>${l.status}</td>
              </tr>
            `).join("")
      }
    </table>
  `;
}

// ===== MANAGER APPROVAL =====
function renderManagerLeaves() {
 fetch("http://backend:5000/api/leaves")
  .then(res => res.json())
  .then(leaves => {
  const pendingLeaves = leaves.filter(l => l.status === "PENDING");

  mainSection.innerHTML = `
    <h2>Pending Leave Requests</h2>
    <table class="leave-table">
      <tr>
        <th>User</th><th>Type</th><th>From</th><th>To</th><th>Action</th>
      </tr>
      ${
        pendingLeaves.length === 0
          ? `<tr><td colspan="5">No pending requests</td></tr>`
          : pendingLeaves.map(l => `
              <tr>
                <td>${l.username}</td>
                <td>${l.type}</td>
                <td>${l.from}</td>
                <td>${l.to}</td>
                <td>
                  <button onclick="updateLeave(${l.id}, 'APPROVED')">Approve</button>
                  <button onclick="updateLeave(${l.id}, 'REJECTED')">Reject</button>
                </td>
              </tr>
            `).join("")
      }
    </table>
  `;
}
)};

function updateLeave(id, status) {
  const leaves = JSON.parse(localStorage.getItem("leaves")) || [];
  const index = leaves.findIndex(l => l.id === id);
  if (index === -1) return;

  leaves[index].status = status;
  localStorage.setItem("leaves", JSON.stringify(leaves));

  alert(`Leave ${status}`);
  renderManagerLeaves();
  renderDashboard();
}

// ===== DARK MODE =====
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  if (toggleBtn) toggleBtn.innerText = "☀️";
}

if (toggleBtn) {
  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toggleBtn.innerText = isDark ? "☀️" : "🌙";
  };
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderSidebar(currentUser.role);
  renderDashboard();
});
