// ── DATE / TIME ──────────────────────────────────────────────
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
function updateClock(){
  const d=new Date();
  const h=d.getHours()%12||12, m=String(d.getMinutes()).padStart(2,'0');
  const ampm=d.getHours()<12?'AM':'PM';
  const el=document.getElementById('currentTime');
  if(el) el.textContent=`${h}:${m} ${ampm}`;
  const dbEl=document.getElementById('topbarDate');
  if(dbEl) dbEl.textContent=`${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
updateClock();
setInterval(updateClock,1000);

document.addEventListener('DOMContentLoaded',()=>{
  const today=new Date().toISOString().split('T')[0];
  ['entryDate','exitDate'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=today;});
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────────
let collapsed=(localStorage.getItem('sidebarCollapsed')==='true');
document.addEventListener('DOMContentLoaded',()=>{
  const s=document.getElementById('sidebar');
  if(s && collapsed) s.classList.add('collapsed');
});
function toggleSidebar(){
  collapsed=!collapsed;
  const s=document.getElementById('sidebar');
  s.classList.toggle('collapsed',collapsed);
  localStorage.setItem('sidebarCollapsed',collapsed);
}
function openMobileSidebar(){
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('overlay').classList.add('show');
}
function closeMobileSidebar(){
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('overlay').classList.remove('show');
}

// ── TABLE FILTER ──────────────────────────────────────────────
function filterTable(tbodyId,inputId){
  const q=document.getElementById(inputId).value.toLowerCase();
  const rows=document.getElementById(tbodyId).querySelectorAll('tr');
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

// ── CAMERA & QR SCANNER (scanner.html only) ────────────────────
let stream=null, scanLoop=null, facingMode='environment', lastQR=null, lastQRTime=0;

const mockVehicles=[
  {name:'Maria Santos',role:'Student — BSIT 3B',plate:'ABC-1234',model:'Honda Click 125i',color:'Matte Black'},
  {name:'Juan dela Cruz',role:'Faculty — Engineering',plate:'XYZ-5678',model:'Yamaha NMAX 155',color:'Midnight Blue'},
  {name:'Ana Reyes',role:'Student — BSA 2A',plate:'DEF-9012',model:'Yamaha Mio i 125',color:'Pearl White'},
  {name:'Carlos Lim',role:'Staff — Admin Office',plate:'GHI-3456',model:'Honda PCX 160',color:'Candy Red'},
];

async function startCamera(){
  const startBtn=document.getElementById('startCamBtn');
  const stopBtn=document.getElementById('stopCamBtn');
  const switchBtn=document.getElementById('switchCamBtn');
  const errEl=document.getElementById('camError');
  errEl.style.display='none';
  startBtn.disabled=true;
  startBtn.innerHTML='<i class="ti ti-loader" aria-hidden="true"></i> Starting...';

  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    errEl.textContent='Camera not supported on this browser/device.';
    errEl.style.display='block';
    startBtn.disabled=false;
    startBtn.innerHTML='<i class="ti ti-camera" aria-hidden="true"></i> Start Camera';
    return;
  }

  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode,width:{ideal:1280},height:{ideal:720}}
    });
    const video=document.getElementById('videoEl');
    video.srcObject=stream;
    video.style.display='block';
    document.getElementById('camPlaceholder').style.display='none';
    document.getElementById('qrOverlay').style.display='flex';
    document.getElementById('camStatus').style.display='flex';
    stopBtn.disabled=false;
    switchBtn.disabled=false;
    startBtn.innerHTML='<i class="ti ti-camera" aria-hidden="true"></i> Start Camera';
    startBtn.disabled=true;
    beginScanLoop(video);
  }catch(e){
    let msg='Unable to access camera.';
    if(e.name==='NotAllowedError') msg='Camera permission denied. Please allow camera access.';
    else if(e.name==='NotFoundError') msg='No camera found on this device.';
    errEl.textContent=msg;
    errEl.style.display='block';
    startBtn.disabled=false;
    startBtn.innerHTML='<i class="ti ti-camera" aria-hidden="true"></i> Start Camera';
  }
}

function stopCamera(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  if(scanLoop){cancelAnimationFrame(scanLoop);scanLoop=null;}
  const video=document.getElementById('videoEl');
  if(!video) return;
  video.srcObject=null; video.style.display='none';
  document.getElementById('camPlaceholder').style.display='flex';
  document.getElementById('qrOverlay').style.display='none';
  document.getElementById('camStatus').style.display='none';
  document.getElementById('startCamBtn').disabled=false;
  document.getElementById('stopCamBtn').disabled=true;
  document.getElementById('switchCamBtn').disabled=true;
  document.getElementById('camError').style.display='none';
}

async function switchCamera(){
  facingMode=(facingMode==='environment')?'user':'environment';
  if(stream) await startCamera();
}

function beginScanLoop(video){
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  function tick(){
    if(!stream){return;}
    if(video.readyState===video.HAVE_ENOUGH_DATA){
      canvas.width=video.videoWidth;
      canvas.height=video.videoHeight;
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      try{
        const img=ctx.getImageData(0,0,canvas.width,canvas.height);
        const code=jsQR(img.data,img.width,img.height,{inversionAttempts:'dontInvert'});
        if(code){
          const now=Date.now();
          if(code.data!==lastQR||now-lastQRTime>5000){
            lastQR=code.data;
            lastQRTime=now;
            handleQRResult(code.data);
          }
        }
      }catch(e){}
    }
    scanLoop=requestAnimationFrame(tick);
  }
  scanLoop=requestAnimationFrame(tick);
}

function handleQRResult(data){
  let vehicle=null;
  try{
    const parsed=JSON.parse(data);
    vehicle={
      name:parsed.name||parsed.owner||'Unknown',
      role:parsed.role||parsed.course||'Unknown',
      plate:parsed.plate||parsed.plateNumber||'—',
      model:parsed.model||parsed.motorcycle||'—',
      color:parsed.color||'—'
    };
  }catch(e){
    vehicle=mockVehicles.find(v=>data.toUpperCase().includes(v.plate)||data.toLowerCase().includes(v.name.split(' ')[1].toLowerCase()));
    if(!vehicle){
      vehicle={name:data.length>30?data.substring(0,30)+'...':data,role:'Unknown owner',plate:'N/A',model:'N/A',color:'N/A',unverified:true};
    }
  }
  populateResult(vehicle);
}

function populateResult(v){
  const initials=v.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('resultAvatar').textContent=initials;
  document.getElementById('resultName').textContent=v.name;
  document.getElementById('resultRole').textContent=v.role;
  document.getElementById('resultPlate').textContent=v.plate;
  document.getElementById('resultModel').textContent=v.model;
  document.getElementById('resultColor').textContent=v.color;
  const vEl=document.getElementById('resultVerify');
  if(v.unverified){
    vEl.textContent='Unverified QR';
    vEl.className='verify-badge verify-fail';
  }else{
    vEl.textContent='✓ Verified';
    vEl.className='verify-badge verify-ok';
  }
  document.getElementById('btnEntry').disabled=false;
  document.getElementById('btnExit').disabled=false;
  showToast('QR scanned: '+v.name);
}

function confirmAction(type){
  const name=document.getElementById('resultName').textContent;
  const plate=document.getElementById('resultPlate').textContent;
  const now=new Date();
  const h=now.getHours()%12||12, m=String(now.getMinutes()).padStart(2,'0');
  const ampm=now.getHours()<12?'AM':'PM';
  const timeStr=`${h}:${m} ${ampm}`;
  const label=type==='entry'?'Entry':'Exit';

  document.getElementById('lastConfirmed').textContent=`${name} — ${label} at ${timeStr}`;
  showToast(`${label} confirmed for ${name}`);

  document.getElementById('btnEntry').disabled=true;
  document.getElementById('btnExit').disabled=true;
  document.getElementById('resultName').textContent='Waiting for scan...';
  document.getElementById('resultRole').textContent='No QR detected yet';
  document.getElementById('resultAvatar').textContent='—';
  document.getElementById('resultPlate').textContent='—';
  document.getElementById('resultModel').textContent='—';
  document.getElementById('resultColor').textContent='—';
  document.getElementById('resultVerify').textContent='Awaiting scan';
  document.getElementById('resultVerify').className='verify-badge verify-none';
  lastQR=null;
}
