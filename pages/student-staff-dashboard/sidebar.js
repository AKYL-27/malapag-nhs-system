function renderSidebar(activePage){
  const items=[
    {id:'dashboard',icon:'ti-layout-dashboard',label:'Dashboard',href:'dashboard.html'},
    {id:'motorcycle',icon:'ti-motorbike',label:'My Motorcycle',href:'my-motorcycle.html'},
    {id:'qrcode',icon:'ti-qrcode',label:'My QR Code',href:'my-qrcode.html'},
    {id:'history',icon:'ti-history',label:'Entry & Exit History',href:'history.html'},
  ];
  const navHtml=items.map(it=>`
    <a class="nav-item${it.id===activePage?' active':''}" data-label="${it.label}" href="${it.href}">
      <i class="ti ${it.icon}" aria-hidden="true"></i>
      <span class="nav-label">${it.label}</span>
    </a>`).join('');

  const sidebarHtml=`
    <div class="toggle-btn" id="toggleBtn" onclick="toggleSidebar()" title="Toggle sidebar">
      <i class="ti ti-chevron-left" id="toggleIcon"></i>
    </div>
    <div class="sidebar-logo">
      <div class="logo-icon"><i class="ti ti-motorbike" aria-hidden="true"></i></div>
      <div class="logo-text">
        <div class="school">Campus Portal</div>
        <div class="title">Moto Monitor</div>
      </div>
    </div>
    <nav class="nav" role="navigation" aria-label="Main navigation">
      ${navHtml}
      <a class="nav-item${activePage==='profile'?' active':''}" data-label="My Profile" href="profile.html">
        <i class="ti ti-user-circle" aria-hidden="true"></i>
        <span class="nav-label">My Profile</span>
      </a>
    </nav>
    <div class="nav-bottom">
      <a class="nav-item logout" data-label="Logout" href="login.html">
        <i class="ti ti-power" aria-hidden="true"></i>
        <span class="nav-label">Logout</span>
      </a>
    </div>
  `;
  document.getElementById('sidebar').innerHTML=sidebarHtml;
}
