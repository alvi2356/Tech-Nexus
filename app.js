/* app.js - interactivity for the Techflare Nexus demo */
document.addEventListener('DOMContentLoaded', ()=>{
  // year
  document.getElementById('year').textContent = new Date().getFullYear();

  // mobile menu
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  if(menuBtn && nav){
    menuBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      nav.classList.toggle('active');
      menuBtn.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e)=>{
      if(!nav.contains(e.target) && !menuBtn.contains(e.target)){
        nav.classList.remove('active');
        menuBtn.classList.remove('active');
      }
    });
    
    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>{
        nav.classList.remove('active');
        menuBtn.classList.remove('active');
      });
    });
  }

  // small parallax on hero card
  const heroCard = document.getElementById('heroCard');
  window.addEventListener('mousemove', (e)=>{
    const rect = heroCard.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const transform = `translate3d(${x*10}px, ${y*8}px, 0) rotateX(${y*4}deg) rotateY(${x*6}deg)`;
    heroCard.style.transform = transform;
  });
  window.addEventListener('mouseleave', ()=> heroCard.style.transform = '');

  // accessible tilt for keyboard focus
  document.querySelectorAll('.tilt').forEach(el=>{
    el.addEventListener('focus', ()=> el.style.transform = 'translateY(-8px) rotateX(2deg)');
    el.addEventListener('blur', ()=> el.style.transform = '');
  });

  const canvas = document.createElement('canvas');
  canvas.id = 'particles';
  document.querySelector('.hero').prepend(canvas);
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0; let particles = [];
  function getAccents(){
    const cs = getComputedStyle(document.documentElement);
    return [cs.getPropertyValue('--accent1').trim(), cs.getPropertyValue('--accent2').trim()];
  }
  function resize(){
    const rect = document.querySelector('.hero').getBoundingClientRect();
    w = Math.ceil(rect.width); h = Math.ceil(rect.height);
    canvas.width = w * DPR; canvas.height = h * DPR; canvas.style.width = w+'px'; canvas.style.height = h+'px';
  }
  function init(){
    const COUNT = Math.round((w*h)/12000);
    particles = Array.from({length: Math.max(100, COUNT)}, ()=>({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6,
      r: Math.random()*2.2+0.8,
      c: (Math.random()<0.5? getAccents()[0] : getAccents()[1])
    }));
  }
  function step(){
    ctx.clearRect(0,0,w*DPR,h*DPR);
    ctx.save(); ctx.scale(DPR,DPR);
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<-10) p.x=w+10; if(p.x>w+10) p.x=-10;
      if(p.y<-10) p.y=h+10; if(p.y>h+10) p.y=-10;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c; ctx.globalAlpha=0.6; ctx.fill();
      for(let j=i+1;j<particles.length;j++){
        const q = particles[j];
        const dx = p.x-q.x, dy = p.y-q.y; const d = Math.hypot(dx,dy);
        if(d<80){
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
          ctx.strokeStyle = getAccents()[0]; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
    }
    ctx.restore();
    requestAnimationFrame(step);
  }
  resize(); init(); step();
  window.addEventListener('resize', ()=>{resize(); init();});

  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); });
  },{threshold:0.2});
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
  const darkToggle = document.getElementById('darkToggle');
  const savedMode = localStorage.getItem('mode');
  if(savedMode){ document.documentElement.dataset.mode = savedMode; }
  if(darkToggle){
    darkToggle.addEventListener('click', ()=>{
      const next = document.documentElement.dataset.mode==='dark' ? 'light' : 'dark';
      document.documentElement.dataset.mode = next;
      localStorage.setItem('mode', next);
      init();
    });
  }
});

function handleForm(e){
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const name = (data.get('name')||'').trim();
  const email = (data.get('email')||'').trim();
  const message = (data.get('message')||'').trim();
  const alertEl = document.getElementById('formAlert');
  const submitBtn = form.querySelector('button[type="submit"]');
  if(!name || !email || !message){
    alertEl.textContent = 'Please fill in all fields.';
    alertEl.className = 'alert error';
    return;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  const endpoint = form.dataset.endpoint || '';
  if(endpoint.startsWith('http')){
    fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name,email,message})
    }).then(r=>{
      if(!r.ok) throw new Error('Request failed');
      return r.json().catch(()=>({}));
    }).then(()=>{
      alertEl.textContent = 'Thanks! We\'ll get back to you shortly.';
      alertEl.className = 'alert success';
      form.reset();
    }).catch(()=>{
      alertEl.textContent = 'Unable to send. Please try again or email us directly.';
      alertEl.className = 'alert error';
    }).finally(()=>{
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    });
  } else {
    const mailto = `mailto:info@nexusbd.tech?subject=${encodeURIComponent('New inquiry from '+name)}&body=${encodeURIComponent(message+'\n\nFrom: '+name+' ('+email+')')}`;
    alertEl.textContent = 'Opening your email client...';
    alertEl.className = 'alert';
    window.location.href = mailto;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send message';
  }
}

function scrollToTop(){window.scrollTo({top:0, behavior:'smooth'})}

document.body.insertAdjacentHTML('beforeend','<div id="progressBar"></div>');
window.addEventListener('scroll',()=>{
  const max = document.body.scrollHeight - window.innerHeight;
  const p = Math.max(0, Math.min(1, window.scrollY / max));
  const el = document.getElementById('progressBar');
  if(el) el.style.width = (p*100)+'%';
});


function handleNewsletter(){
  const input = document.getElementById('newsletterEmail');
  const email = (input.value || '').trim();
  if(!email){
    alert('Please enter your email address.');
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    alert('Please enter a valid email address.');
    return;
  }
  // In a real app, you'd send this to your backend
  alert('Thank you for subscribing! We\'ll keep you updated.');
  input.value = '';
}


// Floating chat toggle
document.addEventListener('DOMContentLoaded', ()=>{
  const chatToggle = document.getElementById('chatToggle');
  const chatOptions = document.getElementById('chatOptions');
  
  if(chatToggle && chatOptions){
    chatToggle.addEventListener('click', ()=>{
      chatToggle.classList.toggle('active');
      chatOptions.classList.toggle('active');
    });
    
    // Close chat options when clicking outside
    document.addEventListener('click', (e)=>{
      if(!e.target.closest('.floating-chat')){
        chatToggle.classList.remove('active');
        chatOptions.classList.remove('active');
      }
    });
  }
});
