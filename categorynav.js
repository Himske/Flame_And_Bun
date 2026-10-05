const categoryNav = document.querySelector('[aria-label="Menu categories"]');
const activeClasses = ['bg-red-600', 'text-white'];
const inactiveClasses = ['bg-white', 'text-stone-700', 'hover:bg-orange-100'];
const categoryLinks = [...categoryNav.querySelectorAll('a[href^="#"]')];

function setActiveCategory(selectedLink) {
    categoryLinks.forEach((link) => {
        const isSelected = link === selectedLink;
        link.classList.remove(...(isSelected ? inactiveClasses : activeClasses));
        link.classList.add(...(isSelected ? activeClasses : inactiveClasses));

        if (isSelected) {
            link.setAttribute('aria-current', 'location');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

categoryNav.addEventListener('click', (event) => {
    const selectedLink = event.target.closest('a[href^="#"]');
    if (selectedLink && categoryNav.contains(selectedLink)) {
        setActiveCategory(selectedLink);
    }
});

const categorySections = categoryLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
let scrollUpdatePending = false;

function updateActiveCategoryFromScroll() {
    if (scrollUpdatePending) return;
    scrollUpdatePending = true;

    requestAnimationFrame(() => {
        scrollUpdatePending = false;
        const navBottom = categoryNav.getBoundingClientRect().bottom;
        const activationPoint = navBottom + (window.innerHeight - navBottom) / 2;
        const activeSection = categorySections.reduce((currentSection, section) =>
            section.getBoundingClientRect().top <= activationPoint ? section : currentSection,
            categorySections[0]);
        const activeLink = categoryLinks.find((link) =>
            link.getAttribute('href') === `#${activeSection?.id}`
        );

        if (activeLink) setActiveCategory(activeLink);
    });
}

window.addEventListener('scroll', updateActiveCategoryFromScroll, { passive: true });
window.addEventListener('resize', updateActiveCategoryFromScroll);
updateActiveCategoryFromScroll();