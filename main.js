const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 60);
window.addEventListener("scroll", onScroll);
onScroll();

document.getElementById("menuBtn").addEventListener("click", () => document.body.classList.toggle("menu-open"));
document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("menu-open")));

const slides = [...document.querySelectorAll("#slides .ph")];
const dotsBox = document.getElementById("dots");
let cur = 0, timer;
slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", (i + 1) + "枚目");
    b.addEventListener("click", () => go(i));
    dotsBox.appendChild(b);
});
const dots = [...dotsBox.children];
function go(i) {
    slides[cur].classList.remove("is-active");
    dots[cur].classList.remove("is-active");
    cur = (i + slides.length) % slides.length;
    slides[cur].classList.add("is-active");
    void dots[cur].offsetWidth;
    dots[cur].classList.add("is-active");
    clearTimeout(timer);
    timer = setTimeout(() => go(cur + 1), 6000);
}
go(0);

const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((el, i) => {
    const sib = el.parentElement.querySelectorAll(":scope > .reveal");
    if (sib.length > 2) el.style.transitionDelay = ([...sib].indexOf(el) % 4) * .1 + "s";
    io.observe(el);
});

const REPORTS_SHOW = 4;
document.querySelectorAll("#reports .reports > .report").forEach((r, i) => r.classList.toggle("is-over", i >= REPORTS_SHOW));
document.querySelectorAll("#reportFilter button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#reportFilter button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const f = btn.dataset.filter;
        document.querySelector(".reports").classList.toggle("is-filtered", f !== "all");
        document.querySelectorAll("#reports .reports > .report").forEach((r, i) => {
            r.classList.toggle("is-hidden", f !== "all" && r.dataset.cat !== f);
            r.classList.toggle("is-over", f === "all" && i >= REPORTS_SHOW);
        });
        const shown = document.querySelectorAll("#reports .reports > .report:not(.is-hidden)").length;
        document.getElementById("reportsEmpty").hidden = shown > 0;
    });
});

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
function closeModal() { modal.classList.remove("is-open"); document.body.style.overflow = archive.classList.contains("is-open") ? "hidden" : ""; }
document.querySelectorAll(".report").forEach(r => {
    r.addEventListener("click", () => {
        const ph = r.querySelector(".ph").cloneNode(true);
        modalBody.innerHTML = "";
        modalBody.appendChild(ph);
        setupSlider(ph);
        const c = document.createElement("div");
        c.className = "modal__content";
        c.innerHTML = r.querySelector(".report__meta").outerHTML
            + "<h3>" + r.querySelector("h3").innerHTML + "</h3>"
            + r.querySelector(".report__body").innerHTML;
        modalBody.appendChild(c);
        modal.classList.add("is-open");
        modal.scrollTop = 0;
        document.body.style.overflow = "hidden";
    });
});
document.getElementById("modalClose").addEventListener("click", closeModal);

let slideToken = 0, slideGo = null;
function setupSlider(ph) {
    slideGo = null;
    const base = ph.querySelector("img");
    if (!base) return;
    const src = base.getAttribute("src");
    const m = src.match(/^(.*)\.(jpe?g|png|webp)$/i);
    if (!m) return;
    const cand = [src];
    for (let k = 2; k <= 5; k++) cand.push(m[1] + "-" + k + "." + m[2]);
    const found = [], token = ++slideToken;
    let pending = cand.length;
    cand.forEach((c, i) => {
        const probe = new Image();
        probe.onload = () => { found[i] = c; done(); };
        probe.onerror = done;
        probe.src = c;
    });
    function done() {
        if (--pending > 0 || token !== slideToken) return;
        const list = found.filter(Boolean);
        if (list.length < 2) return;
        base.remove();
        const imgs = list.map(c => {
            const im = document.createElement("img");
            im.src = c; im.alt = ""; im.className = "m-slide";
            ph.appendChild(im);
            return im;
        });
        const dots = document.createElement("div");
        dots.className = "m-dots";
        const dotBtns = list.map((_, i) => {
            const d = document.createElement("button");
            d.setAttribute("aria-label", (i + 1) + "枚目");
            d.addEventListener("click", e => { e.stopPropagation(); go(i); });
            dots.appendChild(d);
            return d;
        });
        const prev = document.createElement("button");
        prev.className = "m-arrow m-arrow--prev"; prev.textContent = "←"; prev.setAttribute("aria-label", "前の写真");
        const next = document.createElement("button");
        next.className = "m-arrow m-arrow--next"; next.textContent = "→"; next.setAttribute("aria-label", "次の写真");
        prev.addEventListener("click", e => { e.stopPropagation(); go(cur - 1); });
        next.addEventListener("click", e => { e.stopPropagation(); go(cur + 1); });
        ph.append(prev, next, dots);
        let cur = 0;
        const baseCredit = ph.getAttribute("data-credit");
        function go(i) {
            cur = (i + imgs.length) % imgs.length;
            if (baseCredit !== null) ph.setAttribute("data-credit", cur === 0 ? baseCredit : (ph.getAttribute("data-credit-" + (cur + 1)) ?? baseCredit));
            imgs.forEach((im, k) => im.classList.toggle("is-on", k === cur));
            dotBtns.forEach((d, k) => d.classList.toggle("is-on", k === cur));
        }
        go(0);
        slideGo = d => go(cur + d);
        let sx = 0;
        ph.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
        ph.addEventListener("touchend", e => {
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
        });
    }
}
document.addEventListener("keydown", e => {
    if (!modal.classList.contains("is-open") || !slideGo) return;
    if (e.key === "ArrowLeft") slideGo(-1);
    if (e.key === "ArrowRight") slideGo(1);
});
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

const figs = [...document.querySelectorAll("#galleryGrid figure")];
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbCap = document.getElementById("lbCap");
let gi = 0;
let lbList = null;
function showFig(i) {
    if (lbList) {
        gi = (i + lbList.length) % lbList.length;
        lbImg.innerHTML = `<img class="lightbox__img" src="${lbList[gi].src}" alt="">`;
        lbCap.textContent = lbList[gi].cap + "　（" + (gi + 1) + " / " + lbList.length + "）";
        return;
    }
    gi = (i + figs.length) % figs.length;
    const img = figs[gi].querySelector("img.g-extra.is-on") || figs[gi].querySelector("img");
    lbImg.innerHTML = img
        ? `<img class="lightbox__img" src="${img.src}" alt="">`
        : `<div class="lightbox__img ph" data-label="${figs[gi].querySelector(".ph").dataset.label}"></div>`;
    lbCap.textContent = figs[gi].querySelector("figcaption").textContent + "　（" + (gi + 1) + " / " + figs.length + "）";
}
function closeLb() { lb.classList.remove("is-open"); document.body.style.overflow = document.getElementById("works").classList.contains("is-open") ? "hidden" : ""; }
figs.forEach((f, i) => f.addEventListener("click", () => {
    lbList = null;
    showFig(i); lb.classList.add("is-open"); document.body.style.overflow = "hidden";
}));
document.getElementById("lbClose").addEventListener("click", closeLb);
document.getElementById("lbPrev").addEventListener("click", () => showFig(gi - 1));
document.getElementById("lbNext").addEventListener("click", () => showFig(gi + 1));
lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
let sx = 0;
lb.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
lb.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) showFig(gi + (dx < 0 ? 1 : -1));
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeLb(); closeModal(); }
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") showFig(gi - 1);
    if (e.key === "ArrowRight") showFig(gi + 1);
});

const REQUEST_MAIL = "kcc@example.com";

document.getElementById("requestForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body =
        "【お名前】" + f.get("name") + "\n" +
        "【団体名・ご所属】" + (f.get("org") || "-") + "\n" +
        "【メールアドレス】" + f.get("email") + "\n" +
        "【撮影の種類】" + f.get("type") + "\n" +
        "【撮影希望日】" + (f.get("date") || "-") + "\n" +
        "【撮影場所】" + (f.get("place") || "-") + "\n\n" +
        "【ご依頼内容】\n" + f.get("message");
    const subject = "【撮影依頼】" + f.get("name") + " 様より";
    location.href = "mailto:" + REQUEST_MAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
});

document.getElementById("year").textContent = new Date().getFullYear();
const toTop = document.getElementById("toTop");
window.addEventListener("scroll", () => toTop.classList.toggle("is-show", window.scrollY > 800));
toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));

const G_INTERVAL = 6000;

const G_CAPTIONS = {
    "g16.jpg": "撮影者：R.S",
};

document.querySelectorAll("#galleryGrid figure").forEach((fig, idx) => {
    const n = (fig.querySelector(".ph").dataset.label.match(/^g(\d)\.jpg$/) || [])[1];
    if (!n) return;
    const ph = fig.querySelector(".ph");
    const extras = [];
    let pending = 9;
    for (let t = 1; t <= 9; t++) {
        const src = "images/g" + t + n + ".jpg";
        const probe = new Image();
        probe.onload = () => { extras[t] = src; done(); };
        probe.onerror = done;
        probe.src = src;
    }
    function done() {
        if (--pending > 0) return;
        const list = extras.filter(Boolean);
        if (!list.length) return;
        const layers = list.map(src => {
            const im = document.createElement("img");
            im.src = src; im.alt = ""; im.className = "g-extra";
            ph.appendChild(im);
            return im;
        });
        let cur = -1;
        const cap = fig.querySelector("figcaption");
        const baseCap = cap ? cap.textContent : "";
        function next() {
            if (cur >= 0) layers[cur].classList.remove("is-on");
            cur++;
            if (cur >= layers.length) cur = ph.querySelector("img:not(.g-extra)") ? -1 : 0;
            if (cur >= 0) layers[cur].classList.add("is-on");
            if (cap) {
                const file = cur >= 0 ? layers[cur].getAttribute("src").split("/").pop() : null;
                cap.textContent = (file && G_CAPTIONS[file]) || baseCap;
            }
        }
        if (!ph.querySelector("img:not(.g-extra)")) next();
        const offset = (idx * G_INTERVAL / 8) + Math.random() * 1500;
        setTimeout(() => { next(); setInterval(next, G_INTERVAL); }, offset + G_INTERVAL / 2);
    }
});

const archive = document.getElementById("archive");
const archiveList = document.getElementById("archiveList");
const archiveFilter = document.getElementById("archiveFilter");
function buildArchive() {
    archiveList.innerHTML = "";
    document.querySelectorAll("#reports .reports > .report").forEach(orig => {
        const c = orig.cloneNode(true);
        if (c.classList.contains("report--feature")) {
            const wrap = c.querySelector(":scope > div:not(.ph)");
            if (wrap) wrap.replaceWith(...wrap.childNodes);
        }
        c.classList.remove("report--feature", "is-hidden", "is-over", "reveal");
        c.addEventListener("click", () => orig.click());
        archiveList.appendChild(c);
    });
    archiveFilter.innerHTML = document.getElementById("reportFilter").innerHTML;
    archiveFilter.querySelectorAll("button").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.filter === "all");
        btn.addEventListener("click", () => {
            archiveFilter.querySelectorAll("button").forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            const f = btn.dataset.filter;
            let shown = 0;
            archiveList.querySelectorAll(".report").forEach(r => {
                const hide = f !== "all" && r.dataset.cat !== f;
                r.classList.toggle("is-hidden", hide);
                if (!hide) shown++;
            });
            document.getElementById("archiveEmpty").hidden = shown > 0;
        });
    });
    document.getElementById("archiveEmpty").hidden = true;
}
function openArchive() {
    buildArchive();
    archive.classList.add("is-open");
    archive.scrollTop = 0;
    document.body.style.overflow = "hidden";
}
function closeArchive() {
    archive.classList.remove("is-open");
    document.body.style.overflow = "";
}
document.getElementById("archiveOpen").addEventListener("click", openArchive);
document.getElementById("archiveClose").addEventListener("click", closeArchive);
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && archive.classList.contains("is-open") && !modal.classList.contains("is-open")) closeArchive();
}, true);

const works = document.getElementById("works");
const worksList = document.getElementById("worksList");
let worksItems = null;
const WORKS_SKIP = ["report5-2.jpg", "act3.jpg"];
const WORKS_ORDER = ["g1.jpg", "g2.jpg", "g3.jpg", "g4.jpg", "g5.jpg", "g6.jpg", "g7.jpg", "g16.jpg", "g8.jpg",
    "hero1.jpg", "hero2.jpg", "report3.jpg", "report3-2.jpg", "act1.jpg", "act2.jpg", "act4.jpg", "report4.jpg", "report4-2.jpg", "report5.jpg", "about2.jpg"];
function probe(src) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(src); im.onerror = () => res(null); im.src = src; });
}
async function loadWorks() {
    if (worksItems) return worksItems;
    const baseCap = {};
    document.querySelectorAll("#galleryGrid figure").forEach(f => {
        const m = f.querySelector(".ph").dataset.label.match(/^g(\d)\.jpg$/);
        if (m) baseCap[m[1]] = f.querySelector("figcaption").textContent;
    });
    const nums = Object.keys(baseCap);
    const cand = [];
    for (let t = 0; t <= 9; t++) nums.forEach(n => cand.push({ file: "g" + (t ? t : "") + n + ".jpg", n }));
    const ok = await Promise.all(cand.map(c => probe("images/" + c.file)));
    const rank = f => { const i = WORKS_ORDER.indexOf(f); return i < 0 ? 999 : i; };
    worksItems = cand.filter((c, i) => ok[i]).sort((a, b) => rank(a.file) - rank(b.file)).map(c => ({
        src: "images/" + c.file,
        cap: (typeof G_CAPTIONS !== "undefined" && G_CAPTIONS[c.file]) || baseCap[c.n]
    }));

    const others = [];
    document.querySelectorAll("main .ph[data-label]").forEach(ph => {
        const label = ph.dataset.label;
        if (/^g\d+\.jpg$/.test(label) || ph.closest(".archive")) return;
        const m = label.match(/^(.*)\.(jpe?g|png|webp)$/i);
        others.push({ file: label, cap: ph.dataset.credit || "" });
        if (m && ph.closest(".report")) {
            for (let k = 2; k <= 5; k++) others.push({ file: m[1] + "-" + k + "." + m[2], cap: ph.getAttribute("data-credit-" + k) || ph.dataset.credit || "" });
        }
    });
    const seen = new Set(worksItems.map(w => w.src));
    const uniq = others.filter(o => !WORKS_SKIP.includes(o.file) && !seen.has("images/" + o.file) && seen.add("images/" + o.file));
    const ok2 = await Promise.all(uniq.map(o => probe("images/" + o.file)));
    uniq.forEach((o, i) => { if (ok2[i]) worksItems.push({ src: "images/" + o.file, cap: o.cap }); });
    const pos = w => { const i = WORKS_ORDER.indexOf(w.src.split("/").pop()); return i < 0 ? 999 : i; };
    worksItems.sort((a, b) => pos(a) - pos(b));
    return worksItems;
}
async function openWorks() {
    works.classList.add("is-open");
    works.scrollTop = 0;
    document.body.style.overflow = "hidden";
    const items = await loadWorks();
    if (worksList.children.length) return;
    items.forEach((w, i) => {
        const f = document.createElement("figure");
        f.innerHTML = `<img src="${w.src}" alt="" loading="lazy"><figcaption></figcaption>`;
        f.querySelector("figcaption").textContent = w.cap;
        const im = f.querySelector("img");
        const fit = () => { if (im.naturalWidth > im.naturalHeight) im.classList.add("is-land"); };
        im.complete ? fit() : im.addEventListener("load", fit);
        f.addEventListener("click", () => { lbList = items; showFig(i); lb.classList.add("is-open"); });
        worksList.appendChild(f);
    });
}
function closeWorks() { works.classList.remove("is-open"); document.body.style.overflow = ""; }
document.getElementById("worksOpen").addEventListener("click", openWorks);
document.getElementById("worksClose").addEventListener("click", closeWorks);
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && works.classList.contains("is-open") && !lb.classList.contains("is-open")) closeWorks();
}, true);