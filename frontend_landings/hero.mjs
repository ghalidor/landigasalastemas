import puppeteer from 'puppeteer-core';
const CHROME='/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
await page.setViewport({width:1400,height:900});
await page.goto('http://127.0.0.1:4200/piura/abc',{waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,3500));
console.log('CADENA DE ALTURAS DEL HERO:');
console.log(await page.evaluate(()=>{
  const c=['#hero','#heroCarousel','.carousel-inner','.carousel-item.active','.carousel-item.active > div','app-safe-image','.carousel-img'];
  return c.map(s=>{
    const e=document.querySelector(s);
    if(!e) return `  ${s}: NO EXISTE`;
    const r=e.getBoundingClientRect(), cs=getComputedStyle(e);
    return `  ${s.padEnd(28)} ${Math.round(r.width)}x${Math.round(r.height)}  pos=${cs.position} display=${cs.display}`;
  }).join('\n');
}));
await browser.close();
