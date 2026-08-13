# Gracia Digital Elegance

Create a high-end, luxury, ultra-premium restaurant website for "Gracia Family" (Italian Family Restaurant) using React, Tailwind CSS, Lucide Icons, and Framer Motion for smooth 2D animations.

🎨 DESIGN & COLOR PALETTE
- Theme: Luxury Monochromatic (Black, Dark Slate, Charcoal, Off-White, Pure White, with subtle Gold/Warm Champagne accents for interactive states).
- Aesthetics: Minimalist, clean, elegant, high-contrast typography, crisp layout inspired by high-end dining apps.
- Typography: Modern Serif headers paired with clean Sans-serif body text.

✨ ANIMATIONS & INTERACTIVITY (CRITICAL)
- Intro Loader: Smooth black screen fade-out with a glowing "GRACIA" minimal 2D SVG logo reveal animation on page entry.
- Hero Slider / Interactive Dish View: 
  - Showcase dish showcase inspired by smooth interactive carousels: continuous smooth transition when clicking thumbnail dish icons or "Next".
  - Active dish image should smoothly rotate/scale into place with a subtle floating 2D parallax effect.
  - Text transition: Title, description, and price should fade-in-up seamlessly using Framer Motion when switching dishes.
- Page Transitions: Smooth slide-fade transitions between pages.
- Hover Effects: Micro-interactions on buttons, interactive floating food items, and subtle image zoom on hover.

🚀 LANDING PAGE STRUCTURE (HERO & SECTIONS)
1. Header / Navbar:
   - Logo ("GRACIA Family"), Navigation Links (Home, Menu, Book a Table, About Us, Kids Zone, Contact), and a prominent CTA button: "Table Reservation".
2. Hero Section (Interactive Spotlight):
   - Left Side: "Today's Special" header, Dish Title, Rich Description, Price tag, and horizontal mini-thumbnail selector with active borders.
   - Right Side: High-resolution cutout dish image with 2D shadow depth, rotating ambient background element, and smooth page indicator controls.
3. About & Atmosphere:
   - Split layout showcasing Italian family dining vibes, authentic taste, and the dedicated "Kids Zone" area with elegant cards.
4. Interactive Menu Preview:
   - Filterable categories (Starters, Main Courses, Authentic Pizza/Pasta, Desserts, Beverages).
   - Card grid with dish image, title, Italian description, price, and "Add to Order" / "View Details" trigger.
5. Table Reservation System (Modal / Section):
   - Interactive booking form: Guest count picker, Date & Time selection, Contact Info (Name, Phone number - Uzbek format +998), Special Requests.
   - Instant visual confirmation feedback animation upon submission.
6. Footer:
   - Location (Andijan / Uzbekistan context), Operating Hours, Contact (+998 99 609 99 99), Instagram link (@gracia_restaurant), interactive map snippet.

🔐 ADMIN PANEL (/admin)
- Authentication: Simple passcode/login protection page for restaurant managers.
- Menu Management (CRUD): Add new dishes, edit prices, upload image URLs, change descriptions, toggle availability.
- Reservations Dashboard: Table listing showing customer bookings, status badges (Pending, Confirmed, Cancelled), and date filters.
- Site Settings: Option to update main hero special dish banner and general contact details.

Ensure full mobile responsiveness, crisp performance, and pixel-perfect UI execution.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ce64bb93-da52-46f5-9133-88028249b8e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
