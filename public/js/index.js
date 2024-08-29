const menu = document.querySelector('.main-menu');
const toggleSidebar = document.querySelector('.hamburger-icon');
const sections = document.querySelectorAll('section');
const components = document.querySelectorAll('.auto-container');
const closeBtn = menu.querySelector('.close-btn');

menu.querySelectorAll('li.dropdown .dropdown-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const prevElement = this.previousElementSibling;
    if (prevElement) {
      prevElement.style.display = prevElement.style.display === 'block' ? 'none' : 'block';
    }
    this.classList.toggle('active');
  });
});

const openMenu = () => {
  menu.classList.add('mobile-menu');
  document.documentElement.classList.add('mobile-menu-visible');

  toggleSidebar.style.visibility = 'hidden';
  components.forEach((component) => {
    component.classList.add('menu-visible');
  });

  sections.forEach((section) => {
    section.classList.add('menu-visible');
  });

  const nav = menu.querySelector('.navigation');
  if (nav && nav.innerHTML.trim() === '') {
    const menuContent = mainHeader.innerHTML;
    nav.innerHTML = menuContent;
  }
};

const closeMenu = () => {
  menu.classList.remove('mobile-menu');
  toggleSidebar.style.visibility = 'visible';
  document.documentElement.classList.remove('mobile-menu-visible');

  components.forEach((component) => {
    component.classList.remove('menu-visible');
  });

  sections.forEach((section) => {
    section.classList.remove('menu-visible');
  });
};

document.querySelector('.menu-backdrop').addEventListener('click', function () {
  toggleSidebar.style.visibility = 'visible';
  menu.classList.remove('mobile-menu');
  document.documentElement.classList.remove('mobile-menu-visible');
});

document.addEventListener('DOMContentLoaded', function () {
  applySavedTheme();
  document.getElementById('toggleIcon').addEventListener('click', toggleTheme);
});

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  const toggleIcon = document.getElementById('toggleIcon');
  const themeToApply = savedTheme;

  document.body.setAttribute('data-theme', themeToApply);

  if (themeToApply === 'light') {
    toggleIcon.classList.remove('fa-moon');
    toggleIcon.classList.add('fa-sun');
  } else {
    toggleIcon.classList.remove('fa-sun');
    toggleIcon.classList.add('fa-moon');
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', newTheme);
  document.body.setAttribute('data-theme', newTheme);

  const toggleIcon = document.getElementById('toggleIcon');
  if (newTheme === 'light') {
    toggleIcon.classList.remove('fa-moon');
    toggleIcon.classList.add('fa-sun');
  } else {
    toggleIcon.classList.remove('fa-sun');
    toggleIcon.classList.add('fa-moon');
  }
}
