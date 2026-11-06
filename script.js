const menu=document.getElementById('menu');
const nav=document.getElementById('nav');
if(menu&&nav){
  menu.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
    menu.textContent=open?'×':'☰';
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open'); menu.textContent='☰'; menu.setAttribute('aria-expanded','false');
  }));
}
const year=document.getElementById('year');
if(year) year.textContent=new Date().getFullYear();

const contactForm=document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit',e=>{
    e.preventDefault(); if(!contactForm.reportValidity()) return;
    const form=new FormData(contactForm);
    const body=['Name: '+(form.get('name')||''),'Email: '+(form.get('email')||''),'Topic: '+(form.get('topic')||''),'','Message:',form.get('message')||''].join('\n');
    window.location.href='mailto:hickmanfinancialgroup@gmail.com?'+new URLSearchParams({subject:'Hickman Legacy Property Group — '+(form.get('topic')||'Website inquiry'),body}).toString();
  });
}

// Supabase investor portal. The publishable key is designed for browser use;
// database access is restricted by the row-level security policies in schema.sql.
(function(){
  const SUPABASE_URL='https://anvuwribvgbrulzqyti.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Lwcv2EAfLV4gAn51_JtlVA_iEEimZIi';
  const message=document.getElementById('authMessage');
  const authPanel=document.getElementById('authPanel');
  const accountPanel=document.getElementById('accountPanel');
  const authForm=document.getElementById('authForm');
  const signUpButton=document.getElementById('signUpButton');
  const signOutButton=document.getElementById('signOutButton');
  if(!window.supabase || !authForm){
    if(message) message.textContent='The investor portal could not load its connection library. Please refresh the page.';
    return;
  }
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  let currentUser=null;
  let savedRows=[];
  const setMessage=(text)=>{if(message)message.textContent=text;};
  const cards=Array.from(document.querySelectorAll('.property-card'));
  const savedList=document.getElementById('savedList');
  const submissionList=document.getElementById('submissionList');

  function listingFromCard(card){
    return {
      listing_title:card.querySelector('h3')?.textContent?.trim()||'Property',
      listing_url:card.querySelector('.property-link')?.href||'',
      asking_price:card.querySelector('.property-price')?.textContent?.trim()||''
    };
  }
  function renderSaved(){
    if(!savedList)return;
    if(!currentUser){savedList.textContent='Sign in to view your saved properties.';return;}
    if(!savedRows.length){savedList.textContent='No saved properties yet. Use “Save property” on a listing above.';return;}
    savedList.innerHTML='';
    savedRows.forEach(item=>{
      const row=document.createElement('div');row.className='saved-item';
      const link=document.createElement('a');link.href=item.listing_url;link.target='_blank';link.rel='noopener';
      link.textContent=(item.listing_title||'Property')+(item.asking_price?' — '+item.asking_price:'');
      const remove=document.createElement('button');remove.className='save-property';remove.textContent='Remove';
      remove.addEventListener('click',async()=>{
        const {error}=await db.from('saved_properties').delete().eq('user_id',currentUser.id).eq('listing_url',item.listing_url);
        if(error){setMessage('Could not remove saved property: '+error.message);return;}
        await loadSaved();
      });
      row.append(link,remove);savedList.append(row);
    });
  }
  function updateSaveButtons(){
    cards.forEach(card=>{
      const item=listingFromCard(card);
      let button=card.querySelector('.save-property');
      if(!button){button=document.createElement('button');button.type='button';button.className='save-property';card.querySelector('.property-info')?.append(button);}
      const isSaved=savedRows.some(row=>row.listing_url===item.listing_url);
      button.textContent=isSaved?'Saved ✓':'☆ Save property';
      button.classList.toggle('saved',isSaved);button.setAttribute('aria-pressed',String(isSaved));
      button.onclick=async()=>{
        if(!currentUser){setMessage('Please sign in before saving properties.');authPanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}
        if(savedRows.some(row=>row.listing_url===item.listing_url)){
          const {error}=await db.from('saved_properties').delete().eq('user_id',currentUser.id).eq('listing_url',item.listing_url);
          if(error){setMessage('Could not update saved property: '+error.message);return;}
        }else{
          const {error}=await db.from('saved_properties').insert({user_id:currentUser.id,...item});
          if(error){setMessage('Could not save property: '+error.message);return;}
        }
        await loadSaved();
      };
    });
  }
  async function loadSaved(){
    if(!currentUser){savedRows=[];renderSaved();updateSaveButtons();return;}
    const {data,error}=await db.from('saved_properties').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
    if(error){setMessage('Saved properties could not load: '+error.message);return;}
    savedRows=data||[];renderSaved();updateSaveButtons();
  }
  async function loadSubmissions(){
    if(!submissionList)return;
    if(!currentUser){submissionList.textContent='Sign in to view your submissions.';return;}
    const {data,error}=await db.from('property_submissions').select('property_address,asking_price,status,created_at').eq('submitted_by',currentUser.id).order('created_at',{ascending:false});
    if(error){submissionList.textContent='Submissions could not load: '+error.message;return;}
    if(!data?.length){submissionList.textContent='You have not submitted any properties yet.';return;}
    submissionList.innerHTML='';
    data.forEach(item=>{
      const row=document.createElement('div');row.className='saved-item';
      const label=document.createElement('span');label.textContent=item.property_address+(item.asking_price?' — $'+Number(item.asking_price).toLocaleString():'');
      const status=document.createElement('strong');status.textContent=(item.status||'submitted').replace('_',' ');
      row.append(label,status);submissionList.append(row);
    });
  }
  async function showSession(session){
    currentUser=session?.user||null;
    if(authPanel)authPanel.hidden=!!currentUser;
    if(accountPanel)accountPanel.hidden=!currentUser;
    const accountEmail=document.getElementById('accountEmail');
    if(accountEmail)accountEmail.textContent=currentUser?.email||'';
    if(currentUser){setMessage('');await Promise.all([loadSaved(),loadSubmissions()]);}
    else{savedRows=[];renderSaved();updateSaveButtons();if(submissionList)submissionList.textContent='Sign in to view your submissions.';}
  }
  authForm.addEventListener('submit',async e=>{
    e.preventDefault();if(!authForm.reportValidity())return;
    const email=document.getElementById('authEmail').value.trim();
    const password=document.getElementById('authPassword').value;
    const button=document.getElementById('signInButton');button.disabled=true;button.textContent='Signing in…';
    const {data,error}=await db.auth.signInWithPassword({email,password});
    button.disabled=false;button.textContent='Sign In';
    if(error){setMessage(error.message);return;}
    await showSession(data.session);setMessage('You are signed in.');
  });
  signUpButton?.addEventListener('click',async()=>{
    if(!authForm.reportValidity())return;
    const email=document.getElementById('authEmail').value.trim();
    const password=document.getElementById('authPassword').value;
    signUpButton.disabled=true;signUpButton.textContent='Creating…';
    const {data,error}=await db.auth.signUp({email,password});
    signUpButton.disabled=false;signUpButton.textContent='Create Account';
    if(error){setMessage(error.message);return;}
    if(data.session){await showSession(data.session);setMessage('Your account is ready.');}
    else setMessage('Account created. Check your email for the confirmation link, then return here and sign in.');
  });
  signOutButton?.addEventListener('click',async()=>{
    const {error}=await db.auth.signOut();
    if(error){setMessage(error.message);return;}
    await showSession(null);setMessage('You have signed out.');
  });
  const investorForm=document.getElementById('investorForm');
  investorForm?.addEventListener('submit',async e=>{
    e.preventDefault();if(!investorForm.reportValidity())return;
    if(!currentUser){setMessage('Please create an account or sign in before saving your investor profile.');authPanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    const f=new FormData(investorForm);
    const profile={user_id:currentUser.id,full_name:String(f.get('name')||''),phone:String(f.get('phone')||''),investment_interest:String(f.get('interest')||''),target_budget:String(f.get('budget')||''),preferred_area:String(f.get('area')||'')};
    const {error}=await db.from('investor_profiles').upsert(profile,{onConflict:'user_id'});
    if(error){setMessage('Profile could not be saved: '+error.message);return;}
    setMessage('Your investor profile has been saved securely.');
  });
  const propertyForm=document.getElementById('propertySubmitForm');
  propertyForm?.addEventListener('submit',async e=>{
    e.preventDefault();if(!propertyForm.reportValidity())return;
    if(!currentUser){setMessage('Please create an account or sign in before submitting a property.');authPanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    const f=new FormData(propertyForm);const raw=String(f.get('price')||'').replace(/[^0-9.]/g,'');
    const price=raw?Number(raw):null;
    const submission={submitted_by:currentUser.id,contact_name:String(f.get('name')||''),contact_email:String(f.get('email')||currentUser.email),property_address:String(f.get('address')||''),asking_price:Number.isFinite(price)?price:null,details:String(f.get('details')||'')};
    const {error}=await db.from('property_submissions').insert(submission);
    if(error){setMessage('Property could not be submitted: '+error.message);return;}
    propertyForm.reset();await loadSubmissions();setMessage('Your property has been submitted for review.');
  });
  db.auth.onAuthStateChange((_event,session)=>{showSession(session);});
  db.auth.getSession().then(({data,error})=>{
    if(error)setMessage('Could not check your sign-in session: '+error.message);
    else showSession(data.session);
  });
  updateSaveButtons();
})();