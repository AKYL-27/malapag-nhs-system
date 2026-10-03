// ── DATE / TIME ──────────────────────────────────────────────
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
function updateClock(){
  const d=new Date();
  const dbEl=document.getElementById('topbarDate');
  if(dbEl) dbEl.textContent=`${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
updateClock();
setInterval(updateClock,60000);

document.addEventListener('DOMContentLoaded',()=>{
  const today=new Date().toISOString().split('T')[0];
  const dEl=document.getElementById('historyDate');
  if(dEl) dEl.value=today;
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────────
let collapsed=(localStorage.getItem('studentSidebarCollapsed')==='true');
document.addEventListener('DOMContentLoaded',()=>{
  const s=document.getElementById('sidebar');
  if(s && collapsed) s.classList.add('collapsed');
});
function toggleSidebar(){
  collapsed=!collapsed;
  const s=document.getElementById('sidebar');
  s.classList.toggle('collapsed',collapsed);
  localStorage.setItem('studentSidebarCollapsed',collapsed);
}
function openMobileSidebar(){
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('overlay').classList.add('show');
}
function closeMobileSidebar(){
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('overlay').classList.remove('show');
}

// ── TABLE FILTER (history page) ────────────────────────────────
function filterHistoryTable(){
  const q=(document.getElementById('historySearch')?.value||'').toLowerCase();
  const rows=document.getElementById('historyTbody').querySelectorAll('tr');
  rows.forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';});
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg){
  const t=document.getElementById('scanToast');
  if(!t) return;
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ── QR CODE GENERATION (My QR Code page) ───────────────────────
function generateQRCode(){
  const el=document.getElementById('qrCanvas');
  if(!el || typeof QRCode==='undefined') return;
  el.innerHTML='';
  const payload=JSON.stringify({
    name:'Maria Santos',
    studentId:'2021-0457',
    plate:'ABC-1234',
    model:'Honda Click 125i',
    role:'Student'
  });
  new QRCode(el,{
    text:payload,
    width:200,
    height:200,
    colorDark:'#1d4ed8',
    colorLight:'#ffffff',
    correctLevel:QRCode.CorrectLevel.H
  });
}

function downloadQR(){
  const img=document.querySelector('#qrCanvas img');
  if(!img){showToast('QR code not ready yet.');return;}
  const link=document.createElement('a');
  link.href=img.src;
  link.download='my-moto-qr-code.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('QR code downloaded.');
}

function printQR(){
  const img=document.querySelector('#qrCanvas img');
  if(!img){showToast('QR code not ready yet.');return;}
  const w=window.open('','_blank');
  w.document.write(`
    <html><head><title>Print QR Code</title>
    <style>body{font-family:sans-serif;text-align:center;padding:40px;}
    h2{margin-bottom:4px;}p{color:#555;margin-bottom:20px;}
    img{width:260px;height:260px;}</style></head>
    <body>
      <h2>Maria Santos</h2>
      <p>Plate Number: ABC-1234</p>
      <img src="${img.src}" />
    </body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(()=>w.print(),400);
}
