
// Banca Amiga - Frontend funcional (sin backend) 
// Maneja: login simulado, almacenamiento de usuario, transferencias, historial (localStorage), perfil, navegación y validaciones.

(function(){
  // Helpers
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
  const formatCurrency = v => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(v);

  // Initialize demo data in localStorage if not present
  const DEFAULT_STATE = {
    user: { name: "Cliente", email: "cliente@bancaamiga.test" },
    accounts: [
      { id: "ACC-001", type: "Cuenta corriente", balance: 800.00 },
      { id: "ACC-002", type: "Ahorros", balance: 450.00 }
    ],
    transactions: [
      { id: "tx-1", date: "2025-11-10", desc: "Depósito", amount: 500.00, balance: 1250.00 },
      { id: "tx-2", date: "2025-11-08", desc: "Pago Servicios", amount: -75.00, balance: 750.00 }
    ]
  };

  function loadState(){
    try {
      const raw = localStorage.getItem('banca_state_v1');
      if(!raw) { localStorage.setItem('banca_state_v1', JSON.stringify(DEFAULT_STATE)); return DEFAULT_STATE; }
      return JSON.parse(raw);
    } catch(e) {
      console.error("Error leyendo state:", e);
      localStorage.setItem('banca_state_v1', JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
  }
  function saveState(state){ localStorage.setItem('banca_state_v1', JSON.stringify(state)); }

  let state = loadState();

  // --------- NAV / INTERACTIONS ----------
  // Mobile nav toggle
  qsa('.nav-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  });
  
	  // Toggle del menú móvil
	document.querySelectorAll('.nav-toggle').forEach(btn => {
	  btn.addEventListener('click', () => {
		document.body.classList.toggle('nav-open');
	  });
	});


  // Logout
  qsa('.logout').forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    // For demo, just redirect to login
    window.location.href = 'login.html';
  }));

  // Global function to update UI pieces
  function updateHeaderUser(){
    const userPill = qs('.user-pill span');
    if(userPill) userPill.textContent = state.user.name || 'Cliente';
  }

  function updateBalances(){
    // Dashboard balance elements
    const total = state.accounts.reduce((s,a)=>s+a.balance,0);
    qsa('.big-balance').forEach(el => el.textContent = formatCurrency(total));
    qsa('.account-list').forEach(container => {
      container.innerHTML = state.accounts.map(a=>`<div class="acc"><small>${a.type}</small><div class="acc-b">${formatCurrency(a.balance)}</div></div>`).join('');
    });
  }

  function renderTransactions(){
    const tbody = qs('#txBody');
    if(!tbody) return;
    tbody.innerHTML = state.transactions.slice().reverse().map(tx=>{
      const amt = tx.amount >= 0 ? `+$${Math.abs(tx.amount).toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`;
      return `<tr><td>${tx.date}</td><td>${tx.desc}</td><td>${amt}</td></tr>`;
    }).join('');
  }

  // Init UI
  document.addEventListener('DOMContentLoaded', ()=>{
    updateHeaderUser();
    updateBalances();
    renderTransactions();

    // Login form (simulado)
    const loginForm = qs('#loginForm');
    if(loginForm){
      loginForm.addEventListener('submit', e=>{
        e.preventDefault();
        const email = (qs('#email')?.value || '').trim();
        const pass = (qs('#password')?.value || '').trim();
        const msg = qs('#loginMsg');
        if(!email || !pass){ if(msg) msg.textContent = 'Complete los campos.'; return; }
        // guardamos email en state demo
        state.user.email = email;
        saveState(state);
        if(msg) msg.textContent = 'Ingresando...';
        setTimeout(()=> location.href = 'dashboard.html', 600);
      });
    }

    // Quick transfer (dashboard)
    const quick = qs('#quickTransfer');
    if(quick){
      quick.addEventListener('submit', e=>{
        e.preventDefault();
        const to = (qs('#toAccount')?.value || '').trim();
        const amt = parseFloat(qs('#amount')?.value || '0');
        const msg = qs('#transferMsg');
        if(!to || !amt || isNaN(amt) || amt <= 0){ if(msg) msg.textContent = 'Datos inválidos.'; return; }
        // create transaction (debit from first account)
        const fromAcc = state.accounts[0];
        if(fromAcc.balance < amt){ if(msg) msg.textContent = 'Saldo insuficiente.'; return; }
        fromAcc.balance = +(fromAcc.balance - amt).toFixed(2);
        const totalBalance = state.accounts.reduce((s,a)=>s+a.balance,0);
        const tx = { id: 'tx-'+Date.now(), date: new Date().toISOString().slice(0,10), desc: 'Transferencia rápida a '+to, amount: -amt, balance: totalBalance };
        state.transactions.push(tx);
        saveState(state);
        updateBalances();
        renderTransactions();
        if(msg) msg.textContent = `Transferencia enviada: ${formatCurrency(amt)} a ${to}`;
        quick.reset();
      });
    }

    // Full transfer form
    const transferForm = qs('#transferForm');
    if(transferForm){
      transferForm.addEventListener('submit', e=>{
        e.preventDefault();
        const fromId = (qs('#fromAcc')?.value || '').trim();
        const to = (qs('#toAcc')?.value || '').trim();
        const amt = parseFloat(qs('#amt')?.value || '0');
        const res = qs('#transferResult');
        if(!fromId || !to || isNaN(amt) || amt <= 0){ if(res) res.textContent = 'Complete correctamente los campos.'; return; }
        const from = state.accounts.find(a=>a.id===fromId) || state.accounts[0];
        if(from.balance < amt){ if(res) res.textContent = 'Saldo insuficiente en la cuenta origen.'; return; }
        from.balance = +(from.balance - amt).toFixed(2);
        const totalBalance = state.accounts.reduce((s,a)=>s+a.balance,0);
        const tx = { id: 'tx-'+Date.now(), date: new Date().toISOString().slice(0,10), desc: `Transferencia a ${to}`, amount: -amt, balance: totalBalance };
        state.transactions.push(tx);
        saveState(state);
        updateBalances();
        renderTransactions();
        if(res) res.textContent = 'Transferencia realizada con éxito.';
        transferForm.reset();
      });
    }

    // Profile save
    const profileForm = qs('#profileForm');
    if(profileForm){
      profileForm.addEventListener('submit', e=>{
        e.preventDefault();
        const name = (qs('#fullName')?.value || '').trim();
        const email = (qs('#emailProfile')?.value || '').trim();
        const phone = (qs('#phone')?.value || '').trim();
        const msg = qs('#profileMsg');
        if(!name || !email){ if(msg) msg.textContent = 'Nombre y correo son requeridos.'; return; }
        state.user.name = name;
        state.user.email = email;
        state.user.phone = phone;
        saveState(state);
        updateHeaderUser();
        if(msg) msg.textContent = 'Perfil actualizado.';
      });
      // set initial values
      qs('#fullName').value = state.user.name || '';
      qs('#emailProfile').value = state.user.email || '';
      qs('#phone').value = state.user.phone || '';
    }

    // Populate transfer account select fields (if present)
    qsa('datalist#accountsList').forEach(dl=>{
      dl.innerHTML = state.accounts.map(a=>`<option value="${a.id}">${a.type} (${a.id})</option>`).join('');
    });
    // If form has fromAcc input with placeholder, set default id
    if(qs('#fromAcc') && !qs('#fromAcc').value){
      qs('#fromAcc').value = state.accounts[0].id;
    }

  });

})();

