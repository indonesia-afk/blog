import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyDEGklPNtv-LvKzSW0d3QZRo5DMLr1nY-Y", authDomain: "portal-berita-firebase.firebaseapp.com", projectId: "portal-berita-firebase", storageBucket: "portal-berita-firebase.firebasestorage.app", messagingSenderId: "598254123187", appId: "1:598254123187:web:9418bcbe0a00dda3c3d8c6" };
const app = initializeApp(firebaseConfig); const db = getFirestore(app);

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) { themeToggle.addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light"); themeToggle.textContent = document.body.classList.contains("dark") ? "🌙" : "☀️"; }); if (localStorage.getItem("theme") === "dark") { document.body.classList.add("dark"); themeToggle.textContent = "🌙"; } }

function showLoading() { document.getElementById("loadingOverlay").style.display = "flex"; }
function hideLoading() { document.getElementById("loadingOverlay").style.display = "none"; }
window.showModal = (msg) => { document.getElementById("modalMessage").textContent = msg; document.getElementById("customModal").style.display = "flex"; }
window.closeModal = () => { document.getElementById("customModal").style.display = "none"; }

function linkify(text) {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/g;
    return text.replace(urlRegex, function (url) {
        let href = url; if (!href.match(/^https?:\/\//)) href = "https://" + href;
        return `<a href="${href}" target="_blank" style="color:var(--accent);text-decoration:underline;">${url}</a>`;
    });
}

/* === Tambahan kecil: formatter WIB & info edit === */
function formatWIB(ts) {
    try {
        if (!ts) return "";
        const d = (typeof ts.toDate === "function") ? ts.toDate() : new Date(ts);
        const tgl = d.toLocaleDateString("id-ID");
        const jam = d.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', hour12: false }).replace(":", ".");
        return `${tgl} ${jam} WIB`;
    } catch { return ""; }
}

async function loadDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id"); const slug = params.get("slug");
    if (!id && !slug) { document.getElementById("detailContainer").innerHTML = "❌ Tidak ada ID atau slug."; return; }

    showLoading();
    try {
        let d = null;
        if (id) { const snap = await getDoc(doc(db, "posts", id)); if (snap.exists()) d = snap.data(); }
        else if (slug) { const q = query(collection(db, "posts"), where("slug", "==", slug), limit(1)); const qs = await getDocs(q); if (!qs.empty) d = qs.docs[0].data(); }
        hideLoading();
        if (!d) { detailContainer.innerHTML = "❌ Berita tidak ditemukan."; return; }
        if (d.status !== "Aktif") { detailContainer.innerHTML = "<div class='card'><p>Konten tidak tersedia.</p></div>"; return; }

        let imageAtas = "", imageBawah = "";
        if (d.images && d.images.length > 0) {
            imageAtas = `<img src="${d.images[0]}" class="detail-img" onclick="showLightbox(this.src)">`;
            if (d.images.length > 1) { imageBawah = d.images.slice(1).map(url => `<img src="${url}" class="detail-img" onclick="showLightbox(this.src)">`).join(""); }
        } else if (d.imageUrl) { imageAtas = `<img src="${d.imageUrl}" class="detail-img" onclick="showLightbox(this.src)">`; }

        let docSection = "";
        if (d.category === "Peraturan" && Array.isArray(d.links) && d.links.length > 0) {
            const items = d.links.map(f => {
                const url = f.url || "#"; const name = f.name || "Dokumen"; const lower = url.toLowerCase();
                let cls = "", icon = "📑";
                if (lower.includes(".pdf")) { cls = "pdf"; icon = "📕"; }
                else if (lower.includes(".doc") || lower.includes(".docx")) { cls = "word"; icon = "📘"; }
                else if (lower.includes(".xls") || lower.includes(".xlsx")) { cls = "excel"; icon = "📊"; }
                else if (lower.includes(".ppt") || lower.includes(".pptx")) { cls = "ppt"; icon = "📈"; }
                else if (lower.includes("docs.google.com")) { cls = "gdoc"; icon = "📄"; }
                else if (lower.includes(".zip") || lower.includes(".rar")) { cls = "zip"; icon = "📦"; }
                return `<div class="doc-item ${cls}"><span>${icon}</span><a href="${url}" target="_blank">${name}</a></div>`;
            }).join("");
            docSection = `<div class="doc-title">Dokumen terkait:</div>${items}`;
        }

        document.getElementById("detailContainer").innerHTML = `
          <div class="card">
            ${imageAtas}
            <h2>${d.title}</h2>
            <div class="date">
              ${formatWIB(d.createdAt)}
              ${d.updatedAt ? `<div style="font-size:.6rem;opacity:.75;">di-edit pada ${formatWIB(d.updatedAt)}</div>` : ""}
            </div>
            <p>${linkify(d.content || "").replace(/\n/g, "<br>")}</p>
            ${docSection}
            ${imageBawah}
          </div>`;
    } catch (err) {
        hideLoading(); showModal("Gagal memuat detail: " + err.message);
    }
}

loadDetail();
window.showLightbox = (src) => { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').style.display = 'flex'; }

/* ===== TOMBOL KEMBALI (set flag + kembali) ===== */
const backBtn = document.getElementById("backBtn");
backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // Tandai agar index memulihkan state
    sessionStorage.setItem("fromDetail", "yes");

    // Kalau user masuk ke detail langsung (tanpa state), sediakan default minimal
    const lastCategory = sessionStorage.getItem("lastCategory") || "Berita";
    if (!sessionStorage.getItem("pageState")) {
        sessionStorage.setItem(
            "pageState",
            JSON.stringify({ scroll: 0, category: lastCategory, loadedCount: 10 })
        );
    }

    window.location.href = "index.html";
});