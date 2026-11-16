/**
 * 设置页账户操作：Firebase 登录状态、账户界面及相关操作。
 * 由 settings.html 底部加载，保持原先的依赖和执行顺序。
 * 保留 ES Module 类型，支持 Firebase 的原生 import。
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc, runTransaction, serverTimestamp, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyBr9xYxp9dQvdf2gkr1ILeEqkn6Bt1CZmI",
            authDomain: "fyp-gacha-system.firebaseapp.com",
            projectId: "fyp-gacha-system",
            databaseURL: "https://fyp-gacha-system-default-rtdb.asia-southeast1.firebasedatabase.app",
            storageBucket: "fyp-gacha-system.firebasestorage.app",
            messagingSenderId: "892136562526",
            appId: "1:892136562526:web:6d2b218ec3f1bc346b79cf"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        let currentCustomAvatar = null; 
        let currentUserProfile = null;

        // 获取并同步用户基础资料库
        async function initializeUserProfile(user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const counterRef = doc(db, "system", "counters");
                try {
                    const customUid = await runTransaction(db, async (transaction) => {
                        const counterSnap = await transaction.get(counterRef);
                        let newCount = 1;
                        if (!counterSnap.exists()) { transaction.set(counterRef, { userCount: 1 }); } 
                        else { newCount = (counterSnap.data().userCount || 0) + 1; transaction.update(counterRef, { userCount: newCount }); }
                        return "U" + String(newCount).padStart(6, '0');
                    });

                    const profileData = { customUid: customUid, email: user.email, displayName: user.displayName || "玩家_" + customUid, avatar: user.photoURL || "", createdAt: serverTimestamp() };
                    await setDoc(userRef, profileData, { merge: true });
                    return profileData;
                } catch (error) { throw error; }
            }
            return userSnap.data();
        }

        onAuthStateChanged(auth, async (user) => {
            document.getElementById('acc-loading').style.display = 'none';
            if (user) {
                try {
                    currentUserProfile = await initializeUserProfile(user);
                    document.getElementById('acc-logged-in').style.display = 'flex';
                    document.getElementById('acc-logged-out').style.display = 'none';
                    
                    document.getElementById('display-name').innerText = `${currentUserProfile.displayName} (${currentUserProfile.customUid})`;
                    document.getElementById('display-email').innerText = currentUserProfile.email || user.email;

                    currentCustomAvatar = currentUserProfile.avatar;
                    if (currentCustomAvatar) {
                        document.getElementById('display-avatar').innerHTML = `<img src="${currentCustomAvatar}" style="width:100%; height:100%; object-fit:cover;">`;
                    } else {
                        document.getElementById('display-avatar').innerHTML = (currentUserProfile.displayName || '?').charAt(0).toUpperCase();
                    }

                    if (!sessionStorage.getItem('GM_HasSynced')) {
                        window.location.href = 'index.html'; 
                    }
                } catch(e) { 
                    console.error("加载资料出错", e); 
                }
            } else {
                document.getElementById('acc-logged-in').style.display = 'none';
                document.getElementById('acc-logged-out').style.display = 'flex';
                currentCustomAvatar = null;
                currentUserProfile = null;
            }
        });

        window.logoutAccount = async () => {
            const msg = window.getTrans ? window.getTrans('confirm_logout') : "确认登出？";
            if(await window.customConfirm(msg)) {
                await auth.signOut();
                const successMsg = window.getTrans ? window.getTrans('alert_logout_success') : "已成功登出。";
                await window.customAlert(successMsg);
                location.reload();
            }
        };

        window.openAuthModal = () => {
            document.getElementById('authModalOverlay').style.display = 'flex';
            window.switchAuthTab('login');
        };

        window.switchAuthTab = (mode) => {
            const tLogin = document.getElementById('tab-login');
            const tRegister = document.getElementById('tab-register');
            const confirmPwdGroup = document.getElementById('group-confirm-pwd');
            const submitBtn = document.getElementById('btn-auth-submit');
            
            if (mode === 'login') {
                tLogin.classList.add('active'); tRegister.classList.remove('active');
                confirmPwdGroup.style.display = 'none'; 
                submitBtn.innerText = window.getTrans ? window.getTrans('auth_btn_login') : "登录";
            } else {
                tRegister.classList.add('active'); tLogin.classList.remove('active');
                confirmPwdGroup.style.display = 'block'; 
                submitBtn.innerText = window.getTrans ? window.getTrans('auth_btn_register') : "注册新账号";
            }
        };
        
        window.realGoogleLogin = async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                await initializeUserProfile(result.user);
                document.getElementById('authModalOverlay').style.display = 'none';
                await window.customAlert(`登录/切换成功！`);
            } catch(error) { 
                if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                    await window.customAlert("登录失败: " + error.message); 
                }
            }
        };

        window.handleAuthSubmit = async (e) => {
            e.preventDefault();
            const isLogin = document.getElementById('tab-login').classList.contains('active');
            const inputs = document.querySelectorAll('.auth-input');
            const email = inputs[0].value; const pwd = inputs[1].value;
            try {
                if (isLogin) {
                    await signInWithEmailAndPassword(auth, email, pwd);
                } else {
                    const confirmPwd = inputs[2].value;
                    const errMismatch = window.getTrans ? window.getTrans('alert_pwd_mismatch') : "密码不一致";
                    if (pwd !== confirmPwd) return await window.customAlert(errMismatch);
                    
                    const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
                    await initializeUserProfile(userCredential.user);
                    const successMsg = window.getTrans ? window.getTrans('alert_reg_success') : "注册成功";
                    await window.customAlert(successMsg);
                }
                document.getElementById('authModalOverlay').style.display = 'none';
            } catch (error) { 
                if (error.code === 'resource-exhausted' || (error.message && error.message.includes('Quota'))) {
                    const quotaMsg = window.getTrans ? window.getTrans('alert_quota_full') : "资源配额超限";
                    await window.customAlert(quotaMsg);
                } else {
                    const failMsg = window.getTrans ? window.getTrans('alert_login_fail') : "登录失败：";
                    await window.customAlert(failMsg + error.message); 
                }
            }
        };

        window.handleForgotPassword = async () => {
            const email = document.getElementById('auth-email').value;
            if (!email) {
                const noEmailMsg = window.getTrans ? window.getTrans('alert_empty_email_reset') : "请先输入邮箱";
                return await window.customAlert(noEmailMsg);
            }
            try {
                await sendPasswordResetEmail(auth, email);
                const successMsg = window.getTrans ? window.getTrans('alert_reset_email_sent') : "重置邮件已发送";
                await window.customAlert(successMsg);
            } catch (error) { 
                const failMsg = window.getTrans ? window.getTrans('alert_op_fail') : "操作失败：";
                await window.customAlert(failMsg + error.message); 
            }
        };

        let tempAvatarBase64 = null;
        // 头像居中裁成正方形；公共组件处理图片，本页仍负责预览及保存到用户资料。
        const avatarImageUploader = window.ImageUpload.createInputHandler({
            options: { mode: 'square', maxSize: 150, quality: 0.8 },
            onReady({ dataURL }) {
                tempAvatarBase64 = dataURL;
                document.getElementById('edit-avatar-preview').innerHTML = `<img src="${dataURL}" style="width:100%; height:100%; object-fit:cover;">`;
            },
            onError(error) {
                console.error(error);
                return window.customAlert((localStorage.getItem('GM_Lang') || 'zh') === 'en'
                    ? 'Unable to read this image. Please choose another image.' : '图片读取失败，请选择其他图片。');
            }
        });

        window.openProfileModal = () => {
            if (!currentUserProfile) return;
            avatarImageUploader.cancelPending();
            document.getElementById('edit-name').value = currentUserProfile.displayName || '';
            tempAvatarBase64 = null;
            if (currentCustomAvatar) {
                document.getElementById('edit-avatar-preview').innerHTML = `<img src="${currentCustomAvatar}" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                document.getElementById('edit-avatar-preview').innerHTML = (currentUserProfile.displayName || '?').charAt(0).toUpperCase();
            }
            document.getElementById('profileModalOverlay').style.display = 'flex';
        };

        window.handleAvatarSelect = event => avatarImageUploader.handle(event);

        window.saveProfile = async () => {
            const user = auth.currentUser;
            if (!user || !currentUserProfile) return;
            const newName = document.getElementById('edit-name').value.trim();
            try {
                const updates = {};
                if (newName && newName !== currentUserProfile.displayName) updates.displayName = newName;
                if (tempAvatarBase64) updates.avatar = tempAvatarBase64;

                if (Object.keys(updates).length > 0) {
                    await setDoc(doc(db, "users", user.uid), updates, { merge: true });
                    const successMsg = window.getTrans ? window.getTrans('alert_save_success') : "保存成功";
                    await window.customAlert(successMsg);
                    document.getElementById('profileModalOverlay').style.display = 'none';
                    location.reload(); 
                } else {
                    document.getElementById('profileModalOverlay').style.display = 'none';
                }
            } catch (error) { 
                await window.customAlert("保存失败: " + error.message); 
            }
        };

        window.openPasswordModal = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const isPasswordProvider = user.providerData.some(p => p.providerId === 'password');
            if (!isPasswordProvider) {
                const thirdPartyMsg = window.getTrans ? window.getTrans('alert_third_party_pwd') : "第三方登录无法修改密码。";
                return await window.customAlert(thirdPartyMsg);
            }
            document.getElementById('old-pwd').value = '';
            document.getElementById('new-pwd').value = '';
            document.getElementById('confirm-new-pwd').value = '';
            document.getElementById('passwordModalOverlay').style.display = 'flex';
        };

        window.savePassword = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const oldPwd = document.getElementById('old-pwd').value;
            const newPwd = document.getElementById('new-pwd').value;
            const confirmNewPwd = document.getElementById('confirm-new-pwd').value;

            if (!oldPwd || !newPwd || !confirmNewPwd) return await window.customAlert("⚠️ 请完整填写所有密码输入框！");
            if (newPwd !== confirmNewPwd) return await window.customAlert("❌ 两次输入的新密码不一致！");
            if (newPwd.length < 6) return await window.customAlert("❌ 新密码至少需要 6 个字符！");

            try {
                const credential = EmailAuthProvider.credential(user.email, oldPwd);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPwd);
                
                const successMsg = window.getTrans ? window.getTrans('alert_pwd_success') : "密码修改成功";
                await window.customAlert(successMsg);
                document.getElementById('passwordModalOverlay').style.display = 'none';
            } catch (error) {
                if (error.code === 'auth/invalid-credential') {
                    const invalidMsg = window.getTrans ? window.getTrans('alert_invalid_old_pwd') : "旧密码错误";
                    await window.customAlert(invalidMsg);
                } else {
                    await window.customAlert("密码修改失败: " + error.message);
                }
            }
        };

        window.triggerForceSync = async (mode) => {
            if(!auth.currentUser) return await window.customAlert("⚠️ 请先登录账号！");
            
            let confirmMsg = mode === 'push' ? 
                (window.getTrans ? window.getTrans('confirm_push_cloud') : "确认推送到云端？") : 
                (window.getTrans ? window.getTrans('confirm_pull_cloud') : "确认从云端拉取？");
            
            if (await window.customConfirm(confirmMsg)) {
                sessionStorage.setItem('GM_ForceSync', mode);
                window.location.href = 'index.html';
            }
        };

