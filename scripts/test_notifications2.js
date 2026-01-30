console.log('script start');
(async ()=>{
  try{
    const base='http://localhost:3001';
    const loginRes=await fetch(base+'/api/auth/login',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({email:'admin@demo.com',password:'password123'})
    });
    const setCookie=loginRes.headers.get('set-cookie');
    const cookieVal=setCookie?setCookie.split(';')[0]:'';
    console.log('LOGIN',loginRes.status, 'cookie=', cookieVal);

    const r=await fetch(base+'/api/notifications',{headers:{cookie:cookieVal}});
    console.log('NOTIF STATUS',r.status);
    const t=await r.text();
    try{console.log(JSON.parse(t))}catch(e){console.log(t)}
  }catch(err){console.error(err)}
})();
