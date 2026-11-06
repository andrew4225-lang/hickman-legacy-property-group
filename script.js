const menu=document.getElementById('menu');
const nav=document.getElementById('nav');
if(menu&&nav){
  menu.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
    menu.textContent=open?'×':'☰';
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open');
    menu.textContent='☰';
    menu.setAttribute('aria-expanded','false');
  }));
}
const year=document.getElementById('year');
if(year) year.textContent=new Date().getFullYear();

const contactForm=document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!contactForm.reportValidity()) return;
    const form=new FormData(contactForm);
    const recipient='hickmanfinancialgroup@gmail.com';
    const subject='Hickman Legacy Property Group — '+(form.get('topic')||'Website inquiry');
    const body=[
      'Name: '+(form.get('name')||''),
      'Email: '+(form.get('email')||''),
      'Topic: '+(form.get('topic')||''),
      '',
      'Message:',
      form.get('message')||''
    ].join('\n');
    const mailto='mailto:'+recipient+'?'+new URLSearchParams({subject,body}).toString();
    window.location.href=mailto;
  });
}
