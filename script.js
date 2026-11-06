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

// Supabase investor portal with CDN fallback and visible error reporting.
(function(){
  const SUPABASE_URL='https://anvuwribvgbrulzqyti.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Lwcv2EAfLV4gAn51_JtlVA_iEEimZIi';
  const message=document.getElementById('authMessage');
  const authPanel=document.getElementById('authPanel');
  const accountPanel=document.getElementById('accountPanel');
  const authForm=document.getElementById('authForm');
  const signUpButton=document.getElementById('signUpButton');
  const signOutButton=document.getElementById('signOutButton');
  const setMessage=(value)=>{if(message)message.textContent=value;};
  if(!authForm)return;
  function loadFallback(){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload=()=>window.supabase?resolve():reject(new Error('The Supabase library loaded but did not initialize.'));
      script.onerror=()=>reject(new Error('Could not load the account connection library. Check your internet connection or content blocker.'));
      document.head.appendChild(script);
    });
  }
  async function start(){
    if(!window.supabase?.createClient) await loadFallback();
    if(!window.supabase?.createClient) throw new Error('The account connection library is unavailable.');
    const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
    let currentUser=null,savedRows=[];
    const cards=Array.from(document.querySelectorAll('.property-card'));
    const savedList=document.getElementById('savedList');
    const submissionList=document.getElementById('submissionList');
    function listingFromCard(card){return {listing_title:card.querySelector('h3')?.textContent?.trim()||'Property',listing_url:card.querySelector('.property-link')?.href||'',asking_price:card.querySelector('.property-price')?.textContent?.trim()||''};}
    function renderSaved(){
      if(!savedList)return;
      if(!currentUser){savedList.textContent='Sign in to view your saved properties.';return;}
      if(!savedRows.length){savedList.textContent='No saved properties yet. Use “Save property” on a listing above.';return;}
      savedList.replaceChildren();
      savedRows.forEach(item=>{
        const row=document.createElement('div');row.className='saved-item';
        const link=document.createElement('a');link.href=item.listing_url;link.target='_blank';link.rel='noopener';link.textContent=(item.listing_title||'Property')+(item.asking_price?' — '+item.asking_price:'');
        const remove=document.createElement('button');remove.type='button';remove.className='save-property';remove.textContent='Remove';
        remove.addEventListener('click',async()=>{try{const {error}=await db.from('saved_properties').delete().eq('user_id',currentUser.id).eq('listing_url',item.listing_url);if(error)throw error;await loadSaved();}catch(e){setMessage('Could not remove property: '+e.message);}});
        row.append(link,remove);savedList.append(row);
      });
    }
    function updateSaveButtons(){
      cards.forEach(card=>{
        const item=listingFromCard(card);let button=card.querySelector('.save-property');
        if(!button){button=document.createElement('button');button.type='button';button.className='save-property';card.querySelector('.property-info')?.append(button);}
        const isSaved=savedRows.some(row=>row.listing_url===item.listing_url);
        button.textContent=isSaved?'Saved ✓':'☆ Save property';button.classList.toggle('saved',isSaved);button.setAttribute('aria-pressed',String(isSaved));
        button.onclick=async()=>{if(!currentUser){setMessage('Please sign in before saving properties.');authPanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}try{const result=isSaved?await db.from('saved_properties').delete().eq('user_id',currentUser.id).eq('listing_url',item.listing_url):await db.from('saved_properties').insert({user_id:currentUser.id,...item});if(result.error)throw result.error;await loadSaved();}catch(e){setMessage('Could not update saved property: '+e.message);}};
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
      submissionList.replaceChildren();
      data.forEach(item=>{const row=document.createElement('div');row.className='saved-item';const label=document.createElement('span');label.textContent=item.property_address+(item.asking_price?' — $'+Number(item.asking_price).toLocaleString():'');const status=document.createElement('strong');status.textContent=(item.status||'submitted').replace('_',' ');row.append(label,status);submissionList.append(row);});
    }
    async function showSession(session){
      currentUser=session?.user||null;if(authPanel)authPanel.hidden=!!currentUser;if(accountPanel)accountPanel.hidden=!currentUser;
      const accountEmail=document.getElementById('accountEmail');if(accountEmail)accountEmail.textContent=currentUser?.email||'';
      if(currentUser){setMessage('Signed in. Loading your investor account…');await Promise.all([loadSaved(),loadSubmissions()]);}
      else{savedRows=[];renderSaved();updateSaveButtons();if(submissionList)submissionList.textContent='Sign in to view your submissions.';}
    }
    authForm.addEventListener('submit',async e=>{
      e.preventDefault();if(!authForm.reportValidity())return;
      const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value,button=document.getElementById('signInButton');
      button.disabled=true;button.textContent='Signing in…';setMessage('Connecting to your investor account…');
      try{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;await showSession(data.session);setMessage('You are signed in.');}
      catch(err){setMessage('Sign-in failed: '+(err.message||String(err)));}
      finally{button.disabled=false;button.textContent='Sign In';}
    });
    signUpButton?.addEventListener('click',async()=>{
      if(!authForm.reportValidity())return;
      const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
      signUpButton.disabled=true;signUpButton.textContent='Creating…';setMessage('Creating your investor account…');
      try{const {data,error}=await db.auth.signUp({email,password});if(error)throw error;if(data.session){await showSession(data.session);setMessage('Your account is ready.');}else setMessage('Account created. Check your email for a confirmation link, then return here and sign in.');}
      catch(err){const detail=[err?.message,err?.code,err?.status?('HTTP '+err.status):null].filter(Boolean).join(' · ');setMessage('Account creation failed'+(detail?': '+detail:'. Supabase returned no error details; check the Supabase Auth settings and project URL/key.'));}
      finally{signUpButton.disabled=false;signUpButton.textContent='Create Account';}
    });
    signOutButton?.addEventListener('click',async()=>{try{const {error}=await db.auth.signOut();if(error)throw error;await showSession(null);setMessage('You have signed out.');}catch(err){setMessage('Sign-out failed: '+err.message);}});
    const investorForm=document.getElementById('investorForm');
    investorForm?.addEventListener('submit',async e=>{
      e.preventDefault();if(!investorForm.reportValidity())return;
      if(!currentUser){setMessage('Please create an account or sign in before saving your investor profile.');authPanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}
      try{const f=new FormData(investorForm),profile={user_id:currentUser.id,full_name:String(f.get('name')||''),phone:String(f.get('phone')||''),investment_interest:String(f.get('interest')||''),target_budget:String(f.get('budget')||''),preferred_area:String(f.get('area')||'')};const {error}=await db.from('investor_profiles').upsert(profile,{onConflict:'user_id'});if(error)throw error;setMessage('Your investor profile has been saved.');}
      catch(err){setMessage('Profile could not be saved: '+err.message);}
    });
    const propertyForm=document.getElementById('propertySubmitForm');
    propertyForm?.addEventListener('submit',async e=>{
      e.preventDefault();if(!propertyForm.reportValidity())return;
      if(!currentUser){setMessage('Please create an account or sign in before submitting a property.');authPanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}
      try{const f=new FormData(propertyForm),raw=String(f.get('price')||'').replace(/[^0-9.]/g,''),price=raw?Number(raw):null,submission={submitted_by:currentUser.id,contact_name:String(f.get('name')||''),contact_email:String(f.get('email')||currentUser.email),property_address:String(f.get('address')||''),asking_price:Number.isFinite(price)?price:null,details:String(f.get('details')||'')};const {error}=await db.from('property_submissions').insert(submission);if(error)throw error;propertyForm.reset();await loadSubmissions();setMessage('Your property has been submitted for review.');}
      catch(err){setMessage('Property could not be submitted: '+err.message);}
    });
    db.auth.onAuthStateChange((_event,session)=>{showSession(session);});
    const {data,error}=await db.auth.getSession();if(error)throw error;await showSession(data.session);updateSaveButtons();
    setMessage('Investor portal connected. Create an account or sign in.');
  }
  setMessage('Loading secure investor portal…');
  start().catch(err=>{setMessage('Investor portal error: '+(err.message||String(err)));});
})();
