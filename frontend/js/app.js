// ================= GLOBAL ELEMENTS =================
const sidebarMenu = document.getElementById("sidebar-menu");
const dashboardCards = document.getElementById("dashboard-cards");
const mainSection = document.getElementById("main-section");
const toggleBtn = document.getElementById("themeToggle");

// ================= CONFIG =================
const API_BASE = "http://localhost:5000/api";

// ================= CURRENT USER =================
const currentUser = {
  username: localStorage.getItem("username"),
  role: localStorage.getItem("userRole")
};

if (!currentUser.username || !currentUser.role) {
  window.location.href = "index.html";
}

// ================= INIT USERS (DEMO) =================
if (!localStorage.getItem("users")) {
  localStorage.setItem(
    "users",
    JSON.stringify([
      { username: "admin", role: "ADMIN" },
      { username: "manager1", role: "MANAGER" },
      { username: "employee1", role: "EMPLOYEE" }
    ])
  );
}

// ================= SIDEBAR =================
function renderSidebar(role) {
  sidebarMenu.innerHTML = "";

  const menu =
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

// ================= MENU HANDLER =================
function handleMenuClick(menu) {
  mainSection.innerHTML = "";
  dashboardCards.style.display = "none";

  if (menu === "Logout") {
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }

  if (menu === "Dashboard") {
    dashboardCards.style.display = "flex";
    renderDashboard();
  }

  if (menu === "Apply Leave") renderApplyLeave();
  if (menu === "My Leaves") renderMyLeaves();
  if (menu === "Approve Leaves") renderManagerLeaves();
  if (menu === "Manage Users") renderManageUsers();
}

// ================= DASHBOARD =================
function renderDashboard() {
  fetch(`${API_BASE}/leaves/all`)
    .then(res => res.json())
    .then(leaves => {
      const greeting =
        new Date().getHours() < 12 ? "Good Morning" :
        new Date().getHours() < 17 ? "Good Afternoon" :
        "Good Evening";

      // EMPLOYEE
      if (currentUser.role === "EMPLOYEE") {
        const myLeaves = leaves.filter(l => l.employee === currentUser.username);
        dashboardCards.innerHTML = `
          <div class="card"><h3>${greeting}</h3><p>${currentUser.username}</p></div>
          <div class="card"><h3>Total Leaves</h3><p>${myLeaves.length}</p></div>
          <div class="card"><h3>Pending</h3><p>${myLeaves.filter(l=>l.status==="PENDING").length}</p></div>
          <div class="card"><h3>Approved</h3><p>${myLeaves.filter(l=>l.status==="APPROVED").length}</p></div>
        `;
      }

      // MANAGER
      if (currentUser.role === "MANAGER") {
        dashboardCards.innerHTML = `
          <div class="card"><h3>${greeting}</h3><p>Manager</p></div>
          <div class="card"><h3>Total Requests</h3><p>${leaves.length}</p></div>
          <div class="card"><h3>Pending</h3><p>${leaves.filter(l=>l.status==="PENDING").length}</p></div>
        `;
      }

      // ADMIN
      if (currentUser.role === "ADMIN") {
        const users = JSON.parse(localStorage.getItem("users"));
        dashboardCards.innerHTML = `
          <div class="card"><h3>Total Users</h3><p>${users.length}</p></div>
          <div class="card"><h3>Employees</h3><p>${users.filter(u=>u.role==="EMPLOYEE").length}</p></div>
          <div class="card"><h3>Managers</h3><p>${users.filter(u=>u.role==="MANAGER").length}</p></div>
        `;
      }
    });
}

// ================= APPLY LEAVE =================
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
      <button onclick="applyLeave()">Submit</button>
    </div>
  `;
}

function applyLeave() {
  fetch(`${API_BASE}/leaves/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee: currentUser.username,
      from: from.value,
      to: to.value,
      type: type.value
    })
  }).then(() => {
    alert("Leave Applied");
    renderMyLeaves();
  });
}

// ================= MY LEAVES =================
function renderMyLeaves() {
  fetch(`${API_BASE}/leaves/all`)
    .then(res => res.json())
    .then(leaves => {
      const myLeaves = leaves.filter(l => l.employee === currentUser.username);
      mainSection.innerHTML = `
        <table class="leave-table">
          <tr><th>Type</th><th>From</th><th>To</th><th>Status</th></tr>
          ${myLeaves.map(l=>`
            <tr>
              <td>${l.type}</td><td>${l.from}</td><td>${l.to}</td><td>${l.status}</td>
            </tr>`).join("")}
        </table>
      `;
    });
}

// ================= MANAGER APPROVAL =================
function renderManagerLeaves() {
  fetch(`${API_BASE}/leaves/all`)
    .then(res => res.json())
    .then(leaves => {
      const pending = leaves.filter(l => l.status === "PENDING");
      mainSection.innerHTML = `
        <h2>Approve Leaves</h2>
        <table class="leave-table">
          <tr><th>User</th><th>Type</th><th>From</th><th>To</th><th>Action</th></tr>
          ${pending.map(l=>`
            <tr>
              <td>${l.employee}</td>
              <td>${l.type}</td>
              <td>${l.from}</td>
              <td>${l.to}</td>
              <td>
                <button onclick="updateLeave(${l.id},'APPROVED')">Approve</button>
                <button onclick="updateLeave(${l.id},'REJECTED')">Reject</button>
              </td>
            </tr>`).join("")}
        </table>
      `;
    });
}

function updateLeave(id, status) {
  fetch(`${API_BASE}/leaves/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(() => renderManagerLeaves());
}

// ================= ADMIN: MANAGE USERS =================
function renderManageUsers() {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const total = users.length;
  const employees = users.filter(u => u.role === "EMPLOYEE").length;
  const managers = users.filter(u => u.role === "MANAGER").length;
  const admins = users.filter(u => u.role === "ADMIN").length;

  mainSection.innerHTML = `
    <h2>Manage users, roles and system access</h2>

    <!-- STATS -->
    <div class="admin-stats">
      <div class="stat-card">👥 <b>${total}</b><span>Total Users</span></div>
      <div class="stat-card">🧑‍💻 <b>${employees}</b><span>Employees</span></div>
      <div class="stat-card">🧑‍💼 <b>${managers}</b><span>Managers</span></div>
      <div class="stat-card">👑 <b>${admins}</b><span>Admins</span></div>
    </div>

    <!-- ADD USER -->
    <div class="admin-box">
      <h3>Add New User</h3>
      <div class="add-user-row">
        <input id="newUser" placeholder="Username" />
        <select id="newRole">
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="MANAGER">MANAGER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button onclick="addUser()">➕ Add</button>
      </div>
    </div>

    <!-- USERS TABLE -->
    <div class="admin-box">
      <h3>User Management</h3>
      <table class="leave-table">
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Action</th>
        </tr>

        ${
          users.map(u => `
            <tr>
              <td>${u.username}</td>
              <td>
                <span class="role-badge role-${u.role.toLowerCase()}">
                  ${u.role}
                </span>
              </td>
              <td>
                ${
                  u.username === currentUser.username
                    ? `<span class="muted">Logged in</span>`
                    : `<button class="danger" onclick="deleteUser('${u.username}')">Delete</button>`
                }
              </td>
            </tr>
          `).join("")
        }
      </table>
    </div>
  `;
}
function addUser() {
  const username = document.getElementById("newUser").value.trim();
  const role = document.getElementById("newRole").value;

  if (!username) return alert("Username required");

  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.some(u => u.username === username)) {
    return alert("User already exists");
  }

  users.push({ username, role });
  localStorage.setItem("users", JSON.stringify(users));

  alert("User added successfully ✅");
  renderManageUsers();
}

function deleteUser(username) {
  if (!confirm(`Delete user "${username}"?`)) return;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  users = users.filter(u => u.username !== username);

  localStorage.setItem("users", JSON.stringify(users));
  renderManageUsers();
}

// ================= DARK MODE =================
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

if (toggleBtn) {
  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  };
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  renderSidebar(currentUser.role);
  renderDashboard();
});

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  renderSidebar(currentUser.role);
  renderDashboard();
});
// ================= DARK MODE =================
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

if (toggleBtn) {
  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  };
}
