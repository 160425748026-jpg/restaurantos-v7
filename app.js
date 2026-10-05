/* RestaurantOS V7 - browser-only demo, no server required */
"use strict";

const DB = "restaurantos_v7";

const seed = {
  restaurant: {
    name: "SpiceHub Restaurant",
    type: "Restaurant",
    tagline: "Fresh food. Fast service.",
    phone: "+91 90000 00000",
    address: "Hyderabad, Telangana",
    brand: "#635bff"
  },

  categories: [
    "All",
    "Starters",
    "Mains",
    "Breads",
    "Drinks",
    "Desserts"
  ],

  menu: [
    {
      id: "m1",
      name: "Chicken Biryani",
      cat: "Mains",
      price: 220,
      emoji: "🍛",
      available: true
    },
    {
      id: "m2",
      name: "Chicken 65",
      cat: "Starters",
      price: 180,
      emoji: "🍗",
      available: true
    },
    {
      id: "m3",
      name: "Paneer Tikka",
      cat: "Starters",
      price: 170,
      emoji: "🥘",
      available: true
    },
    {
      id: "m4",
      name: "Butter Naan",
      cat: "Breads",
      price: 45,
      emoji: "🫓",
      available: true
    },
    {
      id: "m5",
      name: "Masala Dosa",
      cat: "Mains",
      price: 120,
      emoji: "🥞",
      available: true
    },
    {
      id: "m6",
      name: "Mango Lassi",
      cat: "Drinks",
      price: 90,
      emoji: "🥭",
      available: true
    },
    {
      id: "m7",
      name: "Gulab Jamun",
      cat: "Desserts",
      price: 80,
      emoji: "🍮",
      available: true
    }
  ],

  tables: Array.from(
    { length: 8 },
    (_, i) => ({
      id: "T" + (i + 1),
      name: "Table " + (i + 1),
      seats: 4,
      status: "Available"
    })
  ),

  orders: [],

  staff: [
    {
      id: "s1",
      name: "Manager",
      role: "Manager",
      active: true
    },
    {
      id: "s2",
      name: "Kitchen",
      role: "Kitchen",
      active: true
    }
  ],

  settings: {
    tax: 5,
    service: 0,
    currency: "₹",
    autoAccept: false
  },

  audit: []
};

let state = read();
let cart = [];

const params = () =>
  new URLSearchParams(location.search);

let view =
  params().get("view") ||
  "dashboard";

let table =
  params().get("table") ||
  "T1";

let category = "All";

function copy(x) {
  return JSON.parse(
    JSON.stringify(x)
  );
}

function read() {
  try {
    const x =
      JSON.parse(
        localStorage.getItem(DB)
      );

    return x
      ? Object.assign(
          copy(seed),
          x
        )
      : copy(seed);

  } catch (e) {
    return copy(seed);
  }
}

function save() {
  localStorage.setItem(
    DB,
    JSON.stringify(state)
  );
}

function id(p) {
  return (
    p +
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2, 7)
  );
}

function esc(x) {
  return String(x ?? "").replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
  );
}

function money(n) {
  return (
    state.settings.currency ||
    "₹"
  ) +
    Number(n || 0).toFixed(0);
}

function toast(s) {
  const t =
    document.getElementById("toast");

  if (!t) return;

  t.textContent = s;

  t.classList.add("show");

  setTimeout(
    () =>
      t.classList.remove("show"),
    2100
  );
}

function audit(s) {
  state.audit.unshift({
    id: id("a"),
    action: s,
    at: new Date().toLocaleString()
  });

  state.audit =
    state.audit.slice(0, 100);

  save();
}

function go(v) {
  view = v;

  history.pushState(
    {},
    "",
    "?view=" + v
  );

  render();
}

function badge(s) {
  const c =
    ["PAID", "READY", "SERVED"].includes(
      s
    )
      ? "ok"
      : ["QUEUED", "IN_PROGRESS"].includes(
          s
        )
      ? "warn"
      : s === "CANCELLED"
      ? "red"
      : "gray";

  return `
    <span class="badge ${c}">
      ${esc(s)}
    </span>
  `;
}

function shell() {
  const nav = [
    ["dashboard", "⌂ Dashboard"],
    ["orders", "▣ Orders"],
    ["menu", "☷ Menu"],
    ["tables", "▦ Tables & QR"],
    ["kitchen", "⚙ Kitchen"],
    ["analytics", "◔ Analytics"],
    ["staff", "♟ Staff"],
    ["settings", "⚙ Settings"]
  ];

  return `
    <div class="layout">

      <aside
        class="sidebar"
        id="sidebar"
      >

        <div class="brand">

          <div class="brandmark">
            R
          </div>

          RestaurantOS

          <span
            class="small"
            style="color:#98a2b3"
          >
            V7
          </span>

        </div>

        <div class="nav">

          ${nav
            .map(
              n => `
                <button
                  class="${
                    view === n[0]
                      ? "active"
                      : ""
                  }"
                  data-nav="${n[0]}"
                >
                  ${n[1]}
                </button>
              `
            )
            .join("")}

        </div>

        <div class="side-footer">

          <button
            class="btn"
            style="width:100%"
            data-customer
          >
            Preview customer
          </button>

        </div>

      </aside>

      <main class="main">

        <header class="topbar">

          <button
            class="mobile"
            id="mobile"
          >
            ☰
          </button>

          <strong>
            ${esc(
              state.restaurant.name
            )}
          </strong>

          <div
            style="
              display:flex;
              gap:8px;
              align-items:center
            "
          >

            <span class="pill">
              ${esc(
                state.restaurant.type
              )}
            </span>

            <button
              class="btn ghost"
              data-reset
            >
              Reset demo
            </button>

          </div>

        </header>

        <section class="content">
          ${viewBody()}
        </section>

      </main>

    </div>
  `;
}

function viewBody() {
  if (view === "customer")
    return customer();

  if (view === "dashboard")
    return dashboard();

  if (view === "orders")
    return orders();

  if (view === "menu")
    return menu();

  if (view === "tables")
    return tables();

  if (view === "kitchen")
    return kitchen();

  if (view === "analytics")
    return analytics();

  if (view === "staff")
    return staff();

  return settings();
}

function dashboard() {
  const active =
    state.orders.filter(
      o => o.status !== "CANCELLED"
    );

  const revenue =
    active.reduce(
      (a, o) => a + o.total,
      0
    );

  const paid =
    state.orders.filter(
      o => o.status === "PAID"
    ).length;

  const low =
    state.menu.filter(
      m => !m.available
    ).length;

  return `
    <div class="hero">

      <div>

        <h1>
          Restaurant operations,
          upgraded.
        </h1>

        <p>
          ${esc(
            state.restaurant.tagline
          )}

          Orders, QR tables,
          kitchen and analytics
          in one browser.
        </p>

      </div>

      <div class="actions">

        <button
          class="btn primary"
          data-nav="menu"
        >
          Manage menu
        </button>

        <button
          class="btn"
          data-customer
        >
          Open customer
        </button>

      </div>

    </div>

    <div class="grid kpis">

      <div class="card kpi">
        <div class="label">
          Revenue
        </div>

        <div class="value">
          ${money(revenue)}
        </div>
      </div>

      <div class="card kpi">
        <div class="label">
          Orders
        </div>

        <div class="value">
          ${state.orders.length}
        </div>
      </div>

      <div class="card kpi">
        <div class="label">
          Kitchen queue
        </div>

        <div class="value">
          ${paid}
        </div>
      </div>

      <div class="card kpi">
        <div class="label">
          Menu items
        </div>

        <div class="value">
          ${state.menu.length}
        </div>
      </div>

      <div class="card kpi">
        <div class="label">
          Hidden items
        </div>

        <div class="value">
          ${low}
        </div>
      </div>

    </div>

    <div class="grid two">

      <div class="card">

        <div class="title">

          <h2>
            Recent orders
          </h2>

          <button
            class="btn ghost"
            data-nav="orders"
          >
            View all
          </button>

        </div>

        ${recent()}

      </div>

      <div class="card">

        <div class="title">
          <h2>
            Operations
          </h2>
        </div>

        <div class="notice">

          Customers scan a table QR
          → browse menu
          → pay the demo checkout
          → paid order enters
          the kitchen queue.

        </div>

        <div style="height:12px"></div>

        <div class="actions">

          <button
            class="btn primary"
            data-nav="tables"
          >
            Tables & QR
          </button>

          <button
            class="btn ghost"
            data-nav="kitchen"
          >
            Kitchen
          </button>

        </div>

      </div>

    </div>
  `;
}

function recent() {
  if (!state.orders.length) {
    return `
      <div class="empty">
        No orders yet.
        Open the customer preview
        and place a demo order.
      </div>
    `;
  }

  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Order</th>
            <th>Table</th>
            <th>Total</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>

          ${state.orders
            .slice(0, 7)
            .map(
              o => `
                <tr>

                  <td>
                    #${o.id
                      .slice(-5)
                      .toUpperCase()}
                  </td>

                  <td>
                    ${esc(o.table)}
                  </td>

                  <td>
                    ${money(o.total)}
                  </td>

                  <td>
                    ${badge(o.status)}
                  </td>

                </tr>
              `
            )
            .join("")}

        </tbody>

      </table>

    </div>
  `;
}

function orders() {
  return `
    <div class="title">

      <div>

        <h2>
          Orders
        </h2>

        <div class="muted small">
          Order control center
        </div>

      </div>

      <button
        class="btn primary"
        data-customer
      >
        New customer order
      </button>

    </div>

    <div class="card">

      <div class="table-wrap">

        <table>

          <thead>

            <tr>
              <th>Order</th>
              <th>Table</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            ${
              state.orders.length
                ? state.orders
                    .map(
                      o => `
                        <tr>

                          <td>
                            #${o.id
                              .slice(-6)
                              .toUpperCase()}
                          </td>

                          <td>
                            ${esc(o.table)}
                          </td>

                          <td>
                            ${o.items.reduce(
                              (a, i) =>
                                a + i.qty,
                              0
                            )}
                          </td>

                          <td>
                            ${money(o.total)}
                          </td>

                          <td>
                            ${badge(o.status)}
                          </td>

                          <td>
                            <button
                              class="btn ghost"
                              data-order="${o.id}"
                            >
                              Details
                            </button>
                          </td>

                        </tr>
                      `
                    )
                    .join("")
                : `
                  <tr>
                    <td
                      colspan="6"
                      class="empty"
                    >
                      No orders.
                    </td>
                  </tr>
                `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}

function menu() {
  return `
    <div class="title">

      <div>

        <h2>
          Menu
        </h2>

        <div class="muted small">
          Products, prices and
          availability
        </div>

      </div>

      <button
        class="btn primary"
        data-add-menu
      >
        Add item
      </button>

    </div>

    <div class="card">

      <div class="tabs">

        ${state.categories
          .map(
            c => `
              <button
                class="tab ${
                  category === c
                    ? "active"
                    : ""
                }"
                data-cat="${esc(c)}"
              >
                ${esc(c)}
              </button>
            `
          )
          .join("")}

      </div>

      <div class="menu-grid">

        ${
          state.menu.filter(
            m =>
              category === "All" ||
              m.cat === category
          ).length
            ? state.menu
                .filter(
                  m =>
                    category === "All" ||
                    m.cat === category
                )
                .map(
                  m => `
                    <div class="card">

                      <div class="food-img">
                        ${m.emoji}
                      </div>

                      <div class="food-body">

                        <h3>
                          ${esc(m.name)}
                        </h3>

                        <div class="muted small">
                          ${esc(m.cat)}
                        </div>

                        <div class="price">
                          ${money(m.price)}
                        </div>

                        <div class="food-actions">

                          <button
                            class="btn ghost"
                            data-edit="${m.id}"
                          >
                            Edit
                          </button>

                          <button
                            class="btn ${
                              m.available
                                ? "success"
                                : "danger"
                            }"
                            data-toggle="${m.id}"
                          >
                            ${
                              m.available
                                ? "Available"
                                : "Hidden"
                            }
                          </button>

                        </div>

                      </div>

                    </div>
                  `
                )
                .join("")
            : `
              <div class="empty">
                No items in this
                category.
              </div>
            `
        }

      </div>

    </div>
  `;
}

function tables() {
  return `
    <div class="title">

      <div>

        <h2>
          Tables & QR
        </h2>

        <div class="muted small">
          Scan links open the
          customer menu for each
          table.
        </div>

      </div>

      <button
        class="btn primary"
        data-add-table
      >
        Add table
      </button>

    </div>

    <div class="tables">

      ${state.tables
        .map(t => {

          const u =
            location.origin +
            location.pathname +
            "?table=" +
            encodeURIComponent(
              t.id
            );

          const q =
            "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
            encodeURIComponent(u);

          return `
            <div class="table-card">

              <div class="table-no">
                ${esc(t.name)}
              </div>

              <div class="muted small">
                ${t.seats} seats
              </div>

              <div style="height:10px"></div>

              <img
                class="qr"
                src="${q}"
                alt="QR ${esc(t.name)}"
              >

              <div style="height:10px"></div>

              <button
                class="btn ghost"
                data-copy="${esc(u)}"
              >
                Copy link
              </button>

            </div>
          `;

        })
        .join("")}

    </div>
  `;
}

function kitchen() {
  const cols = [
    "PAID",
    "IN_PROGRESS",
    "READY"
  ];

  return `
    <div class="title">

      <div>

        <h2>
          Kitchen display
        </h2>

        <div class="muted small">
          Only paid orders enter
          production.
        </div>

      </div>

    </div>

    <div class="kanban">

      ${cols
        .map(
          s => `
            <div class="card">

              <div class="title">

                <h3>
                  ${s.replace(
                    "_",
                    " "
                  )}
                </h3>

                <span class="badge warn">
                  ${
                    state.orders.filter(
                      o =>
                        o.status === s
                    ).length
                  }
                </span>

              </div>

              ${
                state.orders.filter(
                  o =>
                    o.status === s
                ).length
                  ? state.orders
                      .filter(
                        o =>
                          o.status === s
                      )
                      .map(
                        o => `
                          <div class="order-card">

                            <div class="order-head">

                              <strong>
                                #${o.id
                                  .slice(-5)
                                  .toUpperCase()}
                              </strong>

                              ${badge(
                                o.status
                              )}

                            </div>

                            <div class="muted small">
                              ${esc(
                                o.table
                              )}
                            </div>

                            ${o.items
                              .map(
                                i => `
                                  <div class="order-item">

                                    <span>
                                      ${i.qty}×
                                      ${esc(
                                        i.name
                                      )}
                                    </span>

                                    <span>
                                      ${money(
                                        i.qty *
                                          i.price
                                      )}
                                    </span>

                                  </div>
                                `
                              )
                              .join("")}

                            <button
                              class="btn ${
                                s === "READY"
                                  ? "success"
                                  : "primary"
                              }"
                              style="
                                width:100%;
                                margin-top:8px
                              "
                              data-next="${o.id}"
                            >
                              ${
                                s === "PAID"
                                  ? "Start preparing"
                                  : s ===
                                    "IN_PROGRESS"
                                  ? "Mark ready"
                                  : "Mark served"
                              }
                            </button>

                          </div>
                        `
                      )
                      .join("")
                  : `
                    <div class="empty">
                      No orders.
                    </div>
                  `
              }

            </div>
          `
        )
        .join("")}

    </div>
  `;
}

function analytics() {
  const active =
    state.orders.filter(
      o => o.status !== "CANCELLED"
    );

  const revenue =
    active.reduce(
      (a, o) => a + o.total,
      0
    );

  const avg =
    active.length
      ? revenue / active.length
      : 0;

  const top =
    state.menu
      .map(m => ({
        name: m.name,
        count: state.orders.reduce(
          (a, o) =>
            a +
            o.items
              .filter(
                i =>
                  i.id === m.id
              )
              .reduce(
                (b, i) =>
                  b + i.qty,
                0
              ),
          0
        )
      }))
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 6);

  return `
    <div class="title">

      <div>

        <h2>
          Analytics
        </h2>

        <div class="muted small">
          Based on this browser's
          demo data.
        </div>

      </div>

    </div>

    <div class="grid kpis">

      <div class="card kpi">
        <div class="label">
          Revenue
        </div>

        <div class="value">
          ${money(revenue)}
        </div>
      </div>

      <div class="card kpi">
        <div class="label">
          Average order
        </div>

        <div class="value">
          ${money(avg)}
        </div>
      </div>

      <div class="card kpi">
        <div class="label">
          Completed
        </div>

        <div class="value">
          ${
            state.orders.filter(
              o =>
                o.status ===
                "SERVED"
            ).length
          }
        </div>
      </div>

    </div>

    <div class="grid two">

      <div class="card">

        <div class="title">
          <h2>
            Top items
          </h2>
        </div>

        ${
          top
            .map(
              x => `
                <div class="order-item">

                  <span>
                    ${esc(x.name)}
                  </span>

                  <strong>
                    ${x.count}
                  </strong>

                </div>
              `
            )
            .join("") ||
          `<div class="empty">No sales yet.</div>`
        }

      </div>

      <div class="card">

        <div class="title">
          <h2>
            Activity
          </h2>
        </div>

        ${
          state.audit
            .slice(0, 8)
            .map(
              a => `
                <div class="order-item">

                  <span>
                    ${esc(a.action)}
                  </span>

                  <span class="muted small">
                    ${esc(a.at)}
                  </span>

                </div>
              `
            )
            .join("") ||
          `<div class="empty">No activity yet.</div>`
        }

      </div>

    </div>
  `;
}

function staff() {
  return `
    <div class="title">

      <div>

        <h2>
          Staff
        </h2>

        <div class="muted small">
          Manage restaurant team.
        </div>

      </div>

      <button
        class="btn primary"
        data-add-staff
      >
        Add staff
      </button>

    </div>

    <div class="card">

      <div class="table-wrap">

        <table>

          <thead>

            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            ${state.staff
              .map(
                s => `
                  <tr>

                    <td>
                      ${esc(s.name)}
                    </td>

                    <td>
                      ${esc(s.role)}
                    </td>

                    <td>
                      ${s.active
                        ? badge("ACTIVE")
                        : badge(
                            "INACTIVE"
                          )}
                    </td>

                    <td>

                      <button
                        class="btn ghost"
                        data-staff="${s.id}"
                      >
                        ${
                          s.active
                            ? "Disable"
                            : "Enable"
                        }
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>

        </table>

      </div>

    </div>
  `;
}

function settings() {
  return `
    <div class="title">

      <div>

        <h2>
          Settings
        </h2>

        <div class="muted small">
          Restaurant branding and
          checkout settings.
        </div>

      </div>

    </div>

    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            Restaurant name
          </label>

          <input
            class="input"
            id="sn"
            value="${esc(
              state.restaurant.name
            )}"
          >

        </div>

        <div class="field">

          <label>
            Type
          </label>

          <select
            class="select"
            id="st"
          >

            ${[
              "Restaurant",
              "Cafe",
              "Fast Food",
              "Bakery"
            ]
              .map(
                x => `
                  <option
                    ${
                      state.restaurant.type ===
                      x
                        ? "selected"
                        : ""
                    }
                  >
                    ${x}
                  </option>
                `
              )
              .join("")}

          </select>

        </div>

        <div class="field">

          <label>
            Phone
          </label>

          <input
            class="input"
            id="sp"
            value="${esc(
              state.restaurant.phone
            )}"
          >

        </div>

        <div class="field">

          <label>
            Brand color
          </label>

          <input
            class="input"
            id="sb"
            value="${esc(
              state.restaurant.brand
            )}"
          >

        </div>

        <div class="field">

          <label>
            Tagline
          </label>

          <input
            class="input"
            id="sg"
            value="${esc(
              state.restaurant.tagline
            )}"
          >

        </div>

        <div class="field">

          <label>
            Address
          </label>

          <input
            class="input"
            id="sa"
            value="${esc(
              state.restaurant.address
            )}"
          >

        </div>

        <div class="field">

          <label>
            Tax %
          </label>

          <input
            class="input"
            id="tax"
            type="number"
            value="${state.settings.tax}"
          >

        </div>

        <div class="field">

          <label>
            Currency
          </label>

          <input
            class="input"
            id="cur"
            value="${esc(
              state.settings.currency
            )}"
          >

        </div>

      </div>

      <div style="height:16px"></div>

      <button
        class="btn primary"
        data-save-settings
      >
        Save settings
      </button>

    </div>
  `;
}

function customer() {
  const items =
    state.menu.filter(
      m =>
        m.available &&
        (
          category === "All" ||
          m.cat === category
        )
    );

  const count =
    cart.reduce(
      (a, i) => a + i.qty,
      0
    );

  const total =
    cart.reduce(
      (a, i) =>
        a + i.price * i.qty,
      0
    );

  return `
    <div class="customer">

      <header class="customer-head">

        <div class="title">

          <div>

            <div
              class="small"
              style="color:#cdd5e1"
            >
              TABLE ${esc(table)}
            </div>

            <h1 style="margin:4px 0">
              ${esc(
                state.restaurant.name
              )}
            </h1>

            <div
              style="color:#d6dbea"
            >
              ${esc(
                state.restaurant.tagline
              )}
            </div>

          </div>

          <button
            class="btn"
            data-admin
          >
            Admin
          </button>

        </div>

      </header>

      <section class="content">

        <div class="tabs">

          ${state.categories
            .map(
              c => `
                <button
                  class="tab ${
                    category === c
                      ? "active"
                      : ""
                  }"
                  data-cat="${esc(c)}"
                >
                  ${esc(c)}
                </button>
              `
            )
            .join("")}

        </div>

        <div class="menu-grid">

          ${items
            .map(
              m => `
                <div class="card">

                  <div class="food-img">
                    ${m.emoji}
                  </div>

                  <div class="food-body">

                    <h3>
                      ${esc(m.name)}
                    </h3>

                    <div class="muted small">
                      ${esc(m.cat)}
                    </div>

                    <div class="price">
                      ${money(m.price)}
                    </div>

                    <button
                      class="btn primary"
                      style="
                        width:100%;
                        margin-top:10px
                      "
                      data-add-cart="${m.id}"
                    >
                      Add to cart
                    </button>

                  </div>

                </div>
              `
            )
            .join("")}

        </div>

        ${
          count
            ? `
              <div class="cartbar">

                <div>

                  <strong>
                    ${count}
                    item${
                      count > 1
                        ? "s"
                        : ""
                    }
                  </strong>

                  <div class="muted small">
                    ${money(total)}
                  </div>

                </div>

                <button
                  class="btn primary"
                  data-cart
                >
                  View cart →
                </button>

              </div>
            `
            : ""
        }

      </section>

    </div>
  `;
}

function openModal(content) {
  const box =
    document.getElementById(
      "modalBox"
    );

  const modal =
    document.getElementById(
      "modal"
    );

  if (!box || !modal) return;

  box.innerHTML = content;

  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document
    .querySelectorAll("[data-close]")
    .forEach(
      x =>
        (x.onclick =
          closeModal)
    );
}

function closeModal() {
  const modal =
    document.getElementById(
      "modal"
    );

  if (!modal) return;

  modal.classList.remove(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );
}

function menuModal(mid) {
  const m = mid
    ? state.menu.find(
        x => x.id === mid
      )
    : {
        name: "",
        cat: "Mains",
        price: 0,
        emoji: "🍽️"
      };

  openModal(`
    <div class="modal-head">

      <h2>
        ${mid ? "Edit" : "Add"}
        item
      </h2>

      <button
        class="close"
        data-close
      >
        ×
      </button>

    </div>

    <div class="form-grid">

      <div class="field full">

        <label>
          Name
        </label>

        <input
          class="input"
          id="mn"
          value="${esc(m.name)}"
        >

      </div>

      <div class="field">

        <label>
          Category
        </label>

        <input
          class="input"
          id="mc"
          value="${esc(m.cat)}"
        >

      </div>

      <div class="field">

        <label>
          Price
        </label>

        <input
          class="input"
          id="mp"
          type="number"
          value="${m.price}"
        >

      </div>

      <div class="field">

        <label>
          Emoji
        </label>

        <input
          class="input"
          id="me"
          value="${esc(m.emoji)}"
        >

      </div>

    </div>

    <div style="height:14px"></div>

    <button
      class="btn primary"
      id="saveMenu"
    >
      Save item
    </button>
  `);

  document
    .getElementById(
      "saveMenu"
    )
    .onclick = () => {

      const x = {
        id:
          m.id ||
          id("m"),

        name:
          document
            .getElementById("mn")
            .value
            .trim(),

        cat:
          document
            .getElementById("mc")
            .value
            .trim() ||
          "Mains",

        price:
          Number(
            document
              .getElementById("mp")
              .value
          ) || 0,

        emoji:
          document
            .getElementById("me")
            .value ||
          "🍽️",

        available: true
      };

      if (!x.name) {
        return toast(
          "Enter a name"
        );
      }

      if (mid) {
        Object.assign(
          state.menu.find(
            z => z.id === mid
          ),
          x
        );
      } else {
        state.menu.push(x);
      }

      if (
        !state.categories.includes(
          x.cat
        )
      ) {
        state.categories.push(
          x.cat
        );
      }

      save();

      audit(
        (mid
          ? "Edited "
          : "Added ") +
          x.name
      );

      closeModal();

      render();
    };
}

function cartModal() {
  const total =
    cart.reduce(
      (a, i) =>
        a + i.price * i.qty,
      0
    );

  openModal(`
    <div class="modal-head">

      <h2>
        Cart · ${esc(table)}
      </h2>

      <button
        class="close"
        data-close
      >
        ×
      </button>

    </div>

    ${cart
      .map(
        i => `
          <div
            style="
              padding:10px 0;
              border-bottom:1px solid var(--line);
              display:flex;
              justify-content:space-between
            "
          >

            <div>

              <strong>
                ${esc(i.name)}
              </strong>

              <div class="muted small">
                ${money(i.price)}
              </div>

            </div>

            <div class="stepper">

              <button
                data-minus="${i.id}"
              >
                −
              </button>

              <strong>
                ${i.qty}
              </strong>

              <button
                data-plus="${i.id}"
              >
                +
              </button>

            </div>

          </div>
        `
      )
      .join("")}

    <div
      style="
        padding:13px 0;
        display:flex;
        justify-content:space-between
      "
    >

      <strong>
        Total
      </strong>

      <strong>
        ${money(total)}
      </strong>

    </div>

    <div class="notice small">
      Demo payment only —
      no real money is charged.
    </div>

    <div style="height:12px"></div>

    <button
      class="btn primary"
      id="pay"
      style="width:100%"
    >
      Pay & place order
    </button>
  `);

  document
    .querySelectorAll(
      "[data-minus]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const x =
            cart.find(
              i =>
                i.id ===
                b.dataset.minus
            );

          if (x) x.qty--;

          cart =
            cart.filter(
              i => i.qty > 0
            );

          cartModal();
        })
    );

  document
    .querySelectorAll(
      "[data-plus]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const x =
            cart.find(
              i =>
                i.id ===
                b.dataset.plus
            );

          if (x) x.qty++;

          cartModal();
        })
    );

  document
    .getElementById("pay")
    .onclick =
    placeOrder;
}

function placeOrder() {
  if (!cart.length)
    return;

  const sub =
    cart.reduce(
      (a, i) =>
        a + i.price * i.qty,
      0
    );

  const tax =
    sub *
    state.settings.tax /
    100;

  const service =
    sub *
    state.settings.service /
    100;

  const o = {
    id: id("o"),

    table,

    items: cart.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty
    })),

    subtotal: sub,

    tax,

    service,

    total:
      sub +
      tax +
      service,

    status: "PAID",

    createdAt:
      new Date().toISOString()
  };

  state.orders.unshift(o);

  cart = [];

  save();

  audit(
    "Paid order " +
      o.id.slice(-5)
  );

  closeModal();

  toast(
    "Payment successful — sent to kitchen"
  );

  render();
}

function bind() {

  document
    .querySelectorAll("[data-nav]")
    .forEach(
      b =>
        (b.onclick = () =>
          go(
            b.dataset.nav
          ))
    );

  document
    .querySelectorAll(
      "[data-customer]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          view = "customer";

          history.pushState(
            {},
            "",
            "?table=" +
              encodeURIComponent(
                table
              )
          );

          render();
        })
    );

  document
    .querySelector(
      "[data-admin]"
    )
    ?.addEventListener(
      "click",
      () => go("dashboard")
    );

  document
    .getElementById("mobile")
    ?.addEventListener(
      "click",
      () =>
        document
          .getElementById(
            "sidebar"
          )
          ?.classList.toggle(
            "open"
          )
    );

  document
    .querySelector(
      "[data-reset]"
    )
    ?.addEventListener(
      "click",
      () => {

        if (
          confirm(
            "Reset all demo data?"
          )
        ) {

          state = copy(seed);

          save();

          audit(
            "Demo reset"
          );

          render();
        }

      }
    );

  document
    .querySelectorAll(
      "[data-cat]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          category =
            b.dataset.cat;

          render();
        })
    );

  document
    .querySelectorAll(
      "[data-add-cart]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const m =
            state.menu.find(
              x =>
                x.id ===
                b.dataset.addCart
            );

          if (!m) return;

          const x =
            cart.find(
              x =>
                x.id === m.id
            );

          if (x)
            x.qty++;
          else
            cart.push({
              ...m,
              qty: 1
            });

          toast(
            m.name +
              " added to cart"
          );

          render();
        })
    );

  document
    .querySelector(
      "[data-cart]"
    )
    ?.addEventListener(
      "click",
      cartModal
    );

  document
    .querySelector(
      "[data-add-menu]"
    )
    ?.addEventListener(
      "click",
      () => menuModal()
    );

  document
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(
      b =>
        (b.onclick = () =>
          menuModal(
            b.dataset.edit
          ))
    );

  document
    .querySelectorAll(
      "[data-toggle]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const m =
            state.menu.find(
              x =>
                x.id ===
                b.dataset.toggle
            );

          if (!m) return;

          m.available =
            !m.available;

          save();

          audit(
            (m.available
              ? "Enabled "
              : "Hidden ") +
              m.name
          );

          render();
        })
    );

  document
    .querySelectorAll(
      "[data-copy]"
    )
    .forEach(
      b =>
        (b.onclick = async () => {

          try {

            await navigator.clipboard.writeText(
              b.dataset.copy
            );

            toast(
              "Link copied"
            );

          } catch (e) {

            toast(
              "Copy unavailable"
            );
          }
        })
    );

  document
    .querySelector(
      "[data-add-table]"
    )
    ?.addEventListener(
      "click",
      () => {

        openModal(`
          <div class="modal-head">

            <h2>
              Add table
            </h2>

            <button
              class="close"
              data-close
            >
              ×
            </button>

          </div>

          <div class="form-grid">

            <div class="field">

              <label>
                Name
              </label>

              <input
                class="input"
                id="tn"
                placeholder="Table 9"
              >

            </div>

            <div class="field">

              <label>
                Seats
              </label>

              <input
                class="input"
                id="ts"
                type="number"
                value="4"
              >

            </div>

          </div>

          <div style="height:14px"></div>

          <button
            class="btn primary"
            id="ct"
          >
            Create
          </button>
        `);

        document
          .getElementById("ct")
          .onclick = () => {

            const n =
              document
                .getElementById("tn")
                .value
                .trim() ||
              "Table " +
                (state.tables
                  .length +
                  1);

            state.tables.push({
              id:
                "T" +
                (state.tables
                  .length +
                  1),
              name: n,
              seats:
                Number(
                  document
                    .getElementById(
                      "ts"
                    )
                    .value
                ) || 4,
              status:
                "Available"
            });

            save();

            audit(
              "Created " + n
            );

            closeModal();

            render();
          };
      }
    );

  document
    .querySelectorAll(
      "[data-next]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const o =
            state.orders.find(
              x =>
                x.id ===
                b.dataset.next
            );

          if (!o) return;

          o.status =
            o.status === "PAID"
              ? "IN_PROGRESS"
              : o.status ===
                "IN_PROGRESS"
              ? "READY"
              : "SERVED";

          save();

          audit(
            "Order " +
              o.id.slice(-5) +
              " → " +
              o.status
          );

          render();
        })
    );

  document
    .querySelectorAll(
      "[data-order]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const o =
            state.orders.find(
              x =>
                x.id ===
                b.dataset.order
            );

          if (!o) return;

          openModal(`
            <div class="modal-head">

              <h2>
                Order #
                ${o.id
                  .slice(-6)
                  .toUpperCase()}
              </h2>

              <button
                class="close"
                data-close
              >
                ×
              </button>

            </div>

            <p>
              ${esc(o.table)}
              ·
              ${badge(o.status)}
            </p>

            ${o.items
              .map(
                i => `
                  <div class="order-item">

                    <span>
                      ${i.qty}×
                      ${esc(i.name)}
                    </span>

                    <strong>
                      ${money(
                        i.qty *
                          i.price
                      )}
                    </strong>

                  </div>
                `
              )
              .join("")}

            <div
              style="
                text-align:right;
                padding-top:10px
              "
            >
              <strong>
                Total
                ${money(o.total)}
              </strong>
            </div>
          `);
        })
    );

  document
    .querySelectorAll(
      "[data-staff]"
    )
    .forEach(
      b =>
        (b.onclick = () => {

          const s =
            state.staff.find(
              x =>
                x.id ===
                b.dataset.staff
            );

          if (!s) return;

          s.active =
            !s.active;

          save();

          audit(
            "Changed " +
              s.name +
              " status"
          );

          render();
        })
    );

  document
    .querySelector(
      "[data-add-staff]"
    )
    ?.addEventListener(
      "click",
      () => {

        openModal(`
          <div class="modal-head">

            <h2>
              Add staff
            </h2>

            <button
              class="close"
              data-close
            >
              ×
            </button>

          </div>

          <div class="form-grid">

            <div class="field">

              <label>
                Name
              </label>

              <input
                class="input"
                id="stn"
              >

            </div>

            <div class="field">

              <label>
                Role
              </label>

              <select
                class="select"
                id="str"
              >

                <option>
                  Manager
                </option>

                <option>
                  Cashier
                </option>

                <option>
                  Kitchen
                </option>

                <option>
                  Waiter
                </option>

              </select>

            </div>

          </div>

          <div style="height:14px"></div>

          <button
            class="btn primary"
            id="as"
          >
            Add
          </button>
        `);

        document
          .getElementById("as")
          .onclick = () => {

            const n =
              document
                .getElementById(
                  "stn"
                )
                .value
                .trim();

            if (!n)
              return toast(
                "Enter a name"
              );

            state.staff.push({
              id: id("s"),
              name: n,
              role:
                document
                  .getElementById(
                    "str"
                  )
                  .value,
              active: true
            });

            save();

            audit(
              "Added staff " +
                n
            );

            closeModal();

            render();
          };
      }
    );

  document
    .querySelector(
      "[data-save-settings]"
    )
    ?.addEventListener(
      "click",
      () => {

        state.restaurant.name =
          document
            .getElementById("sn")
            .value
            .trim() ||
          "Restaurant";

        state.restaurant.type =
          document
            .getElementById("st")
            .value;

        state.restaurant.phone =
          document
            .getElementById("sp")
            .value;

        state.restaurant.brand =
          document
            .getElementById("sb")
            .value ||
          "#635bff";

        state.restaurant.tagline =
          document
            .getElementById("sg")
            .value;

        state.restaurant.address =
          document
            .getElementById("sa")
            .value;

        state.settings.tax =
          Math.max(
            0,
            Number(
              document
                .getElementById(
                  "tax"
                )
                .value
            ) || 0
          );

        state.settings.currency =
          document
            .getElementById("cur")
            .value ||
          "₹";

        document.documentElement.style.setProperty(
          "--brand",
          state.restaurant.brand
        );

        save();

        audit(
          "Updated settings"
        );

        toast("Saved");

        render();
      }
    );
}

function render() {
  document.documentElement.style.setProperty(
    "--brand",
    state.restaurant.brand ||
      "#635bff"
  );

  const app =
    document.getElementById(
      "app"
    );

  if (!app) return;

  app.innerHTML =
    view === "customer"
      ? customer()
      : shell();

  bind();
}

window.addEventListener(
  "storage",
  () => {
    state = read();
    render();
  }
);

window.addEventListener(
  "popstate",
  () => {

    const p = params();

    view =
      p.get("view") ||
      "dashboard";

    table =
      p.get("table") ||
      "T1";

    render();
  }
);

render();
