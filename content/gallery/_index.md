+++
template = "index.html"
title = "Gallery"
[extra]
styles = ["gallery.css"]
scripts = ["gallery.js"]
+++

A little photo gallery, with (what I find to be) beautiful pictures I took in the last few months.

They're licensed under the `CreativeCommons BY-NC-SA 4.0`: you may use them as you wish, as long as you follow [the license's terms](https://creativecommons.org/licenses/by-nc-sa/4.0/). They were all taken with a Pixel 6a.

<!-- Inspired by https://github.com/WebDevSimplified/js-css-carousel/ -->
<section aria-label="Photo gallery">
    <div class="carousel" data-carousel>
        <button class="carousel-button prev" data-carousel-button="prev">&#8656;</button>
        <button class="carousel-button next" data-carousel-button="next">&#8658;</button>
        <ul data-slides>
            <li class="slide" data-active>
                <img class="no-hover" src="gallery/20240731-180358134.webp" alt="Photo gallery image">
                <p> Near Lans-en-Vercors, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250502-135359337.webp" alt="Photo gallery image">
                <p> Near Bad Goisern, Austria </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20240801-075808098.webp" alt="Photo gallery image">
                <p> Belvédère Vertiges des Cimes, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20240804-113110862.webp" alt="Photo gallery image">
                <p> Hauts Plateaux du Vercors, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20240806-153659070.webp" alt="Photo gallery image">
                <p> Vallon de la Toussière, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20240809-102804938.webp" alt="Photo gallery image">
                <p> Vallon de la Toussière, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250124-140337832.webp" alt="Photo gallery image">
                <p> Near Saint-Malo, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250127-151718470.webp" alt="Photo gallery image">
                <p> Mont Saint-Michel, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250206-125701139.webp" alt="Photo gallery image">
                <p> Near Romans-Sur-Isère, France </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250211-170056033.webp" alt="Photo gallery image">
                <p> Sevilla, Spain </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250213-105743682.webp" alt="Photo gallery image">
                <p> Pueblos Blancos, Spain </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250225-145912944.webp" alt="Photo gallery image">
                <p> Chefchaouen, Morocco </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250501-090223547.webp" alt="Photo gallery image">
                <p> Near Hallstatt, Austria </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250501-094512313.webp" alt="Photo gallery image">
                <p> Near Hallstatt, Austria </p>
            </li>
            <li class="slide">
                <img class="no-hover" src="gallery/20250502-132536634.webp" alt="Photo gallery image">
                <p> Near Bad Goisern, Austria </p>
            </li>
        </ul>
    </div>
</section>
