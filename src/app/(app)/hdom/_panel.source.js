/* CIM-11 */
const CIMDB={ch5:{l:'Ch.5 · Maladies métaboliques',c:[{i:'5A11',l:'Diabète mellitus type 2',s:[{i:'5A11.0',l:'T2DM sans complications'},{i:'5A11.1',l:'T2DM acidocétose'},{i:'5A11.2',l:'T2DM atteinte rénale'},{i:'5A11.3',l:'T2DM atteinte ophtalmique'},{i:'5A11.4',l:'T2DM atteinte neurologique'},{i:'5A11.5',l:'T2DM atteinte circulatoire'},{i:'5A11.Z',l:'T2DM non spécifié'}]},{i:'5C51',l:'Résistance insuline',s:[]},{i:'5C52',l:'Syndrome métabolique',s:[]},{i:'5A20',l:'Hyperglycémie',s:[]}]},ch6:{l:'Ch.6 · Troubles mentaux',c:[{i:'6B41',l:'PTSD',s:[{i:'6B41.0',l:'PTSD réaction différée'},{i:'6B41.1',l:'PTSD complexe'}]},{i:'6B40',l:'Trouble adaptation',s:[]}]},ch21:{l:'Ch.21 · Symptômes cliniques',c:[{i:'5C73',l:'Polydipsie',s:[]},{i:'5C74',l:'Polyurie',s:[]},{i:'MB27',l:'Fatigue chronique',s:[]},{i:'5C70',l:'Glycosurie',s:[]},{i:'MD17',l:'Anomalie glycémie à jeun',s:[]}]},ch26:{l:'Ch.26 · Médecine traditionnelle',c:[{i:'SJ60',l:'Rate Qi Xu',s:[{i:'SJ60.0',l:'Rate Qi Xu — inappétence'},{i:'SJ60.1',l:'Rate Qi Xu — fatigue'}]},{i:'SJ43',l:'Rein Qi Xu',s:[{i:'SJ43.0',l:'KI Qi Xu — lassitude'}]},{i:'SJ45',l:'Rein Yang Xu',s:[{i:'SJ45.0',l:'KI Yang Xu — froideur'},{i:'SJ45.1',l:'KI Yang Xu — polyurie noc.'}]},{i:'SJ30',l:'Foie Qi Stagnation',s:[]},{i:'SJ62',l:'Rate Humidité-Chaleur',s:[]}]},ch24:{l:'Ch.24 · Facteurs de santé',c:[{i:'QE21',l:'Violence sexuelle par parent',s:[]},{i:'QE22',l:'Maltraitance psychologique',s:[]},{i:'QF44',l:'Antécédents traumatismes sexuels',s:[]},{i:'QF84',l:'Histoire familiale métabolique',s:[]}]}};
function cimLbl(id){for(const c of Object.values(CIMDB))for(const x of c.c){if(x.i===id)return x.l;if(x.s)for(const s of x.s)if(s.i===id)return s.l;}return id;}
const cimSt={};
function cimInit(wid){cimSt[wid]={sel:new Map(),q:'',oCh:new Set(),oSub:new Set(),open:false};cimDraw(wid);}
function cimDraw(wid){
  const w=document.getElementById(wid);if(!w)return;
  const s=cimSt[wid],m=s.sel;
  let h='<div class="cim-chips">';
  if(!m.size)h+='<span class="cim-hint">Aucun code —&nbsp;</span>';
  else m.forEach((lb,id)=>h+=`<span class="cim-chip"><b>${id}</b>&nbsp;<i>${lb}</i><s data-fn="cimRm" data-wid="${wid}" data-id="${id}">×</s></span>`);
  h+=`<button class="cim-opn" data-fn="cimOpen" data-wid="${wid}">${m.size?'Modifier':'+ CIM-11'}</button></div>`;
  if(s.open){
    const q=s.q.toLowerCase();
    h+=`<div class="cim-picker"><div class="cim-ptop"><input value="${s.q.replace(/"/g,'&quot;')}" placeholder="Rechercher…" data-fn="cimQ" data-wid="${wid}"><button class="cim-done" data-fn="cimClose" data-wid="${wid}">✓ Terminé</button></div><div class="cim-list">`;
    for(const[cid,ch] of Object.entries(CIMDB)){
      let codes=ch.c;if(q)codes=codes.filter(c=>c.i.toLowerCase().includes(q)||c.l.toLowerCase().includes(q)||(c.s&&c.s.some(x=>x.i.toLowerCase().includes(q)||x.l.toLowerCase().includes(q))));
      if(!codes.length&&q)continue;
      const open=s.oCh.has(cid)||!!q;
      const cnt=codes.filter(c=>m.has(c.i)||(c.s&&c.s.some(x=>m.has(x.i)))).length;
      h+=`<div class="cim-ch" data-fn="cimTch" data-wid="${wid}" data-cid="${cid}">${ch.l}${cnt?` <span class="cim-badge">${cnt}</span>`:''}<span>${open?'▲':'▼'}</span></div>`;
      if(open)for(const c of codes){
        const on=m.has(c.i);
        h+=`<div class="cim-it${on?' on':''}" data-fn="cimTc" data-wid="${wid}" data-ci="${c.i}"><input type="checkbox"${on?' checked':''} data-fn="cimTc" data-wid="${wid}" data-ci="${c.i}"><span class="cim-id">${c.i}</span><span class="cim-lbl">${c.l}</span></div>`;
        if(c.s&&c.s.length){const so=s.oSub.has(c.i)||!!q;if(so){for(const x of c.s){const son=m.has(x.i);h+=`<div class="cim-sub${son?' on':''}" data-fn="cimTcx" data-wid="${wid}" data-xi="${x.i}"><input type="checkbox"${son?' checked':''} data-fn="cimTcx" data-wid="${wid}" data-xi="${x.i}"><span class="cim-sid">${x.i}</span><span class="cim-slb">${x.l}</span></div>`;}}else if(!q)h+=`<span class="cim-more" data-fn="cimTsub" data-wid="${wid}" data-ci="${c.i}">▶ ${c.s.length} sous-codes</span>`;}
      }
    }
    h+='</div></div>';
  }
  w.innerHTML=h;bldSynth();
}
function cimOpen(w){cimSt[w].open=true;cimDraw(w);}
function cimClose(w){cimSt[w].open=false;cimDraw(w);}
function cimQ(w,q){cimSt[w].q=q;cimDraw(w);}
function cimTch(w,c){const s=cimSt[w];s.oCh.has(c)?s.oCh.delete(c):s.oCh.add(c);cimDraw(w);}
function cimTsub(w,c){const s=cimSt[w];s.oSub.has(c)?s.oSub.delete(c):s.oSub.add(c);cimDraw(w);}
function cimTc(w,id){const m=cimSt[w].sel;m.has(id)?m.delete(id):m.set(id,cimLbl(id));cimDraw(w);}
function cimRm(w,id){cimSt[w].sel.delete(id);cimDraw(w);}
/* ROUE */
const ROUE={s:{l:'Sécurité / Paix',it:['Câlins','Calme','Amour','Soutien','Intimité','Empathie','Écoute','Sécurité','Paix intérieure']},a:{l:'Autonomie',it:['Choix de mes rêves','Choix de mes actions','Temps libre','Faire moi-même','Apprendre','Découvrir','Comprendre','Besoin de clarté','Besoin de justice']},e:{l:'Expression',it:['Dire ce que je pense','Exprimer mes émotions','Créativité','Être entendu(e)','Authenticité']},r:{l:'Respect',it:['Respect pour mon corps','Respect pour mes idées','Respect pour mes efforts','Dignité']},k:{l:'Acceptation / Groupe',it:['Acceptation tel que je suis','Appartenance','Amitié','Partage','Aide et aider','Honnêteté','Fêter / célébrer','Attention']},j:{l:'Jeu / Créa',it:['Amuser','Créer quelque chose','Rire','Me détendre','Jouer','Légèreté']},c:{l:'Corps',it:['Manger','Dormir','Respirer','Bouger','Boire','Toucher sain']}};
function bOpts(sel){let h='<option value="">— choisir —</option>';Object.entries(ROUE).forEach(([k,c])=>{h+=`<optgroup label="${c.l}">`;c.it.forEach(it=>{const v=k+'|'+it;h+=`<option value="${v}"${sel===v?' selected':''}>${it}</option>`;});h+='</optgroup>';});return h;}
const co=v=>v?v.split('|')[0]:'';
const PHL=['Survie','Pouvoir','Expression','Déconnexion'];
const PHF=['Survie · Attachement','Pouvoir · Contrôle','Expression bloquée','Déconnexion totale'];
const PHC=['#185FA5','#BA7517','#D4537E','#5F5E5A'];
const GUL=['Core Wound','In Limbo','Energetic Rope','Abuse Energy','Sabotage Energy','Archon/Reptilian','Spell','Black Magick','Stain','Bitch Energy','Incubus/Succubus','Entity on Heart','Biblical Dark Entity','Anchors/Chains','Impersonation Energy'];
const MERS=['SP','KI','LR','HT','PC','LU','GB','ST','LI','GV','CV','TE','BL'];
const MC={SP:'#BA7517',KI:'#185FA5',LR:'#3B6D11',HT:'#E24B4A',PC:'#D4537E',LU:'#888780',GB:'#7F77DD',ST:'#639922',LI:'#1D9E75',GV:'#BA7517',CV:'#185FA5',TE:'#D4537E',BL:'#3B6D11'};
const OM=['SP','KI','LR','HT','PC','LU','GB'];
const SOL=['O','A','R','T'];const SLB={O:'Origine',A:'Accumulation',R:'Réduction',T:'Transmission'};const SSH={O:'Orig.',A:'Accum.',R:'Réduc.',T:'Trans.'};
const G=[
{n:15,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:14,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:13,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:12,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:11,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:10,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:9,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:8,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:7,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:6,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:5,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:4,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:3,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:2,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
{n:1,ph:[],ab:'',vi:'',gu:[],mt:[],st:[]},
];
const V=new Set();
function bldTbl(){const tb=document.getElementById('tb');tb.innerHTML='';G.forEach(g=>{const tr=document.createElement('tr');tr.id='r'+g.n;const phH=PHL.map((l,i)=>{const on=g.ph.includes(i);return`<label class="ppill${on?' on'+i:''}"><input type="checkbox"${on?' checked':''} data-fn="tPh" data-n="${g.n}" data-i="${i}">${l}</label>`;}).join('');const guH=GUL.map(g2=>{const on=g.gu.includes(g2);return`<label class="gpill${on?' on':''}"><input type="checkbox"${on?' checked':''} data-fn="tGu" data-n="${g.n}" data-g2="${g2}">${g2}</label>`;}).join('');const merH=MERS.map(m=>`<span class="mt mt-${m}${g.mt.includes(m)?' on':''}" id="mt${g.n}_${m}" data-fn="tMer" data-n="${g.n}" data-m="${m}">${m}</span>`).join('');const stH=SOL.map(s=>{const on=g.st.includes(s);return`<label class="spill${on?' on'+s:''}"><input type="checkbox"${on?' checked':''} data-fn="tSt" data-n="${g.n}" data-s="${s}">${SSH[s]}</label>`;}).join('');tr.innerHTML=`<td class="gc"><span class="gn">G-${g.n}</span></td><td><select class="ns ns-${co(g.ab)}" id="ab${g.n}" data-fn="cN" data-n="${g.n}" data-r="ab">${bOpts(g.ab)}</select></td><td><select class="ns ns-${co(g.vi)}" id="vi${g.n}" data-fn="cN" data-n="${g.n}" data-r="vi">${bOpts(g.vi)}</select></td><td><div class="pwrap" id="pw${g.n}">${phH}</div></td><td><div class="gwrap" id="gw${g.n}">${guH}</div></td><td><div class="mwrap">${merH}</div></td><td><div class="swrap" id="sw${g.n}">${stH}</div></td><td style="text-align:center"><input type="checkbox" class="tchk" id="ck${g.n}" data-fn="tV" data-n="${g.n}"></td>`;tb.appendChild(tr);});}
function cN(n,r,val){const g=G.find(x=>x.n===n);if(!g)return;g[r]=val;const s=document.getElementById(r+n);if(s)s.className='ns ns-'+co(val);bldSynth();}
function tPh(n,i,on){const g=G.find(x=>x.n===n);if(!g)return;const idx=g.ph.indexOf(i);on?(idx<0&&g.ph.push(i)):g.ph.splice(idx,1);const w=document.getElementById('pw'+n);if(w)w.querySelectorAll('.ppill').forEach((el,j)=>{el.className='ppill'+(g.ph.includes(j)?' on'+j:'');});drwCrb();bldSynth();}
function tGu(n,gu,on){const g=G.find(x=>x.n===n);if(!g)return;const idx=g.gu.indexOf(gu);on?(idx<0&&g.gu.push(gu)):g.gu.splice(idx,1);const w=document.getElementById('gw'+n);if(w)w.querySelectorAll('.gpill').forEach(el=>{const inp=el.querySelector('input');if(inp)el.className='gpill'+(inp.checked?' on':'');});bldSynth();}
function tMer(n,m){const g=G.find(x=>x.n===n);if(!g)return;const idx=g.mt.indexOf(m);idx>=0?g.mt.splice(idx,1):g.mt.push(m);const btn=document.getElementById('mt'+n+'_'+m);if(btn)btn.className='mt mt-'+m+(g.mt.includes(m)?' on':'');updBars();updMets();bldSynth();}
function tSt(n,s,on){const g=G.find(x=>x.n===n);if(!g)return;const idx=g.st.indexOf(s);on?(idx<0&&g.st.push(s)):g.st.splice(idx,1);const w=document.getElementById('sw'+n);if(w)w.querySelectorAll('.spill').forEach((el,i)=>{const inp=el.querySelector('input');if(inp)el.className='spill'+(inp.checked?' on'+SOL[i]:'');});bldSynth();}
function tV(n,on){on?V.add(n):V.delete(n);document.getElementById('r'+n).className=on?'ok':'';updMets();drwCrb();updPAlrt();bldSynth();}
function cnts(){const C={};MERS.forEach(m=>C[m]=0);G.forEach(g=>{if(V.has(g.n))g.mt.forEach(m=>{if(C[m]!==undefined)C[m]++;});});return C;}
function tCnts(){const C={};MERS.forEach(m=>C[m]=0);G.forEach(g=>g.mt.forEach(m=>{if(C[m]!==undefined)C[m]++;}));return C;}
function updMets(){const C=cnts();document.getElementById('mv').textContent=V.size+'/15';document.getElementById('msp').textContent=C.SP+'×';document.getElementById('mki').textContent=C.KI+'×';document.getElementById('mlr').textContent=C.LR+'×';updBars();const d=document.getElementById('diag');if(V.size>0){let t='→ ';if(C.SP>=4)t+='SP×'+C.SP+' Yi épuisé. ';if(C.KI>=3)t+='KI×'+C.KI+' Jing 3.5 Ga. ';if(C.LR>=2)t+='LR×'+C.LR+' colères féminines. ';d.textContent=t;}else d.textContent='Configurer · ✓ = validé radiesthésiquement';}
function updBars(){const C=cnts();const T=tCnts();OM.forEach(m=>{const f=document.getElementById('bf'+m),bc=document.getElementById('bc'+m);if(f)f.style.width=(T[m]>0?C[m]/T[m]*100:0)+'%';if(bc)bc.textContent=C[m]+'/'+T[m];});}
function bldBars(){const b=document.getElementById('bars');b.innerHTML='';const T=tCnts();OM.forEach(m=>{const total=T[m]||0;const d=document.createElement('div');d.className='brow';d.innerHTML=`<span class="bll">${m}</span><div class="btrk" style="background:${MC[m]}18"><div class="bfil" id="bf${m}" style="background:${MC[m]}"></div></div><span class="bct" id="bc${m}">0/${total}</span>`;b.appendChild(d);});}
/* COURBE */
function drwCrb(){const W=660,H=290,P={l:70,r:18,t:28,b:48};const cW=W-P.l-P.r,cH=H-P.t-P.b;const xS=n=>P.l+(15-n)/14*cW,yS=p=>P.t+(p/3)*cH;const dPh=g=>g.ph.length?Math.max(...g.ph):0;const pts=G.map(g=>({x:xS(g.n),y:yS(dPh(g)),n:g.n,phs:g.ph,val:V.has(g.n)}));let pd='M '+pts[0].x+' '+pts[0].y;for(let i=1;i<pts.length;i++){const p=pts[i-1],c=pts[i],cx=(p.x+c.x)/2;pd+=` C ${cx} ${p.y} ${cx} ${c.y} ${c.x} ${c.y}`;}const bg=['#E6F1FB44','#FAEEDA44','#FBEAF044','#F1EFE844'];let svg=`<svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width:100%"><defs><marker id="arrZ" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round"/></marker></defs>`;for(let i=0;i<4;i++){const y=yS(i);svg+=`<rect x="${P.l}" y="${Math.max(P.t,y-cH/6)}" width="${cW}" height="${cH/3}" fill="${bg[i]}"/>`;svg+=`<text x="${P.l-5}" y="${y+4}" text-anchor="end" font-size="10" fill="${PHC[i]}" font-family="sans-serif" font-weight="600">${PHL[i]}</text>`;svg+=`<line x1="${P.l}" y1="${y}" x2="${P.l+cW}" y2="${y}" stroke="${PHC[i]}" stroke-width="0.5" stroke-dasharray="3 4" opacity=".3"/>`;}G.forEach(g=>{svg+=`<text x="${xS(g.n)}" y="${H-P.b+13}" text-anchor="middle" font-size="8" fill="#999" font-family="sans-serif">G${g.n}</text>`;});svg+=`<line x1="${P.l}" y1="${H-P.b+22}" x2="${P.l+cW}" y2="${H-P.b+22}" stroke="#bbb" stroke-width="0.7" marker-end="url(#arrZ)"/>`;svg+=`<text x="${P.l+cW/2}" y="${H-P.b+34}" text-anchor="middle" font-size="8" fill="#aaa" font-family="sans-serif">transmission → Consultant.e (G0)</text>`;svg+=`<path d="${pd}" fill="none" stroke="#ccc" stroke-width="1.5"/>`;pts.forEach(p=>{const col=PHC[Math.max(...(G.find(g=>g.n===p.n).ph.length?G.find(g=>g.n===p.n).ph:[0]))];const phs=G.find(g=>g.n===p.n).ph;if(phs.length>1){const yMin=yS(Math.min(...phs)),yMax=yS(Math.max(...phs));svg+=`<line x1="${p.x}" y1="${yMin}" x2="${p.x}" y2="${yMax}" stroke="${col}" stroke-width="1.5" stroke-dasharray="2 2" opacity=".5"/>`;phs.forEach(i=>{svg+=`<circle cx="${p.x}" cy="${yS(i)}" r="3" fill="${PHC[i]}" opacity=".7"/>`;});}const r=p.val?7:5,str=p.val?'rgba(16,163,127,.9)':col,sw=p.val?2:0.8;svg+=`<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${col}" fill-opacity="${p.val?1:.55}" stroke="${str}" stroke-width="${sw}"/>`;svg+=`<text x="${p.x}" y="${p.y-10}" text-anchor="middle" font-size="9" font-weight="${p.val?'700':'400'}" fill="${col}" font-family="sans-serif">${p.n}</text>`;});svg+='</svg>';document.getElementById('crbwrap').innerHTML=svg;}
/* CHAKRAS */
function cCls(s){return s>=87?'c89':s>=74?'c76':'c62';}
function cCol(s){return s>=87?'#1D9E75':s>=74?'#BA7517':'#E24B4A';}
/* Référentiel des dimensions/chakras — FUSIONNÉ (DEC Patrick 2026-08-01).
   Source canonique : @/lib/cercle/chakras-detail (46 chakras, 11 dimensions,
   port de DimensionsData.swift), injectée par la page dans window.HDOM_REF.
   La copie locale ci-dessous (9 dim / 33 chakras) ne sert plus que de secours
   hors cockpit. */
const DIMS_LOCAL=[
{id:'d9',n:9,l:'D9 — Source créatrice · Temps',d:'Corps Kéthérique',cl:'d9',ck:[{n:33,i:'◈',nm:'Intention, Symptômes et signes',is:[{l:'Diabète T2 — symptôme fork',s:89}]},{n:32,i:'⇄',nm:'Symptômes et signes relatifs',is:[{l:'Polyurie, polydipsie, fatigue',s:89}],cim:true},{n:31,i:'▶',nm:'Classification CIM-10/11',is:[{l:'5A11.0 T2DM',s:89}]},{n:30,i:'♥',nm:'Oversoul',is:[]}]},
{id:'d8',n:8,l:'D8 — Lumière du Tout-Connaissant',d:'Corps Céleste',cl:'d8',ck:[{n:29,i:'◉',nm:'Sacred Soul',is:[]},{n:28,i:'♥',nm:'Electronic Higherself',is:[]}]},
{id:'d7',n:7,l:'D7 — Résonance vibratoire',d:'Corps Émotionnel Supérieur',cl:'d7',ck:[{n:27,i:'◎',nm:'Higher Purpose',is:[{l:'Impersonation Energy',s:63}]}]},
{id:'d6',n:6,l:'D6 — Formes géométriques',d:'5–7 mois avant manifestation',cl:'d6',ck:[{n:26,i:'✚',nm:'Geometric Universal Tree',is:[{l:'Stain G-5',s:77}]},{n:25,i:'◎',nm:'Vibrat. Geometric Forms',is:[{l:'Motif géométrique diabète',s:76}],cim:true},{n:24,i:'◌',nm:'Dimensions of the World Tree',is:[]}]},
{id:'d5',n:5,l:'D5 — Amour · Sensualité · Pléiades',d:'Corps Astral',cl:'d5',ck:[{n:23,i:'♥',nm:'Love — Immunodéficience',is:[{l:'Abuse Energy',s:70}]},{n:22,i:'▽',nm:'Sensuality — Trouble sommeil',is:[{l:'Incubus/Succubus G-1',s:67}]},{n:21,i:'✦',nm:'Light from the Pleiades',is:[]},{n:20,i:'合',nm:'Channel for love 3D',is:[]},{n:19,i:'◉',nm:'Universal Higher Bridge',is:[]},{n:18,i:'✤',nm:'Nirodhah Star',is:[]},{n:17,i:'◎',nm:'Life Tree — Génito-Urinaire',is:[{l:'Tuyau Jing 3.5 Ga',s:83}]}]},
{id:'d4',n:4,l:'D4 — Couche autour de la Terre',d:'Corps Mental — Mythes · Archétypes',cl:'d4',ck:[{n:16,i:'☉',nm:'Universal Father — Égrégores',is:[{l:'Archétype Père abuseur 15 G',s:74}]},{n:15,i:'▽',nm:'Universal Mother — Mythes',is:[{l:'Mythe "femme = proie" — Ph.1',s:89}]},{n:14,i:'◈',nm:'Universal Core — Implants',is:[{l:'Implant Archon/Reptilian G-10',s:66}]},{n:13,i:'⬛',nm:'Earth Star — Maladie rénale',is:[{l:'KI×4 — risque néphropathie',s:83}]},{n:12,i:'◉',nm:'Galactic — Lésion vaisseaux',is:[{l:'Fork galactiques 3.5 Ga — Ph.2',s:89}]},{n:11,i:'☀',nm:'Solar Star',is:[]},{n:10,i:'⊛',nm:'Atomic Doorway',is:[]},{n:9,i:'♻',nm:'Higher Heart — Cœur Supérieur',is:[{l:'Phase 3 séance',s:89}]}]},
{id:'d3',n:3,l:'D3 — Réalité incarnée 3D',d:'7 chakras classiques',cl:'d3',ck:[{n:8,i:'♛',nm:'Crown / Sahasrāra',is:[]},{n:7,i:'—',nm:'Brow / Ājñā',is:[]},{n:6,i:'⊞',nm:'Throat / Viśuddha',is:[{l:'LU×1 — expression bloquée G-7',s:83}]},{n:5,i:'♥',nm:'Heart / Anāhata — CV17',is:[{l:'Phase 4 — Porte du Cœur',s:89}]},{n:4,i:'◉',nm:'Naval / Manipūra — Plexus',is:[{l:'SP×6 — Yi saturé',s:80}]},{n:3,i:'⊗',nm:'Sacral / Svādhisthāna',is:[{l:'Honte ancestrale 15 G',s:85}]},{n:2,i:'◑',nm:'Base / Mūlādhāra',is:[{l:'KI racine — Jing pollué',s:85}]}]},
{id:'d2',n:2,l:'D2 — Espace tellurique',d:'Entre centre Terre et surface',cl:'d2',ck:[{n:null,i:'◌',nm:'Royaume tellurique',is:[]}]},
{id:'d1',n:1,l:'D1 — Cristal de fer · Centre Terre',d:'7.8 Hz Schumann',cl:'d1',ck:[{n:1,i:'◈',nm:'Earth Chakra',is:[{l:'Ancrage défaillant — KI1 Nuummite',s:83}]}]},
];
const DIMS = (typeof window !== "undefined" && window.HDOM_REF && window.HDOM_REF.dims)
  ? window.HDOM_REF.dims : DIMS_LOCAL;

const CKS={};DIMS.forEach(d=>d.ck.forEach(c=>{CKS[d.id+'_'+(c.n||'x')]=false;}));
function bldChk(){
  const body=document.getElementById('ckbody');body.innerHTML='';
  DIMS.forEach(d=>{
    const bl=document.createElement('div');bl.className='dim '+d.cl;
    const done=d.ck.filter(c=>CKS[d.id+'_'+(c.n||'x')]).length;
    let rH='';
    d.ck.forEach(c=>{
      const key=d.id+'_'+(c.n||'x');
      const tgs=c.is.map(t=>`<span class="cktg ${cCls(t.s)}">${t.l} · SLA ${t.s}%</span><div class="slabw"><div class="slabf" style="width:${t.s}%;background:${cCol(t.s)}"></div></div>`).join('');
      const wid=d.id+'_cw'+(c.n||'x');
      rH+=`<div class="ckrow${CKS[key]?' dn':''}" id="rk-${key}"><span class="ckn">${c.n||''}</span><span class="cki">${c.i}</span><div class="ckm"><div class="cknm" data-fn="tCk" data-key="${key}" data-did="${d.id}">${c.nm}</div>${tgs?`<div class="cktgs">${tgs}</div>`:''}${c.cim?`<div style="margin-top:5px" id="${wid}"></div>`:''}</div><div class="ckr"><input type="checkbox" class="ckcb" id="cb-${key}" ${CKS[key]?'checked':''} data-fn="tCkCb" data-key="${key}" data-did="${d.id}"></div></div>`;
    });
    bl.innerHTML=`<div class="dimh" data-fn="tDim" data-did="${d.id}"><span style="font-weight:600;min-width:18px">D${d.n}</span><span>${d.l.replace('D'+d.n+' — ','')}</span><span class="dimd">${d.d}</span><span class="dimpc" id="dpc-${d.id}">${done}/${d.ck.length}</span></div><div id="db-${d.id}">${rH}</div>`;
    body.appendChild(bl);
    d.ck.filter(c=>c.cim).forEach(c=>{
      const wid=d.id+'_cw'+(c.n||'x');
      if(!cimSt[wid])cimInit(wid);else cimDraw(wid);
    });
  });
  updCkS();
}
function tDim(id){const b=document.getElementById('db-'+id);if(b)b.style.display=b.style.display==='none'?'':'none';}
/* Blocs fermés par défaut — seulement les dims sans contenu clinique */
function initDims(){['d8','d2','d1'].forEach(id=>{const b=document.getElementById('db-'+id);if(b)b.style.display='none';});}
function tCk(key,did){CKS[key]=!CKS[key];_apCk(key,did);}
function tCkCb(key,did,on){CKS[key]=on;_apCk(key,did);}
function _apCk(key,did){const row=document.getElementById('rk-'+key),cb=document.getElementById('cb-'+key);if(row)row.className='ckrow'+(CKS[key]?' dn':'');if(cb)cb.checked=CKS[key];const d=DIMS.find(x=>x.id===did);if(d){const done=d.ck.filter(c=>CKS[d.id+'_'+(c.n||'x')]).length;const pct=document.getElementById('dpc-'+did);if(pct)pct.textContent=done+'/'+d.ck.length;}updCkS();bldSynth();}
function updCkS(){const keys=Object.keys(CKS);const done=keys.filter(k=>CKS[k]).length;document.getElementById('ck33s').textContent=done+'/'+keys.length+' nettoyés';document.getElementById('ck33b').style.width=Math.round(done/keys.length*100)+'%';const iD=DIMS.flatMap(d=>d.ck.filter(c=>c.is&&c.is.length&&CKS[d.id+'_'+(c.n||'x')])).length;const iT=DIMS.flatMap(d=>d.ck.filter(c=>c.is&&c.is.length)).length;document.getElementById('ck33n').textContent='Consultant.e libérés : '+iD+'/'+iT;}
function markAll(){DIMS.forEach(d=>d.ck.forEach(c=>{CKS[d.id+'_'+(c.n||'x')]=true;}));bldChk();}
function resetAll(){Object.keys(CKS).forEach(k=>{CKS[k]=false;});bldChk();}
/* PIERRES */
/* Pierres — mêmes ids que @/lib/cercle/pierres. Le panneau porte le registre
   DE SÉANCE (rôle, placement, purification) ; la page injecte le registre
   D'ENSEIGNEMENT (signature, contexte, usage) sous la clé .ens. */
const PRR_LOCAL=[
{id:'tourm',nm:'Tourmaline noire',la:'Schorl',tg:['ent','abus','cord'],ro:'Bouclier n°1 · Gui 鬼 et Abuse Energy · 15 générations.',pl:'Périmètre cabinet + sous la table',pu:'Eau salée 12 h · Soleil 4 h',ic:'◼'},
{id:'obsid',nm:'Obsidienne noire',la:'SiO₂',tg:['cord','abus','anc'],ro:'Cordages Abuseur→Consultant.e · Black Magick G-4.',pl:'Mains du consultant.e ou CV1',pu:'Eau froide 1 h · Pleine lune',ic:'◉'},
{id:'nuum',nm:'Nuummite (3.5 Ga)',la:'Amphibolite',tg:['anc','jing','cord'],ro:'Fork guerres galactiques C12 · Jing pré-biologique · Ouvre D4 pour Dodécaèdre.',pl:'GV4 Mingmen ou KI1',pu:"Pleine lune uniquement. Pas d'eau.",ic:'◈'},
{id:'shung',nm:'Shungite élite I',la:'C>98%',tg:['ent','prat'],ro:'Incubus/Succubus G-1 · Spell G-8 · Protection praticien.',pl:'Poche praticien + coins cabinet',pu:'Eau froide 30 min hebdo',ic:'◆'},
{id:'aegir',nm:'Aegyrine',la:'NaFe³⁺Si₂O₆',tg:['ent','abus'],ro:'Archon/Reptilian G-10 · CUBE non-hermétique.',pl:'Grille 4 pointes autour de la table',pu:'Salvia 10 min · Pleine lune. Fragile.',ic:'◇'},
{id:'apache',nm:'Apache Tears',la:'Perlite volcanique',tg:['anc','cord'],ro:'In Limbo ×3 · Psychopompe · Deuil femmes victimes.',pl:'Cercle autour du consultant.e',pu:'Enterrer 48 h dans la terre après usage',ic:'○'},
{id:'labra',nm:'Labradorite',la:'(Ca,Na)(Si,Al)₄O₈',tg:['prat','ent'],ro:'Aura praticien · Stern-Tetraeder · Pemphigus 15 G.',pl:'Portée praticien (cou ou poche)',pu:'Pleine lune mensuelle · Eau froide brève',ic:'◐'},
{id:'kyani',nm:'Kyanite noire',la:'Al₂SiO₅',tg:['cord','jing'],ro:'Tuyau masculin Adam→Consultant.e · Zéro rétention.',pl:'Tuyau Jing GV4↔KI3',pu:'Aucune purification nécessaire.',ic:'◁'},
];
const PRR = (function(){
  var base = PRR_LOCAL;
  if (typeof window === "undefined" || !window.HDOM_REF || !window.HDOM_REF.pierres) return base;
  var ens = {}; window.HDOM_REF.pierres.forEach(function(p){ ens[p.id] = p; });
  return base.map(function(p){ return ens[p.id] ? Object.assign({}, p, {ens: ens[p.id]}) : p; });
})();

const TLB={ent:'Entités',abus:'Abuse Energy',cord:'Cordages',anc:'Ancestral',prat:'Praticien',jing:'Tuyau Jing'};
const SEL={};PRR.forEach(p=>{SEL[p.id]={sel:false,val:false,vv:1,vu:'kg',dm:30,dj:7};});
function vDisp(id){const s=SEL[id];return s.vv+' '+s.vu;}
function dDisp(id){const s=SEL[id];const a=[];if(s.dm>0)a.push(s.dm+' min');if(s.dj>0)a.push(s.dj+' j');return a.join(' + ')||'—';}
function bldPrr(){
  const pg=document.getElementById('pgrid');
  PRR.forEach(p=>{
    const d=document.createElement('div');d.className='pcard';d.id='pc'+p.id;
    const tH=p.tg.map(t=>`<span class="ptg ${t}">${TLB[t]}</span>`).join('');
    d.innerHTML=`<label class="stg"><input type="checkbox" data-fn="tStn" data-pid="${p.id}"><span class="pnm">${p.ic} ${p.nm}</span></label>
<div class="pla">${p.la}</div><div class="ptgs">${tH}</div>
<div class="pi">${p.ro}</div><div class="pi" style="font-style:italic">Placement : ${p.pl}</div>
<div class="vsec"><div class="clbl">Volume de protection</div>
<div class="urads">
  <label class="urad uk" id="uk-${p.id}"><input type="radio" name="u-${p.id}" value="kg" checked data-fn="cUnit" data-pid="${p.id}" data-u="kg"> kg</label>
  <label class="urad" id="ut-${p.id}"><input type="radio" name="u-${p.id}" value="t" data-fn="cUnit" data-pid="${p.id}" data-u="t"> tonnes</label>
</div>
<div class="vrow">
  <input type="range" min="1" max="999" step="1" value="1" id="vs-${p.id}" data-fn="sVol" data-pid="${p.id}" data-src="s">
  <input type="number" class="vman" min="1" max="999" step="1" value="1" id="vm-${p.id}" data-fn="sVol" data-pid="${p.id}" data-src="m">
  <span class="vul" id="vu-${p.id}">kg</span>
</div></div>
<div class="dsec"><div class="clbl">Durée de protection</div>
<div class="drow"><span class="dlbl">Min (1–60)</span><input type="range" min="1" max="60" step="1" value="30" id="dms-${p.id}" data-fn="sDm" data-pid="${p.id}" data-src="s"><input type="number" class="dman" min="1" max="60" step="1" value="30" id="dmm-${p.id}" data-fn="sDm" data-pid="${p.id}" data-src="m"><span class="dunit">min</span></div>
<div class="drow"><span class="dlbl">Jours (1–29)</span><input type="range" min="1" max="29" step="1" value="7" id="djs-${p.id}" data-fn="sDj" data-pid="${p.id}" data-src="s"><input type="number" class="dman" min="1" max="29" step="1" value="7" id="djm-${p.id}" data-fn="sDj" data-pid="${p.id}" data-src="m"><span class="dunit">j</span></div>
<span class="dsum" id="ds-${p.id}">30 min + 7 j</span></div>
<div class="pi" style="color:var(--t3);margin-top:6px">Purif. : ${p.pu}</div>`;
    pg.appendChild(d);
  });
}
function tStn(id,on){SEL[id].sel=on;if(!on)SEL[id].val=false;document.getElementById('pc'+id).className=on?'pcard sel':'pcard';bldPRes();bldSynth();}
function tPVal(id,on){SEL[id].val=on;bldPRes();bldSynth();}
function cUnit(id,u){SEL[id].vu=u;document.getElementById('vu-'+id).textContent=u;const kl=document.getElementById('uk-'+id),tl=document.getElementById('ut-'+id);if(kl)kl.className='urad'+(u==='kg'?' uk':'');if(tl)tl.className='urad'+(u==='t'?' ut':'');bldPRes();bldSynth();}
function sVol(id,src,v){v=Math.max(1,Math.min(999,v||1));SEL[id].vv=v;if(src==='s'){const m=document.getElementById('vm-'+id);if(m)m.value=v;}else{const s=document.getElementById('vs-'+id);if(s)s.value=v;}bldPRes();bldSynth();}
function sDm(id,src,v){v=Math.max(1,Math.min(60,v||1));SEL[id].dm=v;if(src==='s'){const m=document.getElementById('dmm-'+id);if(m)m.value=v;}else{const s=document.getElementById('dms-'+id);if(s)s.value=v;}const ds=document.getElementById('ds-'+id);if(ds)ds.textContent=dDisp(id);bldPRes();bldSynth();}
function sDj(id,src,v){v=Math.max(1,Math.min(29,v||1));SEL[id].dj=v;if(src==='s'){const m=document.getElementById('djm-'+id);if(m)m.value=v;}else{const s=document.getElementById('djs-'+id);if(s)s.value=v;}const ds=document.getElementById('ds-'+id);if(ds)ds.textContent=dDisp(id);bldPRes();bldSynth();}
function bldPRes(){
  const r=document.getElementById('pres');
  const sel=PRR.filter(p=>SEL[p.id].sel);
  if(!sel.length){r.innerHTML='<span style="font-size:11px;color:var(--t2)">Sélectionner les pierres ci-dessus</span>';return;}
  r.innerHTML=sel.map(p=>`
    <div class="prw" style="align-items:center">
      <input type="checkbox" class="tchk" style="margin-right:6px;flex-shrink:0"
        ${SEL[p.id].val?'checked':''} data-fn="tPVal" data-pid="${p.id}">
      <span class="pc1">${p.ic} ${p.nm}</span>
      <span class="pc2">${vDisp(p.id)} · ${dDisp(p.id)}</span>
    </div>`).join('');
  const valN=sel.filter(p=>SEL[p.id].val).length;
  document.getElementById('pnte').textContent=`${sel.length} pierre(s) · ${valN} validée(s) · Purification avant déploiement.`;
}
function updPAlrt(){const n=V.size,el=document.getElementById('palrt');if(!n){el.className='palrt r';el.textContent='Charge non évaluée — validez d\'abord les générations dans Décodage G.';}else if(n<=5){el.className='palrt o';el.textContent='Charge modérée ('+n+'/15)';}else if(n<=10){el.className='palrt o';el.textContent='Charge sévère ('+n+'/15) · Protection extrême recommandée';}else{el.className='palrt r';el.textContent='Charge critique ('+n+'/15) · PROTECTION EXTRÊME';}}
/* SYNTHÈSE */
function row(l,v){return`<div class="prw"><span class="pc1">${l}</span><span class="pc2">${v}</span></div>`;}
function bldSynth(){
  const s=document.getElementById('synth');const C=cnts();const selP=PRR.filter(p=>SEL[p.id].sel);
  if(!V.size&&!selP.length){s.innerHTML='<span style="font-size:11px;color:var(--t2)">Compléter les autres onglets.</span>';return;}
  const dom=OM.filter(m=>C[m]>0).sort((a,b)=>C[b]-C[a]).slice(0,4);
  const allGu=[...new Set(G.filter(g=>V.has(g.n)).flatMap(g=>g.gu))];
  const stC={O:0,A:0,R:0,T:0};G.filter(g=>V.has(g.n)).forEach(g=>g.st.forEach(s2=>stC[s2]++));
  const phC=[0,0,0,0];G.filter(g=>V.has(g.n)).forEach(g=>g.ph.forEach(p=>phC[p]++));
  const dPh=phC.indexOf(Math.max(...phC));
  const ckDone=Object.values(CKS).filter(Boolean).length;
  const iD=DIMS.flatMap(d=>d.ck.filter(c=>c.is&&c.is.length&&CKS[d.id+'_'+(c.n||'x')])).length;
  const iT=DIMS.flatMap(d=>d.ck.filter(c=>c.is&&c.is.length)).length;
  const allCim=[];Object.entries(cimSt).forEach(([wid,cs])=>{if(cs.sel&&cs.sel.size>0){const ck=wid.includes('32')?'C32':wid.includes('25')?'C25':'C?';cs.sel.forEach((lb,id)=>allCim.push(`${ck} · ${id} — ${lb}`));}});
  const stB=Object.entries(stC).filter(([,v])=>v>0).map(([k,v])=>`<span class="sbdg sbdg-${k}">${SLB[k]} ×${v}</span>`).join(' ');
  const bx=(t,c)=>`<div class="synbx"><div class="prl">${t}</div>${c}</div>`;
  s.innerHTML=bx('Consultant.e · Diabète Type II · SLA 89%',
    row('Gén. validées',V.size+'/15 — '+([...V].sort((a,b)=>b-a).map(n=>'G-'+n).join(', ')||'—'))+
    row('Phase dominante',`<span style="color:${PHC[dPh]}">${PHF[dPh]} (${phC[dPh]}×)</span>`)+
    `<div class="prw"><span class="pc1">Statuts</span><span class="pc2" style="display:flex;gap:4px;flex-wrap:wrap">${stB||'—'}</span></div>`+
    row('Méridiens',dom.map(m=>m+'×'+C[m]).join(' · ')||'—')+
    row('Gu 鬼',`<span style="font-size:10px">${allGu.join(', ')||'—'}</span>`)+
    row('CIM-11',`<span style="font-size:10px">${allCim.length?allCim.join('<br>'):'—'}</span>`)+
    row('33 Chakras',ckDone+'/33 · Consultant.e '+iD+'/'+iT)
  )+bx('Protection — '+selP.length+' pierre(s)',
    selP.length?selP.map(p=>row(p.ic+' '+p.nm,vDisp(p.id)+' · '+dDisp(p.id))).join(''):'<span style="font-size:11px;color:var(--t2)">Aucune pierre</span>'
  )+bx('Séquence séance',
    ['Ph -1 · SLM Monade + Nuummite GV4 (3.5 Ga)','Ph 0 · Secondary Gain','Ph 1 · C15 D4 Mère Universelle','Ph 2 · C12 D4 Galactique — fork 3.5 Ga','Ph 5a · CUBE × abuseurs patients zéro','Ph 5b · ICOSAÈDRE × lots victimes féminines','Ph 5d · DODÉCAÈDRE Monade S8','Scellement · SP3+SP6+KI3+GV4+PC7 · Om Nama Shivaya'].map(x=>`<div style="font-size:11px;color:var(--t2);padding:3px 0;border-bottom:0.5px solid var(--bd3)">${x}</div>`).join('')
  );
}
/* TABS */
function st(id){
  const ids=['intro','pierres','decode','chakras'];
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('on',ids[i]===id));
  ids.forEach(x=>{const p=document.getElementById('pane-'+x);if(p)p.classList.toggle('on',x===id);});
}
function drwCrb(){} /* onglet Courbe supprimé */
function bldSynth(){} /* onglet Synthèse supprimé */
/* ═══ EXPORT VERS CLAUDE — tous onglets ═══ */
function exportToClaude() {
  var lines = [];
  lines.push('=== SVLBH · hDOM · Consultant.e Diabète Type II · SLA 89% ===');
  lines.push('Exporté le ' + new Date().toLocaleString('fr-CH'));
  lines.push('');

  // ── SVLBH ──
  lines.push('── SVLBH ──');
  lines.push('Fork galactique : 3.5 Ga · C12 D4 · Méridien dominant : SP×6');
  lines.push('15 générations · Yi épuisé → Diabète Type II');
  lines.push('');

  // ── DÉCODAGE G. ──
  lines.push('── DÉCODAGE G. ──');
  var C = {}; MERS.forEach(function(m){C[m]=0;});
  G.forEach(function(g) {
    var valid = V.has(g.n) ? '✓' : '○';
    var ab = g.ab ? g.ab.split('|')[1] : '—';
    var vi = g.vi ? g.vi.split('|')[1] : '—';
    lines.push(valid + ' G-' + g.n
      + ' | Abuseur: ' + ab
      + ' | Victime: ' + vi
      + ' | Phase: ' + g.ph.map(function(i){return PHL[i];}).join('+')
      + ' | Gu: ' + g.gu.join(', ')
      + ' | Méridiens: ' + g.mt.join(' ')
      + ' | Statut: ' + g.st.map(function(s){return SLB[s];}).join('+'));
    if(V.has(g.n)) g.mt.forEach(function(m){if(C[m]!==undefined)C[m]++;});
  });
  lines.push('');
  lines.push('Méridiens validés : ' + MERS.filter(function(m){return C[m]>0;}).map(function(m){return m+'×'+C[m];}).join(' · '));
  lines.push('');

  // ── PIERRES ──
  lines.push('── PIERRES DE PROTECTION ──');
  PRR.forEach(function(p) {
    var s = SEL[p.id];
    if (!s.sel) return; // non sélectionnée
    var valid = s.val ? '✓' : '○';
    lines.push(valid + ' ' + p.ic + ' ' + p.nm
      + ' | ' + s.vv + ' ' + s.vu + ' · ' + dDisp(p.id)
      + ' | ' + p.ro
      + ' | Placement: ' + p.pl
      + (s.val ? '' : ' [non validée]'));
  });
  lines.push('');

  // ── 33 CHAKRAS ──
  lines.push('── 33 CHAKRAS ──');
  DIMS.forEach(function(d) {
    lines.push('D' + d.n + ' — ' + d.l.replace('D'+d.n+' — ',''));
    d.ck.forEach(function(c) {
      var key = d.id + '_' + (c.n||'x');
      var done = CKS[key] ? '✓' : '○';
      var cimCodes = '';
      var wid = d.id + '_cw' + (c.n||'x');
      if (cimSt[wid] && cimSt[wid].sel && cimSt[wid].sel.size > 0) {
        var codes = [];
        cimSt[wid].sel.forEach(function(lb, id){ codes.push(id + ' ' + lb); });
        cimCodes = ' | CIM-11: ' + codes.join(', ');
      }
      var tags = c.is.map(function(t){return t.l+' SLA'+t.s+'%';}).join(', ');
      lines.push('  ' + done + ' C' + (c.n||'?') + ' ' + c.nm
        + (tags ? ' | ' + tags : '')
        + cimCodes);
    });
  });
  lines.push('');

  // ── SÉQUENCE SÉANCE ──
  lines.push('── SÉQUENCE SÉANCE ──');
  ['Ph -1 · SLM Monade + Nuummite GV4 (3.5 Ga)',
   'Ph 0 · Secondary Gain',
   'Ph 1 · C15 D4 Mère Universelle',
   'Ph 2 · C12 D4 Galactique — fork 3.5 Ga',
   'Ph 5a · CUBE × abuseurs patients zéro',
   'Ph 5b · ICOSAÈDRE × lots victimes féminines',
   'Ph 5d · DODÉCAÈDRE Monade S8',
   'Scellement · SP3+SP6+KI3+GV4+PC7 · Om Nama Shivaya'
  ].forEach(function(x){lines.push(x);});

  var content = lines.join('\n');
  window.hdomExport = content;

  navigator.clipboard.writeText(content).then(function() {
    var btn = document.getElementById('btn-export');
    if (btn) {
      btn.textContent = '✓ Copié !';
      btn.style.background = 'rgba(16,163,127,.1)';
      btn.style.borderColor = '#1D9E75';
      btn.style.color = '#0f6e56';
      setTimeout(function(){
        btn.textContent = '📋 Exporter';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2500);
    }
  }).catch(function(err) {
    console.warn('Clipboard:', err);
    var btn = document.getElementById('btn-export');
    if (btn) { btn.textContent = '⚠ window.hdomExport'; }
  });
}

/* Pont extension Claude — inactif hors extension. */
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'GET_CONTENT') {
      exportToClaude();
      sendResponse({ content: window.hdomExport || document.body.innerText });
    }
  });
}

window.onload=function(){
  try{hdomRestore();}catch(e){console.error('hdomRestore',e);}
  try{bldTbl();}catch(e){console.error('bldTbl',e);}
  try{bldBars();}catch(e){console.error('bldBars',e);}
  try{bldChk();initDims();}catch(e){console.error('bldChk',e);}
  try{bldPrr();}catch(e){console.error('bldPrr',e);}
};

/* EVENT DELEGATION — replaces static inline handlers */
document.addEventListener('click', function(e) {
  var a = e.target.closest('[data-action]');
  if (!a) return;
  var act = a.getAttribute('data-action');
  if (act.startsWith('st-')) { st(act.slice(3)); return; }
  if (act === 'markAll')  { markAll();  return; }
  if (act === 'resetAll') { resetAll(); return; }
});


/* ═══ EVENT DELEGATION COMPLÈTE — remplace tous les handlers inline ═══ */
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-fn]');
  if (!el) return;
  var fn = el.getAttribute('data-fn');

  if (fn === 'st-intro')   { st('intro');      return; }
  if (fn === 'st-pierres') { st('pierres');    return; }
  if (fn === 'st-decode')  { st('decode');     return; }
  if (fn === 'st-chakras') { st('chakras');    return; }
  if (fn === 'markAll')    { markAll();        return; }
  if (fn === 'resetAll')   { resetAll();       return; }
  if (fn === 'export')     { exportToClaude(); return; }

  if (fn === 'tMer') { tMer(+el.getAttribute('data-n'), el.getAttribute('data-m')); return; }
  if (fn === 'tDim') { tDim(el.getAttribute('data-did')); return; }
  if (fn === 'tCk')  { tCk(el.getAttribute('data-key'), el.getAttribute('data-did')); return; }

  if (fn === 'cimOpen')  { cimOpen(el.getAttribute('data-wid')); return; }
  if (fn === 'cimClose') { cimClose(el.getAttribute('data-wid')); return; }
  if (fn === 'cimRm')    { cimRm(el.getAttribute('data-wid'), el.getAttribute('data-id')); return; }
  if (fn === 'cimTch')   { cimTch(el.getAttribute('data-wid'), el.getAttribute('data-cid')); return; }
  if (fn === 'cimTc')    { e.stopPropagation(); cimTc(el.getAttribute('data-wid'), el.getAttribute('data-ci')); return; }
  if (fn === 'cimTcx')   { e.stopPropagation(); cimTc(el.getAttribute('data-wid'), el.getAttribute('data-xi')); return; }
  if (fn === 'cimTsub')  { e.stopPropagation(); cimTsub(el.getAttribute('data-wid'), el.getAttribute('data-ci')); return; }
});

document.addEventListener('change', function(e) {
  var el = e.target.closest('[data-fn]');
  if (!el) el = e.target;
  var fn = el.getAttribute('data-fn');
  if (!fn) return;

  if (fn === 'tPh')   { tPh(+el.getAttribute('data-n'), +el.getAttribute('data-i'), el.checked); return; }
  if (fn === 'tGu')   { tGu(+el.getAttribute('data-n'), el.getAttribute('data-g2'), el.checked); return; }
  if (fn === 'tSt')   { tSt(+el.getAttribute('data-n'), el.getAttribute('data-s'), el.checked); return; }
  if (fn === 'tV')    { tV(+el.getAttribute('data-n'), el.checked); return; }
  if (fn === 'cN')    { cN(+el.getAttribute('data-n'), el.getAttribute('data-r'), el.value); return; }
  if (fn === 'tStn')  { tStn(el.getAttribute('data-pid'), el.checked); return; }
  if (fn === 'tPVal') { tPVal(el.getAttribute('data-pid'), el.checked); return; }
  if (fn === 'cUnit') { cUnit(el.getAttribute('data-pid'), el.getAttribute('data-u')); return; }
  if (fn === 'tCkCb') { tCkCb(el.getAttribute('data-key'), el.getAttribute('data-did'), el.checked); return; }
});

document.addEventListener('input', function(e) {
  var el = e.target;
  var fn = el.getAttribute('data-fn');
  if (!fn) return;

  if (fn === 'sVol') { sVol(el.getAttribute('data-pid'), el.getAttribute('data-src'), +el.value); return; }
  if (fn === 'sDm')  { sDm(el.getAttribute('data-pid'),  el.getAttribute('data-src'), +el.value); return; }
  if (fn === 'sDj')  { sDj(el.getAttribute('data-pid'),  el.getAttribute('data-src'), +el.value); return; }
  if (fn === 'cimQ') { cimQ(el.getAttribute('data-wid'), el.value); return; }
});


/* ═══════════════════════════════════════════════════════════════════════
   PERSISTANCE — ajout cockpit (DEC Patrick 2026-08-01).
   Le panneau d'origine ne gardait RIEN : fermer l'onglet perdait la séance.
   Les mesures au pendule sont saisies dans les onglets existants ; on
   sérialise l'état réel (G, V, CKS, SEL, cimSt) + l'en-tête du cas.
   Stockage local à l'appareil de la praticienne — aucune donnée envoyée.
   ═══════════════════════════════════════════════════════════════════════ */
var HDOM_KEY = 'hdom_seance_v1';

/* En-tête du cas : ce qui était figé en dur dans le spécimen. */
var HDOM_CAS = { titre:'', sla:'', gen:'', fork:'', mer:'' };

function hdomSnapshot(){
  return {
    v: 1,
    cas: HDOM_CAS,
    G: G,
    V: Array.from(V),
    CKS: CKS,
    SEL: SEL,
    cimSt: cimSt,
    at: new Date().toISOString()
  };
}

function hdomSave(){
  try { localStorage.setItem(HDOM_KEY, JSON.stringify(hdomSnapshot())); }
  catch(e) { console.warn('hdomSave', e); }
  var t = document.getElementById('hdom-saved');
  if (t) {
    t.textContent = 'enregistré ' + new Date().toLocaleTimeString('fr-CH', {hour:'2-digit',minute:'2-digit'});
  }
}

function hdomRestore(){
  var raw = null;
  try { raw = localStorage.getItem(HDOM_KEY); } catch(e) { return; }
  if (!raw) { hdomBindCas(); return; }
  var d;
  try { d = JSON.parse(raw); } catch(e) { return; }
  if (!d || d.v !== 1) { hdomBindCas(); return; }

  if (Array.isArray(d.G)) {
    d.G.forEach(function(sg){
      var g = G.find(function(x){ return x.n === sg.n; });
      if (!g) return;
      g.ph = sg.ph || []; g.ab = sg.ab || ''; g.vi = sg.vi || '';
      g.gu = sg.gu || []; g.mt = sg.mt || []; g.st = sg.st || [];
    });
  }
  if (Array.isArray(d.V)) { V.clear(); d.V.forEach(function(n){ V.add(n); }); }
  if (d.CKS)    { Object.keys(d.CKS).forEach(function(k){ if (k in CKS) CKS[k] = d.CKS[k]; }); }
  if (d.SEL)    { Object.keys(d.SEL).forEach(function(k){ if (k in SEL) SEL[k] = d.SEL[k]; }); }
  if (d.cimSt)  { Object.keys(d.cimSt).forEach(function(k){ cimSt[k] = d.cimSt[k]; }); }
  if (d.cas)    { HDOM_CAS = d.cas; }
  hdomBindCas();
}

/* Les 5 champs de l'en-tête : saisis, pas déduits. */
function hdomBindCas(){
  ['titre','sla','gen','fork','mer'].forEach(function(k){
    var el = document.getElementById('cas-' + k);
    if (!el) return;
    el.value = HDOM_CAS[k] || '';
    el.addEventListener('input', function(){
      HDOM_CAS[k] = el.value;
      hdomPaintCas();
      hdomSave();
    });
  });
  hdomPaintCas();
}

/* Reporte l'en-tête saisi dans les zones que le spécimen affichait en dur. */
function hdomPaintCas(){
  var map = {
    'cas-out-titre': HDOM_CAS.titre || '— cas non nommé —',
    'cas-out-sla':   HDOM_CAS.sla   || '—',
    'cas-out-gen':   HDOM_CAS.gen   || '—',
    'cas-out-fork':  HDOM_CAS.fork  || '—',
    'cas-out-mer':   HDOM_CAS.mer   || '—'
  };
  Object.keys(map).forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.textContent = map[id];
  });
}

function hdomReset(){
  if (!window.confirm('Effacer toute la séance en cours ?')) return;
  try { localStorage.removeItem(HDOM_KEY); } catch(e) {}
  location.reload();
}

function hdomExportJSON(){
  var blob = new Blob([JSON.stringify(hdomSnapshot(), null, 2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hdom-seance-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* Toute interaction du panneau écrit l'état (débounce 400 ms). */
var hdomT = null;
function hdomTouch(){ clearTimeout(hdomT); hdomT = setTimeout(hdomSave, 400); }
['click','change','input'].forEach(function(ev){
  document.addEventListener(ev, function(e){
    if (e.target && e.target.closest && (e.target.closest('[data-fn]') || e.target.closest('[data-action]'))) hdomTouch();
  }, true);
});
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-hdom]');
  if (!a) return;
  var w = a.getAttribute('data-hdom');
  if (w === 'reset')  { hdomReset(); return; }
  if (w === 'export') { hdomExportJSON(); return; }
});
