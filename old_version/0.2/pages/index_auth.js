/**
 * 首页认证与云同步：Firebase 身份验证、个人资料和抽卡数据同步。
 * 由 index.html 底部加载，保持原先的依赖和执行顺序。
 * 保留 ES Module 类型，支持 Firebase 的原生 import。
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
        // 🌟 核心包引入：加入了 runTransaction (保证用户数计数器并发安全), serverTimestamp 等
        import { getFirestore, collection, doc, getDoc, setDoc, getDocs, runTransaction, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

        // Firebase 秘钥配置
        const firebaseConfig = {
            apiKey: "AIzaSyBr9xYxp9dQvdf2gkr1ILeEqkn6Bt1CZmI",
            authDomain: "fyp-gacha-system.firebaseapp.com",
            databaseURL: "https://fyp-gacha-system-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "fyp-gacha-system",
            storageBucket: "fyp-gacha-system.firebasestorage.app",
            messagingSenderId: "892136562526",
            appId: "1:892136562526:web:6d2b218ec3f1bc346b79cf",
            measurementId: "G-5WQ8HNPC3D"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' }); // 强制要求 Google 弹出账号选择界面

        // 挂载到全局方便外部或其他非 module 的 script 可能会用到
        window.firebaseDb = db;
        window.firebaseAuth = auth;

        /**
         * 自动初始化或拉取用户云端基本资料
         * @param {Object} user Firebase 身份验证对象
         * @param {Object} additionalData 包含显示名称等可选数据的字典
         */
        async function initializeUserProfile(user, additionalData = {}) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            // 如果该 UID 不存在文档，说明是首次注册的新用户
            if (!userSnap.exists()) {
                const counterRef = doc(db, "system", "counters");
                let customUid = "";
                try {
                    // 开启事务 (Transaction)，确保多个新用户同时注册时不会发生分配相同 customUid 的并发冲突
                    customUid = await runTransaction(db, async (transaction) => {
                        const counterSnap = await transaction.get(counterRef);
                        let newCount = 1;
                        if (!counterSnap.exists()) {
                            transaction.set(counterRef, { userCount: 1 });
                        } else { 
                            newCount = (counterSnap.data().userCount || 0) + 1; 
                            transaction.update(counterRef, { userCount: newCount }); 
                        }
                        // 组装格式化专属数字 ID，例如 U000105
                        return "U" + String(newCount).padStart(6, '0');
                    });
                    
                    const profileData = { 
                        customUid: customUid, 
                        email: user.email, 
                        displayName: additionalData.displayName || user.displayName || "玩家_" + customUid, 
                        avatar: user.photoURL || "", 
                        createdAt: serverTimestamp() 
                    };
                    // 把资料存储进个人中心
                    await setDoc(userRef, profileData, { merge: true });
                    return profileData;
                } catch (error) { throw error; }
            }
            return userSnap.data();
        }

        // ==========================================
        // 🌟 核心引擎：多端数据双向智能融合与覆盖逻辑
        // 根据弹窗中用户的选择策略，安全地合并本地 localStorage 和 Firebase Firestore 的数据
        // ==========================================
        window.executeDataSync = async (mode) => {
            const user = auth.currentUser;
            if (!user) return;
            
            // 锁定界面以防止重复点击，并在标题给出处理中的反馈
            document.getElementById('sync-title').innerText = window.getTrans('sync_in_progress');
            document.querySelectorAll('.sync-option').forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.5'; });

            try {
                // 1. 发起两轮并发请求，拉取该用户在云端保存的所有"引擎数据"和"抽卡记录分片"
                const enginesSnap = await getDocs(collection(db, "users", user.uid, "custom_engines"));
                const recordsSnap = await getDocs(collection(db, "users", user.uid, "gacha_records"));

                // 梳理云端引擎列表
                let cloudEngines = {};
                enginesSnap.forEach(d => cloudEngines[d.id] = d.data());

                // 梳理云端抽卡记录，进行碎片拼合
                let cloudRecords = {};
                recordsSnap.forEach(docSnap => {
                    let d = docSnap.data();
                    if(!cloudRecords[d.gameId]) cloudRecords[d.gameId] = {};
                    if(!cloudRecords[d.gameId][d.poolId]) cloudRecords[d.gameId][d.poolId] = [];
                    // 解析类似 '0001_迪卢克' 的 key 值将其逆向还原为有序数组
                    let keys = Object.keys(d.data || {});
                    keys.forEach(k => {
                        let idx = parseInt(k.split('_')[0]) - 1; 
                        cloudRecords[d.gameId][d.poolId][idx] = d.data[k];
                    });
                });

                // 安全的 JSON 解析工具，防止本地数据损坏导致页面卡死
                const safeParse = (str) => { try { return str && str !== 'undefined' ? JSON.parse(str) : null; } catch(e) { return null; } };

                // 2. 梳理全局 GameID，找到需要合并的所有游戏集合 (并集)
                let localGamesList = safeParse(localStorage.getItem('GM_Custom_Games_List')) || [];
                let mergedGamesMap = new Map();
                // 录入本地游戏名录
                localGamesList.forEach(g => mergedGamesMap.set(g.id, g));
                // 追加录入云端独有或已存在的游戏名录
                Object.keys(cloudEngines).forEach(gId => mergedGamesMap.set(gId, {id: gId, name: cloudEngines[gId].gameName}));
                
                let finalGamesList = Array.from(mergedGamesMap.values());

                // 策略：如果彻底废弃本地以云端为准，先斩后奏清理掉本地相关所有的键值对
                if (mode === 'cloud_only') {
                    finalGamesList = Object.keys(cloudEngines).map(gId => ({id: gId, name: cloudEngines[gId].gameName}));
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        let key = localStorage.key(i);
                        if (key && key.startsWith('GM_')) localStorage.removeItem(key);
                    }
                }
                // 把融合后的名录先行覆盖
                localStorage.setItem('GM_Custom_Games_List', JSON.stringify(finalGamesList));

                // 3. 开始执行逐个游戏的深度双向融合算法
                for (let game of finalGamesList) {
                    let gId = game.id;
                    let cEngine = cloudEngines[gId]; // 取出云端对应的游戏引擎
                    
                    // 取出本地该游戏引擎的三个核心碎片
                    let lInfo = safeParse(localStorage.getItem(`GM_Info_${gId}`));
                    let lRoster = safeParse(localStorage.getItem(`GM_Roster_${gId}`));
                    let lRosterPools = safeParse(localStorage.getItem(`GM_RosterPools_${gId}`));
                    let lEngine = null;
                    if (lInfo) {
                        lEngine = { gameName: lInfo.gameName || gId, info: lInfo, roster: lRoster || {}, rosterPools: lRosterPools || [] };
                    }

                    // --- 模块 A: 游戏引擎本体融合 (Info, Roster, RosterPools) ---
                    let finalEngine = null;
                    let needsUploadEngine = false; // 是否需要将本地最新引擎反哺上传的标记

                    if (mode === 'cloud_only') {
                        finalEngine = cEngine;
                    } else if (mode === 'cloud_first') {
                        if (cEngine) {
                            finalEngine = cEngine; // 发生冲突或皆有情况，尊崇云端版本
                        } else if (lEngine) {
                            finalEngine = lEngine; // 云端无对应游戏，用本地充当并开启上传通道
                            needsUploadEngine = true;
                        }
                    } else if (mode === 'local_first') {
                        if (lEngine) {
                            finalEngine = lEngine; // 尊崇本地版本，并强制推向云端进行覆盖
                            needsUploadEngine = true; 
                        } else if (cEngine) {
                            finalEngine = cEngine; // 本地无此游戏但云端有（比如新手机换机场景），将其下载
                        }
                    }

                    // 如果决胜出了该游戏的最终引擎，存入本地
                    if (finalEngine) {
                        localStorage.setItem(`GM_Info_${gId}`, JSON.stringify(finalEngine.info || {}));
                        localStorage.setItem(`GM_Roster_${gId}`, JSON.stringify(finalEngine.roster || {}));
                        if (finalEngine.rosterPools) localStorage.setItem(`GM_RosterPools_${gId}`, JSON.stringify(finalEngine.rosterPools));
                        
                        // 若触发上传标记，利用 setDoc 对远程执行并集融合更新
                        if (needsUploadEngine) {
                            await setDoc(doc(db, "users", user.uid, "custom_engines", gId), {
                                gameName: finalEngine.gameName || gId,
                                info: finalEngine.info || {}, roster: finalEngine.roster || {}, rosterPools: finalEngine.rosterPools || [],
                                lastModified: serverTimestamp()
                            }, { merge: true });
                        }
                    }

                    // --- 模块 B: 抽卡记录数组精细化融合算法 ---
                    // 找出所有存在该游戏数据的池子ID
                    let poolIds = new Set();
                    if (cloudRecords[gId]) Object.keys(cloudRecords[gId]).forEach(p => poolIds.add(p));
                    for (let i = 0; i < localStorage.length; i++) {
                        let key = localStorage.key(i);
                        if (key && key.startsWith(`GM_Data_${gId}_`)) poolIds.add(key.replace(`GM_Data_${gId}_`, ''));
                    }

                    for (let pId of poolIds) {
                        let cArr = (cloudRecords[gId] && cloudRecords[gId][pId]) ? cloudRecords[gId][pId] : [];
                        let lArr = safeParse(localStorage.getItem(`GM_Data_${gId}_${pId}`)) || [];
                        // 净化可能出现的缺失或稀疏数组现象
                        cArr = Array.from(cArr, item => item || null);

                        let mergedArr = [];
                        if (mode === 'cloud_only') {
                            mergedArr = cArr; // 纯云端模式直接舍弃比对环节
                        } else {
                            // 以两者中最长的一方为界限开始补全遍历
                            let maxLen = Math.max(cArr.length, lArr.length);
                            for(let i=0; i<maxLen; i++) {
                                let cItem = cArr[i];
                                let lItem = lArr[i];
                                if (mode === 'cloud_first') {
                                    // 【云端优先】：有分歧优先采纳云端，云端没数据（数组超出其长度）则把本地特有的多出数据追加进去
                                    mergedArr[i] = (cItem !== undefined && cItem !== null) ? cItem : lItem;
                                } else if (mode === 'local_first') {
                                    // 【本地优先】：有分歧采纳本地，本地没有这条数据(如早期没录)则采纳云端历史记录进行填补
                                    mergedArr[i] = (lItem !== undefined && lItem !== null) ? lItem : cItem;
                                }
                            }
                        }

                        // 清理数组末尾的空洞垃圾 (Null)，防止污染后续逻辑
                        while(mergedArr.length > 0 && mergedArr[mergedArr.length - 1] === null) mergedArr.pop();

                        // 落入本地
                        if (mergedArr.length > 0) {
                            localStorage.setItem(`GM_Data_${gId}_${pId}`, JSON.stringify(mergedArr));
                        } else {
                            localStorage.removeItem(`GM_Data_${gId}_${pId}`);
                        }

                        // 分片同步机制：向云端重新交卷以保证双端严格一致
                        // 为了绕过单文档1MB上限，按最大 9000 条切割上传区块 (Chunk)
                        const CHUNK_SIZE = 9000;
                        const totalChunks = Math.ceil(mergedArr.length / CHUNK_SIZE) || 1;
                        for (let i = 0; i < totalChunks; i++) {
                            const chunkArray = mergedArr.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                            const cloudReadableData = {};
                            chunkArray.forEach((item, index) => {
                                if(!item) return;
                                // 还原如 00001_神里绫华 样式的键，便于控制台审查
                                const pullNum = String((i * CHUNK_SIZE) + index + 1).padStart(5, '0');
                                cloudReadableData[`${pullNum}_${item.name || '空'}`] = item;
                            });
                            // 分批异步写回云端集合中
                            await setDoc(doc(db, "users", user.uid, "gacha_records", `${gId}_${pId}_pt${i + 1}`), {
                                gameId: gId, poolId: pId, part: i + 1, data: cloudReadableData, lastModified: serverTimestamp()
                            });
                        }
                    }
                }

                // 给该会话作上完成同步的标记，防止刷新后不断弹窗
                sessionStorage.setItem('GM_HasSynced', 'true');
                document.getElementById('syncModalOverlay').style.display = 'none';
                
                alert(window.getTrans('alert_sync_success'));
                        location.reload(); 

                    } catch(e) {
                        console.error(e);
                        document.getElementById('syncModalOverlay').style.display = 'none';
                        // 专门识别是否因为触发了 Firebase 免费额度的上限错误 (读写过多)
                        if (e.code === 'resource-exhausted' || (e.message && e.message.includes('Quota'))) {
                            alert(window.getTrans('alert_sync_quota'));
                        } else {
                            alert(window.getTrans('alert_sync_error') + e.message + window.getTrans('alert_local_safe'));
                        }
                    }
        };

        // ==========================================
        // 🌟 监听用户全局身份状态及界面调度
        // ==========================================
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 如果已登录，获取/初始化云端用户信息
                try {
                    const userProfile = await initializeUserProfile(user);
            
                    // 切换前端展示面板：隐去登录按钮，显示欢迎语及用户头像
                    document.getElementById('guest-panel').style.display = 'none';
                    document.getElementById('user-panel').style.display = 'block';
            
                    const displayName = userProfile.displayName || user.email.split('@')[0];
                    document.getElementById('display-username').innerText = displayName;

                    // 优先展示自定义头像，其次展示 Google 帐号头像，最后以降级文字显示
                    const avatarContainer = document.getElementById('display-avatar-home');
                    if (userProfile.avatar) {
                        avatarContainer.innerHTML = `<img src="${userProfile.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
                    } else if (user.photoURL) {
                        avatarContainer.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; object-fit:cover;">`;
                    } else {
                        avatarContainer.innerText = displayName.charAt(0).toUpperCase();
                    }
            
                    // ==========================================
                    // 接收处理跳转传参或触发默认数据同步逻辑
                    // ==========================================
                    const forceSyncMode = sessionStorage.getItem('GM_ForceSync');
                    const hasSynced = sessionStorage.getItem('GM_HasSynced');

                    // 1. 若是从 settings.html 发来的强制云端动作指令
                    if (forceSyncMode) {
                        sessionStorage.removeItem('GM_ForceSync');
                        let mode = 'cloud_first';
                        if (forceSyncMode === 'push') mode = 'local_first'; // "强制推向云端"对应本地优先全覆盖
                        if (forceSyncMode === 'pull') mode = 'cloud_only';  // "强制从云端覆盖"对应无脑信任云端
                        
                        window.executeDataSync(mode);
                    } 
                    // 2. 正常场景，检测在当前一次浏览中是否已经触发过同步机制弹窗，若未触发则呼出
                    else if (!hasSynced) {
                        document.getElementById('syncModalOverlay').style.display = 'flex';
                    }
            
                } catch (error) {
                    console.error("加载首页用户信息出错:", error);
                }
            } else {
                // 若用户退出或未登录，恢复界面初始访客状态
                document.getElementById('guest-panel').style.display = 'block';
                document.getElementById('user-panel').style.display = 'none';
                sessionStorage.removeItem('GM_HasSynced'); // 登出时销毁会话同步标记，为下次登录做准备
            }
        });

        // ==========================================
        // 拦截表单提交：处理原生邮箱与密码登录/注册
        // ==========================================
        window.handleAuthSubmit = async (e) => {
            e.preventDefault(); // 阻止 form 自带的刷新动作
            const isLogin = document.getElementById('tab-login').classList.contains('active');
            const inputs = document.querySelectorAll('.auth-input');
            const email = inputs[0].value; 
            const pwd = inputs[1].value;

            try {
                if (isLogin) {
                    // 调用 Firebase Auth 进行邮箱登录验证
                    await signInWithEmailAndPassword(auth, email, pwd);
                } else {
                    // 注册校验：校验两次密码输入的一致性
                    const confirmPwd = inputs[2].value;
                    if (pwd !== confirmPwd) return alert(window.getTrans('alert_pwd_mismatch'));
                    const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
                    // 注册成功后立刻为其在云端开辟用户资料库
                    await initializeUserProfile(userCredential.user);
                    alert(window.getTrans('alert_reg_success'));
                }
                // 成功后关闭遮罩弹窗
                document.getElementById('authModalOverlay').style.display = 'none';
            } catch (error) { 
                // 捕获可能产生的网络错/配额满等异常
                if (error.code === 'resource-exhausted' || (error.message && error.message.includes('Quota'))) {
                    alert(window.getTrans('alert_quota_full'));
                } else {
                    alert(window.getTrans('alert_login_fail') + error.message); 
                }
            }
        };

