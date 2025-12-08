/* ============================================================
   KINO IA - SCRIPT.JS (FINAL) + Firebase Auth (Google + Email)
   - Mantido o comportamento original do seu arquivo
   - Adicionadas funções Firebase sem remover nada
   - Usei SDK modular via CDN (compatível com <script type="module">)
   ============================================================ */

/* -------------------------
   Firebase SDK imports (CDN modular v9+)
   - Mantive como imports ES modules para seu script ser usado
     via <script type="module" src="script.js"></script>
   - Se quiser usar npm + bundler eu converto as imports facilmente.
   ------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ============================================================
   Substitute with your Firebase config (you posted earlier)
   Keep this file private; it's needed for auth to work.
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCiUU_rKTl0R59DOePgzIFymyCiT8-do-M",
  authDomain: "kinoia-de763.firebaseapp.com",
  projectId: "kinoia-de763",
  storageBucket: "kinoia-de763.firebasestorage.app",
  messagingSenderId: "215235666094",
  appId: "1:215235666094:web:357a492602f4897a36cd3f",
  measurementId: "G-7L92XP41L1"
};

/* -------------------------
   Initialize Firebase app + Auth
   ------------------------- */
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

/* ============================================================
   Helper selectors (kept from your original file)
   ============================================================ */
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

/* ============================================================
   PREFERÊNCIAS (mantidas)
   ============================================================ */

const PREF_KEY = "kino_prefs_v2";

function getDefaultPrefs() {
    return {
        dark: false,
        fontsize: "normal",
        defaultModel: "gpt-4.1"
    };
}

function loadPreferences() {
    const raw = localStorage.getItem(PREF_KEY);
    let prefs;

    try {
        prefs = raw ? JSON.parse(raw) : null;
    } catch {
        prefs = null;
    }

    if (!prefs) {
        prefs = getDefaultPrefs();
        localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    }

    // Atualizar UI
    if (qs("#setting-darkmode")) qs("#setting-darkmode").checked = !!prefs.dark;
    if (qs("#setting-fontsize")) qs("#setting-fontsize").value = prefs.fontsize || "normal";
    if (qs("#setting-default-model")) qs("#setting-default-model").value = prefs.defaultModel || "gpt-4.1";

    applyPreferences(prefs);
}

function savePreferences() {
    const prefs = {
        dark: !!qs("#setting-darkmode")?.checked,
        fontsize: qs("#setting-fontsize")?.value || "normal",
        defaultModel: qs("#setting-default-model")?.value || "gpt-4.1"
    };

    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    applyPreferences(prefs);
    closeModal("configModal");
}

function applyPreferences(p) {
    if (!p) p = getDefaultPrefs();

    /* MODO ESCURO */
    document.body.classList.toggle("dark", !!p.dark);

    /* TAMANHO DA FONTE */
    document.body.classList.remove("font-small", "font-large");
    if (p.fontsize === "small") document.body.classList.add("font-small");
    if (p.fontsize === "large") document.body.classList.add("font-large");

    /* MODELO PADRÃO */
    if (qs("#model-select")) qs("#model-select").value = p.defaultModel;
}

/* ============================================================
   MODAL SYSTEM (melhorias: toggling body.modal-open, animações)
   - Mantive a lógica e adicionei body.modal-open para bloquear scroll
   ============================================================ */

function openModal(id) {
    const modal = qs(`#${id}`);
    if (!modal) return;

    // Fechar outros modais
    qsa(".modal.active").forEach(m => {
        if (m.id !== id) closeModal(m.id);
    });

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    // animação do conteúdo
    const content = modal.querySelector(".modal-content");
    if (content) {
        content.style.animation = "popIn .22s ease";
        content.style.transform = "";
    }

    // bloquear scroll de fundo
    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = qs(`#${id}`);
    if (!modal) return;

    const content = modal.querySelector(".modal-content");
    if (content) {
        content.style.animation = "none";
        content.style.transform = "translateY(6px)";
    }

    setTimeout(() => {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");

        if (content) {
            content.style.animation = "";
            content.style.transform = "";
        }

        // se não tiver mais modais ativos, liberar scroll
        if (!document.querySelector(".modal.active")) {
            document.body.classList.remove("modal-open");
        }
    }, 140);
}

// clique fora fecha modal (mantido)
window.addEventListener("click", (ev) => {
    qsa(".modal.active").forEach(modal => {
        if (ev.target === modal) closeModal(modal.id);
    });
});

/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    // MENU HAMBÚRGUER
    qs("#hamburgerBtn")?.addEventListener("click", () =>
        qs("#navMenu")?.classList.toggle("active")
    );

    // CONFIGURAÇÕES
    qs("#link-config")?.addEventListener("click", e => {
        e.preventDefault();
        openModal("configModal");
    });

    qs("#closeConfig")?.addEventListener("click", () => closeModal("configModal"));
    qs("#saveSettings")?.addEventListener("click", savePreferences);

    // LIVE DARK MODE
    const darkToggle = qs("#setting-darkmode");
    if (darkToggle)
        darkToggle.addEventListener("change", () => {
            const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
            prefs.dark = !!darkToggle.checked;
            localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
            applyPreferences(prefs);
        });

    // ACCOUNT MODAL
    qs("#link-account")?.addEventListener("click", e => {
        e.preventDefault();
        openModal("accountModal");
    });

    qs("#closeAccount")?.addEventListener("click", () => closeModal("accountModal"));

    // TABS DA CONTA
    qsa(".account-tabs .tab").forEach(btn =>
        btn.addEventListener("click", () => activateTab(btn.getAttribute("data-tab")))
    );

    // BOTÕES PLACEHOLDER LOGIN (mantidos)
    qs("#btn-login")?.addEventListener("click", userLoginPlaceholder);
    qs("#btn-signup")?.addEventListener("click", userSignupPlaceholder);
    qs("#btn-logout")?.addEventListener("click", userLogoutPlaceholder);

    // BOTÕES FIREBASE (se existirem no HTML, conectamos)
    qs("#btn-google-login")?.addEventListener("click", firebaseSignInWithGoogle);
    qs("#btn-email-login")?.addEventListener("click", firebaseSignInWithEmailFromForm);
    qs("#btn-email-signup")?.addEventListener("click", firebaseSignupWithEmailFromForm);
    qs("#btn-firebase-logout")?.addEventListener("click", firebaseSignOut);

    // PREMIUM FLOW
    qs("#premium-upgrade")?.addEventListener("click", () => openModal("upgradeModal"));
    qs("#premium-signup")?.addEventListener("click", () => { closeModal("premiumPrompt"); openModal("accountModal"); });
    qs("#premium-login")?.addEventListener("click", () => { closeModal("premiumPrompt"); openModal("accountModal"); });

    qs("#congratsStartUsing")?.addEventListener("click", () => closeModal("congratsModal"));
    qs("#congratsClose")?.addEventListener("click", () => closeModal("congratsModal"));

    qsa(".plan-choose").forEach(btn =>
        btn.addEventListener("click", () => {
            closeModal("upgradeModal");
            openModal("congratsModal");
        })
    );

    qs("#btn-create")?.addEventListener("click", onGenerateClick);

    // Inicialização
    loadPreferences();
    refreshCreditsDisplay();
    activateTab("profile");

    // Inicializa observador de auth do Firebase
    initFirebaseAuthObserver();
});

/* ============================================================
   TABS DA CONTA (mantidas)
   ============================================================ */

function activateTab(tab) {
    qsa(".tab-content").forEach(c => c.classList.add("hidden"));
    qsa(".account-tabs .tab").forEach(b => b.classList.remove("active"));

    qs(`#content-${tab}`)?.classList.remove("hidden");
    qs(`.account-tabs .tab[data-tab="${tab}"]`)?.classList.add("active");
}

/* ============================================================
   LOGIN PLACEHOLDER (mantidos como fallback)
   ============================================================ */

function userLoginPlaceholder() {
    const email = qs("#login-email")?.value || "user@example.com";
    localStorage.setItem("kino_user", JSON.stringify({ email }));
    closeModal("accountModal");
    updateAccountUI();
}

function userSignupPlaceholder() {
    const name = qs("#signup-name")?.value || "Usuário";
    const email = qs("#signup-email")?.value || "user@example.com";

    localStorage.setItem("kino_user", JSON.stringify({ name, email }));
    closeModal("accountModal");
    updateAccountUI();
}

function userLogoutPlaceholder() {
    localStorage.removeItem("kino_user");
    updateAccountUI();
}

/* ============================================================
   Account UI updater: utiliza Firebase user quando disponível,
   senão fallback para localStorage 'kino_user'.
   ============================================================ */

function updateAccountUI(firebaseUser = null) {
    // firebaseUser: object from Firebase Auth OR null
    if (firebaseUser) {
        // quando o usuário estiver logado via Firebase
        qs("#account-name").textContent = firebaseUser.displayName || firebaseUser.email || "Usuário";
        qs("#account-email").textContent = firebaseUser.email || "";
        // opcional: mostrar avatar inicial
        if (qs("#avatarInitial")) qs("#avatarInitial").textContent = (firebaseUser.displayName || "U").charAt(0).toUpperCase();
    } else {
        // fallback ao localStorage (se existir)
        const raw = localStorage.getItem("kino_user");
        const user = raw ? JSON.parse(raw) : null;

        qs("#account-name").textContent = user?.name || "Convidado";
        qs("#account-email").textContent = user?.email || "";
        if (qs("#avatarInitial")) qs("#avatarInitial").textContent = (user?.name || "U").charAt(0).toUpperCase();
    }
}

/* ============================================================
   CRÉDITOS VISITANTE (mantidos)
   ============================================================ */

const VISITOR_INITIAL_CREDITS = 2;

function refreshCreditsDisplay() {
    const cur = parseInt(localStorage.getItem("kinoVisitorCredits") || VISITOR_INITIAL_CREDITS, 10);

    if (!localStorage.getItem("kinoVisitorCredits"))
        localStorage.setItem("kinoVisitorCredits", String(VISITOR_INITIAL_CREDITS));

    const elRem = qs("#creditsRemaining");
    if (elRem) elRem.textContent = `${cur} / ${VISITOR_INITIAL_CREDITS} (visitante)`;
}

/* ============================================================
   GERAÇÃO DE ROTEIRO (PLACEHOLDER) - mantida
   ============================================================ */

async function onGenerateClick() {
    const prompt = qs("#prompt-input")?.value?.trim();
    if (!prompt) return alert("Digite sua ideia primeiro.");

    const out = qs("#output");
    out.textContent = "Gerando roteiro...";

    await new Promise(r => setTimeout(r, 700));
    out.textContent = "Roteiro gerado: " + prompt.slice(0, 180) + (prompt.length > 180 ? "..." : "");
}

/* ============================================================
   FIREBASE AUTH HELPERS (novas)
   - signInWithGoogle
   - signInWithEmail (from form)
   - signupWithEmail (from form)
   - signOut
   - onAuthStateChanged observer updates UI
   ============================================================ */

/* 1) Observer: atualiza UI quando há mudança no estado de autenticação */
function initFirebaseAuthObserver() {
    // 'onAuthStateChanged' é chamado sempre que o usuário loga/desloga
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuário logado: atualiza UI usando dados do Firebase
            updateAccountUI(user);

            // Fechar modal de conta se estiver aberta
            if (qs("#accountModal")?.classList.contains("active")) closeModal("accountModal");

            // Opcional: salvar estado leve no localStorage (não salva senha)
            localStorage.setItem("kino_user", JSON.stringify({ name: user.displayName || null, email: user.email || null }));
        } else {
            // Usuário deslogado: limpar UI / fallback
            updateAccountUI(null);
            // remover cinema_user firebase salvo
            // (deixo localStorage como fallback, não removo se user fez signup placeholder)
            // localStorage.removeItem("kino_user");
        }
    });
}

/* 2) Google sign-in (popup) */
async function firebaseSignInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential.accessToken;
        const user = result.user;
        // onAuthStateChanged vai cuidar do updateAccountUI
        // fechar modais se necessário
        if (qs("#accountModal")?.classList.contains("active")) closeModal("accountModal");
    } catch (err) {
        console.error("Erro ao logar com Google:", err);
        alert("Falha no login com Google: " + (err.message || err));
    }
}

/* 3) Sign up with email & password (from form fields on page) */
async function firebaseSignupWithEmailFromForm() {
    try {
        const email = qs("#signup-email")?.value;
        const password = qs("#signup-password")?.value;
        if (!email || !password) return alert("Preencha email e senha para criar conta.");
        await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged cuidará do resto
    } catch (err) {
        console.error("Erro ao criar conta:", err);
        alert("Erro ao criar conta: " + (err.message || err));
    }
}

/* 4) Sign in with email & password */
async function firebaseSignInWithEmailFromForm() {
    try {
        const email = qs("#login-email")?.value;
        const password = qs("#login-password")?.value;
        if (!email || !password) return alert("Preencha email e senha para entrar.");
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged cuidará da UI
    } catch (err) {
        console.error("Erro ao entrar com email:", err);
        alert("Erro ao entrar: " + (err.message || err));
    }
}

/* 5) Sign out */
async function firebaseSignOut() {
    try {
        await signOut(auth);
        // limpar localStorage leve opcional
        // localStorage.removeItem("kino_user");
        updateAccountUI(null);
        alert("Desconectado.");
    } catch (err) {
        console.error("Erro ao deslogar:", err);
        alert("Erro ao deslogar: " + (err.message || err));
    }
}

/* ============================================================
   Nota sobre botões no HTML (IDs esperados)
   ------------------------------------------------------------
   Para usar o Firebase Auth com os botões que já existem:
   - botão login Google:   id="btn-google-login"
   - botão login email:    id="btn-email-login"   (usa #login-email / #login-password)
   - botão signup email:   id="btn-email-signup"  (usa #signup-email / #signup-password)
   - botão logout:         id="btn-firebase-logout"
   Se os IDs não existirem, os handlers não quebram (uso optional chaining).
   ============================================================ */

/* ============================================================
   END OF FILE
   ============================================================ */