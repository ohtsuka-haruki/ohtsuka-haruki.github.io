// 大塚陽暉 HP — 共通JS (v1)
// 1) 出現演出 2) ハンバーガーパネル 3) ABOUT日英切替 4) カルーセル送り
document.addEventListener("DOMContentLoaded", () => {
  // 1) 出現演出
  const targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && targets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => el.classList.add("is-in"));
  }

  // 2) ハンバーガーパネル
  const panel = document.querySelector(".nav-panel");
  const openBtn = document.querySelector(".burger");
  const closeBtn = document.querySelector(".nav-close");
  if (panel && openBtn) {
    openBtn.addEventListener("click", () => panel.classList.add("open"));
    if (closeBtn) closeBtn.addEventListener("click", () => panel.classList.remove("open"));
    panel.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => panel.classList.remove("open")));
  }

  // 3) 言語選択（ページ全体・主役交代型）＋ ABOUT プロフィール全文切替
  const setLang = (l) => {
    document.documentElement.dataset.lang = l;
    document.documentElement.lang = l === "en" ? "en" : "ja";
    try { localStorage.setItem("hp-lang", l); } catch (e) {}
    document.querySelectorAll("[data-setlang]").forEach((b) =>
      b.classList.toggle("active", b.dataset.setlang === l));
    const jp = document.querySelector(".profile-jp");
    const en = document.querySelector(".profile-en");
    if (jp && en) { jp.hidden = l === "en"; en.hidden = l !== "en"; }
    const lb = document.querySelector(".lang-btn");
    if (lb) lb.textContent = l === "en" ? "日本語" : "English";
  };
  document.querySelectorAll("[data-setlang]").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.setlang)));
  const langBtn = document.querySelector(".lang-btn");
  if (langBtn) langBtn.addEventListener("click", () =>
    setLang(document.documentElement.dataset.lang === "en" ? "ja" : "en"));
  let saved = "ja";
  try { saved = localStorage.getItem("hp-lang") || "ja"; } catch (e) {}
  setLang(saved === "en" ? "en" : "ja");

  // 4) カルーセル送り（自動スライドは Phase C 後半で追加）
  document.querySelectorAll(".carousel").forEach((c) => {
    const track = c.querySelector(".track");
    const prev = c.querySelector(".c-prev");
    const next = c.querySelector(".c-next");
    if (!track) return;
    const step = () => Math.min(340, track.clientWidth * 0.85);
    if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  });
});


// 5) 自動再生動画を確実に動かす（再生UIは出さない）
document.querySelectorAll("video[autoplay]").forEach((v) => {
  v.muted = true;
  const tryPlay = () => { const p = v.play(); if (p) p.catch(() => {}); };
  tryPlay();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) tryPlay(); })).observe(v);
  }
  window.addEventListener("pointerdown", tryPlay, { once: true });
});

// 6) アーカイブ一覧のスクロール位置を復元する
if (document.getElementById("archive-mosaic")) {
  try {
    const y = sessionStorage.getItem("archiveScroll");
    if (y) window.scrollTo(0, parseInt(y, 10) || 0);
    document.querySelectorAll(".mosaic a").forEach((a) =>
      a.addEventListener("click", () => {
        try { sessionStorage.setItem("archiveScroll", String(window.scrollY)); } catch (e) {}
      }));
  } catch (e) {}
}

// ヘッダーのHARUKIロゴ：同じページ内なら先頭へスムーズスクロール（2026-11-06 本人指示）
document.querySelectorAll('.site-header .logo').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var href = a.getAttribute('href') || '';
    var toHome = href === './' || href === 'index.html' || href.slice(-11) === '/index.html';
    var isHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (isHome && toHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// 6) お問い合わせフォーム（入力チェック＋送信・GAS受け口、2026-11-10）
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxMc6gOnklZ4ET3XtzSpaCe_epWP8BYrW2KaJUhTkTsTP3ObR4vWnChdZ1mvzEiKu3vuQ/exec";
document.querySelectorAll("form[data-form-kind]").forEach((form) => {
  const btn = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fields = [];
  const addField = (control, check) => {
    if (!control) return;
    const errEl = document.createElement("p");
    errEl.className = "field-error";
    const anchor = control.closest(".field") || (control.type === "checkbox" ? control.closest("label") : control);
    anchor.parentNode.insertBefore(errEl, anchor.nextSibling);
    const f = { control, check, errEl, touched: false };
    fields.push(f);
    control.addEventListener("blur", () => { f.touched = true; paint(f); refresh(); });
    control.addEventListener("input", () => { if (f.touched) paint(f); refresh(); });
    control.addEventListener("change", () => { if (f.touched) paint(f); refresh(); });
  };
  const paint = (f) => {
    const msg = f.check();
    if (msg === true) {
      f.errEl.textContent = "";
      f.errEl.classList.remove("show");
      f.control.classList.remove("is-invalid");
    } else {
      f.errEl.textContent = msg;
      f.errEl.classList.add("show");
      f.control.classList.add("is-invalid");
    }
    return msg === true;
  };
  addField(form.querySelector('select[name="type"]'),
    (c) => (c.value !== "" ? true : "ご依頼内容を選択してください"));
  addField(form.querySelector('input[name="name"]'),
    (c) => (c.value.trim() !== "" ? true : "お名前・会社名を入力してください"));
  addField(form.querySelector('input[name="email"]'), (c) => {
    const v = c.value.trim();
    if (v === "") return "メールアドレスを入力してください";
    return emailRe.test(v) ? true : "メールアドレスの形式を確認してください";
  });
  addField(form.querySelector('input[name="file_link"]'), (c) => {
    const v = c.value.trim();
    if (v === "") return true;
    try { new URL(v); return true; } catch (e) { return "リンクの形式を確認してください（https://…）"; }
  });
  addField(form.querySelector('textarea[name="message"]'),
    (c) => (c.value.trim() !== "" ? true : "お問い合わせ内容を入力してください"));
  addField(form.querySelector('label.consent input[type="checkbox"]'),
    (c) => (c.checked ? true : "プライバシーポリシーへの同意が必要です"));
  fields.forEach((f) => { f.check = f.check.bind(null, f.control); });
  const refresh = () => {
    const ok = fields.every((f) => f.check() === true);
    if (btn) btn.disabled = !ok;
    return ok;
  };
  refresh();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    fields.forEach((f) => { f.touched = true; paint(f); });
    if (!refresh()) {
      const firstBad = fields.find((f) => f.check() !== true);
      if (firstBad) firstBad.control.focus();
      return;
    }
    const show = (msg) => { if (status) { status.style.display = "block"; status.textContent = msg; } };
    if (btn) btn.disabled = true;
    show("送信しています…");
    try {
      const data = new URLSearchParams(new FormData(form));
      data.set("form_kind", form.dataset.formKind);
      await fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: data });
      form.reset();
      fields.forEach((f) => { f.touched = false; paint(f); });
      refresh();
      show("送信しました。ありがとうございます。内容を確認のうえ、ご記入のメールアドレスへご連絡します。");
    } catch (err) {
      show("送信に失敗しました。お手数ですが、haruki.artist@gmail.com まで直接メールでご連絡ください。");
      refresh();
    }
  });
});
