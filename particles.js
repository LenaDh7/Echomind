(function(){
  function Particles(canvas){
    this.cvs = canvas;
    this.ctx = canvas.getContext('2d');
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      this.ctx.setTransform(1,0,0,1,0,0);
      this.ctx.scale(dpr, dpr);
      this.w = w; this.h = h;
      const count = Math.floor((this.w * this.h) / 35000);
      this.p = Array.from({length: count}, () => ({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 0.6 + Math.random() * 1.6,
        a: Math.random() * Math.PI * 2,
        s: 0.15 + Math.random() * 0.35,
        h: Math.random() * 360
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    this.step = this.step.bind(this);
    requestAnimationFrame(this.step);
  }
  Particles.prototype.burst = function(cx, cy, n=30){
    for (let i=0;i<n;i++){
      this.p.push({ x: cx, y: cy, r: 1 + Math.random()*2, a: Math.random()*Math.PI*2, s: 1.0 + Math.random()*1.2, h: Math.random()*360, life: 60 + Math.random()*30 });
    }
  };
  Particles.prototype.step = function(){
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.w,this.h);
    for (const o of this.p){
      if (o.life != null){ o.life--; o.x += Math.cos(o.a)*o.s; o.y += Math.sin(o.a)*o.s - 0.3; }
      else { o.a += 0.004; o.x += Math.cos(o.a)*o.s*0.4; o.y += Math.sin(o.a*0.7)*o.s*0.3 - 0.05; }
      if (o.x < -10) o.x = this.w + 10; if (o.x > this.w + 10) o.x = -10;
      if (o.y < -10) o.y = this.h + 10; if (o.y > this.h + 10) o.y = -10;
      o.h = (o.h + 0.08) % 360;
      const grad = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*4);
      grad.addColorStop(0, `hsla(${o.h}, 90%, 65%, .65)`);
      grad.addColorStop(1, `hsla(${(o.h+40)%360}, 90%, 55%, 0)`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(o.x, o.y, o.r*3, 0, Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(this.step);
  };
  function mount(id){
    const c = document.getElementById(id);
    if(!c) return null;
    c.style.position = 'absolute'; c.style.inset = '0';
    c.style.width = '100%'; c.style.height = '100%'; c.style.pointerEvents='none';
    return new Particles(c);
  }
  window.WitchlightParticles = { mount };
})();