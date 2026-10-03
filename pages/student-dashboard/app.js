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

// ── CURRENT USER HELPER ─────────────────────────────────────────
// login.html stores the logged-in user under the key 'motoUser', and
// picks localStorage (if "Remember me" was checked) or sessionStorage
// (if not) at login time. So on every other page we don't know which
// one it landed in — check both, localStorage first.
function getCurrentUser(){
  const raw = localStorage.getItem('motoUser') || sessionStorage.getItem('motoUser');
  if(!raw) return null;
  try{
    return JSON.parse(raw);
  }catch(e){
    console.error('Could not parse motoUser from storage', e);
    return null;
  }
}

// ── PROFILE PAGE ─────────────────────────────────────────────
// Fills the profile page with the real logged-in user, and the topbar
// user chip that appears on every page.
function loadProfile(){
  const user = getCurrentUser();
  if(!user){
    window.location.href = '/login';
    return;
  }

  const initials = (user.fullName || '?')
    .split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const isStaff = user.role === 'staff';

  // Topbar chip (present on every page, not just profile).
  const chipName = document.querySelector('.user-name');
  const chipAvatar = document.querySelector('.user-avatar');
  if(chipName) chipName.textContent = user.fullName || '';
  if(chipAvatar) chipAvatar.textContent = initials;

  // Left card.
  const avatarLg = document.getElementById('profileAvatarLg');
  const nameLg = document.getElementById('profileNameLg');
  const roleBadgeText = document.getElementById('profileRoleBadgeText');
  const roleBadge = document.getElementById('profileRoleBadge');
  const deptLine = document.getElementById('profileDeptLine');
  if(avatarLg) avatarLg.textContent = initials;
  if(nameLg) nameLg.textContent = user.fullName || '';
  if(roleBadgeText) roleBadgeText.textContent = isStaff ? 'Staff' : 'Student';
  if(roleBadge){
    const icon = roleBadge.querySelector('i');
    if(icon) icon.className = isStaff ? 'ti ti-briefcase' : 'ti ti-school';
  }
  if(deptLine){
    deptLine.textContent = [user.yearLevel, user.department].filter(Boolean).join(' · ');
  }

  // Account information card.
  const fullNameEl = document.getElementById('profileFullName');
  const idLabelEl = document.getElementById('profileIdLabel');
  const idNumberEl = document.getElementById('profileIdNumber');
  const contactEl = document.getElementById('profileContact');
  const emailEl = document.getElementById('profileEmail');
  const roleLineEl = document.getElementById('profileRoleLine');
  if(fullNameEl) fullNameEl.textContent = user.fullName || '—';
  if(idLabelEl) idLabelEl.textContent = isStaff ? 'Employee ID' : 'Student ID';
  if(idNumberEl) idNumberEl.textContent = user.idNumber || '—';
  if(contactEl) contactEl.textContent = user.contactNumber || '—';
  if(emailEl) emailEl.textContent = user.email || '—';
  if(roleLineEl){
    const roleName = isStaff ? 'Staff' : 'Student';
    roleLineEl.textContent = user.department
      ? `${roleName} — ${user.department}`
      : roleName;
  }
}

// ── QR CODE GENERATION (My QR Code page) ───────────────────────
// Pulls the logged-in user and their motorcycle from the real API
// instead of using hardcoded demo data.
async function generateQRCode(){
  const el=document.getElementById('qrCanvas');
  if(!el || typeof QRCode==='undefined') return;

  const user = getCurrentUser();
  if(!user){
    // Not logged in (or currentUser wasn't set) — send back to login.
    window.location.href = '/login';
    return;
  }

  // Fill in the name/ID chips that used to be hardcoded in the HTML.
  const nameEl = document.getElementById('qrOwnerName');
  const idEl = document.getElementById('qrIdNumber');
  const userChipName = document.querySelector('.user-name');
  const userAvatar = document.querySelector('.user-avatar');
  if(nameEl) nameEl.textContent = user.fullName || 'Unknown';
  if(idEl) idEl.textContent = user.idNumber || '—';
  if(userChipName) userChipName.textContent = user.fullName || '';
  if(userAvatar){
    userAvatar.textContent = (user.fullName || '?')
      .split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  }

  let moto = null;
  try{
    const res = await fetch(`/api/motorcycles?owner_id=${encodeURIComponent(user.id)}`);
    if(res.ok){
      const motos = await res.json();
      moto = motos[0] || null; // assumes one motorcycle per student
    }
  }catch(e){
    console.error('Failed to load motorcycle for QR code', e);
  }

  const plateEl = document.getElementById('qrPlate');
  const statusEl = document.getElementById('qrStatus');

  if(!moto){
    if(plateEl) plateEl.textContent = 'No motorcycle on file';
    if(statusEl) statusEl.textContent = 'N/A';
    el.innerHTML = '';
    return;
  }

  if(plateEl) plateEl.textContent = `Plate Number: ${moto.plate}`;
  if(statusEl) statusEl.textContent = moto.status;

  el.innerHTML='';
  const payload=JSON.stringify({
    userId: user.id,
    motoId: moto.id,
    name: user.fullName,
    studentId: user.idNumber,
    plate: moto.plate,
    model: `${moto.brand||''} ${moto.model||''}`.trim(),
    role: user.role
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
  const user = getCurrentUser();
  const name = user?.fullName || document.getElementById('qrOwnerName')?.textContent || '';
  const plateText = document.getElementById('qrPlate')?.textContent || '';
  const w=window.open('','_blank');
  w.document.write(`
    <html><head><title>Print QR Code</title>
    <style>body{font-family:sans-serif;text-align:center;padding:40px;}
    h2{margin-bottom:4px;}p{color:#555;margin-bottom:20px;}
    img{width:260px;height:260px;}</style></head>
    <body>
      <h2>${name}</h2>
      <p>${plateText}</p>
      <img src="${img.src}" />
    </body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(()=>w.print(),400);
}