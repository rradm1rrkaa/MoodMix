// Небо: цвет и положение солнца/луны зависят от прокрутки (0 — день, 1 — ночь)
const $=s=>document.querySelector(s),hex=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
const mix=(a,b,t)=>'rgb('+hex(a).map((v,i)=>Math.round(v+(hex(b)[i]-v)*t))+')';
function sky(){
  const m=document.documentElement.scrollHeight-innerHeight,p=m>0?Math.min(1,scrollY/m):0;
  $('#sky').style.background=`linear-gradient(${mix('#2a3f9e','#02051a',p)} 0%,${mix('#ff7a2f','#0b1240',p)} 60%,${mix('#ffc36b','#1a1f4d',p)} 80%)`;
  const s=$('#sun');s.style.top=(8+p*1.05*85)+'%';s.style.opacity=Math.max(0,1-Math.max(0,p-.7)*3);
  $('#moon').style.opacity=Math.max(0,Math.min(1,(p-.75)*4));
}
addEventListener('scroll',sky);addEventListener('resize',sky);sky();
const io=new IntersectionObserver(e=>e.forEach(x=>x.isIntersecting&&x.target.classList.add('in')),{threshold:.15});
document.querySelectorAll('.fade').forEach(el=>io.observe(el));
