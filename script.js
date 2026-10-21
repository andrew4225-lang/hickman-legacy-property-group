const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#name').value.trim();
  const email = document.querySelector('#email').value.trim();
  const interest = document.querySelector('#interest').value;
  const message = document.querySelector('#message').value.trim();
  const subject = encodeURIComponent('Website inquiry: ' + interest);
  const body = encodeURIComponent('Name: ' + name + '\\nEmail: ' + email + '\\nInterest: ' + interest + '\\n\\nMessage:\\n' + message);
  // Replace the placeholder below with the business email address before launch.
  window.location.href = 'mailto:YOUR-EMAIL@example.com?subject=' + subject + '&body=' + body;
});
