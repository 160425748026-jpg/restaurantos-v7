/* RestaurantOS V7 — browser-only demo */
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
    {id:"m1",name:"Chicken Biryani",cat:"Mains",price:220,emoji:"🍛",available:true},
    {id:"m2",name:"Chicken 65",cat:"Starters",price:180,emoji:"🍗",available:true},
    {id:"m3",name:"Paneer Tikka",cat:"Starters",price:170,emoji:"🥘",available:true},
    {id:"m4",name:"Butter Naan",cat:"Breads",price:45,emoji:"🫓",available:true},
    {id:"m5",name:"Masala Dosa",cat:"Mains",price:120,emoji:"🥞",available:true},
    {id:"m6",name:"Mango Lassi",cat:"Drinks",price:90,emoji:"🥭",available:true},
    {id:"m7",name:"Gulab Jamun",cat:"Desserts",price:80,emoji:"🍮",available:true}
  ],

  tables: Array.from(
    {length:8},
    (_,i)=>({
      id:"T"+(i+1),
      name:"Table "+(i+1),
      seats:4,
      status:"Available"
    })
  ),

  orders: [],

  staff: [
    {id:"s1",name:"Manager",role:"Manager",active:true},
    {id:"s2",name:"Kitchen",role:"Kitchen",active:true}
  ],

  settings: {
    tax:5,
    service:0,
    currency:"₹",
    autoAccept:false
  },

  audit:[]
};

let state = read();
let cart = [];

const params = () => new URLSearchParams(location.search);

let view = params().get("view") || "dashboard";
let table = params().get("table") || "T1";
let category = "All";

function copy(x){
  return JSON.parse(JSON.stringify(x));
}

function read(){
  try{
    const x = JSON.parse(localStorage.getItem(DB));
    return x ? Object.assign(copy(seed),x) : copy(seed);
  }catch(e){
    return copy(seed);
  }
}

function save(){
  localStorage.setItem(DB,JSON.stringify(state));
}

function id(prefix){
  return prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2,7);
}

function esc(x){
  return String(x ?? "").replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));
}

function money(n){
  return (state.settings.currency || "₹") +
    Number(n || 0).toFixed(0);
}

function toast(message){
  const t = document.getElementById("toast");

  t.textContent = message;
  t.classList.add("show");

  setTimeout(()=>{
    t.classList.remove("show");
  },2100);
}

function audit(message){
  state.audit.unshift({
    id:id("a"),
    action:message,
    at:new Date().toLocaleString()
  });

  state.audit = state.audit.slice(0,100);

  save();
}

function go(nextView){
  view = nextView;

  history.pushState(
    {},
    "",
    "?view=" + encodeURIComponent(nextView)
  );

  render();
}

function badge(status){
  const type =
    ["PAID","READY","SERVED"].includes(status)
      ? "ok"
      : ["QUEUED","IN_PROGRESS"].includes(status)
      ? "warn"
      : status === "CANCELLED"
      ? "red"
      : "gray";

  return `<span class="badge ${type}">
    ${esc(status)}
  </span>`;
}

function shell(){

  const nav = [
    ["dashboard","⌂ Dashboard"],
    ["orders","▣ Orders"],
    ["menu","☷ Menu"],
    ["tables","▦ Tables & QR"],
    ["kitchen","⚙ Kitchen"],
    ["analytics","◔ Analytics"],
    ["staff","♟ Staff"],
    ["settings","⚙ Settings"]
  ];

  return `
  <div class="layout">

    <aside class="sidebar" id="sidebar">

      <div class="brand">
        <div class="brandmark">R</div>
        RestaurantOS
        <span class="small" style="color:#98a2b3">V7</span>
      </div>

      <div class="nav">

        ${nav.map(n=>`
          <button
            class="${view===n[0]?"active":""}"
            data-nav="${n[0]}"
          >
            ${n[1]}
          </button>
        `).join("")}

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
          ${esc(state.restaurant.name)}
        </strong>

        <div style="display:flex;gap:8px;align-items:center">

          <span class="pill">
            ${esc(state.restaurant.type)}
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

function viewBody(){

  if(view === "customer")
    return customer();

  if(view === "dashboard")
    return dashboard();

  if(view === "orders")
    return orders();

  if(view === "menu")
    return menu();

  if(view === "tables")
    return tables();

  if(view === "kitchen")
    return kitchen();

  if(view === "analytics")
    return analytics();

  if(view === "staff")
    return staff();

  return settings();
}

function dashboard(){

  const active =
    state.orders.filter(
      o=>o.status !== "CANCELLED"
    );

  const revenue =
    active.reduce(
      (a,o)=>a + o.total,
      0
    );

  const paid =
    state.orders.filter(
      o=>o.status === "PAID"
    ).length;

  const hidden =
    state.menu.filter(
      m=>!m.available
    ).length;

  return `

  <div class="hero">

    <div>

      <h1>
        Restaurant operations, upgraded.
      </h1>

      <p>
        ${esc(state.restaurant.tagline)}
        Orders, QR tables, kitchen and analytics in one browser.
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
      <div class="label">Revenue</div>
      <div class="value">${money(revenue)}</div>
    </div>

    <div class="card kpi">
      <div class="label">Orders</div>
      <div class="value">${state.orders.length}</div>
    </div>

    <div class="card kpi">
      <div class="label">Kitchen queue</div>
      <div class="value">${paid}</div>
    </div>

    <div class="card kpi">
      <div class="label">Menu items</div>
      <div class="value">${state.menu.length}</div>
    </div>

    <div class="card kpi">
      <div class="label">Hidden items</div>
      <div class="value">${hidden}</div>
    </div>

  </div>

  <div class="grid two">

    <div class="card">

      <div class="title">

        <h2>Recent orders</h2>

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
        <h2>Operations</h2>
      </div>

      <div class="notice">

        Customers scan a table QR →
        browse menu →
        pay the demo checkout →
        paid order enters the kitchen queue.

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

function recent(){

  if(!state.orders.length){

    return `
      <div class="empty">
        No orders yet.
        Open the customer preview and place a demo order.
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

        ${state.orders.slice(0,7).map(o=>`

          <tr>

            <td>
              #${o.id.slice(-5).toUpperCase()}
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

        `).join("")}

      </tbody>

    </table>

  </div>
  `;
}

function orders(){

  return `

  <div class="title">

    <div>
      <h
