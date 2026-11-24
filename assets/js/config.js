/* ==========================================================
   Harmonix Energy: site settings. Edit this file, not the pages.
   ========================================================== */
window.HX = {
  company: "Harmonix Energy Solutions",
  phone: "254706813495",            // WhatsApp / calls, international format with no plus sign
  phoneDisplay: "+254 706 813 495",
  email: "harmonixenergysolutions@gmail.com",
  location: "Nairobi, Kenya",
  tariff: 28,                       // default KES per kWh used in the savings estimates (customers can change it)
  sunHours: 5,                      // default peak sun hours per day (customers can change it)
  panelWatts: 550,                  // default panel size in watts
  proposal: {
    priceKES: 100,                  // price of one full proposal
    paymentNote: "Pay KES 100 by M-Pesa to [add your Till / Paybill here], then send the M-Pesa message on WhatsApp to receive your unlock code.",
    gate: true,                     // true = full proposals need an unlock code; false = everyone gets the full proposal free
    /* Unlock codes are stored as SHA-256 fingerprints so they are not readable in the page.
       To add a code: open tools.html, press F12, paste:  hxHash("YOUR-CODE").then(console.log)  and copy the result here.
       This is a light gate to protect a low-priced product. It is not bank-grade security. */
    unlockHashes: ["f32d42704a6e050c8983811fc139a8f2eb9f62a62415049203f99e6d1bb0fcf3"]  // this is the demo code HX-DEMO. Delete it and add your own codes before launch
  }
};
