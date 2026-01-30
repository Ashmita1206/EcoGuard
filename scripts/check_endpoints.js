const base='http://localhost:3001';
const roles = [
  {name:'admin', email:'admin@demo.com'},
  {name:'supervisor', email:'supervisor@demo.com'},
  {name:'agent', email:'agent@demo.com'},
];
const common = ['/api/notifications'];
const endpointsByRole = {
  admin: ['/api/admin/stats','/api/admin/calls','/api/admin/analytics?range=7d', ...common],
  supervisor: ['/api/supervisor/stats','/api/supervisor/calls','/api/supervisor/evaluations','/api/supervisor/team', ...common],
  agent: ['/api/agent/stats','/api/agent/calls','/api/agent/coaching', ...common],
};

(async ()=>{
  for(const r of roles){
    console.log('\n=== ROLE',r.name,'(' + r.email + ') ===');
    try{
      const lr = await fetch(base + '/api/auth/login', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({email:r.email, password:'password123'})});
      console.log(' login status', lr.status);
      const sc = lr.headers.get('set-cookie')||''; const cookie = sc.split(';')[0];
      for(const ep of endpointsByRole[r.name]){
        try{
          const res = await fetch(base + ep, {headers: {cookie}});
          const t = await res.text();
          let parsed;
          try{ parsed = JSON.parse(t); } catch(e){ parsed = t; }
          console.log(' ', ep, '->', res.status);
          console.log('   ', parsed);
        }catch(e){ console.error('  err fetching',ep,e); }
      }
    }catch(e){ console.error(' login error for', r.name, e); }
  }
})();
