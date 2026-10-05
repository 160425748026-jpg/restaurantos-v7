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
    Number(n ||
