
const WA_NUMBER = "254706813495";
function waLink(message){return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;}
function openWhatsApp(message){window.open(waLink(message),"_blank","noopener");}
document.querySelectorAll("[data-wa]").forEach(el=>el.addEventListener("click",()=>openWhatsApp(el.dataset.wa||"Hello Harmonix Energy, I would like to make an enquiry.")));
const menuBtn=document.querySelector(".menu-toggle"), navLinks=document.querySelector(".nav-links");
if(menuBtn&&navLinks){menuBtn.addEventListener("click",()=>{navLinks.classList.toggle("open");menuBtn.setAttribute("aria-expanded",navLinks.classList.contains("open")?"true":"false")});navLinks.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>navLinks.classList.remove("open")));}
document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());

// Product catalogue filters
const filterButtons=[...document.querySelectorAll(".filter-btn")], productCards=[...document.querySelectorAll(".catalog-product")], searchInput=document.querySelector("#product-search"), sortSelect=document.querySelector("#product-sort");
let activeCategory="all";
function updateProducts(){const q=(searchInput?.value||"").toLowerCase();productCards.forEach(card=>{const matchCat=activeCategory==="all"||card.dataset.category===activeCategory;const matchText=card.innerText.toLowerCase().includes(q);card.classList.toggle("hidden",!(matchCat&&matchText));});}
filterButtons.forEach(btn=>btn.addEventListener("click",()=>{filterButtons.forEach(b=>b.classList.remove("active"));btn.classList.add("active");activeCategory=btn.dataset.category;updateProducts();}));
if(searchInput)searchInput.addEventListener("input",updateProducts);

// Load calculator
let appliances=[];
const applianceForm=document.querySelector("#appliance-form");
function renderAppliances(){const body=document.querySelector("#appliance-rows");if(!body)return;body.innerHTML="";if(!appliances.length){body.innerHTML='<tr><td colspan="7" class="empty-state">Add an appliance to begin.</td></tr>';return;}appliances.forEach((a,i)=>{const day=a.watts*a.qty*a.day,night=a.watts*a.qty*a.night;const tr=document.createElement("tr");tr.innerHTML=`<td>${a.name.replace(/[<>]/g,"")}</td><td>${a.watts}</td><td>${a.qty}</td><td>${a.day}</td><td>${a.night}</td><td>${Math.round(day).toLocaleString()}</td><td><button class="text-link" type="button" data-remove="${i}">Remove</button></td>`;body.appendChild(tr);});body.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{appliances.splice(Number(b.dataset.remove),1);renderAppliances();}));}
if(applianceForm){applianceForm.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(applianceForm);appliances.push({name:f.get("name"),watts:Number(f.get("watts")),qty:Number(f.get("qty")),day:Number(f.get("day")),night:Number(f.get("night"))});applianceForm.reset();renderAppliances();});}
const calculateLoad=document.querySelector("#calculate-load");
if(calculateLoad)calculateLoad.addEventListener("click",()=>{if(!appliances.length){alert("Add at least one appliance first.");return;}const day=appliances.reduce((s,a)=>s+a.watts*a.qty*a.day,0)/1000;const night=appliances.reduce((s,a)=>s+a.watts*a.qty*a.night,0)/1000;const total=day+night;const peak=appliances.reduce((s,a)=>s+a.watts*a.qty,0);const psHrs=Math.max(1,Number(document.querySelector("#sun-hours")?.value||5));const panelW=Math.max(100,Number(document.querySelector("#panel-watts")?.value||550));const pvKw=total/(psHrs*.75);const panels=Math.ceil(pvKw*1000/panelW);const battery=night/.9;const inverter=Math.ceil(peak*1.25/1000*2)/2;document.querySelector("#load-results").classList.remove("hidden");document.querySelector("#r-day").textContent=day.toFixed(2)+" kWh";document.querySelector("#r-night").textContent=night.toFixed(2)+" kWh";document.querySelector("#r-total").textContent=total.toFixed(2)+" kWh";document.querySelector("#r-pv").textContent=pvKw.toFixed(1)+" kWp";document.querySelector("#r-panels").textContent=panels+" panels";document.querySelector("#r-battery").textContent=battery.toFixed(1)+" kWh";document.querySelector("#r-inverter").textContent=inverter.toFixed(1)+" kW";});
const clearLoad=document.querySelector("#clear-load");if(clearLoad)clearLoad.addEventListener("click",()=>{appliances=[];renderAppliances();document.querySelector("#load-results")?.classList.add("hidden");});

// Simple solar sizing estimator
const solarForm=document.querySelector("#solar-form");
if(solarForm)solarForm.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(solarForm);const monthly=Number(f.get("monthly"));const sun=Number(f.get("sun"));const panel=Number(f.get("panel"));const cover=Number(f.get("cover"))/100;const daily=monthly/30*cover;const kw=daily/(sun*.75);const panels=Math.ceil(kw*1000/panel);const out=document.querySelector("#solar-results");out.classList.remove("hidden");document.querySelector("#solar-kw").textContent=kw.toFixed(1)+" kWp";document.querySelector("#solar-panels").textContent=panels+" panels";document.querySelector("#solar-day").textContent=daily.toFixed(1)+" kWh/day";});

// Enquiry forms open WhatsApp with supplied details
document.querySelectorAll(".enquiry-form").forEach(form=>form.addEventListener("submit",e=>{e.preventDefault();const data=new FormData(form);const msg=[`Hello Harmonix Energy, my name is ${data.get("name")||""}.`,`Phone: ${data.get("phone")||""}`,`Email: ${data.get("email")||""}`,`Service: ${data.get("service")||""}`,`Project details: ${data.get("details")||""}`].join("\n");openWhatsApp(msg);}));
