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


// Investor portal: forms prepare emails; saved listings stay in this browser only.
(function(){
 const recipient='hickmanfinancialgroup@gmail.com';
 function wireMailForm(id,subject,fields){
  const form=document.getElementById(id); if(!form)return;
  form.addEventListener('submit',function(e){e.preventDefault();if(!form.reportValidity())return;
   const data=new FormData(form);const body=fields.map(([label,key])=>label+': '+(data.get(key)||'')).join('\\n');
   window.location.href='mailto:'+recipient+'?'+new URLSearchParams({subject,body}).toString();
  });
 }
 wireMailForm('investorForm','Investor registration — Hickman Legacy',[['Name','name'],['Email','email'],['Phone','phone'],['Investment interest','interest'],['Target purchase range','budget'],['Preferred area','area']]);
 wireMailForm('propertySubmitForm','Property submission — Hickman Legacy',[['Submitted by','name'],['Email','email'],['Property address','address'],['Asking price','price'],['Details / listing link','details']]);
 const cards=Array.from(document.querySelectorAll('.property-card'));
 const key='hickmanLegacySavedProperties';
 function read(){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}}
 function write(items){try{localStorage.setItem(key,JSON.stringify(items))}catch(e){}}
 function render(){const list=document.getElementById('savedList');if(!list)return;const items=read();if(!items.length){list.textContent='No saved properties yet. Use “Save property” on a listing above.';return;}list.innerHTML='';items.forEach(item=>{const row=document.createElement('div');row.className='saved-item';const link=document.createElement('a');link.href=item.href;link.target='_blank';link.rel='noopener';link.textContent=item.name+' — '+item.price;const remove=document.createElement('button');remove.className='save-property';remove.textContent='Remove';remove.addEventListener('click',()=>{write(read().filter(x=>x.href!==item.href));updateButtons();render()});row.append(link,remove);list.append(row)})}
 function updateButtons(){const saved=read();cards.forEach(card=>{const name=card.querySelector('h3')?.textContent?.trim()||'Property';const link=card.querySelector('.property-link')?.href||'#';const price=card.querySelector('.property-price')?.textContent?.trim()||'';const button=card.querySelector('.save-property');if(!button)return;const yes=saved.some(x=>x.href===link);button.textContent=yes?'Saved ✓':'☆ Save property';button.classList.toggle('saved',yes);button.setAttribute('aria-pressed',String(yes))})}
 cards.forEach(card=>{const name=card.querySelector('h3')?.textContent?.trim()||'Property';const link=card.querySelector('.property-link')?.href||'#';const price=card.querySelector('.property-price')?.textContent?.trim()||'';const button=document.createElement('button');button.type='button';button.className='save-property';button.addEventListener('click',()=>{let items=read();if(items.some(x=>x.href===link))items=items.filter(x=>x.href!==link);else items.push({name,href:link,price});write(items);updateButtons();render()});card.querySelector('.property-info')?.append(button)});
 updateButtons();render();
})();
