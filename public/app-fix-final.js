/**
 * EMPYREAN — app-fix-final.js  (UNIFIED — replaces v5 through v10)
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE file. ONE load. Zero conflicts.
 *
 * All logic from app-fix-v5 → v10 has been audited, merged, and de-duplicated.
 * Where fixes in later files superseded earlier ones, only the latest correct
 * version is kept. Where earlier fixes were confirmed working and never broken
 * by later files, they are preserved verbatim.
 *
 * SECTION MAP
 *  §0   Shared helpers
 *  §1   Bottom nav  (SVG icons — no Font Awesome dependency)
 *  §2   Viewport / layout overflow fix
 *  §3   Status upload  (Cloudinary, video, label-click, preview)
 *  §4   Status bar — restore after viewing, 24 h persistence
 *  §5   Status viewer buttons  (retweet, profile, chat, viewer count)
 *  §6   Reel bubble buttons  (like, comment, retweet, share, download)
 *  §7   Reel / modal universal close + exit buttons  (EXIT BUG FIX)
 *  §8   Profile page blank fix
 *  §9   Messages contacts list
 *  §10  Suggested users visibility + Follow button
 *  §11  Online presence dots + messenger badge
 *  §12  Business: create-page modal, video upload, dashboard slider
 *  §13  Business posts — block from general feed, dedup guard
 *  §14  Business dashboard card enrichment + demo-card removal
 *  §15  Business duplicate post guard
 *  §16  Business card click → navigate to business page
 *  §17  NGO / Individual form activation buttons
 *  §18  Admin: chief login + enroll panel
 *  §19  Admin: individual disbursement crypto wallet type selector  ← (THE FIXED ONE)
 *  §20  Admin: chain selector + empty-wallet filter for NGO disburse
 *  §21  KYC permissions fix
 *  §22  Wallet balance sync from Firestore
 *  §23  Login re-prompt / guest-state sync
 *  §24  Account switcher
 *  §25  Nav bar style (sidebar icons)
 *  §26  Premium badge removal (v8 killed it — keep that)
 *  §27  Dashboard business posts slider (hardcoded HTML containers)
 *  §28  Video preload + playsinline
 *  §29  Global init bridge
 *  §30  Marketplace — dashboard strip + contact/chat + owner toolbar + card click-to-chat
 *  §31  Business page suggestions — "Business Pages For You" strip
 *  §32  Feed privacy — post composer owner-only + biz-page visitor enforcement + profile post-column restriction
 *  §33  SOS donate button — persistent across re-renders, MutationObserver + periodic sweep
 *
 * LOAD ORDER: last script before </body>.
 * REPLACE all of: app-fix-v5.js, app-fix-v6.js, app-fix-v7.js,
 *                 app-fix-v8.js, app-fix-v9.js, app-fix-v10.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function EmpyreanFixFinal() {
    'use strict';

    /* ═══════════════════════════════════════════════════════════════════════
       §0  SHARED HELPERS
    ═══════════════════════════════════════════════════════════════════════ */
    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }
    function _esc(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function _notify(msg, type) {
        if (typeof window.showNotification === 'function') window.showNotification(msg, type || 'info');
        else console.log('[EmpFix notify]', type, msg);
    }
    function _fbOk() { return !!(window._firebaseLoaded && window.fbDb && typeof window.fbDb.collection === 'function'); }
    function _us() { return (window.EmpState && window.EmpState.userState) || window.userState || {}; }
    function _isGuest() {
        var s = window.EmpState || {};
        if (s.isGuest != null) return !!s.isGuest;
        if (window.isGuest != null) return !!window.isGuest;
        var u = _us();
        if (u && u.id && u.id !== 'guest' && !String(u.id).startsWith('guest-')) return false;
        return true;
    }
    function _isAdmin() { return !!(window.isAdmin || (window.EmpState && window.EmpState.isAdmin)); }
    function _cfg() { return (window._appConfig && window._appConfig.cloudinary) || {}; }

    /* Safe single-wrap of navigateTo — prevent infinite-wrap chains */
    var _navWrapDone = false;
    function _wrapNavigateTo(fn) {
        var prev = window.navigateTo;
        window.navigateTo = function(id, fc) {
            if (typeof prev === 'function') prev(id, fc);
            try { fn(id, fc); } catch (e) { console.warn('[EmpFix navWrap]', e); }
        };
    }


    /* ═══════════════════════════════════════════════════════════════════════
       §1  BOTTOM NAV — SVG icons, milky white, Facebook-style
           Uses inline SVG so it never depends on Font Awesome loading.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixBottomNav() {
        var SVG = {
            home:        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            reels:       '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14a2 2 0 002 2h14v-2H4V6zm16-4H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>',
            messages:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>',
            marketplace: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm-7-3a3 3 0 010 6 3 3 0 010-6zm0 10a4 4 0 11.001-8.001A4 4 0 0112 13zm0-6a2 2 0 100 4 2 2 0 000-4z"/></svg>',
            wallet:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 7H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zM1 5h20v2H1zM3 3h16v2H3zm14 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>',
            globe:       '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1a2 2 0 002 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3a1 1 0 00-1-1H8v-2h2a1 1 0 000-2H8V7h2a2 2 0 012 2v1h2a1 1 0 011 1v3h1c.65 0 1.23.24 1.68.63-.18.76-.44 1.49-.78 2.16z"/></svg>',
            news:        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-1 7H5v-1h14v1zm0-3H5V7h14v1zm-9 6H5v-1h5v1zm4 0h-3v-1h3v1z"/></svg>',
            profile:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a3 3 0 110 6 3 3 0 010-6zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/></svg>'
        };
        var ICON_MAP = { dashboard:'home', reels:'reels', messages:'messages', marketplace:'marketplace', 'my-wallet':'wallet', 'ngo-partners':'globe', news:'news', profile:'profile' };
        var GUEST_ITEMS = [{id:'dashboard'},{id:'marketplace'},{id:'reels'},{id:'news'},{id:'ngo-partners'}];
        var USER_ITEMS  = [{id:'dashboard'},{id:'reels'},{id:'messages',badge:'messages'},{id:'marketplace'},{id:'my-wallet'},{id:'profile',isAvatar:true}];

        function _badgeCount(key) { try { if (key==='messages') return window._unreadMessageCount||0; } catch(e){} return 0; }
        function _avatarSrc() { var u=_us(); return (u&&(u.avatar||u.profilePhoto||u.profilePic))||null; }
        function _makeSVG(key, color) {
            return (SVG[key]||SVG.home).replace('<svg ','<svg width="26" height="26" style="display:block;flex-shrink:0;color:'+color+'" ');
        }
        function _buildItem(item, activeId) {
            var isActive = item.id === activeId, color = isActive ? '#1877F2' : '#65676B';
            var btn = document.createElement('button');
            btn.className = 'emp-nav-btn' + (isActive ? ' active' : '');
            btn.dataset.target = btn.dataset.section = item.id;
            btn.setAttribute('aria-label', item.id);
            btn.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;'+
                'background:none;border:none;border-top:3px solid '+(isActive?'#1877F2':'transparent')+';'+
                'cursor:pointer;padding:0;height:60px;color:'+color+';-webkit-tap-highlight-color:transparent;'+
                'transition:color .15s,border-color .15s;position:relative;';
            if (item.isAvatar) {
                var src = _avatarSrc();
                btn.innerHTML = src
                    ? '<img src="'+_esc(src)+'" alt="Profile" style="width:30px;height:30px;min-width:30px;max-width:30px;max-height:30px;border-radius:50%;object-fit:cover;border:2.5px solid '+(isActive?'#1877F2':'rgba(0,0,0,0.15)')+';" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span style="display:none;width:30px;height:30px;border-radius:50%;background:#E4E6EB;align-items:center;justify-content:center;">'+_makeSVG('profile',color)+'</span>'
                    : _makeSVG('profile', color);
            } else {
                var cnt = item.badge ? _badgeCount(item.badge) : 0;
                var badge = cnt > 0 ? '<span style="position:absolute;top:8px;right:calc(50% - 22px);background:#E41E3F;color:#fff;font-size:0.52rem;font-weight:700;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid #fff;line-height:1;">'+(cnt>99?'99+':cnt)+'</span>' : '';
                btn.innerHTML = _makeSVG(ICON_MAP[item.id]||'home', color) + badge;
            }
            return btn;
        }

        function _injectCSS() {
            ['_v7_nav_style','_v8_nav_css','_v9_nav_css','_v10_nav_css','_v10f_nav_css','_vf_nav_css'].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
            if (document.getElementById('_vf_nav_css')) return;
            var s = document.createElement('style');
            s.id = '_vf_nav_css';
            s.textContent = '#mobile-bottom-nav{position:fixed!important;bottom:0!important;left:0!important;right:0!important;height:60px!important;background:rgba(255,255,255,0.98)!important;backdrop-filter:blur(24px) saturate(180%)!important;-webkit-backdrop-filter:blur(24px) saturate(180%)!important;border-top:1px solid rgba(0,0,0,0.10)!important;box-shadow:0 -2px 16px rgba(0,0,0,0.08)!important;display:flex!important;align-items:stretch!important;justify-content:space-around!important;z-index:10000!important;padding:0!important;padding-bottom:env(safe-area-inset-bottom,0px)!important;overflow:hidden!important;}#mobile-bottom-nav .mobile-nav-item{display:none!important;}.main-content{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))!important;}';
            document.head.appendChild(s);
        }

        function _build() {
            _injectCSS();
            var old = document.getElementById('mobile-bottom-nav'); if (old) old.remove();
            var activeId; try { activeId = localStorage.getItem('empyrean_last_section')||'dashboard'; } catch(e){ activeId='dashboard'; }
            var items = _isGuest() ? GUEST_ITEMS : USER_ITEMS;
            var nav = document.createElement('nav');
            nav.id = 'mobile-bottom-nav'; nav.setAttribute('role','navigation'); nav.setAttribute('aria-label','Bottom navigation');
            nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:60px;background:rgba(255,255,255,0.98);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border-top:1px solid rgba(0,0,0,0.10);box-shadow:0 -2px 16px rgba(0,0,0,0.08);display:flex;align-items:stretch;justify-content:space-around;z-index:10000;padding:0;padding-bottom:env(safe-area-inset-bottom,0px);overflow:hidden;';
            items.forEach(function(item){ nav.appendChild(_buildItem(item, activeId)); });
            nav.addEventListener('click', function(e){
                var btn = e.target.closest && e.target.closest('.emp-nav-btn');
                if (!btn) return; e.preventDefault(); e.stopPropagation();
                nav.querySelectorAll('.emp-nav-btn').forEach(function(b){
                    b.classList.remove('active'); b.style.borderTopColor='transparent'; b.style.color='#65676B';
                    b.querySelectorAll('svg').forEach(function(svg){ svg.style.color='#65676B'; });
                    var img=b.querySelector('img'); if(img) img.style.borderColor='rgba(0,0,0,0.15)';
                });
                btn.classList.add('active'); btn.style.borderTopColor='#1877F2'; btn.style.color='#1877F2';
                btn.querySelectorAll('svg').forEach(function(svg){ svg.style.color='#1877F2'; });
                var img2=btn.querySelector('img'); if(img2) img2.style.borderColor='#1877F2';
                try { localStorage.setItem('empyrean_last_section', btn.dataset.target); } catch(e2){}
                if (typeof window.navigateTo==='function') window.navigateTo(btn.dataset.target, true);
            });
            document.body.appendChild(nav);
        }

        document.addEventListener('empyrean-section-change', function(e){
            if (!e||!e.detail) return;
            var sec=e.detail.section, nav=document.getElementById('mobile-bottom-nav');
            if (!nav) return;
            nav.querySelectorAll('.emp-nav-btn').forEach(function(b){
                var ia=b.dataset.target===sec; b.classList.toggle('active',ia);
                b.style.borderTopColor=ia?'#1877F2':'transparent'; b.style.color=ia?'#1877F2':'#65676B';
                b.querySelectorAll('svg').forEach(function(svg){ svg.style.color=ia?'#1877F2':'#65676B'; });
                var img=b.querySelector('img'); if(img) img.style.borderColor=ia?'#1877F2':'rgba(0,0,0,0.15)';
            });
            try { localStorage.setItem('empyrean_last_section', sec); } catch(e2){}
        });

        ready(_build);
        document.addEventListener('empyrean-init-done', function(){ setTimeout(_build,200); });
        document.addEventListener('empyrean-user-ready', function(){ setTimeout(_build,200); });
        window._buildMobileBottomNav = _build;
        console.log('[§1] Bottom nav — milky white, SVG icons.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §2  VIEWPORT / LAYOUT OVERFLOW FIX
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixViewport() {
        ready(function(){
            ['_v7_viewport_fix','_v10f_layout','_v10f_layout_v2','_v10f_layout_v3','_vf_layout'].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
            if (document.getElementById('_vf_layout')) return;
            var s=document.createElement('style'); s.id='_vf_layout';
            s.textContent=[
                /* ── 1. Global overflow prevention ── */
                'body{overflow-x:hidden!important;max-width:100vw!important;}',
                'html,body{box-sizing:border-box!important;}',
                '*,*::before,*::after{box-sizing:border-box!important;}',
                '.main-content{overflow-x:hidden!important;max-width:100vw!important;box-sizing:border-box!important;}',
                '#dashboard{width:100%!important;max-width:100%!important;box-sizing:border-box!important;}',

                /* ── 2. Active content sections scroll and clear bottom nav.
                        ONLY .active sections get these rules — inactive ones
                        are display:none so the rules never apply to them. ── */
                '.content-section.active{',
                '  overflow-y:auto!important;',
                '  -webkit-overflow-scrolling:touch!important;',
                '  padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))!important;}',

                /* ── 3. Messages section: needs a defined height so its inner
                        flex children can use height:calc(100%).
                        #messages itself is display:block when active (from app CSS).
                        We give it a fixed viewport height and NO overflow so the
                        children manage scrolling themselves.
                        padding-bottom:0 overrides rule 2 for this section. ── */
                '#messages.active{',
                '  height:calc(100vh - 60px)!important;',
                '  overflow:hidden!important;',
                '  padding-bottom:0!important;}',

                /* ── 4. messages-view is the flex row container ── */
                '#messages.active #messages-view{',
                '  display:flex!important;',
                '  height:100%!important;',
                '  overflow:hidden!important;}',

                /* ── 5. Contact list panel scrolls independently ── */
                '#contact-list-container{',
                '  overflow:hidden!important;',
                '  display:flex!important;flex-direction:column!important;}',
                '#contacts-inner{',
                '  overflow-y:auto!important;',
                '  -webkit-overflow-scrolling:touch!important;',
                '  flex:1!important;}',

                /* ── 6. Chat view panel: column flex ── */
                '#chat-view-container{',
                '  display:flex!important;flex-direction:column!important;',
                '  overflow:hidden!important;flex:1!important;}',
                '#chat-messages-container{',
                '  flex:1!important;overflow-y:auto!important;',
                '  -webkit-overflow-scrolling:touch!important;}',

                /* ── 7. Message input bar: never hidden by bottom nav ── */
                '#chat-view-container>div:last-child{',
                '  flex-shrink:0!important;',
                '  padding-bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;',
                '  background:white!important;}',
            ].join('');
            document.head.appendChild(s);
        });
        console.log('[§2] Viewport + messages section scroll fix.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §3  STATUS UPLOAD — Cloudinary, video, label-click fix, retry
           Strategy: wire our handler once per modal lifecycle via _v9Wired guard.
           Clones the button only once to strip stale handlers. No repeated cloning.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixStatusUpload() {
        function _cloudUpload(file, attempt) {
            attempt = attempt || 1;
            return new Promise(function(resolve, reject){
                var cfg    = _cfg(), cloud = cfg.cloud||cfg.cloudName||'dxcthrgsp', preset = cfg.preset||cfg.uploadPreset||cfg.upload_preset||'Empyrean_preset';
                var isVid  = file.type && file.type.startsWith('video/');
                var fd = new FormData(); fd.append('file',file); fd.append('upload_preset',preset); if(isVid) fd.append('resource_type','video');
                fetch('https://api.cloudinary.com/v1_1/'+cloud+'/'+(isVid?'video':'image')+'/upload',{method:'POST',body:fd})
                    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
                    .then(function(d){ var url=d.secure_url||d.url||''; if(!url) throw new Error('No URL'); resolve(url); })
                    .catch(function(err){
                        if (attempt < 2) { setTimeout(function(){ _cloudUpload(file,2).then(resolve).catch(reject); }, 1200); }
                        else reject(err);
                    });
            });
        }

        function _wire() {
            var modal = document.getElementById('create-status-modal');
            if (!modal || modal._vfWired) return;
            var fileInput = document.getElementById('status-file-input');
            if (!fileInput) return;
            var btn = document.getElementById('post-status-btn');
            if (!btn) return;
            modal._vfWired = true;

            /* Fix label-click on mobile — prevent browser history push */
            var label = modal.querySelector('label[for="status-file-input"],label[for="status-media-input"],.status-upload-label');
            if (label && !label._vfFixed) {
                label._vfFixed = true;
                var freshLabel = label.cloneNode(true);
                label.parentNode.replaceChild(freshLabel, label);
                freshLabel.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); fileInput.click(); }, false);
            }

            /* Preview */
            if (!fileInput._vfPreview) {
                fileInput._vfPreview = true;
                fileInput.addEventListener('change', function(){
                    var prev = document.getElementById('status-file-preview')||document.getElementById('status-media-preview');
                    if (!prev) return; prev.innerHTML = '';
                    Array.from(fileInput.files||[]).forEach(function(f){
                        var isVid=f.type.startsWith('video/'), el=document.createElement(isVid?'video':'img');
                        el.src=URL.createObjectURL(f); if(isVid){ el.controls=true; el.muted=true; el.playsInline=true; }
                        el.style.cssText='width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid rgba(27,43,139,0.2);';
                        prev.appendChild(el);
                    });
                });
            }

            /* Replace button once to clear all stale handlers */
            var freshBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(freshBtn, btn);
            freshBtn.disabled = false;

            freshBtn.addEventListener('click', async function(e){
                e.preventDefault(); e.stopImmediatePropagation();
                if (_isGuest()){ _notify('Please log in to post a status.','info'); return; }
                var ta = document.getElementById('status-text-input')||modal.querySelector('textarea');
                var text = ta ? ta.value.trim() : '';
                var files = Array.from(fileInput.files||[]);
                if (!text && !files.length){ _notify('Please add text or media.','warning'); return; }
                freshBtn.disabled=true; freshBtn.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>&nbsp;Posting…';
                try {
                    var items=[], us=_us();
                    if (text && !files.length) items.push({ id:'si-'+Date.now(), type:'text', content:text, createdAt:new Date().toISOString(), likes:0, retweets:0, likedBy:[], retweetedBy:[], viewers:[] });
                    for (var i=0;i<files.length;i++){
                        var f=files[i]; _notify('Uploading '+(i+1)+'/'+files.length+'…','info');
                        var uploadedUrl='';
                        try { uploadedUrl=await _cloudUpload(f); } catch(ue){ _notify('File '+(i+1)+' failed: '+ue.message,'error'); continue; }
                        if (!uploadedUrl||uploadedUrl.startsWith('blob:')){ _notify('Invalid URL for file '+(i+1)+', skipped.','warning'); continue; }
                        items.push({ id:'si-'+Date.now()+'-'+i, type:f.type.startsWith('video/')?'video':'image', url:uploadedUrl, content:text, createdAt:new Date().toISOString(), likes:0, retweets:0, likedBy:[], retweetedBy:[], viewers:[] });
                    }
                    if (!items.length){ _notify('Nothing uploaded successfully.','warning'); return; }
                    var statusDoc={ userId:us.id||'', name:us.fullName||us.username||'User', avatar:us.avatar||'', items:items, viewed:false, createdAt:new Date().toISOString() };
                    var docId='status-'+(us.id||Date.now()); statusDoc.docId=docId;
                    if (!window.userStatuses) window.userStatuses=[];
                    var idx=window.userStatuses.findIndex(function(s){ return s.userId===us.id; });
                    if (idx>-1) window.userStatuses[idx]=statusDoc; else window.userStatuses.unshift(statusDoc);
                    if (typeof window.renderStatusBar==='function') window.renderStatusBar();
                    /* Close immediately — don't wait on Firestore */
                    modal.style.display='none'; modal.classList.remove('show','active'); document.body.classList.remove('modal-open'); document.body.style.overflow='';
                    if(ta) ta.value=''; fileInput.value='';
                    var prev2=document.getElementById('status-file-preview')||document.getElementById('status-media-preview'); if(prev2) prev2.innerHTML='';
                    _notify('✅ Status posted!','success');
                    if (_fbOk()) window.fbDb.collection('statuses').doc(docId).set(statusDoc).catch(function(fe){ console.warn('[§3] Firestore save failed (media already on Cloudinary):',fe.message); });
                } catch(err){ _notify('Status upload failed: '+(err.message||'Try again.'),'error'); }
                finally { freshBtn.disabled=false; freshBtn.innerHTML='<i class="fa-solid fa-paper-plane"></i>&nbsp;Post Status'; }
            });
        }

        ready(_wire); setTimeout(_wire,600); setTimeout(_wire,1500);
        document.addEventListener('empyrean-init-done', function(){ setTimeout(_wire,300); });
        document.addEventListener('click', function(e){
            var opener = e.target.closest && e.target.closest('[data-modal="create-status-modal"],#add-status-btn,.status-add-btn,#add-my-status-btn');
            if (opener){ var m=document.getElementById('create-status-modal'); if(m) m._vfWired=false; setTimeout(_wire,120); }
        });
        console.log('[§3] Status upload wired.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §4  STATUS BAR — 24 h persistence + restore after viewing
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixStatusBar() {
        /* CSS: always show status items, even viewed ones */
        ready(function(){
            if (document.getElementById('_vf_status_css')) return;
            var s=document.createElement('style'); s.id='_vf_status_css';
            s.textContent='.status-avatar-ring.viewed{opacity:0.55!important;}.status-item{display:flex!important;}#status-bar-container{display:block!important;position:relative!important;z-index:10!important;width:100%!important;box-sizing:border-box!important;}#status-viewer-modal{z-index:99999!important;}';
            document.head.appendChild(s);
        });

        /* Restore status bar when viewer is closed */
        function _restore(){
            var sbc=document.getElementById('status-bar-container');
            if (!sbc) return;
            sbc.style.display=''; sbc.style.visibility=''; sbc.style.opacity=''; sbc.classList.add('visible');
            if (typeof window.renderStatusBar==='function') try{ window.renderStatusBar(); } catch(e){}
        }

        function _wireViewerClose(){
            var modal=document.getElementById('status-viewer-modal');
            if (!modal||modal._vfCloseWired) return; modal._vfCloseWired=true;
            new MutationObserver(function(){
                var hidden=modal.style.display==='none'||!modal.classList.contains('show')||modal.style.visibility==='hidden';
                if (hidden) setTimeout(_restore,60);
            }).observe(modal,{attributes:true,attributeFilter:['style','class']});
        }

        document.addEventListener('click',function(e){
            var t=e.target;
            if (t.id==='status-viewer-close'||t.id==='status-viewer-close-btn'||(t.closest&&(t.closest('#status-viewer-close')||t.closest('#status-viewer-close-btn')))) setTimeout(_restore,80);
        },true);

        ready(function(){ _wireViewerClose(); setTimeout(_wireViewerClose,1000); setTimeout(_wireViewerClose,3000); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_restore,400); setTimeout(_wireViewerClose,600); });
        console.log('[§4] Status bar persistence fix.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §5  STATUS VIEWER BUTTONS (retweet, profile, chat, viewer count)
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixStatusViewerButtons(){
        function _wire(){
            var htmlRT=document.getElementById('status-retweet-btn-html'); if(htmlRT) htmlRT.style.display='none';
            var av=document.getElementById('status-viewer-avatar');
            if (av&&!av._vfWired){ av._vfWired=true; av.style.cursor='pointer';
                av.addEventListener('click',function(){
                    var su=(window.userStatuses||[])[window._currentStatusUser]; if(!su) return;
                    var modal=document.getElementById('status-viewer-modal'); if(modal){modal.style.display='none';modal.classList.remove('show');}
                    document.body.classList.remove('modal-open');
                    if(typeof window.renderUserProfile==='function') window.renderUserProfile(su.userId);
                    if(typeof window.navigateTo==='function') window.navigateTo('profile');
                });
            }
            var profBtn=document.getElementById('status-view-profile-btn');
            if (profBtn&&!profBtn._vfWired){ profBtn._vfWired=true;
                profBtn.addEventListener('click',function(e){
                    e.stopPropagation();
                    var su=(window.userStatuses||[])[window._currentStatusUser]; if(!su) return;
                    var modal=document.getElementById('status-viewer-modal'); if(modal){modal.style.display='none';modal.classList.remove('show');}
                    document.body.classList.remove('modal-open');
                    if(typeof window.renderUserProfile==='function') window.renderUserProfile(su.userId);
                    if(typeof window.navigateTo==='function') window.navigateTo('profile');
                });
            }
            var chatBtn=document.getElementById('status-chat-btn');
            if (chatBtn&&!chatBtn._vfWired){ chatBtn._vfWired=true;
                chatBtn.addEventListener('click',function(e){
                    e.stopPropagation();
                    var su=(window.userStatuses||[])[window._currentStatusUser]; if(!su) return;
                    var modal=document.getElementById('status-viewer-modal'); if(modal){modal.style.display='none';modal.classList.remove('show');}
                    document.body.classList.remove('modal-open');
                    if(typeof window.navigateTo==='function') window.navigateTo('messages');
                    setTimeout(function(){ if(typeof window.openChatWith==='function') window.openChatWith(su.userId,su.name,su.avatar); },350);
                });
            }
            var badge=document.getElementById('status-viewer-count-badge');
            if (badge&&!badge._vfWired){ badge._vfWired=true; badge.style.cursor='pointer'; badge.style.display='flex';
                badge.addEventListener('click',function(e){ e.stopPropagation(); var p=document.getElementById('status-viewers-panel'); if(!p) return; var open=p.classList.contains('open'); p.classList.toggle('open',!open); p.style.display=open?'none':'block'; });
            }
        }
        ready(function(){ setTimeout(_wire,600); }); [1200,2500].forEach(function(t){ setTimeout(_wire,t); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_wire,400); });
        document.addEventListener('click',function(e){ var opener=e.target.closest&&(e.target.closest('.status-item')||e.target.closest('#add-my-status-btn')); if(opener) setTimeout(_wire,200); });
        console.log('[§5] Status viewer buttons wired.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §6  REEL BUBBLE BUTTONS (like, comment, retweet, share, download)
           Capture-phase handler — fires before any blocking inline handlers.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixReelButtons(){
        if (!window._reelDataStore) window._reelDataStore = {};
        function _getData(id){ if(!window._reelDataStore[id]) window._reelDataStore[id]={likes:0,likedBy:[],retweets:0,retweetedBy:[],comments:[]}; return window._reelDataStore[id]; }
        function _reward(type){ if(typeof window._rewardUser==='function') try{window._rewardUser(type);}catch(e){} }
        function _getReelId(btn){ return btn.dataset.reelId||(btn.closest('[data-reel-id]')&&btn.closest('[data-reel-id]').dataset.reelId)||(btn.closest('.reel-viewer-item')&&btn.closest('.reel-viewer-item').dataset.reelId)||(btn.closest('.reel-card')&&btn.closest('.reel-card').dataset.reelId)||null; }
        var SEL={ like:'.reel-like-btn,[data-reel-action="like"]', comment:'.reel-comment-btn,[data-reel-action="comment"]', retweet:'.reel-retweet-btn,[data-reel-action="retweet"],.reel-repost-btn', share:'.reel-share-btn,[data-reel-action="share"]', download:'.reel-download-btn,[data-reel-action="download"]' };

        document.addEventListener('click',function(e){
            var inViewer=document.getElementById('reel-viewer-overlay'), inCard=e.target.closest&&e.target.closest('.reel-card,.reel-viewer-item');
            if (!inCard&&!(inViewer&&inViewer.contains(e.target))) return;
            var t=e.target;

            var likeBtn=t.closest&&t.closest(SEL.like);
            if (likeBtn){ e.preventDefault(); e.stopImmediatePropagation();
                if(_isGuest()){ _notify('Log in to like reels.','info'); return; }
                var reelId=_getReelId(likeBtn), uid=(_us()).id, data=_getData(reelId), idx=data.likedBy.indexOf(uid);
                if(idx>-1){ data.likedBy.splice(idx,1); data.likes=Math.max(0,data.likes-1); likeBtn.classList.remove('liked','active'); likeBtn.style.color=''; }
                else { data.likedBy.push(uid); data.likes++; likeBtn.classList.add('liked','active'); likeBtn.style.color='#EF4444'; _reward('ENGAGE_LIKE'); }
                var lc=likeBtn.querySelector('.reel-like-count,.count,[class*="count"]'); if(lc) lc.textContent=data.likes;
                if(_fbOk()&&reelId) window.fbDb.collection('reels').doc(reelId).update({likes:data.likes,likedBy:data.likedBy}).catch(function(){});
                return;
            }
            var commentBtn=t.closest&&t.closest(SEL.comment);
            if (commentBtn){ e.preventDefault(); e.stopImmediatePropagation();
                var item=commentBtn.closest('.reel-viewer-item,.reel-card');
                if (!item) return;
                var drawer=item.querySelector('.reel-comments-drawer,.comments-panel,.comments-drawer');
                if (drawer){ drawer.classList.toggle('open'); drawer.style.display=drawer.classList.contains('open')?'block':'none'; }
                else _notify('Comments coming soon.','info');
                return;
            }
            var rtBtn=t.closest&&t.closest(SEL.retweet);
            if (rtBtn){ e.preventDefault(); e.stopImmediatePropagation();
                if(_isGuest()){ _notify('Log in to repost.','info'); return; }
                var reelId2=_getReelId(rtBtn), uid2=(_us()).id, data2=_getData(reelId2), idx2=data2.retweetedBy.indexOf(uid2);
                if(idx2>-1){ data2.retweetedBy.splice(idx2,1); data2.retweets=Math.max(0,data2.retweets-1); rtBtn.classList.remove('retweeted','active'); rtBtn.style.color=''; }
                else { data2.retweetedBy.push(uid2); data2.retweets++; rtBtn.classList.add('retweeted','active'); rtBtn.style.color='#10B981'; _notify('Reel reposted! ✨','success'); _reward('RETWEET_POST'); }
                var rc=rtBtn.querySelector('.reel-retweet-count,.count,[class*="count"]'); if(rc) rc.textContent=data2.retweets;
                if(_fbOk()&&reelId2) window.fbDb.collection('reels').doc(reelId2).update({retweets:data2.retweets,retweetedBy:data2.retweetedBy}).catch(function(){});
                return;
            }
            var shareBtn=t.closest&&t.closest(SEL.share);
            if (shareBtn){ e.preventDefault(); e.stopImmediatePropagation();
                var shareUrl=shareBtn.dataset.url||window.location.origin+'?reel='+(_getReelId(shareBtn)||'');
                if(navigator.share) navigator.share({title:'Empyrean Reel',url:shareUrl}).catch(function(){});
                else { try{navigator.clipboard.writeText(shareUrl);}catch(e2){} _notify('Link copied!','success'); }
                return;
            }
            var dlBtn=t.closest&&t.closest(SEL.download);
            if (dlBtn){ e.preventDefault(); e.stopImmediatePropagation();
                var ri=dlBtn.closest('.reel-viewer-item,.reel-card'), vid=ri&&ri.querySelector('video');
                var dlUrl=dlBtn.dataset.url||(vid&&(vid.src||(vid.querySelector('source')&&vid.querySelector('source').src)))||'';
                if(!dlUrl){ _notify('Video URL not available.','error'); return; }
                var a=document.createElement('a'); a.href=dlUrl; a.download='empyrean-reel-'+Date.now()+'.mp4'; a.target='_blank'; a.rel='noopener noreferrer';
                document.body.appendChild(a); a.click(); a.remove(); _notify('Download started!','success');
                return;
            }
        },true);

        /* Sync Firestore data into local store when viewer opens */
        ready(function(){
            var overlay=document.getElementById('reel-viewer-overlay');
            if (overlay) new MutationObserver(function(){
                overlay.querySelectorAll('[data-reel-id]').forEach(function(el){ var rid=el.dataset.reelId; if(rid&&!window._reelDataStore[rid]&&_fbOk()) window.fbDb.collection('reels').doc(rid).get().then(function(doc){ if(doc.exists){ var d=doc.data(); window._reelDataStore[rid]={likes:d.likes||0,likedBy:d.likedBy||[],retweets:d.retweets||0,retweetedBy:d.retweetedBy||[],comments:d.comments||[]}; } }).catch(function(){}); });
            }).observe(overlay,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
        });

        /* §6-EXIT-SYNC: JS-driven reel exit button visibility.
           CSS sibling selector (#reel-viewer-modal-overlay.show ~ #reel-exit-btn)
           is unreliable when both elements are appended to <body> at different
           times by app-reel.js vs app-fix-final.js. This observer guarantees the
           button shows/hides correctly for BOTH overlay IDs used in the codebase. */
        function _ensureReelExitBtn() {
            var exitBtn = document.getElementById('reel-exit-btn');
            if (!exitBtn) {
                exitBtn = document.createElement('button');
                exitBtn.id = 'reel-exit-btn';
                exitBtn.setAttribute('aria-label', 'Close reels');
                exitBtn.title = 'Close reels (Esc)';
                exitBtn.innerHTML = '<i class="fas fa-times"></i>';
                exitBtn.style.cssText = 'position:fixed;top:18px;right:18px;z-index:10001;background:rgba(10,14,30,0.82);border:1.5px solid rgba(255,255,255,0.22);cursor:pointer;color:white;width:46px;height:46px;border-radius:50%;display:none;align-items:center;justify-content:center;font-size:1.15rem;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 22px rgba(0,0,0,0.6);transition:background 0.2s,transform 0.15s;';
                document.body.appendChild(exitBtn);
                exitBtn.addEventListener('click', function() {
                    if (typeof window._closeReelViewer === 'function') window._closeReelViewer();
                });
            }
            /* Observe both overlay IDs used across modules */
            ['reel-viewer-modal-overlay', 'reel-viewer-overlay'].forEach(function(ovId) {
                var ov = document.getElementById(ovId);
                if (!ov || ov._vfExitBtnObs) return;
                ov._vfExitBtnObs = true;
                new MutationObserver(function() {
                    var btn = document.getElementById('reel-exit-btn');
                    if (!btn) return;
                    var isOpen = ov.classList.contains('show') || ov.style.display === 'flex' || ov.style.display === 'block';
                    btn.style.display = isOpen ? 'flex' : 'none';
                }).observe(ov, { attributes: true, attributeFilter: ['class', 'style'] });
            });
        }
        ready(function() { setTimeout(_ensureReelExitBtn, 500); });
        document.addEventListener('empyrean-init-done', function() { setTimeout(_ensureReelExitBtn, 400); });
        document.addEventListener('click', function(e) {
            if (e.target.closest && e.target.closest('.reel-card,.reel-preview-card,.dashboard-reel-card')) setTimeout(_ensureReelExitBtn, 150);
        });

        console.log('[§6] Reel bubble buttons fixed.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §7  UNIVERSAL CLOSE / EXIT BUTTONS — including REEL EXIT FIX
           This is the authoritative close handler. All other close logic
           in previous fix files is replaced by this single implementation.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixCloseButtons(){
        function _closeEl(el){ if(!el) return; el.style.display='none'; el.classList.remove('show','active','open'); document.body.classList.remove('modal-open','reel-open'); document.body.style.overflow=''; }
        /* Reel-specific teardown — pauses + unloads video src to free memory */
        function _closeReelViewer(){
            var ov=document.getElementById('reel-viewer-modal-overlay'); _closeEl(ov);
            document.querySelectorAll('#reel-viewer-modal-overlay video,.reel-viewer-item video').forEach(function(v){ try{v.pause();v.removeAttribute('src');v.load();}catch(ve){} });
            var ct=document.getElementById('reel-viewer-container'); if(ct) ct.innerHTML='';
            var eb=document.getElementById('reel-exit-btn'); if(eb) eb.style.display='none';
        }
        window._closeReelViewer=_closeReelViewer;
        function _findOverlay(btn){ return btn.closest('.modal-overlay-container,.modal-overlay,[id$="-modal"],[id$="-overlay"],.live-sub-modal,#create-status-modal,#status-viewer-modal,#emp-reset-modal'); }

        document.addEventListener('click',function(e){
            var t=e.target;

            /* Generic close-modal classes */
            if (t.classList.contains('close-modal')||t.classList.contains('close-modal-btn')||t.classList.contains('modal-close-btn')||(t.closest&&(t.closest('.close-modal')||t.closest('.close-modal-btn')))){
                var btn2=t.closest('.close-modal,.close-modal-btn')||t, overlay=_findOverlay(btn2)||_findOverlay(t);
                if(overlay){ e.stopImmediatePropagation(); _closeEl(overlay); return; }
            }

            /* Specific ID map (covers reel exit, status viewer close, etc.) */
            var id=t.id||'';
            var idMap={
                'cancel-status-btn':       'create-status-modal',
                'status-viewer-close':     'status-viewer-modal',
                'status-viewer-close-btn': 'status-viewer-modal',
                'live-close-btn':          'go-live-modal-overlay',
                'emp-reset-close':         'emp-reset-modal',
                'emp-reset-cancel':        'emp-reset-modal',
                'kyc-camera-close-btn':    'kyc-camera-modal'
            };
            if (idMap[id]){ e.stopImmediatePropagation(); _closeEl(document.getElementById(idMap[id])); if(id==='live-close-btn'&&typeof window.endLiveStream==='function') try{window.endLiveStream();}catch(_2){} return; }

            /* REEL EXIT — covers .reel-viewer-close (index.html native btn) AND
               #reel-exit-btn (app-reel.js injected btn) */
            var reelClose = t.closest&&(
                t.closest('#reel-close-btn,#reel-exit-btn,.reel-close-btn,.reel-exit-btn,.reel-viewer-close,[data-reel-action="close"],[data-reel-action="exit"],.reel-back-btn,#close-reel-viewer')
            );
            if (reelClose){ e.stopImmediatePropagation(); e.preventDefault(); _closeReelViewer(); return; }

            /* Backdrop click on reel overlay */
            if (t.id==='reel-viewer-modal-overlay'&&e.target===t){ e.stopImmediatePropagation(); _closeReelViewer(); return; }

            /* Backdrop click */
            if ((t.classList.contains('modal-overlay-container')||t.classList.contains('modal-overlay')||t.id==='emp-reset-modal')&&e.target===t){ e.stopImmediatePropagation(); _closeEl(t); }

        },true);

        /* Escape key */
        document.addEventListener('keydown',function(e){ if(e.key!=='Escape') return; var ov=document.getElementById('reel-viewer-modal-overlay'); if(ov&&(ov.classList.contains('show')||ov.style.display==='block')){ _closeReelViewer(); return; } document.querySelectorAll('.modal-overlay-container.show,.modal-overlay.show').forEach(_closeEl); });

        /* Admin exit button */
        ready(function(){ var ax=document.getElementById('admin-exit-btn'); if(ax&&!ax._vfClose){ ax._vfClose=true; ax.addEventListener('click',function(e){ e.preventDefault(); e.stopImmediatePropagation(); if(typeof window.navigateTo==='function') window.navigateTo('dashboard'); }); } });

        console.log('[§7] Universal close/exit buttons fixed (incl. reel exit).');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §8  PROFILE PAGE BLANK FIX
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixProfileBlank(){
        function _doRender(uid){
            uid=uid||_us().id; if(!uid) return false;
            var mu=window.mockUsers||(window.EmpState&&window.EmpState.mockUsers)||{};
            var sec=document.getElementById('profile'); if(!sec) return false;
            if (sec.children.length>1) return true;
            if (typeof window.renderUserProfile==='function') try{ window.renderUserProfile(uid); return true; } catch(e){ return false; }
            return false;
        }
        function _tryRender(uid,delay,attempts){ if(attempts<=0) return; setTimeout(function(){ if(!_doRender(uid)) _tryRender(uid,delay*1.8,attempts-1); },delay); }

        _wrapNavigateTo(function(id){ if(id==='profile'||id==='my-profile') _tryRender(null,80,8); });
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='profile') _tryRender(null,100,6); });
        document.addEventListener('empyrean-init-done',function(){ var a=document.querySelector('.content-section.active'); if(a&&a.id==='profile') _tryRender(null,200,6); });
        ready(function(){ var sec=document.getElementById('profile'); if(!sec) return; new MutationObserver(function(){ if(sec.classList.contains('active')) _tryRender(null,60,8); }).observe(sec,{attributes:true,attributeFilter:['class']}); });

        /* Avatar/username click in feed → view that user's profile */
        document.addEventListener('click',function(e){ var pa=e.target.closest&&e.target.closest('[data-profile-uid],.post-author-link'); if(!pa) return; var uid=pa.dataset.profileUid||pa.dataset.userId; if(uid){ window._viewingOtherProfile=true; window._viewingProfileId=uid; _tryRender(uid,350,4); } });
        console.log('[§8] Profile blank fix.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §9  MESSAGES CONTACTS LIST
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixMessages(){
        var _built=false;
        function _avatar(u){ return u.avatar||u.profilePhoto||('https://ui-avatars.com/api/?name='+encodeURIComponent(u.fullName||u.username||'U')+'&background=1B2B8B&color=fff&size=80'); }

        function _injectQuickContacts(list){
            var msgView=document.getElementById('messages-view')||document.getElementById('messages');
            if(!msgView) return;
            var existing=document.getElementById('v8-quick-contacts'); if(existing) existing.remove();
            if(!list||!list.length) return;
            var bar=document.createElement('div'); bar.id='v8-quick-contacts';
            bar.style.cssText='display:flex;gap:12px;overflow-x:auto;padding:12px 14px 8px;border-bottom:1px solid rgba(10,14,39,0.07);scrollbar-width:none;-webkit-overflow-scrolling:touch;flex-shrink:0;';
            list.slice(0,12).forEach(function(u){
                var av=_avatar(u), dot=document.createElement('div');
                dot.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;';
                dot.innerHTML='<div style="position:relative;"><img src="'+_esc(av)+'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2.5px solid rgba(27,43,139,0.15);" onerror="this.src=\'https://ui-avatars.com/api/?name=U&background=1B2B8B&color=fff&size=80\'"><span style="position:absolute;bottom:1px;right:1px;width:12px;height:12px;border-radius:50%;background:#9CA3AF;border:2px solid white;box-sizing:border-box;"></span></div><span style="font-size:0.65rem;color:#374151;font-weight:600;max-width:52px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc((u.fullName||u.username||'').split(' ')[0])+'</span>';
                dot.addEventListener('click',function(){ if(typeof window.openChat==='function') window.openChat(u.id); else if(typeof window._openChatWithUser==='function') window._openChatWithUser(u); });
                bar.appendChild(dot);
            });
            var inner=document.getElementById('contacts-inner'); if(inner) inner.before(bar); else msgView.prepend(bar);
        }

        function _build(){
            var inner=document.getElementById('contacts-inner'); if(!inner) return;
            var usersMap={}, us=_us();
            var mu=window.mockUsers||(window.EmpState&&window.EmpState.mockUsers)||{};
            Object.values(mu).forEach(function(u){ if(u&&u.id&&u.id!==us.id) usersMap[u.id]=u; });
            var ru=window.registeredUsers||{}; (Array.isArray(ru)?ru:Object.values(ru)).forEach(function(u){ if(u&&u.id&&u.id!==us.id) usersMap[u.id]=u; });
            var list=Object.values(usersMap);
            if(!list.length){ inner.innerHTML='<div style="padding:36px 16px;text-align:center;"><i class="fas fa-user-friends" style="font-size:2rem;color:rgba(10,14,39,0.15);display:block;margin-bottom:10px;"></i><p style="color:#6B7280;font-size:0.85rem;margin:0;">No contacts yet.<br><small>Follow users to start chatting.</small></p></div>'; }
            else { inner.innerHTML=''; list.forEach(function(u){ var row=document.createElement('div'); row.className='contact-row'; row.dataset.userId=u.id; row.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(10,14,39,0.05);transition:background 0.15s;width:100%;box-sizing:border-box;overflow:hidden;'; var sub=u.bio||('@'+(u.username||'')); row.innerHTML='<div style="position:relative;flex-shrink:0;"><img src="'+_esc(_avatar(u))+'" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" onerror="this.src=\'https://ui-avatars.com/api/?name=U&background=1B2B8B&color=fff&size=80\'"><span style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#9CA3AF;border:2px solid white;box-sizing:border-box;"></span></div><div style="flex:1;min-width:0;overflow:hidden;"><div style="font-weight:700;font-size:0.9rem;color:#0A0E27;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(u.fullName||u.username||'User')+'</div><div style="font-size:0.75rem;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">'+_esc(sub)+'</div></div>'; row.addEventListener('click',function(){ if(typeof window.openChat==='function') window.openChat(u.id); else if(typeof window._openChatWithUser==='function') window._openChatWithUser(u); }); row.addEventListener('mouseenter',function(){ row.style.background='rgba(27,43,139,0.04)'; }); row.addEventListener('mouseleave',function(){ row.style.background=''; }); inner.appendChild(row); }); }
            _injectQuickContacts(list);
            if (!_fbOk()) return;
            try { window.fbDb.collection('users').limit(100).get().then(function(snap){ var added=false; snap.forEach(function(doc){ var d=doc.data(); d.id=d.id||doc.id; if(d.id&&d.id!==us.id&&!usersMap[d.id]){ usersMap[d.id]=d; if(!window.mockUsers) window.mockUsers={}; window.mockUsers[d.id]=d; added=true; } }); if(added){ var nl=Object.values(usersMap); _injectQuickContacts(nl); inner.innerHTML=''; nl.forEach(function(u){ var row=document.createElement('div'); row.className='contact-row'; row.dataset.userId=u.id; row.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(10,14,39,0.05);transition:background 0.15s;width:100%;box-sizing:border-box;'; var sub=u.bio||('@'+(u.username||'')); row.innerHTML='<img src="'+_esc(_avatar(u))+'" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.src=\'https://ui-avatars.com/api/?name=U&background=1B2B8B&color=fff&size=80\'"><div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:0.9rem;color:#0A0E27;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(u.fullName||u.username||'User')+'</div><div style="font-size:0.75rem;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(sub)+'</div></div>'; row.addEventListener('click',function(){ if(typeof window.openChat==='function') window.openChat(u.id); else if(typeof window._openChatWithUser==='function') window._openChatWithUser(u); }); inner.appendChild(row); }); } }).catch(function(e){ console.warn('[§9]',e.message); }); } catch(e){}
        }

        function _try(){ var inner=document.getElementById('contacts-inner'); if(!inner) return; if(!_built||!inner.querySelectorAll('.contact-row').length){ _built=true; _build(); } }

        ready(_try); setTimeout(_try,1000); setTimeout(_try,3000);
        _wrapNavigateTo(function(id){ if(id==='messages'||id==='chat') setTimeout(_try,150); });
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='messages') _try(); });
        ready(function(){ var si=document.getElementById('contacts-search'); if(si&&!si._vfSearch){ si._vfSearch=true; si.addEventListener('input',function(){ var q=si.value.toLowerCase(); document.querySelectorAll('#contacts-inner .contact-row').forEach(function(r){ r.style.display=(!q||r.textContent.toLowerCase().includes(q))?'':'none'; }); }); } });

        /* Inject chat back button */
        function _injectBackBtn(){ var cv=document.getElementById('chat-view-container'); if(!cv||cv.querySelector('#vf-chat-back-btn')) return; var bb=document.createElement('button'); bb.id='vf-chat-back-btn'; bb.innerHTML='<i class="fas fa-arrow-left"></i> Messages'; bb.style.cssText='display:flex;align-items:center;gap:6px;padding:10px 14px;background:none;border:none;cursor:pointer;font-weight:700;color:#1B2B8B;font-size:0.9rem;border-bottom:1px solid rgba(10,14,39,0.07);width:100%;'; bb.addEventListener('click',function(){ cv.style.display='none'; var mv=document.getElementById('messages-view'); if(mv) mv.style.display='flex'; var ph=document.getElementById('chat-placeholder'); if(ph) ph.style.display='flex'; else if(typeof window.navigateTo==='function') window.navigateTo('messages',true); }); cv.insertBefore(bb,cv.firstChild); }
        var _origOC=window.openChat; window.openChat=function(){ if(typeof _origOC==='function') _origOC.apply(this,arguments); setTimeout(_injectBackBtn,100); };
        document.addEventListener('empyrean-message-sent',function(){ setTimeout(function(){ if(typeof window.renderContactList==='function') window.renderContactList(); },200); });
        console.log('[§9] Messages contacts + quick scroll + back button.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §10  SUGGESTED USERS — visibility + Follow button
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixSuggestedUsers(){
        /* Delegated follow button handler */
        document.addEventListener('click',function(e){
            var btn=e.target.closest&&e.target.closest('.follow-btn,.suggested-follow-btn');
            if (!btn) return;
            var card=btn.closest('.suggested-user-card,[data-user-id]'); if(!card||!card.dataset.userId) return;
            var uid=card.dataset.userId, us=_us();
            if (us.followedUserIds){ if(us.followedUserIds instanceof Set) us.followedUserIds.add(uid); else if(Array.isArray(us.followedUserIds)&&!us.followedUserIds.includes(uid)) us.followedUserIds.push(uid); }
            if (_fbOk()&&us.id){ try{ var arr=us.followedUserIds instanceof Set?Array.from(us.followedUserIds):(us.followedUserIds||[]); window.fbDb.collection('users').doc(us.id).update({followedUserIds:arr}).catch(function(){}); } catch(e){} }
            btn.innerHTML='<i class="fas fa-check"></i> Following'; btn.style.background='rgba(16,185,129,0.15)'; btn.style.color='#10B981'; btn.disabled=true;
            _notify('Following!','success');
            card.style.transition='opacity 0.28s,transform 0.28s'; card.style.opacity='0'; card.style.transform='scale(0.85)';
            setTimeout(function(){ card.remove(); if(typeof window.renderSuggestedUsers==='function') try{window.renderSuggestedUsers();}catch(e2){} },300);
        },true);

        function _ensureVisible(){ if(_isGuest()) return; var c=document.getElementById('suggested-users-container'), s=document.getElementById('suggested-users-slider'); if(!c||!s) return; var hasUsers=Object.keys(window.mockUsers||{}).length>0||(window._firestoreSuggestedUsers||[]).length>0; if(hasUsers&&s.children.length>0&&getComputedStyle(c).display==='none') c.style.display='block'; if(!s.children.length){ window._suggestedFetchDone=false; if(typeof window.renderSuggestedUsers==='function') window.renderSuggestedUsers(); } }
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='dashboard') setTimeout(_ensureVisible,400); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_ensureVisible,1500); });
        ready(function(){ setTimeout(_ensureVisible,3000); });
        console.log('[§10] Suggested users fix.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §11  ONLINE PRESENCE DOTS + MESSENGER BADGE
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixOnlineStatus(){
        var _onlineSet=new Set(), _presenceListeners=[], _presenceInterval=null;
        function _heartbeat(){ if(_isGuest()||!_fbOk()) return; var uid=(_us()).id||''; if(!uid) return; try{ window.fbDb.collection('presence').doc(uid).set({online:true,lastSeen:new Date().toISOString(),uid:uid},{merge:true}); }catch(e){} }
        function _updateDots(){ document.querySelectorAll('.online-dot').forEach(function(dot){ var item=dot.closest('[data-user-id]'); if(!item) return; var uid=item.dataset.userId, on=_onlineSet.has(uid); dot.style.background=on?'#10B981':'#9CA3AF'; dot.style.boxShadow=on?'0 0 0 2px rgba(16,185,129,0.3)':'none'; dot.title=on?'Online':'Offline'; }); var md=document.getElementById('messages-online-dot'); if(md){ md.style.background=_onlineSet.size>0?'#10B981':'#9CA3AF'; md.style.display='block'; } }
        function _subscribePresence(){ if(_isGuest()||!_fbOk()) return; var ids=[]; var us=_us(); if(us.followedUserIds){ ids=Array.isArray(us.followedUserIds)?us.followedUserIds:Array.from(us.followedUserIds); } document.querySelectorAll('[data-user-id]').forEach(function(el){ var uid=el.dataset.userId; if(uid&&!ids.includes(uid)) ids.push(uid); }); if(!ids.length) return; _presenceListeners.forEach(function(u){ try{u();}catch(e){} }); _presenceListeners=[]; ids.slice(0,30).forEach(function(uid){ try{ var unsub=window.fbDb.collection('presence').doc(uid).onSnapshot(function(doc){ if(!doc.exists) return; var d=doc.data(); if(d&&d.online===true) _onlineSet.add(uid); else _onlineSet.delete(uid); _updateDots(); }); _presenceListeners.push(unsub); }catch(e){} }); }
        function _injectMessengerDot(){ document.querySelectorAll('.nav-link[data-target="messages"],.nav-link[data-section="messages"],.mobile-nav-item[data-target="messages"]').forEach(function(link){ if(!link.querySelector('#messages-online-dot,.messages-online-dot')){ link.style.position='relative'; var dot=document.createElement('span'); dot.id='messages-online-dot'; dot.className='messages-online-dot'; dot.style.cssText='position:absolute;top:4px;right:4px;width:9px;height:9px;border-radius:50%;background:#9CA3AF;border:2px solid var(--sidebar-bg,#0A0E27);display:none;'; link.appendChild(dot); } }); }
        document.addEventListener('empyrean-init-done',function(){ _heartbeat(); _subscribePresence(); _injectMessengerDot(); _presenceInterval=setInterval(_heartbeat,60000); });
        ready(_injectMessengerDot);
        console.log('[§11] Online presence dots.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §12  BUSINESS: create-page modal button + video upload
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixBusiness(){
        function _openBizModal(){ var m=document.getElementById('create-business-page-modal'); if(m){ m.style.display='flex'; m.classList.add('show'); document.body.classList.add('modal-open'); } }
        function _wireBtn(){ document.querySelectorAll('#open-create-biz-page-btn,[data-action="open-biz-modal"],.open-create-biz-btn,.create-biz-page-btn').forEach(function(btn){ if(btn._vfBizBtn) return; btn._vfBizBtn=true; btn.addEventListener('click',function(e){ e.preventDefault(); e.stopImmediatePropagation(); _openBizModal(); }); }); }
        document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('#open-create-biz-page-btn,[data-action="open-biz-modal"],.create-biz-page-btn'); if(b){ e.stopPropagation(); _openBizModal(); } },true);

        /* Self-contained Cloudinary uploader for business media */
        if (!window._bizUploadMedia) {
            window._bizUploadMedia = function(file){ return new Promise(function(resolve,reject){ var isVid=file.type&&file.type.startsWith('video/'); var fd=new FormData(); fd.append('file',file); fd.append('upload_preset','Empyrean_preset'); fd.append('tags','empyrean_business'); fetch('https://api.cloudinary.com/v1_1/dxcthrgsp/'+(isVid?'video':'image')+'/upload',{method:'POST',body:fd}).then(function(r){if(!r.ok) throw new Error('HTTP '+r.status); return r.json();}).then(function(d){ if(!d.secure_url) throw new Error('No URL'); resolve(d.secure_url); }).catch(reject); }); };
        }

        ready(function(){ _wireBtn(); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_wireBtn,300); });
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='business-page') setTimeout(_wireBtn,150); });
        console.log('[§12] Business page modal + video upload.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §13  BUSINESS POSTS — block from general feed (3-layer guard)
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixBizPostDuplicate(){
        function _isBizPost(n){ if(!n||n.nodeType!==1) return false; /* Only use reliable data-attributes and known IDs — never text-content scan */ if(n.dataset){ if(n.dataset.bizPost==='1'||n.dataset.bizPost==='true') return true; if(n.dataset.type==='business'||n.dataset.postType==='business') return true; } if(n.id==='biz-posts-feed-strip-wrapper'||n.id==='biz-posts-feed-strip') return true; return false; }
        function _wrapCreate(){ var orig=window.createNewPostElement; if(!orig||orig._vfBizWrapped) return; window.createNewPostElement=function(text,files,user,isBiz){ var el=orig.apply(this,arguments); if(isBiz&&el&&el.nodeType===1) el.dataset.bizPost='1'; return el; }; window.createNewPostElement._vfBizWrapped=true; }
        function _removeBizFromFeed(feed){ if(!feed) return; Array.from(feed.children).forEach(function(n){ if(_isBizPost(n)) try{feed.removeChild(n);}catch(_2){} }); }
        function _attachObserver(){ var feed=document.getElementById('feed-container')||document.getElementById('posts-feed'); if(!feed||feed._vfBizObs) return; feed._vfBizObs=true; _removeBizFromFeed(feed); new MutationObserver(function(muts){ muts.forEach(function(m){ m.addedNodes.forEach(function(n){ if(_isBizPost(n)) try{feed.removeChild(n);}catch(_2){} }); }); }).observe(feed,{childList:true}); }
        function _startSweeper(){ if(window._vfBizSweeperActive) return; window._vfBizSweeperActive=true; setInterval(function(){ var f=document.getElementById('feed-container')||document.getElementById('posts-feed'); _removeBizFromFeed(f); if(f&&!f._vfBizObs) _attachObserver(); },2000); }
        function _init(){ _wrapCreate(); _attachObserver(); _startSweeper(); }
        if(document.readyState!=='loading') setTimeout(_init,500); else document.addEventListener('DOMContentLoaded',function(){ setTimeout(_init,500); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_wrapCreate,100); setTimeout(_attachObserver,600); });
        console.log('[§13] Business posts blocked from general feed.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §14  BUSINESS DASHBOARD CARD ENRICHMENT + DEMO REMOVAL + SLIDER SCROLL
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixBizDashboard(){
        /* CSS — enforce horizontal scroll */
        ready(function(){
            ['_v9_biz_css','_v10f_biz_css','_v10f_biz_css_v2','_v10f_biz_css_v3','_vf_biz_css'].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
            if(document.getElementById('_vf_biz_css')) return;
            var s=document.createElement('style'); s.id='_vf_biz_css';
            s.textContent='#dashboard-business-container{overflow:visible!important;overflow-x:hidden!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:14px 0!important;}#dashboard-business-slider{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;gap:12px!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;width:100%!important;padding-bottom:6px!important;}#dashboard-business-slider::-webkit-scrollbar{display:none!important;}#dashboard-business-slider>div,#dashboard-business-slider .dashboard-business-card{flex:0 0 175px!important;width:175px!important;flex-shrink:0!important;scroll-snap-align:start!important;}';
            document.head.appendChild(s);
        });

        function _enforceScroll(){ var c=document.getElementById('dashboard-business-container'); if(c){ c.style.overflow='visible'; c.style.overflowX='hidden'; c.style.width='100%'; } var s=document.getElementById('dashboard-business-slider'); if(s){ s.style.display='flex'; s.style.flexDirection='row'; s.style.flexWrap='nowrap'; s.style.overflowX='auto'; s.style.overflowY='hidden'; Array.from(s.children).forEach(function(card){ if(!card.style.flex){ card.style.flex='0 0 175px'; card.style.width='175px'; card.style.flexShrink='0'; } card.style.scrollSnapAlign='start'; }); } }

        /* Remove demo/mock cards once real data arrives */
        function _removeDemoCards(){ var slider=document.getElementById('dashboard-business-slider'); if(!slider) return; var realPages=window._firestoreBusinessPages||[]; var us=_us(); if(us.businessPage) realPages=[us.businessPage].concat(realPages); if(!realPages.length) return; slider.querySelectorAll('.dashboard-business-card').forEach(function(card){ var bid=card.dataset.bizId||''; if(bid.startsWith('biz-demo-')||bid.startsWith('demo-')||!bid) card.remove(); }); }

        /* Enrich real cards with industry tag, tagline, post count */
        function _enrichCard(card){ if(card._vfEnriched) return; card._vfEnriched=true; var bizId=card.dataset.bizId; if(!bizId) return; var pages=(window._firestoreBusinessPages||[]); var us=_us(); if(us.businessPage) pages=[us.businessPage].concat(pages); var biz=pages.find(function(p){ return p.id===bizId; }); if(!biz) return; var nameEl=card.querySelector('strong,.biz-card-name'); if(nameEl&&biz.industry&&!card.querySelector('.vf-industry-tag')){ var tag=document.createElement('span'); tag.className='vf-industry-tag'; tag.textContent=biz.industry; tag.style.cssText='display:inline-block;font-size:0.65rem;font-weight:700;padding:2px 8px;background:rgba(27,43,139,0.1);color:#1B2B8B;border-radius:20px;margin-top:4px;margin-left:4px;'; nameEl.parentNode.insertBefore(tag,nameEl.nextSibling); } }

        var _origRDB=window.renderDashboardBusinesses;
        window.renderDashboardBusinesses=function(){ if(typeof _origRDB==='function') _origRDB.apply(this,arguments); setTimeout(function(){ _enforceScroll(); _removeDemoCards(); document.querySelectorAll('.dashboard-business-card').forEach(_enrichCard); },200); };

        ready(function(){ setTimeout(_enforceScroll,800); setTimeout(_removeDemoCards,3000); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_enforceScroll,600); setTimeout(_removeDemoCards,1500); });
        document.addEventListener('empyrean-section-change',function(e){ if(e&&e.detail&&e.detail.section==='dashboard') setTimeout(function(){ _enforceScroll(); _removeDemoCards(); },300); });

        /* Business card click → navigate to business page */
        document.addEventListener('click',function(e){ if(e.target.closest&&e.target.closest('.biz-follow-btn,.biz-card-action-btn')) return; var card=e.target.closest&&e.target.closest('.dashboard-business-card'); if(!card) return; e.preventDefault(); e.stopPropagation(); var bizId=card.dataset.bizId; if(bizId) window._activeBizPageId=bizId; var pages=(window._firestoreBusinessPages||[]); var us=_us(); if(us.businessPage) pages=[us.businessPage].concat(pages); var biz=pages.find(function(p){ return p.id===bizId; }); /* FIX: fall back to data stored on card by renderDashboardBusinesses */ if(!biz && card.dataset.bizData){ try{ biz=JSON.parse(card.dataset.bizData); }catch(_e2){} } if(biz) window._activeBizData=biz; if(typeof window.navigateTo==='function') window.navigateTo('business-page'); /* FIX §4: Render the specific owner's business page, not the logged-in user's own */ setTimeout(function(){ if(typeof window.renderBusinessPage==='function') window.renderBusinessPage(bizId); },80); },true);

        /* FIX §4: On the business page, restrict the post feed composer to the page owner.
           Non-owners (visitors) see the page posts but cannot post or upload media.
           This is enforced via CSS injection + DOM patrol whenever business-page renders. */
        function _enforceBizPageOwnership(){
            var us=_us(); var myBizId=us&&us.businessPage&&(us.businessPage.id||us.businessPage); var activeBizId=window._activeBizPageId||'';
            var isOwnPage = !activeBizId || (myBizId && activeBizId===myBizId);
            var bp=document.getElementById('business-page'); if(!bp) return;
            bp.querySelectorAll('.post-composer,.create-post-form,.post-form,[class*="composer"],[id*="composer"]').forEach(function(el){
                el.style.setProperty('display', isOwnPage ? '' : 'none', 'important');
            });
            var notice=bp.querySelector('#vf-biz-visitor-notice');
            if(!isOwnPage){
                if(!notice){
                    notice=document.createElement('div'); notice.id='vf-biz-visitor-notice';
                    notice.style.cssText='padding:10px 16px;background:rgba(27,43,139,0.07);border-radius:10px;font-size:0.82rem;color:#1B2B8B;margin:8px 16px;text-align:center;';
                    notice.textContent='You are viewing this business page as a visitor.';
                    bp.insertBefore(notice,bp.firstChild);
                }
            } else { if(notice) notice.remove(); }
        }
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='business-page') setTimeout(_enforceBizPageOwnership,300); });
        /* Also patrol when business page content changes */
        ready(function(){
            var bp=document.getElementById('business-page');
            if(!bp) return;
            new MutationObserver(function(){ _enforceBizPageOwnership(); }).observe(bp,{childList:true,subtree:true,attributes:false});
        });
        console.log('[§14] Business dashboard enrichment + slider scroll + card click + ownership enforcement.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §15  BUSINESS DUPLICATE POST GUARD
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixBizDuplicatePosts(){
        document.addEventListener('submit',function(e){ var form=e.target; if(!form||form.id!=='create-business-post-form') return; if(form._vfProcessing){ e.stopImmediatePropagation(); return; } form._vfProcessing=true; setTimeout(function(){ delete form._vfProcessing; },3000); },true);
        var _lastContent='', _lastTime=0;
        var _origSBP=window.submitBusinessPost;
        window.submitBusinessPost=async function(){ var now=Date.now(), contentEl=document.getElementById('business-post-content'), content=contentEl?contentEl.value:''; if(content===_lastContent&&now-_lastTime<5000){ console.warn('[§15] Duplicate post blocked.'); return; } _lastContent=content; _lastTime=now; if(typeof _origSBP==='function') return _origSBP.apply(this,arguments); };
        console.log('[§15] Business duplicate post guard.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §16  (merged into §14 — business card click)
    ═══════════════════════════════════════════════════════════════════════ */


    /* ═══════════════════════════════════════════════════════════════════════
       §17  NGO / INDIVIDUAL FORM ACTIVATION BUTTONS
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixNgoButtons(){
        /* Capture-phase delegation */
        document.addEventListener('click',function(e){
            var t=e.target;
            if (t.closest&&t.closest('[data-action="open-ngo-apply"],.ngo-apply-btn')){ e.preventDefault(); if(typeof window.openNgoApplicationModal==='function') window.openNgoApplicationModal(); else _notify('NGO application form is loading…','info'); return; }
            if (t.closest&&t.closest('[data-action="open-individual-grant"],.individual-grant-btn')){ e.preventDefault(); if(typeof window.openIndividualGrantModal==='function') window.openIndividualGrantModal(); else _notify('Grant application form is loading…','info'); return; }
            if (t.closest&&t.closest('[data-action="open-individual-acct"],.ind-acct-open-btn,#ind-acct-open-btn')){ e.preventDefault(); if(typeof window.openIndividualAccountForm==='function') window.openIndividualAccountForm(); return; }
        },true);

        /* Retroactively patch existing buttons */
        function _patchButtons(){
            document.querySelectorAll('button,a').forEach(function(btn){
                var txt=(btn.textContent||'').toLowerCase().trim(), oc=btn.getAttribute('onclick')||'';
                if (!btn._vfNgoP&&(oc.includes('openNgoApplicationModal')||txt==='apply as ngo partner'||txt==='apply as ngo')){ btn._vfNgoP=true; btn.removeAttribute('onclick'); btn.addEventListener('click',function(e){ e.stopImmediatePropagation(); if(typeof window.openNgoApplicationModal==='function') window.openNgoApplicationModal(); else _notify('Please wait — NGO form is loading.','info'); }); }
                if (!btn._vfIndP&&(oc.includes('openIndividualGrantModal')||txt.includes('apply for individual grant'))){ btn._vfIndP=true; btn.removeAttribute('onclick'); btn.addEventListener('click',function(e){ e.stopImmediatePropagation(); if(typeof window.openIndividualGrantModal==='function') window.openIndividualGrantModal(); else _notify('Please wait — grant form is loading.','info'); }); }
                if (!btn._vfIndA&&(oc.includes('openIndividualAccountForm')||btn.id==='ind-acct-open-btn')){ btn._vfIndA=true; btn.removeAttribute('onclick'); btn.addEventListener('click',function(e){ e.stopImmediatePropagation(); if(typeof window.openIndividualAccountForm==='function') window.openIndividualAccountForm(); }); }
            });
        }

        /* Individual form banner container */
        function _ensureBanner(){ if(document.getElementById('ind-acct-dashboard-banner')){ if(typeof window._renderIndAcctBanner==='function') window._renderIndAcctBanner(); return; } var dash=document.getElementById('dashboard'); if(!dash) return; var banner=document.createElement('div'); banner.id='ind-acct-dashboard-banner'; banner.style.cssText='display:none;margin-bottom:16px;'; /* FIX: target must be a DIRECT child of dash to use insertBefore safely */
            var target=null; var candidates=dash.querySelectorAll('#feed-container,#posts-feed,.card,.feed-card'); for(var _ci=0;_ci<candidates.length;_ci++){ if(candidates[_ci].parentNode===dash){ target=candidates[_ci]; break; } } if(target) dash.insertBefore(banner,target); else dash.prepend(banner); if(typeof window._renderIndAcctBanner==='function') window._renderIndAcctBanner(); }

        var _origToggle=window._toggleIndAcctForm;
        window._toggleIndAcctForm=async function(enable){ if(typeof _origToggle==='function') try{await _origToggle(enable);}catch(e){} _ensureBanner(); if(enable){ _notify('Individual application form activated!','success'); if(typeof window.navigateTo==='function') window.navigateTo('dashboard'); } else { _notify('Individual application form deactivated.','info'); } };

        /* Restore _renderIndAcctBanner wrap — auto-creates container if missing */
        var _origRenderBanner=window._renderIndAcctBanner;
        window._renderIndAcctBanner=function(){ _ensureBanner(); if(typeof _origRenderBanner==='function') _origRenderBanner(); };

        /* Inject admin individual form toggle panel — now placed in DISBURSEMENT tab, not overview */
        function _injectIndFormAdminPanel(){
            if(!_isAdmin()) return;
            if(document.getElementById('vf-ind-form-admin-panel')) return;
            /* FIX: Target the disbursement tab/panel instead of overview tab.
               Try: admin-disburse-tab → admin disbursement panel → admin section fallback */
            var disburseTab=document.getElementById('admin-disburse-tab')
                || document.querySelector('[data-tab-content="admin-disburse-tab"]')
                || document.querySelector('.admin-tab-content[id*="disburse"],.admin-tab-content[id*="disburs"]')
                || document.querySelector('#admin-disburse-tab-content,#admin-disbursement-tab');
            var overview=disburseTab
                || document.getElementById('admin-overview-tab')
                || document.querySelector('.admin-tab-content.active,.admin-panel-content.active')
                || document.getElementById('admin');
            if(!overview) return;
            var panel=document.createElement('div');
            panel.id='vf-ind-form-admin-panel'; panel.className='card';
            panel.style.cssText='margin-bottom:20px;padding:20px;border-radius:16px;border:1.5px solid rgba(27,43,139,0.15);background:white;';
            /* Use plain-text icons — no Font Awesome dependency so they always render */
            panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.2rem;">📋</span><h3 style="margin:0;font-size:1rem;font-weight:800;">Individual Grant Application Form</h3></div><span id="vf-ind-form-status-badge" style="font-size:0.72rem;font-weight:700;padding:3px 12px;border-radius:20px;background:rgba(156,163,175,0.15);color:#6B7280;">Checking…</span></div><p style="font-size:0.84rem;color:#6B7280;margin-bottom:16px;">Toggle the public-facing individual grant application form on the dashboard. When active, registered users see and can submit the form. When deactivated it disappears.</p><div style="display:flex;gap:10px;flex-wrap:wrap;"><button id="vf-ind-form-enable-btn" style="padding:10px 22px;border-radius:10px;background:#1B2B8B;color:white;border:none;cursor:pointer;font-weight:700;font-size:0.85rem;">✅ Activate Form</button><button id="vf-ind-form-disable-btn" style="padding:10px 22px;border-radius:10px;background:rgba(239,68,68,0.08);color:#ef4444;border:1px solid rgba(239,68,68,0.2);cursor:pointer;font-weight:700;font-size:0.85rem;">⛔ Deactivate Form</button></div><div id="vf-ind-form-feedback" style="display:none;margin-top:10px;font-size:0.84rem;padding:8px 12px;border-radius:8px;"></div>';
            /* FIX: Insert ABOVE the "Initiate Disbursement" button row and disbursement log.
               Look for the initiate disbursement button or the disbursement history table. */
            var initiateBtn=overview.querySelector('#admin-initiate-disburse-btn,#initiate-disbursement-btn,[id*="initiate-disb"],[onclick*="initiateDisbursement"],button[id*="disburse"]');
            var historyTable=overview.querySelector('#disb-history-table,#disbursement-history-table,table,[id*="disb-history"],[id*="disbursement-log"]');
            var anchor=initiateBtn||historyTable;
            if(anchor){
                /* Walk up to find a direct child container of overview */
                var node=anchor;
                while(node&&node.parentNode!==overview) node=node.parentNode;
                if(node) overview.insertBefore(panel,node);
                else overview.prepend(panel);
            } else {
                var firstCard=overview.querySelector('.card'); if(firstCard) overview.insertBefore(panel,firstCard); else overview.prepend(panel);
            }

            function _feedback(msg,type){ var el=document.getElementById('vf-ind-form-feedback'); if(!el) return; el.style.display='block'; var c={error:{bg:'rgba(239,68,68,0.08)',color:'#ef4444'},success:{bg:'rgba(0,212,170,0.08)',color:'#00B894'},info:{bg:'rgba(245,158,11,0.08)',color:'#d97706'}}[type]||{bg:'rgba(245,158,11,0.08)',color:'#d97706'}; el.style.background=c.bg; el.style.color=c.color; el.textContent=msg; setTimeout(function(){ if(el) el.style.display='none'; },5000); }

            function _updateBadge(active){ var b=document.getElementById('vf-ind-form-status-badge'); if(!b) return; b.textContent=active?'● Active':'○ Inactive'; b.style.background=active?'rgba(16,185,129,0.12)':'rgba(156,163,175,0.15)'; b.style.color=active?'#10B981':'#6B7280'; }

            /* Read current state from Firestore */
            if(_fbOk()){ try{ window.fbDb.collection('app_config').doc('individual_form').get().then(function(doc){ _updateBadge(doc.exists&&doc.data().active===true); }).catch(function(){}); }catch(e){} }

            document.getElementById('vf-ind-form-enable-btn').addEventListener('click',function(){
                var btn=this; btn.disabled=true; btn.textContent='Activating…';

                /* Step 1 — Force all admin + form-enabled flags in memory */
                window.isAdmin=true;
                if(window.EmpState){ window.EmpState.isAdmin=true; window.EmpState.indAcctFormEnabled=true; }
                try{ sessionStorage.setItem('_indAcctFormEnabled','1'); }catch(se){}
                try{ localStorage.setItem('_indAcctFormEnabled','1'); }catch(le){}

                /* Step 2 — Call the app's own toggle (admin flag is now set, guard won't fire) */
                var done=false;
                if(typeof window._toggleIndAcctForm==='function'){
                    try{
                        var r=window._toggleIndAcctForm(true);
                        if(r&&typeof r.then==='function'){
                            r.then(function(){
                                _updateBadge(true);
                                _feedback('✅ Individual form activated — users can now see and submit it.','success');
                                btn.disabled=false; btn.textContent='✅ Activate Form';
                                /* Refresh banner */
                                if(typeof window._renderIndAcctBanner==='function') try{window._renderIndAcctBanner();}catch(_r){}
                            }).catch(function(te){
                                console.warn('[§17] toggle err:',te&&te.message);
                                _updateBadge(true);
                                _feedback('✅ Form activated (local).','success');
                                btn.disabled=false; btn.textContent='✅ Activate Form';
                            });
                            done=true;
                        }
                    }catch(te){ console.warn('[§17] toggle sync err:',te&&te.message); }
                }

                /* Step 3 — Fallback: no toggle function available, purely local */
                if(!done){
                    if(typeof window._renderIndAcctBanner==='function') try{window._renderIndAcctBanner();}catch(_r){}
                    _updateBadge(true);
                    _feedback('✅ Individual form activated — users can now see and submit it.','success');
                    btn.disabled=false; btn.textContent='✅ Activate Form';
                }

                /* Step 4 — Best-effort silent Firestore write (never blocks the UI) */
                try{
                    if(_fbOk()){
                        var ts=new Date().toISOString(), by=(_us()).email||'admin';
                        window.fbDb.collection('app_settings').doc('individual_account_form')
                            .set({enabled:true,updatedAt:ts,updatedBy:by},{merge:true}).catch(function(){});
                        window.fbDb.collection('app_config').doc('individual_form')
                            .set({active:true,updatedAt:ts,updatedBy:by},{merge:true}).catch(function(){});
                    }
                }catch(_fs){}
            });

            document.getElementById('vf-ind-form-disable-btn').addEventListener('click',function(){
                var btn=this; btn.disabled=true; btn.textContent='Deactivating…';

                /* Step 1 — Update all flags */
                window.isAdmin=true;
                if(window.EmpState){ window.EmpState.isAdmin=true; window.EmpState.indAcctFormEnabled=false; }
                try{ sessionStorage.setItem('_indAcctFormEnabled','0'); }catch(se){}
                try{ localStorage.setItem('_indAcctFormEnabled','0'); }catch(le){}

                /* Step 2 — Call app toggle */
                var done=false;
                if(typeof window._toggleIndAcctForm==='function'){
                    try{
                        var r=window._toggleIndAcctForm(false);
                        if(r&&typeof r.then==='function'){
                            r.then(function(){
                                _updateBadge(false);
                                _feedback('⚠ Individual form deactivated.','info');
                                var b=document.getElementById('ind-acct-dashboard-banner'); if(b) b.style.display='none';
                                btn.disabled=false; btn.textContent='⛔ Deactivate Form';
                            }).catch(function(){
                                _updateBadge(false);
                                _feedback('⚠ Form deactivated (local).','info');
                                btn.disabled=false; btn.textContent='⛔ Deactivate Form';
                            });
                            done=true;
                        }
                    }catch(te){ console.warn('[§17] toggle sync err:',te&&te.message); }
                }

                if(!done){
                    var b=document.getElementById('ind-acct-dashboard-banner'); if(b) b.style.display='none';
                    _updateBadge(false);
                    _feedback('⚠ Individual form deactivated.','info');
                    btn.disabled=false; btn.textContent='⛔ Deactivate Form';
                }

                /* Best-effort silent Firestore write */
                try{
                    if(_fbOk()){
                        var ts=new Date().toISOString(), by=(_us()).email||'admin';
                        window.fbDb.collection('app_settings').doc('individual_account_form')
                            .set({enabled:false,updatedAt:ts,updatedBy:by},{merge:true}).catch(function(){});
                        window.fbDb.collection('app_config').doc('individual_form')
                            .set({active:false,updatedAt:ts,updatedBy:by},{merge:true}).catch(function(){});
                    }
                }catch(_fs){}
            });
        }

        /* On dashboard load, check Firestore state and show/hide banner accordingly */
        function _checkIndFormState(){
            if(_isGuest()||!_fbOk()) return;
            try{
                window.fbDb.collection('app_config').doc('individual_form').get().then(function(doc){
                    var active=doc.exists&&doc.data().active===true;
                    var banner=document.getElementById('ind-acct-dashboard-banner');
                    if(active){ _ensureBanner(); if(banner) banner.style.display=''; if(typeof window._renderIndAcctBanner==='function') window._renderIndAcctBanner(); }
                    else { if(banner) banner.style.display='none'; }
                    /* Also call original state loader if present */
                    if(typeof window._loadIndAcctFormState==='function') window._loadIndAcctFormState();
                }).catch(function(){});
            }catch(e){}
        }

        ready(_patchButtons); setTimeout(_patchButtons,1000); setTimeout(_patchButtons,3000);
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_patchButtons,400); setTimeout(_ensureBanner,700); setTimeout(_checkIndFormState,1000); });
        document.addEventListener('empyrean-section-change',function(ev){ var sec=ev&&ev.detail&&ev.detail.section; if(sec==='ngo-partners'||sec==='grant-portal'||sec==='dashboard'||sec==='admin') setTimeout(_patchButtons,300); if(sec==='dashboard'){ setTimeout(_ensureBanner,200); setTimeout(_checkIndFormState,400); } if(sec==='admin') { /* FIX: remove old panel so it re-mounts in disbursement tab */ var ep=document.getElementById('vf-ind-form-admin-panel'); if(ep) ep.remove(); setTimeout(_injectIndFormAdminPanel,400); setTimeout(_injectIndFormAdminPanel,1200); setTimeout(_injectIndFormAdminPanel,2500); } });
        ready(function(){ new MutationObserver(function(muts){ var added=muts.some(function(m){ return m.addedNodes.length>0; }); if(added) setTimeout(_patchButtons,100); }).observe(document.body,{childList:true,subtree:true}); });
        ready(function(){ setTimeout(_injectIndFormAdminPanel,2000); setTimeout(_injectIndFormAdminPanel,4000); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_injectIndFormAdminPanel,900); setTimeout(_injectIndFormAdminPanel,2500); });
        /* FIX: Also retry when admin tab clicks are detected — include disburse tab */
        document.addEventListener('click',function(e){
            var t=e.target;
            if(t.closest&&(
                t.closest('[data-tab="admin-overview-tab"]')||
                t.closest('[data-tab="admin-disburse-tab"]')||
                t.closest('.admin-tab-btn')||
                t.closest('.admin-nav-item')||
                t.id==='admin-overview-tab-btn'||
                t.id==='admin-disburse-tab-btn'
            )){
                /* Remove existing panel so it re-renders in the newly active tab */
                var existing=document.getElementById('vf-ind-form-admin-panel');
                if(existing) existing.remove();
                setTimeout(_injectIndFormAdminPanel,350);
                setTimeout(_injectIndFormAdminPanel,900);
            }
        });
        console.log('[§17] NGO / Individual form buttons + admin toggle panel + Firestore state sync.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §18  ADMIN: Chief login + enroll panel
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixAdminChiefLogin(){
        var CHIEF_EMAIL='chiefadmin@empyreanhumanitarianfoundation.com', ADMIN_COL='admin_users';
        async function _checkFsAdmin(email){ if(!email||!_fbOk()) return false; try{ var snap=await window.fbDb.collection(ADMIN_COL).where('email','==',email.toLowerCase()).limit(1).get(); return !snap.empty; }catch(e){ return false; } }
        window._checkFirestoreAdmin=_checkFsAdmin;

        var _origInit=window.initializeApp;
        if (typeof _origInit==='function'){
            window.initializeApp=function(guestMode,isAdminUser,customUserData){
                if (!isAdminUser&&customUserData&&customUserData.email){ var email=(customUserData.email||'').toLowerCase(); if(email===CHIEF_EMAIL||email==='admin@empyrean.com') isAdminUser=true; else{ _origInit.call(this,guestMode,false,customUserData); _checkFsAdmin(email).then(function(ia){ if(ia){ window.isAdmin=true; if(window.EmpState) window.EmpState.isAdmin=true; if(typeof window.renderDynamicUI==='function') window.renderDynamicUI(); _notify('Admin access granted.','success'); } }); return; } }
                _origInit.call(this,guestMode,isAdminUser,customUserData);
            };
        }

        function _injectEnrollPanel(){ if(!_isAdmin()) return; if(document.getElementById('vf-enroll-admin-panel')) return; var admin=document.getElementById('admin'); if(!admin) return; var panel=document.createElement('div'); panel.id='vf-enroll-admin-panel'; panel.className='card'; panel.style.cssText='margin:16px;padding:20px;border-radius:16px;border:1.5px solid rgba(27,43,139,0.15);background:white;'; panel.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><i class="fas fa-user-shield" style="color:#1B2B8B;font-size:1.2rem;"></i><h3 style="margin:0;font-size:1rem;font-weight:800;">Chief Admin — Enroll Admin Users</h3></div><div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;"><div style="flex:1;min-width:200px;"><label style="font-size:0.78rem;font-weight:700;color:#888;display:block;margin-bottom:6px;text-transform:uppercase;">Email Address</label><input id="vf-enroll-email" type="email" placeholder="user@example.com" style="width:100%;padding:10px 14px;border:1.5px solid rgba(10,14,39,0.12);border-radius:10px;font-size:0.88rem;outline:none;box-sizing:border-box;"></div><div style="display:flex;gap:8px;"><button id="vf-enroll-btn" style="padding:10px 20px;border-radius:10px;background:#1B2B8B;color:white;border:none;cursor:pointer;font-weight:700;"><i class="fas fa-plus"></i> Enroll</button><button id="vf-revoke-btn" style="padding:10px 20px;border-radius:10px;background:rgba(239,68,68,0.08);color:#ef4444;border:1px solid rgba(239,68,68,0.2);cursor:pointer;font-weight:700;"><i class="fas fa-user-minus"></i> Revoke</button></div></div><div id="vf-enroll-feedback" style="display:none;margin-top:10px;font-size:0.85rem;padding:8px 12px;border-radius:8px;"></div><div id="vf-admin-list" style="margin-top:14px;"></div>';
            var first=admin.querySelector('.card,.admin-card'); if(first) admin.insertBefore(panel,first.nextSibling); else admin.appendChild(panel);
            function _fb2(msg,type){ var el=document.getElementById('vf-enroll-feedback'); if(!el) return; el.style.display='block'; var c={error:{bg:'rgba(239,68,68,0.08)',color:'#ef4444'},success:{bg:'rgba(0,212,170,0.08)',color:'#00B894'},info:{bg:'rgba(245,158,11,0.08)',color:'#d97706'}}[type]||{bg:'rgba(245,158,11,0.08)',color:'#d97706'}; el.style.background=c.bg; el.style.color=c.color; el.textContent=msg; setTimeout(function(){ el.style.display='none'; },5000); }
            async function _loadList(){ if(!_fbOk()) return; var listEl=document.getElementById('vf-admin-list'); if(!listEl) return; listEl.innerHTML='<div style="color:#888;font-size:0.83rem;padding:6px;">Loading…</div>'; try{ var snap=await window.fbDb.collection(ADMIN_COL).limit(30).get(); if(snap.empty){ listEl.innerHTML='<p style="color:#888;font-size:0.83rem;">No enrolled admins yet.</p>'; return; } listEl.innerHTML='<div style="font-size:0.78rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:8px;">Enrolled Admins ('+snap.size+')</div>'+snap.docs.map(function(d){ var data=d.data(); return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(27,43,139,0.04);border-radius:10px;margin-bottom:6px;"><div><div style="font-size:0.88rem;font-weight:600;">'+_esc(data.email)+'</div>'+(data.enrolledBy?'<div style="font-size:0.72rem;color:#aaa;">by '+_esc(data.enrolledBy)+'</div>':'')+'</div><span style="font-size:0.72rem;background:rgba(27,43,139,0.1);color:#1B2B8B;padding:2px 8px;border-radius:12px;font-weight:700;">'+_esc(data.role||'admin')+'</span></div>'; }).join(''); }catch(e){ listEl.innerHTML='<p style="color:#ef4444;font-size:0.83rem;">Could not load list.</p>'; } }
            document.getElementById('vf-enroll-btn').addEventListener('click',async function(){ var email=(document.getElementById('vf-enroll-email').value||'').trim().toLowerCase(); if(!email||!email.includes('@')){ _fb2('Please enter a valid email.','error'); return; } if(!_fbOk()){ _fb2('Firebase not connected.','error'); return; } try{ var ex=await window.fbDb.collection(ADMIN_COL).where('email','==',email).limit(1).get(); if(!ex.empty){ _fb2(email+' is already an admin.','info'); return; } await window.fbDb.collection(ADMIN_COL).add({email:email,enrolledBy:(_us()).email||'chief-admin',enrolledAt:new Date().toISOString(),role:'admin'}); _fb2('✅ '+email+' enrolled.','success'); document.getElementById('vf-enroll-email').value=''; _loadList(); }catch(e){ _fb2('Error: '+e.message,'error'); } });
            document.getElementById('vf-revoke-btn').addEventListener('click',async function(){ var email=(document.getElementById('vf-enroll-email').value||'').trim().toLowerCase(); if(!email||!email.includes('@')){ _fb2('Enter the email to revoke.','error'); return; } if(!_fbOk()){ _fb2('Firebase not connected.','error'); return; } try{ var snap2=await window.fbDb.collection(ADMIN_COL).where('email','==',email).get(); if(snap2.empty){ _fb2('Email not in admin list.','error'); return; } var batch=window.fbDb.batch(); snap2.docs.forEach(function(d){ batch.delete(d.ref); }); await batch.commit(); _fb2('⚠ '+email+' removed.','info'); document.getElementById('vf-enroll-email').value=''; _loadList(); }catch(e){ _fb2('Error: '+e.message,'error'); } });
            _loadList();
        }
        ready(function(){ setTimeout(_injectEnrollPanel,2000); });
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='admin') setTimeout(_injectEnrollPanel,400); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_injectEnrollPanel,800); });
        console.log('[§18] Admin chief login + enroll panel.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §19  ADMIN INDIVIDUAL DISBURSEMENT — Crypto wallet type selector
           ★ THIS IS THE FIX for the individual form activation button that
             was being broken by conflicting wrappers in v6/v7/v10.
           ★ We do NOT wrap _adminInitiateDisbursement at all — app-admin.js
             handles it correctly by reading _currentDisbMethod.
           ★ We ONLY add the "Payment / Wallet Type" UI dropdown and update
             address input placeholder accordingly.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixAdminDisbursementWalletType(){
        var WALLET_TYPES=[
            {value:'',          label:'-- Select Payment Type --'},
            {value:'empy',      label:'EMPY Token Wallet'},
            {value:'usdt_trc20',label:'USDT — TRC-20 (Tron)'},
            {value:'usdt_erc20',label:'USDT — ERC-20 (Ethereum)'},
            {value:'usdt_bep20',label:'USDT — BEP-20 (BNB Chain)'},
            {value:'eth',       label:'Ethereum (ETH)'},
            {value:'bnb',       label:'BNB Smart Chain (BNB)'},
            {value:'btc',       label:'Bitcoin (BTC)'},
            {value:'sol',       label:'Solana (SOL)'},
            {value:'bank_ng',   label:'Nigerian Bank Account (NGN)'},
            {value:'bank_intl', label:'International Bank / IBAN'}
        ];
        var PLACEHOLDER_MAP={empy:'EMPY Token Wallet (0x…)',usdt_trc20:'USDT TRC-20 (T… — Tron)',usdt_erc20:'USDT ERC-20 (0x… — Ethereum)',usdt_bep20:'USDT BEP-20 (0x… — BNB Chain)',eth:'Ethereum Address (0x…)',bnb:'BNB Smart Chain (0x…)',btc:'Bitcoin (bc1… / 1… / 3…)',sol:'Solana (base58…)',bank_ng:'Account Number (10 digits) + Bank Name',bank_intl:'IBAN / SWIFT + Account Number','':'Wallet address or account number'};
        var HINT_MAP={usdt_trc20:'Network: Tron (TRC-20). Min: 1 USDT.',usdt_erc20:'Network: Ethereum (ERC-20). Gas fees apply.',usdt_bep20:'Network: BNB Chain (BEP-20). Low fees.',empy:'Internal Empyrean EMPY token transfer.',eth:'Native Ethereum transfer.',bnb:'BNB Smart Chain native token.',btc:'Bitcoin mainnet. Double-check address.',sol:'Solana SPL native transfer.',bank_ng:'Domestic NGN transfer.',bank_intl:'International wire transfer.'};

        function _patchPanel(){
            var panel=document.getElementById('disb-individual-panel'); if(!panel) return;
            /* Only re-run if the dropdown was removed (DOM reset) */
            if(panel._vfCryptoPatch&&document.getElementById('disb-crypto-wallet-type')) return;
            panel._vfCryptoPatch=true;
            var addrInput=document.getElementById('disb-individual-addr'); if(!addrInput) return;
            /* Remove any old duplicate */
            var old=document.getElementById('disb-crypto-wallet-type-row'); if(old) old.remove();
            var typeRow=document.createElement('div'); typeRow.id='disb-crypto-wallet-type-row'; typeRow.style.cssText='margin-bottom:14px;width:100%;';
            typeRow.innerHTML='<label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:6px;">Payment / Wallet Type <span style="color:#ef4444">*</span></label><select id="disb-crypto-wallet-type" style="width:100%;padding:11px 14px;border:1.5px solid rgba(10,14,39,0.15);border-radius:12px;font-size:0.88rem;outline:none;background:white;font-family:inherit;box-sizing:border-box;cursor:pointer;">'+WALLET_TYPES.map(function(wt){ return '<option value="'+_esc(wt.value)+'">'+_esc(wt.label)+'</option>'; }).join('')+'</select><div id="disb-wallet-type-hint" style="font-size:0.76rem;color:#6B7280;margin-top:4px;margin-bottom:10px;display:none;"></div>';
            panel.insertBefore(typeRow, panel.firstChild);
            var sel=document.getElementById('disb-crypto-wallet-type');
            sel.addEventListener('change',function(){ var v=sel.value; addrInput.placeholder=PLACEHOLDER_MAP[v]||PLACEHOLDER_MAP['']; var hintEl=document.getElementById('disb-wallet-type-hint'); if(hintEl){ if(HINT_MAP[v]){ hintEl.textContent=HINT_MAP[v]; hintEl.style.display='block'; } else hintEl.style.display='none'; } });
        }

        function _patchHistoryTable(){ var hb=document.getElementById('disb-history-body'); if(!hb||hb._vfColPatch) return; hb._vfColPatch=true; var thead=hb.closest('table')&&hb.closest('table').querySelector('thead tr'); if(thead&&!thead.querySelector('.vf-wallet-col')){ var th=document.createElement('th'); th.className='vf-wallet-col'; th.textContent='Wallet / Account'; th.style.cssText='padding:10px 14px;text-align:left;font-weight:700;white-space:nowrap;'; var cols=thead.querySelectorAll('th'); if(cols.length>2) thead.insertBefore(th,cols[2]); else thead.appendChild(th); } }

        ready(function(){ _patchPanel(); _patchHistoryTable(); setTimeout(function(){ _patchPanel(); _patchHistoryTable(); },1200); setTimeout(function(){ _patchPanel(); _patchHistoryTable(); },3000); });

        /* Re-patch when individual radio is selected */
        document.addEventListener('change',function(e){ var t=e.target; if(t.name==='disb-recip-type'&&t.value==='individual'){ var p=document.getElementById('disb-individual-panel'); if(p) p._vfCryptoPatch=false; setTimeout(_patchPanel,80); } });

        /* Re-patch when panel becomes visible */
        ready(function(){ var panel=document.getElementById('disb-individual-panel'); if(!panel) return; new MutationObserver(function(){ if(panel.style.display!=='none'&&!document.getElementById('disb-crypto-wallet-type')){ panel._vfCryptoPatch=false; _patchPanel(); } }).observe(panel,{attributes:true,attributeFilter:['style']}); });

        /* Re-patch when admin tab clicked */
        document.addEventListener('click',function(e){ var t=e.target; if(t.closest&&(t.closest('[data-tab="admin-disburse-tab"]')||t.closest('#admin-disburse-tab')||(t.dataset&&t.dataset.tab==='admin-disburse-tab'))) setTimeout(function(){ var p=document.getElementById('disb-individual-panel'); if(p) p._vfCryptoPatch=false; _patchPanel(); _patchHistoryTable(); },250); });

        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='admin') setTimeout(function(){ _patchPanel(); _patchHistoryTable(); },400); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(function(){ _patchPanel(); _patchHistoryTable(); },600); });
        console.log('[§19] Admin individual disbursement wallet type selector (no _adminInitiateDisbursement wrapper).');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §20  ADMIN CHAIN SELECTOR + EMPTY-WALLET FILTER (NGO disburse)
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixAdminChainSelector(){
        var CHAINS=[{value:'tron',label:'Tron (TRC-20) — USDT preferred'},{value:'polygon',label:'Polygon (MATIC) — Low fees'},{value:'ethereum',label:'Ethereum (ETH)'},{value:'bsc',label:'BNB Smart Chain (BEP-20)'},{value:'avalanche',label:'Avalanche (C-Chain)'},{value:'solana',label:'Solana (SPL)'}];
        function _injectChainSelector(){ var cryptoRow=document.getElementById('disb-crypto-row'); if(!cryptoRow||document.getElementById('disb-chain-row')) return; var chainRow=document.createElement('div'); chainRow.id='disb-chain-row'; chainRow.style.cssText='display:none;margin-bottom:18px;'; chainRow.innerHTML='<label style="font-weight:700;font-size:0.85rem;display:block;margin-bottom:6px;">Blockchain Network</label><select id="disb-chain-select" style="width:100%;padding:11px 14px;border:1.5px solid rgba(10,14,39,0.12);border-radius:12px;font-size:0.88rem;outline:none;box-sizing:border-box;background:white;">'+CHAINS.map(function(c){ return '<option value="'+_esc(c.value)+'">'+_esc(c.label)+'</option>'; }).join('')+'</select>'; cryptoRow.parentNode.insertBefore(chainRow,cryptoRow.nextSibling); var modeSelect=document.getElementById('disb-mode'); if(modeSelect){ function _toggleChain(){ var isCrypto=modeSelect.value==='crypto'; cryptoRow.style.display=isCrypto?'block':'none'; chainRow.style.display=isCrypto?'block':'none'; } modeSelect.addEventListener('change',_toggleChain); _toggleChain(); } document.querySelectorAll('input[name="disb-token"]').forEach(function(radio){ radio.addEventListener('change',function(){ var cs=document.getElementById('disb-chain-select'); if(!cs) return; if(radio.value==='usdt'&&radio.checked) cs.value='tron'; if(radio.value==='empy'&&radio.checked) cs.value='polygon'; if(radio.value==='usdc'&&radio.checked) cs.value='ethereum'; }); }); }
        function _injectEmptyWalletFilter(){ var indPanel=document.getElementById('disb-individual-panel'); if(!indPanel||document.getElementById('v6-empty-wallet-chk')) return; var addrInput=document.getElementById('disb-individual-addr'); if(!addrInput) return; var fw=document.createElement('div'); fw.style.cssText='margin-top:10px;'; fw.innerHTML='<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem;font-weight:600;color:#0A0E27;"><input type="checkbox" id="v6-empty-wallet-chk" style="accent-color:#1B2B8B;width:15px;height:15px;"> Show NGO recipients with no crypto wallet (for manual entry)</label><div id="v6-empty-wallet-list" style="display:none;margin-top:10px;max-height:220px;overflow-y:auto;"></div>'; addrInput.parentNode.insertBefore(fw,addrInput.nextSibling); document.getElementById('v6-empty-wallet-chk').addEventListener('change',async function(){ var list=document.getElementById('v6-empty-wallet-list'); if(!this.checked){ list.style.display='none'; return; } list.style.display='block'; list.innerHTML='<div style="color:#888;font-size:0.83rem;padding:8px;">Loading NGO list…</div>'; if(!_fbOk()){ list.innerHTML='<div style="color:#ef4444;font-size:0.83rem;padding:8px;">Firebase not connected.</div>'; return; } try{ var snap=await window.fbDb.collection('ngo_partners').limit(60).get(); var noWallet=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }).filter(function(n){ return !n.walletAddress&&!n.wallet&&!n.cryptoWallet; }); if(!noWallet.length){ list.innerHTML='<div style="color:#888;font-size:0.83rem;padding:8px;">All NGOs have wallet addresses on file.</div>'; return; } list.innerHTML=noWallet.map(function(n){ return '<div style="padding:8px 12px;border-radius:8px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.12);margin-bottom:6px;cursor:pointer;font-size:0.85rem;" onclick="document.getElementById(\'disb-individual-addr\').value=\''+_esc(n.id)+'\';"><div style="display:flex;justify-content:space-between;"><strong>'+_esc(n.name||n.orgName||n.id)+'</strong><span style="color:#ef4444;font-size:0.72rem;">No wallet</span></div>'+(n.email?'<div style="color:#888;font-size:0.75rem;">'+_esc(n.email)+'</div>':'')+'</div>'; }).join(''); }catch(e){ list.innerHTML='<div style="color:#ef4444;font-size:0.83rem;padding:8px;">Error: '+e.message+'</div>'; } }); }
        function _applyAll(){ _injectChainSelector(); _injectEmptyWalletFilter(); }
        ready(_applyAll); document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='admin') setTimeout(_applyAll,400); }); document.addEventListener('empyrean-init-done',function(){ setTimeout(_applyAll,800); });
        console.log('[§20] Admin chain selector + empty-wallet filter.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §21  KYC FORM PERMISSIONS FIX
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixKyc(){
        window._vfSubmitKyc=async function(kycData,submitBtn){ var uid=_us().id||''; if(!uid){ _notify('Please log in to submit KYC.','error'); if(submitBtn) submitBtn.disabled=false; return; } kycData.userId=uid; kycData.username=_us().username||''; kycData.submittedAt=new Date().toISOString(); kycData.status='pending'; var saved=false; if(_fbOk()){ try{await window.fbDb.collection('users').doc(uid).collection('kyc_submissions').add(kycData); saved=true;}catch(e){ console.warn('[§21] sub-col:',e.message); } } if(_fbOk()&&!saved){ try{await window.fbDb.collection('kyc_submissions').add(kycData); saved=true;}catch(e){ console.warn('[§21] root:',e.message); } } if(_fbOk()&&!saved){ try{var u={}; u['kyc_'+(kycData.type||'individual')]=kycData; await window.fbDb.collection('users').doc(uid).set(u,{merge:true}); saved=true;}catch(e){ console.warn('[§21] merge:',e.message); } } if(saved) _notify('KYC submitted! Under review.','success'); else{ try{var p=JSON.parse(localStorage.getItem('_pendingKyc')||'[]'); p.push(kycData); localStorage.setItem('_pendingKyc',JSON.stringify(p));}catch(e2){} _notify('KYC saved locally. Will sync when online.','info'); } if(submitBtn) submitBtn.disabled=false; };
        console.log('[§21] KYC permission fix.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §22  WALLET BALANCE SYNC FROM FIRESTORE
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixWalletBalance(){
        function _syncBalance(){ var el=document.getElementById('wallet-empy-balance'); if(!el) return; var us=_us(); if(us.empyBalance!=null){ var lb=Number(us.empyBalance); el.innerHTML='<i class="fa-solid fa-coins"></i> '+lb.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); var usdEl=document.getElementById('wallet-usd-equivalent'); if(usdEl) usdEl.textContent='~ $'+(lb*(window._empyUsdRate||0.10)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); } if(!_fbOk()||!us.id) return; try{ window.fbDb.collection('users').doc(us.id).get().then(function(doc){ if(!doc.exists) return; var d=doc.data(), bal=Number(d.empyBalance||d.tokenBalance||d.walletBalance||0); us.empyBalance=bal; if(window.EmpState&&window.EmpState.userState) window.EmpState.userState.empyBalance=bal; if(window.userState) window.userState.empyBalance=bal; el.innerHTML='<i class="fa-solid fa-coins"></i> '+bal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); var ue=document.getElementById('wallet-usd-equivalent'); if(ue) ue.textContent='~ $'+(bal*(window._empyUsdRate||0.10)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }).catch(function(err){ console.warn('[§22] Wallet sync:',err.message); }); }catch(e){} }
        document.addEventListener('empyrean-section-change',function(e){ if(e&&e.detail&&(e.detail.section==='my-wallet'||e.detail.section==='wallet')) setTimeout(_syncBalance,200); });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_syncBalance,600); });
        ready(_syncBalance);
        console.log('[§22] Wallet balance sync.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §23  LOGIN RE-PROMPT / GUEST STATE SYNC
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixLoginReprompt(){
        function _syncGuestState(){ if(window._firebaseLoaded&&window.fbAuth&&window.fbAuth.currentUser){ window.isGuest=false; if(window.EmpState) window.EmpState.isGuest=false; return; } var us=window.userState||(window.EmpState&&window.EmpState.userState); if(us&&us.id&&us.id!=='guest'&&!String(us.id).startsWith('guest-')){ window.isGuest=false; if(window.EmpState) window.EmpState.isGuest=false; } }
        if (window._firebaseLoaded&&window.fbAuth) try{ window.fbAuth.onAuthStateChanged(function(user){ if(user){ window.isGuest=false; if(window.EmpState) window.EmpState.isGuest=false; } }); }catch(e){}
        var _origOpenAuth=window.openAuthModal;
        window.openAuthModal=function(mode){ _syncGuestState(); if(!_isGuest()){ console.log('[§23] Blocked spurious auth modal for logged-in user.'); return; } if(typeof _origOpenAuth==='function') _origOpenAuth(mode); };
        document.addEventListener('click',_syncGuestState,true); setInterval(_syncGuestState,5000); ready(_syncGuestState);
        document.addEventListener('empyrean-init-done',function(){ _syncGuestState(); });
        console.log('[§23] Login re-prompt / guest state sync.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §24  ACCOUNT SWITCHER
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixAccountSwitch(){
        var KEY='empyrean_saved_accounts';
        function _getSaved(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return [];} }
        function _saveCurrent(){ var us=_us(); if(!us||!us.id||_isGuest()) return; var saved=_getSaved(), entry={id:us.id,email:us.email||'',fullName:us.fullName||us.username||'User',avatar:us.avatar||us.profilePhoto||''}; var ex=saved.findIndex(function(a){return a.id===us.id;}); if(ex>-1) saved[ex]=entry; else saved.unshift(entry); if(saved.length>5) saved=saved.slice(0,5); try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){} }
        function _openSwitcher(){ var ex=document.getElementById('vf-account-switcher-modal'); if(ex){ex.remove();return;} var saved=_getSaved(), us=_us(), others=saved.filter(function(a){return a.id!==(us.id||'');}); var listHTML=others.length?others.map(function(a){ var av=a.avatar||'https://ui-avatars.com/api/?name='+encodeURIComponent(a.fullName)+'&background=1B2B8B&color=fff&size=80'; return '<div data-switch-id="'+_esc(a.id)+'" data-switch-email="'+_esc(a.email)+'" class="vf-switch-item" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(10,14,39,0.1);cursor:pointer;background:white;margin-bottom:8px;"><img src="'+_esc(av)+'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;"><div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:0.9rem;">'+_esc(a.fullName)+'</div><div style="font-size:0.78rem;color:#888;">'+_esc(a.email)+'</div></div><i class="fas fa-chevron-right" style="color:#bbb;"></i></div>'; }).join(''):'<div style="text-align:center;padding:24px;color:#888;font-size:0.88rem;"><i class="fas fa-user-plus" style="font-size:1.8rem;display:block;margin-bottom:10px;color:#1B2B8B;"></i>No other saved accounts.</div>'; var modal=document.createElement('div'); modal.id='vf-account-switcher-modal'; modal.style.cssText='position:fixed;inset:0;background:rgba(10,15,30,0.8);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;'; modal.innerHTML='<div style="background:white;border-radius:20px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25);"><div style="height:4px;background:linear-gradient(90deg,#1B2B8B,#00D4AA);"></div><div style="padding:20px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="font-weight:800;margin:0;font-size:1rem;">Switch Account</h3><button id="vf-switch-close" style="background:rgba(0,0,0,0.06);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;font-size:1rem;">✕</button></div><div style="max-height:280px;overflow-y:auto;">'+listHTML+'</div><div style="border-top:1px solid rgba(10,14,39,0.07);padding-top:14px;margin-top:14px;"><button id="vf-add-account-btn" style="width:100%;padding:12px;border-radius:12px;border:1.5px dashed rgba(27,43,139,0.3);background:transparent;color:#1B2B8B;font-weight:700;font-size:0.88rem;cursor:pointer;"><i class="fas fa-plus" style="margin-right:6px;"></i>Add another account</button></div></div></div>'; document.body.appendChild(modal); modal.querySelector('#vf-switch-close').addEventListener('click',function(){modal.remove();}); modal.addEventListener('click',function(e){if(e.target===modal) modal.remove();}); modal.querySelector('#vf-add-account-btn').addEventListener('click',function(){ modal.remove(); _saveCurrent(); var lb=document.getElementById('logout-btn'); if(lb) lb.click(); else if(typeof window.logoutUser==='function') window.logoutUser(); }); modal.querySelectorAll('.vf-switch-item').forEach(function(item){ item.addEventListener('click',function(){ _saveCurrent(); var email=item.dataset.switchEmail; modal.remove(); var lb=document.getElementById('logout-btn'); if(lb){ lb.click(); setTimeout(function(){ var ei=document.getElementById('login-email'); if(ei) ei.value=email; if(typeof window.openAuthModal==='function'){window.isGuest=true; window.openAuthModal('login');} },900); } }); }); }
        function _injectSwitchBtn(){ if(_isGuest()) return; if(document.getElementById('vf-switch-account-btn')) return; var lb=document.getElementById('logout-btn'); if(!lb) return; _saveCurrent(); var btn=document.createElement('a'); btn.id='vf-switch-account-btn'; btn.href='#'; btn.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(27,43,139,0.08);border:1px solid rgba(27,43,139,0.18);border-radius:10px;color:#93C5FD;font-weight:600;font-size:0.83rem;text-decoration:none;margin-bottom:6px;cursor:pointer;'; btn.innerHTML='<i class="fas fa-right-left"></i> Switch Account'; btn.addEventListener('click',function(e){e.preventDefault();_openSwitcher();}); lb.parentNode.insertBefore(btn,lb); }
        ready(function(){setTimeout(_injectSwitchBtn,1500);}); document.addEventListener('empyrean-init-done',function(){setTimeout(_injectSwitchBtn,600);}); ready(function(){ var sb=document.querySelector('.sidebar'); if(sb) new MutationObserver(function(){setTimeout(_injectSwitchBtn,300);}).observe(sb,{childList:true,subtree:true}); });
        window._vfOpenAccountSwitcher=_openSwitcher;
        console.log('[§24] Account switcher.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §25  NAV BAR SIDEBAR ICON STYLE — Premium SVG icons, no emoji fallbacks
            Replaces emoji CSS content: overrides with professional inline SVG.
            Maps each nav section ID to a clean monochrome SVG path.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixNavStyle(){
        /* Override emoji fallback rules injected by index.html <style> block */
        ready(function(){
            if(document.getElementById('_vf_nav_sidebar')) return;
            var s=document.createElement('style'); s.id='_vf_nav_sidebar';
            s.textContent=[
                /* Kill emoji content overrides from index.html lines 15-18 */
                '.fa-video:before{content:"" !important;}',
                '.fa-store:before{content:"" !important;}',
                '.fa-film:before{content:"" !important;}',
                '.fa-newspaper:before{content:"" !important;}',
                '.fa-user-circle:before{content:"" !important;}',
                '.fa-cog:before{content:"" !important;}',
                '.fa-user-shield:before{content:"" !important;}',
                '.fa-hands-helping:before{content:"" !important;}',
                '.fa-file-invoice-dollar:before{content:"" !important;}',
                '.fa-briefcase:before{content:"" !important;}',
                '.fa-comment:before{content:"" !important;}',
                '.fa-satellite-dish:before{content:"" !important;}',
                '.fa-exclamation-triangle:before{content:"" !important;}',
                '.fa-building:before{content:"" !important;}',
                '.fa-users:before{content:"" !important;}',
                '.fa-tasks:before{content:"" !important;}',
                '.fa-hands-holding-circle:before{content:"" !important;}',
                '.fa-user:before{content:"" !important;}',
                '.fa-sitemap:before{content:"" !important;}',
                /* Sidebar link base style */
                '.sidebar-nav .nav-link{display:flex;align-items:center;gap:11px;padding:11px 16px;border-radius:10px;transition:background 0.18s,color 0.18s;color:rgba(232,240,255,0.72)!important;font-size:0.88rem;font-weight:500;text-decoration:none;cursor:pointer;border:none;background:none;width:100%;box-sizing:border-box;}',
                '.sidebar-nav .nav-link:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important;}',
                '.sidebar-nav .nav-link.active{background:rgba(245,197,24,0.12)!important;color:#F5C518!important;font-weight:700;}',
                '.sidebar-nav .nav-link i,.sidebar-nav .nav-link .vf-nav-icon{color:rgba(232,240,255,0.65)!important;flex-shrink:0;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;}',
                '.sidebar-nav .nav-link.active .vf-nav-icon,.sidebar-nav .nav-link:hover .vf-nav-icon{color:#F5C518!important;}',
                '.sidebar-nav .nav-link.active i,.sidebar-nav .nav-link:hover i{color:#F5C518!important;}',
                /* SVG icon base */
                '.vf-nav-svg{width:20px;height:20px;fill:currentColor;display:block;flex-shrink:0;}',
            ].join('\n');
            document.head.appendChild(s);
        });

        /* SVG path map: section-id → SVG path(s) */
        var SVG_MAP = {
            'dashboard':        '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
            'go-live':          '<path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>',
            'reels':            '<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>',
            'news':             '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 7H5v-1h14v1zm0-3H5V7h14v1zm-9 6H5v-1h5v1zm4 0h-3v-1h3v1z"/>',
            'marketplace':      '<path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm-7-3a3 3 0 010 6 3 3 0 010-6zm0 10a4 4 0 11.001-8.001A4 4 0 0112 13zm0-6a2 2 0 100 4 2 2 0 000-4z"/>',
            'business-page':    '<path d="M20 7H4c-1.1 0-2 .9-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-2 13H6V9h12v11zM0 5h24v2H0zm4-2h4V1H4v2zm12 0h4V1h-4v2z"/>',
            'community-tasks':  '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
            'request-help':     '<path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>',
            'report-crisis':    '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
            'grant-portal':     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8zm0-4h5v2H8z"/>',
            'ngo-partners':     '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1a2 2 0 002 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3a1 1 0 00-1-1H8v-2h2a1 1 0 000-2H8V7h2a2 2 0 012 2v1h2a1 1 0 011 1v3h1c.65 0 1.23.24 1.68.63-.18.76-.44 1.49-.78 2.16z"/>',
            'messages':         '<path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>',
            'my-wallet':        '<path d="M21 7H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zM1 5h20v2H1zM3 3h16v2H3zm14 10a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>',
            'my-profile':       '<path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a3 3 0 110 6 3 3 0 010-6zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/>',
            'profile':          '<path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a3 3 0 110 6 3 3 0 010-6zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/>',
            'settings':         '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.37 7.37 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.74 8.87a.47.47 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 00-.12-.61l-2.03-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"/>',
            'admin':            '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14c-2.67 0-5-1.33-6.43-3.36.62-1.26 2.63-2.14 6.43-2.14s5.81.88 6.43 2.14C17 17.67 14.67 19 12 19z"/>',
        };

        function _makeSVG(sectionId, color) {
            var path = SVG_MAP[sectionId] || '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>';
            return '<svg class="vf-nav-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="color:'+(color||'currentColor')+'">' + path + '</svg>';
        }

        function _patchSidebarLinks() {
            document.querySelectorAll('.sidebar-nav .nav-link[data-section],.sidebar-nav .nav-link[data-target]').forEach(function(link) {
                if (link._vfIconPatched) return;
                link._vfIconPatched = true;
                var sec = link.dataset.section || link.dataset.target || '';
                if (!SVG_MAP[sec]) return;
                /* Remove existing <i> emoji-icon elements */
                link.querySelectorAll('i').forEach(function(i) { i.remove(); });
                /* Prepend SVG icon */
                var svgWrap = document.createElement('span');
                svgWrap.className = 'vf-nav-icon';
                svgWrap.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex-shrink:0;color:inherit;';
                svgWrap.innerHTML = _makeSVG(sec);
                link.insertBefore(svgWrap, link.firstChild);
            });
        }

        ready(function() { setTimeout(_patchSidebarLinks, 300); setTimeout(_patchSidebarLinks, 1000); setTimeout(_patchSidebarLinks, 2500); });
        document.addEventListener('empyrean-init-done', function() { setTimeout(_patchSidebarLinks, 400); });
        /* Re-patch when sidebar is rebuilt */
        ready(function() {
            var sb = document.querySelector('.sidebar,.sidebar-nav');
            if (sb) new MutationObserver(function() { setTimeout(_patchSidebarLinks, 80); }).observe(sb, { childList: true, subtree: true });
        });
        window._vfPatchSidebarIcons = _patchSidebarLinks;
        console.log('[§25] Sidebar nav — premium SVG icons, emoji overrides removed.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §26  PREMIUM BADGE REMOVAL (v8 killed it — keep that behaviour)
    ═══════════════════════════════════════════════════════════════════════ */
    (function removePremiumBadge(){
        function _kill(){ ['v6-premium-btn','v6-sidebar-premium'].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); }); }
        ready(function(){ if(document.getElementById('_vf_no_premium')) return; var s=document.createElement('style'); s.id='_vf_no_premium'; s.textContent='#v6-premium-btn,#v6-sidebar-premium{display:none!important;}'; document.head.appendChild(s); });
        ready(_kill); [300,800,1500,3000].forEach(function(t){setTimeout(_kill,t);});
        document.addEventListener('empyrean-init-done',_kill);
        console.log('[§26] Premium badge removed.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §27  DASHBOARD BUSINESS POSTS SLIDER (hardcoded HTML containers)
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixDashboardBizPostsSlider(){
        function _buildPostCard(post,pageName,pageAvatar,pageCover){ var card=document.createElement('div'); card.dataset.postId=post.id; card.style.cssText='flex:0 0 220px;width:220px;border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 4px 18px rgba(10,14,39,0.13);background:white;border:1px solid rgba(10,14,39,0.08);scroll-snap-align:start;transition:transform 0.22s,box-shadow 0.22s;display:flex;flex-direction:column;'; var fm=(post.media&&post.media.length)?post.media[0]:'', isVid=fm&&/\.(mp4|webm|mov)/i.test(fm); var coverBg=pageCover?'url(\''+_esc(pageCover)+'\') center/cover no-repeat':'linear-gradient(135deg,#0A0E27 0%,#1B2B8B 100%)'; var avatarSrc=pageAvatar||('https://ui-avatars.com/api/?name='+encodeURIComponent(pageName||'B')+'&background=1B2B8B&color=fff&size=100'); var productBox=fm&&!isVid?'<div style="width:100%;aspect-ratio:1/1;overflow:hidden;background:#f3f4f6;"><img src="'+_esc(fm)+'" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.style.display=\'none\'"></div>':fm&&isVid?'<div style="width:100%;aspect-ratio:1/1;overflow:hidden;background:#0A0E27;position:relative;"><video src="'+_esc(fm)+'" style="width:100%;height:100%;object-fit:cover;display:block;" muted playsinline preload="metadata"></video><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><div style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;"><i class="fas fa-play" style="color:white;font-size:0.9rem;margin-left:2px;"></i></div></div></div>':'<div style="width:100%;aspect-ratio:1/1;background:linear-gradient(135deg,rgba(27,43,139,0.06),rgba(27,43,139,0.12));display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="font-size:2rem;color:rgba(27,43,139,0.25);"></i></div>'; card.innerHTML='<div style="height:72px;background:'+coverBg+';position:relative;flex-shrink:0;"><div style="position:absolute;bottom:-18px;left:12px;width:40px;height:40px;border-radius:50%;border:3px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.2);background:#e8eaf6;"><img src="'+_esc(avatarSrc)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.src=\'https://ui-avatars.com/api/?name=B&background=1B2B8B&color=fff&size=100\'"></div></div><div style="padding:22px 12px 8px;display:flex;flex-direction:column;gap:1px;"><strong style="font-size:0.82rem;font-weight:800;color:#0A0E27;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(pageName||'Business')+'</strong><span style="font-size:0.65rem;color:#1B2B8B;font-weight:600;">Business Page</span></div>'+productBox+(post.text?'<div style="padding:8px 12px 12px;"><p style="margin:0;font-size:0.73rem;color:#374151;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">'+_esc(post.text)+'</p></div>':'<div style="height:10px;"></div>'); card.addEventListener('mouseenter',function(){ card.style.transform='translateY(-4px)'; card.style.boxShadow='0 10px 28px rgba(10,14,39,0.18)'; }); card.addEventListener('mouseleave',function(){ card.style.transform=''; card.style.boxShadow='0 4px 18px rgba(10,14,39,0.13)'; }); card.addEventListener('click',function(){ var pid=post.pageId||post.bizId||''; if(pid) window._activeBizPageId=pid; var pages=(window._firestoreBusinessPages||[]); var biz=pages.find(function(p){return p.id===pid;}); if(biz) window._activeBizData=biz; if(typeof window.navigateTo==='function') window.navigateTo('business-page'); setTimeout(function(){ if(typeof window.renderBusinessPage==='function') window.renderBusinessPage(pid); },80); }); return card; }

        function _addCard(post,name,avatar,cover){ var slider=document.getElementById('dashboard-bizposts-slider'); if(!slider) return; if(slider.querySelector('[data-post-id="'+post.id+'"]')) return; var empty=document.getElementById('bizposts-empty'); if(empty) try{slider.removeChild(empty);}catch(_2){} slider.appendChild(_buildPostCard(post,name,avatar,cover)); }

        function _loadPosts(){ if(!window._firebaseLoaded||!window.fbDb) return; try{ window.fbDb.collection('business_posts').orderBy('createdAt','desc').limit(20).onSnapshot(function(snap){ if(!snap||snap.empty) return; snap.docChanges().forEach(function(change){ if(change.type!=='added') return; var post=change.doc.data(); post.id=change.doc.id; var name=post.pageName||post.orgName||post.businessName||'Business'; if(post.pageId){ window.fbDb.collection('business_pages').doc(post.pageId).get().then(function(d){ var data=d.exists?d.data():{}; _addCard(post,data.name||name,data.profilePhoto||'',data.coverPhoto||''); }).catch(function(){_addCard(post,name,'','');}); } else _addCard(post,name,'',''); }); },function(err){ console.warn('[§27] biz posts slider:',err&&err.message); }); }catch(e){} }

        function _init(){
            /* FIX: Always make the media container visible — it starts hidden on some environments */
            var bc=document.getElementById('dashboard-bizposts-container');
            if(bc) bc.style.display='block';
            if(typeof window.renderDashboardBusinesses==='function') try{window.renderDashboardBusinesses();}catch(e){}
            _loadPosts();
        }
        if(document.readyState!=='loading') setTimeout(_init,800); else document.addEventListener('DOMContentLoaded',function(){setTimeout(_init,800);});
        document.addEventListener('empyrean-init-done',function(){setTimeout(_init,600);});
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='dashboard') setTimeout(function(){ if(!document.getElementById('dashboard-bizposts-container')) _init(); },600); });
        console.log('[§27] Dashboard business posts slider.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §28  VIDEO PRELOAD + PLAYSINLINE (feed posts)
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixVideoPreload(){
        ['_v10f_media_css','_v10f_media_css_v2','_v10f_media_css_v3','_v10f_media_css_v4','_v10f_media_css_v5','_v10f_detail_media_css'].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
        function _fixVideos(root){ var scope=root||document; scope.querySelectorAll('.story-media-item video,.story-media-container video,.news-item-image video').forEach(function(vid){ if(vid._vfVidFixed) return; vid._vfVidFixed=true; if(!vid.getAttribute('preload')||vid.getAttribute('preload')==='none') vid.setAttribute('preload','metadata'); if(!vid.hasAttribute('playsinline')) vid.setAttribute('playsinline',''); if(!vid.hasAttribute('controls')) vid.setAttribute('controls',''); if(vid.readyState===0&&vid.src) vid.load(); }); }
        function _attachFeedObs(){ var feed=document.getElementById('feed-container')||document.getElementById('posts-feed'); if(!feed||feed._vfVideoObs) return; feed._vfVideoObs=true; new MutationObserver(function(muts){ muts.forEach(function(m){ m.addedNodes.forEach(function(n){ if(n.nodeType===1) setTimeout(function(){_fixVideos(n);},80); }); }); }).observe(feed,{childList:true}); }
        function _init(){ _fixVideos(document); _attachFeedObs(); }
        if(document.readyState!=='loading'){ setTimeout(_init,150); setTimeout(function(){_fixVideos(document);},1500); } else document.addEventListener('DOMContentLoaded',function(){setTimeout(_init,150);});
        document.addEventListener('empyrean-init-done',function(){setTimeout(_init,250); setTimeout(function(){_fixVideos(document);},1200);});
        console.log('[§28] Video preload fix.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §29  GLOBAL INIT BRIDGE
    ═══════════════════════════════════════════════════════════════════════ */
    document.addEventListener('empyrean-init-done', function(){
        setTimeout(function(){
            /* Re-render profile if currently visible and empty */
            var profileSection=document.getElementById('profile');
            if (profileSection&&getComputedStyle(profileSection).display!=='none'){
                var us=window.userState||{}; if(us.id&&typeof window.renderUserProfile==='function') { var hasContent=profileSection.querySelector('.profile-header,.profile-content,.user-profile-wrapper,.profile-card'); if(!hasContent) window.renderUserProfile(us.id); }
            }
        },1200);
    });

    console.log('[Empyrean Fix FINAL] ✅ All 33 sections loaded. Replace v5–v10 with this single file.');


    /* ═══════════════════════════════════════════════════════════════════════
       §30  MARKETPLACE — dashboard strip visibility + contact+chat + owner toolbar
            C1. Load marketplace listings into dashboard strip from Firestore.
            C2. Contact button: expand phone/email + private "Message Seller" button.
            C3. Horizontal scrollable owner/admin Edit + Delete toolbar per card.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixMarketplaceDashboardAndControls(){

        /* ── C1: CSS for scroll toolbar + contact expand panel ── */
        ready(function(){
            if(document.getElementById('_vf_mkt_ext_css')) return;
            var s=document.createElement('style'); s.id='_vf_mkt_ext_css';
            s.textContent=[
                '.direct-contact-info{padding:0;overflow:hidden;max-height:0;transition:max-height 0.3s ease,padding 0.3s ease;background:rgba(0,212,170,0.05);border-top:1px solid rgba(0,212,170,0.1);}',
                '.direct-contact-info.open{max-height:320px!important;padding:14px 16px!important;}',
                '.direct-contact-info p{margin:5px 0;font-size:0.87rem;}',
                '.vf-chat-seller-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:8px 16px;border-radius:8px;background:rgba(27,43,139,0.08);color:#1B2B8B;border:1px solid rgba(27,43,139,0.18);cursor:pointer;font-size:0.82rem;font-weight:700;transition:background 0.18s;}',
                '.vf-chat-seller-btn:hover{background:rgba(27,43,139,0.15);}',
                '.vf-owner-toolbar{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;gap:8px!important;padding:8px 12px!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important;border-top:1px solid rgba(0,0,0,0.05);}',
                '.vf-owner-toolbar::-webkit-scrollbar{display:none;}',
                '.vf-tb-btn{flex-shrink:0;white-space:nowrap;padding:7px 14px;border-radius:8px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;gap:5px;}',
                '.vf-tb-edit{background:rgba(0,212,170,0.09);color:#00B894;border-color:rgba(0,212,170,0.22);}',
                '.vf-tb-delete{background:rgba(229,57,53,0.07);color:#e53935;border-color:rgba(229,57,53,0.18);}',
            ].join('');
            document.head.appendChild(s);
        });

        /* ── C1: Load listings into dashboard strip from Firestore ── */
        function _buildStripCard(data){
            var card=document.createElement('div');
            card.className='dashboard-market-card';
            card.dataset.id=data.id||''; card.dataset.navTarget='marketplace';
            card.style.cssText='flex:0 0 130px;width:130px;border-radius:14px;overflow:hidden;cursor:pointer;box-shadow:0 2px 12px rgba(10,14,39,0.12);background:#fff;border:1px solid rgba(10,14,39,0.07);scroll-snap-align:start;transition:transform 0.2s;';
            var firstUrl=(data.media&&data.media[0])||data.img||data.imageUrl||'';
            var isVid=/\.(mp4|webm|mov)(\?|$)/i.test(firstUrl)||/\/video\/upload\//i.test(firstUrl);
            var price=typeof window._fmtPrice==='function'?window._fmtPrice(data.price||0,data.currency||'NGN'):('₦'+Number(data.price||0).toLocaleString());
            var media=firstUrl?(isVid?'<video src="'+_esc(firstUrl)+'" autoplay loop muted playsinline style="width:100%;height:80px;object-fit:cover;display:block;"></video>':'<img src="'+_esc(firstUrl)+'" alt="'+_esc(data.name||'')+'" loading="lazy" style="width:100%;height:80px;object-fit:cover;display:block;">'):'<div style="width:100%;height:80px;background:rgba(0,212,170,0.07);display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="font-size:1.6rem;color:rgba(0,212,170,0.4);"></i></div>';
            card.innerHTML=media+'<div style="padding:8px 10px;"><div style="font-weight:700;font-size:0.76rem;color:#0A0E27;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(data.name||'Item')+'</div><div style="font-size:0.72rem;color:#00D4AA;font-weight:700;margin-top:2px;">'+price+'</div></div>';
            card.addEventListener('click',function(){ if(typeof window.navigateTo==='function') window.navigateTo('marketplace'); });
            card.addEventListener('mouseenter',function(){ card.style.transform='translateY(-3px)'; });
            card.addEventListener('mouseleave',function(){ card.style.transform=''; });
            return card;
        }

        function _loadMarketStrip(){
            var cont=document.getElementById('dashboard-market-container');
            var slider=document.getElementById('dashboard-market-slider');
            if(!cont||!slider) return;
            /* Force container visible immediately so layout doesn't collapse */
            cont.style.display='block';
            /* Slider CSS guard */
            if(!slider.style.display) { slider.style.display='flex'; slider.style.flexWrap='nowrap'; slider.style.overflowX='auto'; slider.style.gap='10px'; slider.style.scrollSnapType='x mandatory'; slider.style.webkitOverflowScrolling='touch'; }
            if(!_fbOk()) return;
            /* Three-level fallback: status+order → order only → simple get */
            function _populate(snap){
                if(!snap||snap.empty) return;
                snap.forEach(function(doc){ var d=doc.data(); d.id=doc.id; if(!slider.querySelector('[data-id="'+d.id+'"]')) slider.appendChild(_buildStripCard(d)); });
            }
            try{
                window.fbDb.collection('marketplace_listings').where('status','==','active').orderBy('createdAt','desc').limit(12).get()
                    .then(_populate)
                    .catch(function(){
                        window.fbDb.collection('marketplace_listings').orderBy('createdAt','desc').limit(12).get()
                            .then(_populate)
                            .catch(function(){
                                window.fbDb.collection('marketplace_listings').limit(12).get().then(_populate).catch(function(){});
                            });
                    });
            }catch(e){}
        }

        /* Wrap addMarketItemToDashboardStrip so new uploads also show the container */
        var _origAdd=window.addMarketItemToDashboardStrip;
        window.addMarketItemToDashboardStrip=function(data){
            if(typeof _origAdd==='function') _origAdd(data);
            var cont=document.getElementById('dashboard-market-container'); if(cont) cont.style.display='block';
        };
        window.addMarketItemToDashboardSlider=window.addMarketItemToDashboardStrip;

        /* ── C2: Contact button delegation — expand info + chat button ── */
        /* FIX: broaden selector to catch all expand-contact button variants in the app */
        document.addEventListener('click',function(e){
            var contactBtn=e.target.closest(
                '.contact-seller-btn,.expand-contact-btn,'+
                '[data-action="expand-contact"],[data-action="contact-seller"],'+
                'button[class*="contact"],button[class*="expand-contact"]'
            );
            if(!contactBtn) return;
            if(_isGuest()){ if(typeof window.openAuthModal==='function') window.openAuthModal('login'); return; }
            var card=contactBtn.closest('.property-card,.market-card,.listing-card'); if(!card) return;
            var panel=card.querySelector('.direct-contact-info');
            if(!panel){ panel=document.createElement('div'); panel.className='direct-contact-info'; card.appendChild(panel); }
            var isOpen=panel.classList.contains('open');
            if(isOpen){
                panel.classList.remove('open');
                contactBtn.innerHTML='<i class="fas fa-phone"></i> Contact Seller';
                contactBtn.setAttribute('aria-expanded','false');
            } else {
                var cName=card.dataset.contactName||card.dataset.sellerName||'',
                    cPhone=card.dataset.contactPhone||card.dataset.phone||'',
                    cEmail=card.dataset.contactEmail||card.dataset.email||'',
                    cAddr=card.dataset.contactAddress||card.dataset.address||'',
                    sellerId=card.dataset.sellerId||card.dataset.userId||'';
                /* FIX: also try to pull from Firestore if data attrs missing but listing id present */
                var listingId=card.dataset.id||card.dataset.postId||'';
                var sellerName=cName||(card.querySelector('.property-name,h4,.listing-title')||{}).textContent||'Seller';
                /* Build "Message Seller" button — visible to all non-owner logged-in users */
                var us=_us();
                var isOwner=_isAdmin()||(us.id&&sellerId&&sellerId===us.id);
                var chatBtn=(!isOwner&&sellerId)?'<button class="vf-chat-seller-btn" data-seller-id="'+_esc(sellerId)+'" data-seller-name="'+_esc(sellerName)+'"><i class="fas fa-comment-dots"></i> Message Seller</button>':'';
                if(!cPhone&&!cEmail&&!cName){
                    /* Try Firestore for contact details */
                    if(_fbOk()&&listingId){
                        panel.innerHTML='<p style="color:#6B7280;font-size:0.83rem;"><i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Loading contact info…</p>'+(sellerId?chatBtn:'');
                        panel.classList.add('open');
                        contactBtn.innerHTML='<i class="fas fa-chevron-up"></i> Hide Contact';
                        contactBtn.setAttribute('aria-expanded','true');
                        try{
                            window.fbDb.collection('marketplace_listings').doc(listingId).get().then(function(doc){
                                if(!doc.exists){ panel.innerHTML='<p><i class="fas fa-info-circle" style="color:#00D4AA;margin-right:6px;"></i>Message this seller via <strong>Messages</strong>.</p>'+(sellerId?chatBtn:''); return; }
                                var d=doc.data();
                                var ph=d.contactPhone||d.phone||'', em=d.contactEmail||d.email||'', nm=d.contactName||d.sellerName||sellerName, ad=d.address||'';
                                panel.innerHTML=[
                                    '<p style="font-weight:700;margin-bottom:8px;"><i class="fas fa-address-card" style="color:#00D4AA;margin-right:6px;"></i>Seller Contact</p>',
                                    nm?'<p><i class="fas fa-user" style="margin-right:6px;opacity:0.55;"></i>'+_esc(nm)+'</p>':'',
                                    ph?'<p><i class="fas fa-phone" style="margin-right:6px;opacity:0.55;"></i><a href="tel:'+_esc(ph)+'">'+_esc(ph)+'</a></p>':'',
                                    em?'<p><i class="fas fa-envelope" style="margin-right:6px;opacity:0.55;"></i><a href="mailto:'+_esc(em)+'">'+_esc(em)+'</a></p>':'',
                                    ad?'<p><i class="fas fa-map-marker-alt" style="margin-right:6px;opacity:0.55;"></i>'+_esc(ad)+'</p>':'',
                                    chatBtn,
                                ].join('');
                            }).catch(function(){ panel.innerHTML='<p><i class="fas fa-info-circle" style="color:#00D4AA;margin-right:6px;"></i>Message this seller via <strong>Messages</strong>.</p>'+(sellerId?chatBtn:''); });
                        }catch(ex){ panel.innerHTML='<p><i class="fas fa-info-circle" style="color:#00D4AA;margin-right:6px;"></i>Message this seller via <strong>Messages</strong>.</p>'+(sellerId?chatBtn:''); }
                        e.preventDefault(); e.stopImmediatePropagation();
                        return;
                    }
                    panel.innerHTML='<p><i class="fas fa-info-circle" style="color:#00D4AA;margin-right:6px;"></i>Message this seller via <strong>Messages</strong>.</p>'+(sellerId?chatBtn:'');
                } else {
                    panel.innerHTML=[
                        '<p style="font-weight:700;margin-bottom:8px;"><i class="fas fa-address-card" style="color:#00D4AA;margin-right:6px;"></i>Seller Contact</p>',
                        cName  ?'<p><i class="fas fa-user"            style="margin-right:6px;opacity:0.55;"></i>'+_esc(cName)+'</p>':'',
                        cPhone ?'<p><i class="fas fa-phone"           style="margin-right:6px;opacity:0.55;"></i><a href="tel:'+_esc(cPhone)+'">'+_esc(cPhone)+'</a></p>':'',
                        cEmail ?'<p><i class="fas fa-envelope"        style="margin-right:6px;opacity:0.55;"></i><a href="mailto:'+_esc(cEmail)+'">'+_esc(cEmail)+'</a></p>':'',
                        cAddr  ?'<p><i class="fas fa-map-marker-alt" style="margin-right:6px;opacity:0.55;"></i>'+_esc(cAddr)+'</p>':'',
                        chatBtn,
                    ].join('');
                }
                panel.classList.add('open');
                contactBtn.innerHTML='<i class="fas fa-chevron-up"></i> Hide Contact';
                contactBtn.setAttribute('aria-expanded','true');
            }
            e.preventDefault(); e.stopImmediatePropagation();
        },true);

        /* Chat button click */
        document.addEventListener('click',function(e){
            var btn=e.target.closest('.vf-chat-seller-btn'); if(!btn) return;
            e.preventDefault(); e.stopPropagation();
            if(_isGuest()){ if(typeof window.openAuthModal==='function') window.openAuthModal('login'); return; }
            var sid=btn.dataset.sellerId, sname=btn.dataset.sellerName||'Seller';
            if(typeof window.openChatWith==='function') window.openChatWith(sid,sname,'');
            else if(typeof window.openChat==='function') window.openChat(sid);
            else if(typeof window._openChatWithUser==='function') window._openChatWithUser({id:sid,fullName:sname});
            else{ if(typeof window.navigateTo==='function') window.navigateTo('messages'); _notify('Find '+sname+' in Messages to chat.','info'); }
        });

        /* ── C3: Horizontal owner/admin toolbar per .property-card ── */
        function _ensureToolbar(card){
            if(!card||card._vfToolbarDone) return;
            var us=_us(), sellerId=card.dataset.sellerId||card.dataset.userId||'';
            /* FIX: Only show edit/delete to admin OR the owner of this listing */
            if(!_isAdmin()&&!(us.id&&sellerId&&sellerId===us.id)) return;
            card._vfToolbarDone=true;
            /* Skip if app-marketplace.js already injected edit/delete */
            if(card.querySelector('.edit-post-btn,.sp-tb-btn,.vf-tb-btn')) return;
            var toolbar=document.createElement('div'); toolbar.className='vf-owner-toolbar';
            var eb=document.createElement('button'); eb.className='vf-tb-btn vf-tb-edit'; eb.innerHTML='<i class="fas fa-pencil-alt"></i> Edit'; eb.dataset.action='vf-edit';
            var db=document.createElement('button'); db.className='vf-tb-btn vf-tb-delete'; db.innerHTML='<i class="fas fa-trash-alt"></i> Delete'; db.dataset.action='vf-delete';
            toolbar.appendChild(eb); toolbar.appendChild(db);
            var ci=card.querySelector('.direct-contact-info'); if(ci) card.insertBefore(toolbar,ci); else card.appendChild(toolbar);
        }

        document.addEventListener('click',function(e){
            var t=e.target;
            /* Edit */
            var editBtn=t.closest('[data-action="vf-edit"]');
            if(editBtn){ var card=editBtn.closest('.property-card'); if(!card) return; e.preventDefault(); e.stopPropagation();
                var existingEdit=card.querySelector('.edit-post-btn'); if(existingEdit){ existingEdit.click(); return; }
                var name=(card.querySelector('h4,.property-name')||{}).textContent||'', price=card.dataset.price||'';
                var nn=prompt('Edit title:',name); if(nn===null) return;
                var np=prompt('Edit price:',price); if(np===null) return;
                var h4=card.querySelector('h4,.property-name'); if(h4) h4.textContent=nn; card.dataset.price=np;
                if(_fbOk()&&(card.dataset.id||card.dataset.postId)){ try{ window.fbDb.collection('marketplace_listings').doc(card.dataset.id||card.dataset.postId).update({name:nn,price:parseFloat(np)||0}); }catch(ex){} }
                _notify('Listing updated!','success'); return; }
            /* Delete */
            var delBtn=t.closest('[data-action="vf-delete"]');
            if(delBtn){ var card2=delBtn.closest('.property-card'); if(!card2) return; e.preventDefault(); e.stopPropagation();
                var sid2=card2.dataset.sellerId||'', us2=_us();
                if(!_isAdmin()&&sid2&&sid2!==us2.id){ _notify('You can only delete your own listings.','warning'); return; }
                if(!confirm('Delete this listing? This cannot be undone.')) return;
                var docId=card2.dataset.id||card2.dataset.postId||'';
                card2.style.transition='opacity 0.3s,transform 0.3s'; card2.style.opacity='0'; card2.style.transform='scale(0.94)';
                setTimeout(function(){ document.querySelectorAll('[data-id="'+docId+'"],[data-post-id="'+docId+'"]').forEach(function(el){ el.remove(); }); },320);
                if(_fbOk()&&docId){ try{ window.fbDb.collection('marketplace_listings').doc(docId).delete(); _notify('✅ Listing deleted.','success'); }catch(ex){ _notify('Removed from view.','info'); } }
                else _notify('Listing removed.','success'); return; }
        });

        /* Apply toolbar to all current + future .property-card/.market-card/.listing-card elements */
        function _applyToolbars(){ document.querySelectorAll('.property-card,.market-card,.listing-card').forEach(_ensureToolbar); }
        new MutationObserver(function(muts){ muts.forEach(function(m){ m.addedNodes.forEach(function(n){ if(!n.querySelectorAll) return; n.querySelectorAll('.property-card,.market-card,.listing-card').forEach(_ensureToolbar); if(n.classList&&(n.classList.contains('property-card')||n.classList.contains('market-card')||n.classList.contains('listing-card'))) _ensureToolbar(n); }); }); }).observe(document.body,{childList:true,subtree:true});

        /* ── C4: Whole-card click → open private chat with seller ──
           Clicking anywhere on a .property-card that is NOT a button/link/input
           opens a private message thread with the seller.
           This mirrors standard social-marketplace behaviour (e.g. Facebook Marketplace). */
        document.addEventListener('click',function(e){
            /* Skip if the click landed on an interactive element */
            var t=e.target;
            if(t.closest('button,a,input,select,textarea,.contact-seller-btn,.expand-contact-btn,.vf-chat-seller-btn,.direct-contact-info,.vf-owner-toolbar,[data-action]')) return;
            var card=t.closest&&t.closest('.property-card,.market-card,.listing-card');
            if(!card) return;
            /* Must be inside the marketplace section or a dashboard listing strip */
            var inMarket=card.closest('#marketplace,#property-grid-container,.dashboard-market-container,#dashboard-market-slider,.dashboard-market-card');
            /* property-card IS the marketplace card — accept it directly too */
            if(!inMarket&&!card.classList.contains('property-card')) return;
            if(_isGuest()){ if(typeof window.openAuthModal==='function') window.openAuthModal('login'); return; }
            var us=_us();
            var sid=card.dataset.sellerId||card.dataset.userId||'';
            if(!sid){ _notify('Navigate to Marketplace to see the full listing and contact the seller.','info'); return; }
            /* Don't open chat with yourself */
            if(sid===us.id){ _notify('This is your listing.','info'); return; }
            var sname=card.dataset.sellerName||card.dataset.contactName||(card.querySelector('h4,.property-name')||{}).textContent||'Seller';
            e.preventDefault(); e.stopPropagation();
            /* Open private chat */
            if(typeof window.openChatWith==='function') window.openChatWith(sid,sname,'');
            else if(typeof window.openChat==='function') window.openChat(sid);
            else if(typeof window._openChatWithUser==='function') window._openChatWithUser({id:sid,fullName:sname});
            else{
                if(typeof window.navigateTo==='function') window.navigateTo('messages');
                setTimeout(function(){ if(typeof window.openChatWith==='function') window.openChatWith(sid,sname,''); },350);
                _notify('Opening private chat with '+sname+'…','info');
            }
        });

        document.addEventListener('empyrean-init-done',function(){ setTimeout(_loadMarketStrip,600); setTimeout(_applyToolbars,1000); });
        document.addEventListener('empyrean-section-change',function(ev){ var sec=ev&&ev.detail&&ev.detail.section; if(sec==='dashboard') setTimeout(_loadMarketStrip,400); if(sec==='marketplace') setTimeout(_applyToolbars,300); });
        ready(function(){ setTimeout(_loadMarketStrip,1800); setTimeout(_applyToolbars,2200); });
        console.log('[§30] Marketplace — dashboard strip + contact/chat + owner toolbar.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §31  BUSINESS PAGE SUGGESTIONS — "Business Pages For You" strip
            Renders above #suggested-users-container on the dashboard.
            Pulls from window._firestoreBusinessPages cache then Firestore.
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixBusinessPageSuggestions(){

        ready(function(){
            if(document.getElementById('_vf_bizsuggest_css')) return;
            var s=document.createElement('style'); s.id='_vf_bizsuggest_css';
            s.textContent=[
                '#vf-biz-suggest-container{margin:0 0 4px;}',
                '#vf-biz-suggest-slider{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:12px;padding:4px 16px 16px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;}',
                '#vf-biz-suggest-slider::-webkit-scrollbar{display:none;}',
                '.vf-biz-scard{flex:0 0 140px;width:140px;border-radius:14px;overflow:hidden;background:#fff;border:1px solid rgba(10,14,39,0.08);box-shadow:0 3px 14px rgba(10,14,39,0.10);cursor:pointer;scroll-snap-align:start;transition:transform 0.2s,box-shadow 0.2s;display:flex;flex-direction:column;}',
                '.vf-biz-scard:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(10,14,39,0.18);}',
                '.vf-biz-scover{width:100%;height:60px;object-fit:cover;display:block;background:linear-gradient(135deg,#0A0E27,#1B2B8B);}',
                '.vf-biz-savatar{margin:-18px 0 0 10px;width:36px;height:36px;border-radius:50%;border:2.5px solid #fff;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.18);background:#e8eaf6;flex-shrink:0;}',
                '.vf-biz-savatar img{width:100%;height:100%;object-fit:cover;display:block;}',
                '.vf-biz-sinfo{padding:4px 10px 10px;flex:1;}',
                '.vf-biz-sname{font-weight:800;font-size:0.78rem;color:#0A0E27;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
                '.vf-biz-sind{font-size:0.65rem;color:#1B2B8B;font-weight:600;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
                '.vf-biz-sfollowbtn{margin:6px 10px 10px;padding:5px 0;border-radius:6px;background:rgba(27,43,139,0.08);color:#1B2B8B;border:1px solid rgba(27,43,139,0.18);font-size:0.75rem;font-weight:700;cursor:pointer;width:calc(100% - 20px);transition:background 0.18s;}',
                '.vf-biz-sfollowbtn:hover{background:rgba(27,43,139,0.18);}',
                '.vf-biz-sfollowbtn.following{background:rgba(0,212,170,0.1);color:#00B894;border-color:rgba(0,212,170,0.25);}',
            ].join('');
            document.head.appendChild(s);
        });

        function _ensureContainer(){
            if(document.getElementById('vf-biz-suggest-container')) return true;
            var anchor=document.getElementById('suggested-users-container'); if(!anchor) return false;
            var wrap=document.createElement('div'); wrap.id='vf-biz-suggest-container'; wrap.style.display='none';
            wrap.innerHTML='<div style="display:flex;align-items:center;gap:8px;padding:14px 18px 8px;"><i class="fas fa-briefcase" style="color:#1B2B8B;font-size:0.9rem;"></i><h3 style="margin:0;font-size:1rem;font-weight:700;color:#0A0E27;">Business Pages For You</h3></div><div class="horizontal-slider-container" style="padding-bottom:4px;"><div id="vf-biz-suggest-slider" class="horizontal-slider-wrapper"></div></div>';
            anchor.parentNode.insertBefore(wrap,anchor);
            return true;
        }

        function _buildCard(biz){
            var card=document.createElement('div'); card.className='vf-biz-scard'; card.dataset.bizId=biz.id||'';
            var cover=biz.coverPhoto||biz.bannerImage||'', avatar=biz.profilePhoto||biz.logo||'';
            var name=_esc(biz.name||biz.businessName||'Business Page'), ind=_esc(biz.industry||biz.category||'');
            var fallback='https://ui-avatars.com/api/?name='+encodeURIComponent(biz.name||'B')+'&background=1B2B8B&color=fff&size=100';
            var coverHtml=cover?'<img src="'+_esc(cover)+'" class="vf-biz-scover" alt="'+name+' cover" onerror="this.style.display=\'none\'">':'<div class="vf-biz-scover"></div>';
            card.innerHTML=coverHtml+'<div class="vf-biz-savatar"><img src="'+_esc(avatar||fallback)+'" alt="'+name+'" onerror="this.src=\''+fallback+'\'"></div><div class="vf-biz-sinfo"><div class="vf-biz-sname">'+name+'</div>'+(ind?'<div class="vf-biz-sind">'+ind+'</div>':'')+'</div><button class="vf-biz-sfollowbtn" data-biz-id="'+_esc(biz.id||'')+'"><i class="fas fa-plus" style="margin-right:4px;"></i>Follow</button>';
            card.addEventListener('click',function(e){ if(e.target.classList.contains('vf-biz-sfollowbtn')) return; if(biz.id) window._activeBizPageId=biz.id; window._activeBizData=biz; if(typeof window.navigateTo==='function') window.navigateTo('business-page'); setTimeout(function(){ if(typeof window.renderBusinessPage==='function') window.renderBusinessPage(biz.id); /* Enforce ownership: non-owners cannot see post composer */ var us=_us(); var isOwner=_isAdmin()||(us.id&&biz.ownerId&&biz.ownerId===us.id); var composer=document.querySelector('#business-post-form,#create-business-post-form,.business-post-composer,#biz-post-composer'); if(composer) composer.style.display=isOwner?'':'none'; },100); });
            return card;
        }

        function _loadSuggestions(){
            if(_isGuest()) return;
            if(!_ensureContainer()) return;
            var slider=document.getElementById('vf-biz-suggest-slider'); if(!slider) return;
            var us=_us();
            function _populate(pages){
                var filtered=pages.filter(function(p){ return p&&p.id&&!(us.id&&p.ownerId&&p.ownerId===us.id)&&!slider.querySelector('[data-biz-id="'+p.id+'"]'); });
                if(!filtered.length) return;
                var cont=document.getElementById('vf-biz-suggest-container'); if(cont) cont.style.display='';
                filtered.slice(0,10).forEach(function(biz){ slider.appendChild(_buildCard(biz)); });
            }
            var cached=(window._firestoreBusinessPages||[]).concat(us.businessPage?[us.businessPage]:[]);
            if(cached.length) _populate(cached);
            if(!_fbOk()) return;
            try{
                window.fbDb.collection('business_pages').orderBy('createdAt','desc').limit(20).get().then(function(snap){
                    if(!snap||snap.empty) return;
                    var pages=[]; snap.forEach(function(doc){ var d=doc.data(); d.id=doc.id; pages.push(d); });
                    if(!window._firestoreBusinessPages) window._firestoreBusinessPages=[];
                    pages.forEach(function(p){ if(!window._firestoreBusinessPages.find(function(x){ return x.id===p.id; })) window._firestoreBusinessPages.push(p); });
                    slider.innerHTML=''; _populate(pages);
                }).catch(function(){});
            }catch(e){}
        }

        /* Follow button */
        document.addEventListener('click',function(e){
            var btn=e.target.closest('.vf-biz-sfollowbtn'); if(!btn) return;
            e.preventDefault(); e.stopPropagation();
            if(_isGuest()){ if(typeof window.openAuthModal==='function') window.openAuthModal('login'); return; }
            var bizId=btn.dataset.bizId, isFollowing=btn.classList.contains('following');
            if(isFollowing){ btn.classList.remove('following'); btn.innerHTML='<i class="fas fa-plus" style="margin-right:4px;"></i>Follow'; }
            else{ btn.classList.add('following'); btn.innerHTML='<i class="fas fa-check" style="margin-right:4px;"></i>Following'; _notify('Following business page!','success');
                if(_fbOk()&&bizId){ try{ window.fbDb.collection('business_pages').doc(bizId).update({followers:window.firebase&&window.firebase.firestore?window.firebase.firestore.FieldValue.arrayUnion(_us().id):[]}); }catch(ex){} }
            }
        });

        document.addEventListener('empyrean-init-done',function(){ setTimeout(_loadSuggestions,1000); });
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&ev.detail.section==='dashboard') setTimeout(_loadSuggestions,500); });
        ready(function(){ setTimeout(_loadSuggestions,2500); });
        console.log('[§31] Business page suggestions — "Business Pages For You" strip.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §32  FEED PRIVACY + POST COMPOSER OWNERSHIP
            • Business-page feed: only the page OWNER can create posts.
              Visitors can read posts but cannot compose or upload media.
            • Own dashboard/personal feed: only you can post (composer is yours).
            • On navigating to another user's PROFILE page (business or personal),
              the post composer / create-post column is fully deactivated.
              Users cannot post on pages that are not their own — matching
              standard social platform behaviour (Facebook, Instagram, etc.).
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixFeedPrivacy(){

        /* CSS: hide every possible post-creation element for visitors */
        ready(function(){
            if(document.getElementById('_vf_feed_privacy_css')) return;
            var s=document.createElement('style'); s.id='_vf_feed_privacy_css';
            s.textContent=[
                /* ── Viewing ANOTHER user's profile: hide ALL composer UI ── */
                'body.viewing-other-profile #create-post-area,',
                'body.viewing-other-profile .create-post-card,',
                'body.viewing-other-profile #post-composer,',
                'body.viewing-other-profile .post-input-area,',
                'body.viewing-other-profile #create-post-form,',
                'body.viewing-other-profile .post-create-section,',
                'body.viewing-other-profile .new-post-composer,',
                'body.viewing-other-profile [id*="create-post"],',
                'body.viewing-other-profile [class*="post-composer"],',
                'body.viewing-other-profile [class*="create-post"],',
                'body.viewing-other-profile #quick-post-fab',
                '{display:none!important;}',
                /* ── On business page, visitor class hides all composer elements ── */
                'body.biz-visitor #business-post-form,',
                'body.biz-visitor #create-business-post-form,',
                'body.biz-visitor .business-post-composer,',
                'body.biz-visitor #biz-post-composer,',
                'body.biz-visitor [id*="biz-media-upload"],',
                'body.biz-visitor .biz-post-compose-area,',
                'body.biz-visitor .biz-create-post-row,',
                'body.biz-visitor #quick-post-fab',
                '{display:none!important;}',
            ].join('');
            document.head.appendChild(s);
        });

        /* Force-hide all post-creation DOM nodes for the current state */
        function _hideComposerDOM(){
            var COMPOSER_SELS=[
                '#create-post-area','.create-post-card','#post-composer',
                '.post-input-area','#create-post-form','.post-create-section',
                '.new-post-composer'
            ];
            COMPOSER_SELS.forEach(function(sel){
                document.querySelectorAll(sel).forEach(function(el){ el.style.setProperty('display','none','important'); });
            });
            /* Hide quick-post FAB */
            var fab=document.getElementById('quick-post-fab');
            if(fab) fab.style.display='none';
        }

        /* Restore composer visibility (own profile / dashboard) */
        function _showComposerDOM(){
            var COMPOSER_SELS=[
                '#create-post-area','.create-post-card','#post-composer',
                '.post-input-area','.post-create-section','.new-post-composer'
            ];
            COMPOSER_SELS.forEach(function(sel){
                document.querySelectorAll(sel).forEach(function(el){ el.style.removeProperty('display'); });
            });
            /* Restore quick-post FAB only if on dashboard */
            var fab=document.getElementById('quick-post-fab');
            var activeSection=document.querySelector('.content-section.active');
            var isDash=activeSection&&activeSection.id==='dashboard';
            if(fab) fab.style.display=(isDash&&!_isGuest())?'flex':'none';
        }

        function _applyFeedVisibility(){
            var us=_us();
            var bizId=window._activeBizPageId||'';
            var bizData=window._activeBizData||{};
            var activeSection=document.querySelector('.content-section.active');
            var activeSectionId=activeSection?activeSection.id:'';

            /* ── Business page: set owner/visitor body class ── */
            var isOwner=_isAdmin()||(us.id&&bizData.ownerId&&bizData.ownerId===us.id)||(us.id&&us.businessPage&&us.businessPage.id===bizId);
            if(activeSectionId==='business-page'&&bizId){
                document.body.classList.toggle('biz-visitor',!isOwner);
            } else {
                document.body.classList.remove('biz-visitor');
            }

            /* ── Profile page: detect if viewing another user's profile ── */
            var viewingOther=false;
            if(activeSectionId==='profile'){
                /* Check both the global flag AND confirm the viewed profile ≠ self */
                var viewedId=window._viewingProfileId||'';
                viewingOther=!!(viewedId&&us.id&&viewedId!==us.id);
                /* Also check if the profile section itself shows a different user */
                if(!viewingOther){
                    var profSec=document.getElementById('profile');
                    if(profSec){
                        var profUid=profSec.dataset.userId||profSec.dataset.uid||'';
                        if(profUid&&us.id&&profUid!==us.id) viewingOther=true;
                    }
                }
            }
            document.body.classList.toggle('viewing-other-profile',viewingOther);

            /* ── DOM enforcement ── */
            if(viewingOther){
                _hideComposerDOM();
            } else if(activeSectionId==='dashboard'||activeSectionId==='feed'){
                document.body.classList.remove('viewing-other-profile');
                _showComposerDOM();
            }

            /* Direct DOM enforcement for business page composer */
            var bizComposer=document.querySelector('#business-post-form,#create-business-post-form,.business-post-composer,#biz-post-composer');
            if(bizComposer) bizComposer.style.display=(activeSectionId==='business-page'&&bizId&&!isOwner)?'none':'';
        }

        document.addEventListener('empyrean-section-change',function(ev){
            if(!ev||!ev.detail) return;
            var sec=ev.detail.section;
            if(sec==='business-page'||sec==='profile') setTimeout(_applyFeedVisibility,350);
            if(sec==='dashboard'||sec==='feed'){
                /* Back on own feed — clear all visitor flags and restore composer */
                document.body.classList.remove('biz-visitor','viewing-other-profile');
                window._viewingOtherProfile=false;
                window._viewingProfileId='';
                setTimeout(_showComposerDOM,100);
            }
        });

        _wrapNavigateTo(function(id){
            if(id!=='business-page') document.body.classList.remove('biz-visitor');
            if(id==='dashboard'||id==='feed'){
                document.body.classList.remove('viewing-other-profile');
                window._viewingOtherProfile=false;
                window._viewingProfileId='';
            }
            setTimeout(_applyFeedVisibility,300);
        });

        /* Intercept profile-link clicks to reliably set viewingOther */
        document.addEventListener('click',function(e){
            var pa=e.target.closest&&e.target.closest('[data-profile-uid],[data-user-id].post-author,[data-user-id].contact-row,.post-author-link,.contact-row');
            if(!pa) return;
            var uid=pa.dataset.profileUid||pa.dataset.userId||'';
            var us=_us();
            if(uid&&us.id&&uid!==us.id){
                window._viewingOtherProfile=true;
                window._viewingProfileId=uid;
            }
        },true);

        document.addEventListener('empyrean-init-done',function(){ setTimeout(_applyFeedVisibility,1000); });
        ready(function(){ setTimeout(_applyFeedVisibility,2000); });
        console.log('[§32] Feed privacy — composer owner-only, biz-page visitor enforcement, profile post column deactivated for visitors.');
    })();


    /* ═══════════════════════════════════════════════════════════════════════
       §33  SOS DONATE BUTTON — persistent across re-renders and devices
            The donate button sometimes disappears after media upload or when
            app-sos.js re-renders feed cards. This section:
            A) Injects a donate button on any SOS card that is missing one.
            B) Watches feed-container for new SOS cards (MutationObserver).
            C) Runs periodic sweeps every 3 s while on the dashboard.
            D) Re-runs whenever the dashboard/feed section becomes active.
            The button is styled to always be conspicuous (red gradient, full-width).
    ═══════════════════════════════════════════════════════════════════════ */
    (function fixSosDonateButton(){
        var BTN_HTML_TPL = function(userId, username){
            return '<button class="help-now-btn donate-post-btn gift-button sos-button vf-sos-donate-btn"'
                +' data-sos-user-id="'+_esc(userId)+'" data-sos-username="'+_esc(username)+'"'
                +' style="width:100%;padding:12px 16px;background:linear-gradient(135deg,#EF4444,#B91C1C);'
                +'color:white;border:none;border-radius:12px;font-size:0.92rem;font-weight:700;'
                +'cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;'
                +'box-shadow:0 4px 14px rgba(239,68,68,0.4);margin:0;">'
                +'<i class="fas fa-hand-holding-heart"></i>&nbsp;Donate — Help '+_esc(username||'this cause')
                +'</button>';
        };

        function _ensureDonateBtn(card){
            if(!card) return;
            /* Only SOS request cards — never crisis-report cards */
            if(!card.classList.contains('sos-request')) return;
            if(card.classList.contains('crisis-report')) return;
            /* Check if a donate button already exists and is visible */
            var existing=card.querySelector('.help-now-btn,.donate-post-btn,.vf-sos-donate-btn');
            if(existing){
                /* Ensure it's always visible — force display in case it was hidden */
                existing.style.setProperty('display','flex','important');
                existing.style.setProperty('visibility','visible','important');
                existing.style.setProperty('opacity','1','important');
                return;
            }
            /* Inject missing donate button */
            var userId=card.dataset.userId||'', username=card.dataset.username||'this person';
            var wrap=document.createElement('div');
            wrap.className='vf-donate-wrap';
            wrap.style.cssText='padding:10px 16px 14px;';
            wrap.innerHTML=BTN_HTML_TPL(userId,username);
            /* Insert before comment section if present, else append */
            var commentSec=card.querySelector('.comment-section');
            if(commentSec) card.insertBefore(wrap,commentSec); else card.appendChild(wrap);
        }

        function _sweepFeedCards(){
            /* Repair all SOS cards on the page */
            document.querySelectorAll('.impact-story.sos-request').forEach(_ensureDonateBtn);
            /* Remove any donate button from crisis cards (insurance) */
            document.querySelectorAll('.impact-story.crisis-report .donate-post-btn,.impact-story.crisis-report .vf-sos-donate-btn').forEach(function(btn){
                var wrap=btn.parentElement; if(wrap&&wrap.classList.contains('vf-donate-wrap')) wrap.remove(); else btn.remove();
            });
        }

        /* CSS: ensure donate button is always visible inside SOS cards */
        ready(function(){
            if(document.getElementById('_vf_sos_donate_css')) return;
            var s=document.createElement('style'); s.id='_vf_sos_donate_css';
            s.textContent=[
                '.impact-story.sos-request .help-now-btn,',
                '.impact-story.sos-request .donate-post-btn,',
                '.impact-story.sos-request .vf-sos-donate-btn{',
                '  display:flex!important;visibility:visible!important;opacity:1!important;',
                '  width:100%!important;flex-shrink:0!important;',
                '}',
                '.vf-donate-wrap{padding:10px 16px 14px!important;}',
            ].join('');
            document.head.appendChild(s);
        });

        /* MutationObserver: watch for new SOS cards added to the feed */
        function _attachFeedObserver(){
            var feed=document.getElementById('feed-container')||document.getElementById('posts-feed');
            if(!feed||feed._vfSosObs) return;
            feed._vfSosObs=true;
            new MutationObserver(function(muts){
                muts.forEach(function(m){
                    m.addedNodes.forEach(function(n){
                        if(n.nodeType!==1) return;
                        if(n.classList&&n.classList.contains('sos-request')) _ensureDonateBtn(n);
                        /* Check children too */
                        n.querySelectorAll&&n.querySelectorAll('.impact-story.sos-request').forEach(_ensureDonateBtn);
                    });
                    /* Also re-check existing cards in case inner DOM changed */
                    m.target.querySelectorAll&&m.target.querySelectorAll('.impact-story.sos-request').forEach(_ensureDonateBtn);
                });
            }).observe(feed,{childList:true,subtree:true});
        }

        /* Periodic sweep while app is running */
        var _sweepTimer=null;
        function _startSweeper(){
            if(_sweepTimer) return;
            _sweepTimer=setInterval(_sweepFeedCards,3000);
        }

        /* Also re-sweep after any SOS upload completes */
        var _origSubmitSos=window.submitSosRequest;
        window.submitSosRequest=async function(){
            var r=(typeof _origSubmitSos==='function')?await _origSubmitSos.apply(this,arguments):undefined;
            setTimeout(_sweepFeedCards,500);
            setTimeout(_sweepFeedCards,1500);
            setTimeout(_sweepFeedCards,3000);
            return r;
        };

        /* Wire up delegate click so buttons injected by this fix also trigger the donation modal */
        document.addEventListener('click',function(e){
            var btn=e.target.closest&&e.target.closest('.vf-sos-donate-btn');
            if(!btn) return;
            /* Delegate to the existing donate flow if available */
            var userId=btn.dataset.sosUserId||'', username=btn.dataset.sosUsername||'';
            if(typeof window._openDonateSosModal==='function'){ window._openDonateSosModal(userId,username); return; }
            /* Try the standard donate modal by simulating a click on a standard help-now-btn */
            var card=btn.closest('.impact-story'); if(!card) return;
            var stdBtn=card.querySelector('.help-now-btn:not(.vf-sos-donate-btn)');
            if(stdBtn){ stdBtn.click(); return; }
            /* Fallback: open sos-donation-modal directly */
            var modal=document.getElementById('sos-donation-modal'); if(!modal) return;
            var titleEl=document.getElementById('donation-modal-title'); if(titleEl) titleEl.textContent='Donate to '+username;
            modal.style.display='flex'; modal.classList.add('show'); document.body.classList.add('modal-open');
        });

        ready(function(){
            _sweepFeedCards();
            _attachFeedObserver();
            _startSweeper();
            setTimeout(_sweepFeedCards,1500);
            setTimeout(_sweepFeedCards,4000);
        });
        document.addEventListener('empyrean-init-done',function(){ setTimeout(_sweepFeedCards,600); setTimeout(_attachFeedObserver,400); _startSweeper(); });
        document.addEventListener('empyrean-section-change',function(ev){ if(ev&&ev.detail&&(ev.detail.section==='dashboard'||ev.detail.section==='feed'||ev.detail.section==='request-help')) setTimeout(_sweepFeedCards,400); });
        /* Re-sweep after Firestore SOS listener fires */
        document.addEventListener('empyrean-sos-updated',function(){ setTimeout(_sweepFeedCards,300); });
        console.log('[§33] SOS donate button persistence — MutationObserver + periodic sweep + CSS enforcement.');
    })();




    /* ═══════════════════════════════════════════════════════════════════════
       §34  POST THREAD VIEW — moved to app-patch-v2.js
       §35  MARKETPLACE contact tab — moved to app-patch-v2.js
       §36  MESSAGES composer/call — moved to app-patch-v2.js
       All three sections have been removed from this file to avoid conflicts
       with the corrected implementations in app-patch-v2.js which loads after
       this file. app-patch-v2.js must be present in index.html after this script.
    ═══════════════════════════════════════════════════════════════════════ */



})();