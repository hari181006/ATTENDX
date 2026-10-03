const getPos=()=>new Promise((ok,no)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>ok(p.coords),()=>no(new Error('Location permission is required')),{enableHighAccuracy:true,timeout:15000}):no(new Error('Geolocation not supported')));
initPage('qr',async(u,m)=>{
  if(u.role==='faculty'){
    m.innerHTML=`<div class="panel"><label>Subject<input id="subj" placeholder="e.g. Data Structures"></label><br><button class="btn" id="mk">Create Attendance Session</button>
    <p><small>Opens 08:50 AM · Late after 09:30 AM · Closes 10:00 AM · Radius 100 m</small></p><div id="out"></div></div>`;
    $('mk').onclick=async()=>{try{const p=await getPos();
      const s=(await api('/sessions',{method:'POST',body:{subject:$('subj').value,lat:p.latitude,lng:p.longitude}})).session;
      $('out').innerHTML=`<div class="msg ok">Session created for <b>${esc(s.subject)}</b>. Students can scan this QR.</div><div id="qrbox"></div>`;
      new QRCode($('qrbox'),{text:s.token,width:240,height:240});
    }catch(e){$('out').innerHTML=`<div class="msg err">${esc(e.message)}</div>`}};
  }else{
    m.innerHTML=`<div class="panel"><div id="reader" style="max-width:360px;margin:auto"></div><div id="res"></div></div>`;
    let busy=false;const sc=new Html5Qrcode('reader');
    const done=(h,ok)=>$('res').innerHTML=`<div class="msg ${ok?'ok':'err'}">${h}</div>`;
    sc.start({facingMode:'environment'},{fps:10,qrbox:240},async token=>{
      if(busy)return;busy=true;
      try{const p=await getPos();const r=await api('/attendance/scan',{method:'POST',body:{token,lat:p.latitude,lng:p.longitude}});
        done(`✔ ${r.message} — ${esc(r.subject)} (${r.status}, ${r.distance} m away)`,true);sc.stop().catch(()=>{})}
      catch(e){done('✖ Attendance Failed: '+esc(e.message),false);setTimeout(()=>busy=false,3000)}
    }).catch(()=>done('Camera could not start. Allow camera access (use HTTPS or localhost).',false));
  }
});
