# Harmonix Energy website (version 2)

A fast, mobile-first, multi-page static website for GitHub Pages. No build step. Plain HTML, CSS and JavaScript.

## Pages
| Page | What it does |
|---|---|
| `index.html` | Home: services, process, projects, tools, FAQ and enquiry form |
| `services.html` | PV, water heating and other technical services |
| `products.html` | Product catalogue with search, filters, sorting and an enquiry list (WhatsApp or email) |
| `tools.html` | Appliance load calculator and solar savings estimator, plus sizing-sheet requests |
| `proposal.html` | Proposal builder: live preview, print or save as PDF |

## What changed from version 1
- **Layout adapts to every screen.** Fluid sizes (`rem`, `clamp`, auto-fitting grids) replace fixed breakpoints, so it works from small phones to wide monitors and at any browser zoom. No sideways scrolling at 320 px to 1920 px wide.
- **New colour palette.** Deep navy for trust, solar amber for actions, and a readable green for confirmation. Includes automatic dark mode. All text meets contrast guidelines.
- **Clearer wording.** Benefit-led headlines, plain language, Kenya-specific answers (KPLC, outages, WhatsApp).
- **Load calculator:** one-tap appliance presets, editable quantities and hours, motor start-up surge, battery type and depth, system voltage, cloudy-day buffer, growth margin, array space, charge-controller current, biggest energy users, saved between visits.
- **Savings estimator:** works from a bill (KES) or units (kWh), shows monthly and yearly savings, roof-fit check, battery for backup hours, payback (if you enter a quote), and a comparison of 50 / 70 / 90 / 100% solar share.
- **Proposal builder:** a real tool. Import the calculator design, build the bill of quantities, set VAT, terms and warranty, and print a clean 3-page A4 proposal. A free one-page sample is available; the full version is unlocked with a code.
- **Text appears as you scroll.** Headlines rise in word by word, and sections, cards and steps fade in as they come into view. Nothing is hidden if scripts fail, and visitors who prefer reduced motion see everything at once. Edit the list in `assets/js/main.js` (`SEL`) to choose what animates.
- Calculators and proposals can be sent to you on WhatsApp, copied, or printed.

## Settings you should edit
Everything lives in `assets/js/config.js`: phone, email, default tariff, default sun hours, proposal price, M-Pesa note and unlock codes.

### Selling full proposals (KES 100)
The free sample is always available. The full proposal is unlocked by a code:
1. Customer pays KES 100 by M-Pesa (put your Till/Paybill text in `paymentNote`).
2. They send you the M-Pesa message on WhatsApp.
3. You reply with a code.

Codes are stored as SHA-256 fingerprints. To add one: open any page, press F12, type `hxHash("MYCODE-001").then(console.log)`, and copy the result into `unlockHashes`. Codes are not case sensitive. **The demo code `HX-DEMO` is included for testing. Remove it before launch.**
This is a light gate for a low-priced item. Anyone technical can bypass it, because a static website cannot verify payments. For automatic M-Pesa verification you would need a small server (Daraja API).

## Before you publish
- Replace the Unsplash stock photos (they load from the internet) with your own project photos. Put them in `assets/img/` and update the `src` attributes. Photos are labelled "illustrative" on the homepage.
- Confirm the EPRA wording on the badge. Add your licence class/number only if appropriate.
- Add real products, brands and prices in `assets/js/products.js`. Leave `price: null` to show "Request current price".
- Calculator results are preliminary estimates. They use standard assumptions: 75% overall PV efficiency, battery depth 90% (lithium) or 50% (lead-acid), 25% inverter margin.
- Add real sizing-sheet files if you want direct downloads. At present those buttons send a WhatsApp request.

## Deploy to GitHub Pages
Copy everything in this folder to the root of your repository, commit and push. Keep the `assets` folder as it is.
