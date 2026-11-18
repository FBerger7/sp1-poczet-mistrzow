/* ==========================================================================
   POCZET WYBITNYCH SPORTOWCÓW – SP NR 1 W BIERUNIU
   Modular UI Renderer + GSAP ScrollTrigger + Lenis + Ceremony Mode Engine
   ========================================================================== */

(function () {
  "use strict";

  const DATA = window.HALL_OF_FAME_DATA;
  if (!DATA) {
    console.error("Brak danych HALL_OF_FAME_DATA.");
    return;
  }

  let lenis = null;
  let lightbox = null;
  let currentSlideIndex = 0;
  let slideTargets = []; // Ordered list of section DOM IDs for Ceremony Mode (← / →)
  let isCeremonyMode = false;
  let activeAthleteId = null; // null on Prologue/Epilogue, athlete.id when viewing an athlete section

  // Theme accent helper
  function getThemeClasses(theme) {
    switch (theme) {
      case "crimson":
        return {
          badge: "bg-rose-500/15 text-rose-300 border-rose-500/35",
          accentText: "text-rose-400",
          accentBorder: "border-rose-500/30",
          statHighlight: "from-rose-500/20 via-amber-500/10 to-slate-900/80 border-rose-500/40",
          glow: "shadow-rose-500/10"
        };
      case "emerald":
        return {
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
          accentText: "text-emerald-400",
          accentBorder: "border-emerald-500/30",
          statHighlight: "from-emerald-500/20 via-sky-500/10 to-slate-900/80 border-emerald-500/40",
          glow: "shadow-emerald-500/10"
        };
      case "amber":
      default:
        return {
          badge: "bg-amber-500/15 text-amber-300 border-amber-500/35",
          accentText: "text-amber-400",
          accentBorder: "border-amber-500/30",
          statHighlight: "from-amber-500/20 via-yellow-500/10 to-slate-900/80 border-amber-500/40",
          glow: "shadow-amber-500/10"
        };
    }
  }

  function getTierBadge(tier) {
    switch (tier) {
      case "olympic":
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40"><i data-lucide="flame" class="w-3.5 h-3.5"></i>Igrzyska / Finał Pucharów</span>`;
      case "gold":
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"><i data-lucide="trophy" class="w-3.5 h-3.5"></i>Złoto / Mistrzostwo</span>`;
      case "silver":
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-300/20 text-slate-200 border border-slate-400/40"><i data-lucide="medal" class="w-3.5 h-3.5"></i>Srebro / Wicemistrzostwo</span>`;
      case "bronze":
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40"><i data-lucide="medal" class="w-3.5 h-3.5"></i>Brązowy Medal</span>`;
      default:
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40"><i data-lucide="award" class="w-3.5 h-3.5"></i>Wyróżnienie / Honor</span>`;
    }
  }

  // ==========================================================================
  // 1. TOP STICKY NAVIGATION & CEREMONY CONTROLS
  // ==========================================================================
  function renderNavigation() {
    const navItems = DATA.athletes
      .map(
        (a, idx) => `
        <button
          type="button"
          data-jump-target="athlete-${a.id}"
          data-athlete-pill="${a.id}"
          class="timeline-nav-pill px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 text-slate-300 hover:text-white hover:border-amber-400/50 whitespace-nowrap flex items-center gap-1.5"
          title="${a.name} (${a.discipline})"
        >
          <span class="font-mono-stat text-[11px] text-amber-400/90">0${idx + 1}</span>
          <span>${a.name.replace("śp. ", "")}</span>
        </button>`
      )
      .join("");

    return `
      <header class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
        <!-- Top Scroll Progress Bar -->
        <div class="h-0.5 w-full bg-slate-900 overflow-hidden">
          <div id="scroll-progress-bar" class="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400 w-0 transition-all duration-75"></div>
        </div>

        <div class="max-w-[1440px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <!-- Brand / School Title -->
          <button type="button" data-jump-target="section-prologue" class="flex items-center text-left group shrink-0">
            <div>
              <div class="text-[11px] uppercase tracking-[0.2em] text-amber-400/90 font-semibold group-hover:text-amber-300 transition-colors">${DATA.school.shortName}</div>
              <div class="text-sm font-serif-ceremonial font-bold text-white tracking-wide">Poczet Sportowców</div>
            </div>
          </button>

          <!-- Horizontal Athlete Timeline Pills (Smart Interactive Ribbon) -->
          <nav
            id="header-timeline-nav"
            aria-label="Oś czasu sportowców"
            class="relative hidden lg:flex flex-1 max-w-xl xl:max-w-2xl min-w-0 mx-4 items-center gap-1.5 overflow-x-auto py-1.5 px-7 no-scrollbar nav-ribbon-mask select-none"
          >
            ${navItems}
          </nav>

          <!-- Ceremony Presentation Controls -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="hidden sm:flex items-center bg-white/[0.04] border border-white/10 rounded-full p-1 gap-1">
              <button
                type="button"
                id="btn-prev-slide"
                class="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Poprzednia scena (Strzałka w lewo)"
              >
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
              <span id="slide-counter-badge" class="font-mono-stat text-xs px-2 text-amber-300 font-medium">01 / 10</span>
              <button
                type="button"
                id="btn-next-slide"
                class="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Następna scena (Strzałka w prawo / Spacja)"
              >
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
            </div>

            <button
              type="button"
              id="btn-ceremony-mode"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 transition-all flex items-center gap-2"
              title="Włącz/wyłącz pełny ekran na ceremonię (klawisz F)"
            >
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
              <span class="hidden md:inline">Tryb Ceremonii</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  // ==========================================================================
  // 2. PROLOGUE / HERO STAGE (SCENE 0)
  // ==========================================================================
  function renderPrologue() {
    const statCards = DATA.school.summaryStats
      .map(
        (s) => `
        <div class="bento-card rounded-2xl p-6 text-left relative overflow-hidden group">
          <div class="flex items-center justify-between mb-3">
            <span class="font-display-sport text-4xl lg:text-5xl font-bold bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">${s.value}</span>
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
              <i data-lucide="${s.icon}" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-base font-semibold text-white mb-1">${s.label}</div>
          <div class="text-xs text-slate-400 leading-relaxed">${s.sub}</div>
        </div>`
      )
      .join("");

    const rosterGrid = DATA.athletes
      .map(
        (a, i) => `
        <button
          type="button"
          data-jump-target="athlete-${a.id}"
          class="bento-card rounded-2xl p-3.5 text-left group flex items-center gap-3.5 hover:-translate-y-1 transition-all duration-300"
        >
          <div class="w-14 h-16 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-slate-900 relative">
            <img src="${a.heroImage}" alt="${a.name}" class="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500" loading="eager" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 text-[11px] font-mono-stat text-amber-400 mb-0.5">
              <span>#0${i + 1}</span>
              <span>•</span>
              <span class="truncate">${a.discipline.split("•")[0].trim()}</span>
            </div>
            <div class="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">${a.name}</div>
            <div class="text-[11px] text-slate-400 truncate">${a.titleRole}</div>
          </div>
        </button>`
      )
      .join("");

    return `
      <section id="section-prologue" data-slide-section="section-prologue" data-section-era="amber" class="relative min-h-screen pt-28 pb-20 px-4 lg:px-8 flex flex-col justify-center">
        <div class="max-w-[1360px] mx-auto w-full">
          <!-- Hero Header -->
          <div class="text-center max-w-4xl mx-auto mb-14 gsap-reveal">
            <h1 class="font-serif-ceremonial text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-6">
              ${DATA.school.title}
              <span class="block text-3xl sm:text-4xl lg:text-5xl font-normal italic bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mt-3">
                ${DATA.school.name}
              </span>
            </h1>

            <!-- Prominent Gold Banner: Złoci Medaliści Mistrzostw Polski -->
            <div class="flex items-center justify-center gap-4 my-7">
              <span class="hidden sm:block h-px w-16 lg:w-28 bg-gradient-to-r from-transparent to-amber-400/70"></span>
              <div class="inline-flex items-center gap-3 px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/60 shadow-[0_0_35px_-5px_rgba(245,158,11,0.35)]">
                <i data-lucide="trophy" class="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 shrink-0"></i>
                <span class="font-display-sport text-xl sm:text-2xl lg:text-3xl uppercase tracking-[0.14em] font-bold bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                  ${DATA.school.championsTagline || "Złoci Medaliści Mistrzostw Polski"}
                </span>
                <i data-lucide="trophy" class="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 shrink-0"></i>
              </div>
              <span class="hidden sm:block h-px w-16 lg:w-28 bg-gradient-to-l from-transparent to-amber-400/70"></span>
            </div>

            <p class="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed font-light">
              Od legendarnych stadionów piłkarskich lat 60., przez olimpijskie tatami w Barcelonie i Atlancie,
              aż po współczesne podia Mistrzostw Europy. Poznaj historie ośmiu absolwentów naszej szkoły,
              którzy swoją pasją i determinacją zapisali się w historii polskiego sportu.
            </p>

            ${
              DATA.school.patron
                ? `
            <div class="mt-6 flex justify-center">
              <button
                type="button"
                data-jump-target="section-patron"
                class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-amber-500/15 border border-white/15 hover:border-amber-400/50 text-xs sm:text-sm text-slate-300 hover:text-amber-200 transition-all group"
              >
                <i data-lucide="landmark" class="w-4 h-4 text-amber-400 shrink-0"></i>
                <span>Inicjatywa i fundator tablic pamiątkowych: <strong class="text-white group-hover:text-amber-200">${DATA.school.patron.name}</strong></span>
                <i data-lucide="arrow-down" class="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-y-0.5 transition-transform"></i>
              </button>
            </div>`
                : ""
            }
          </div>

          <!-- 4 Summary Bento Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14 gsap-reveal">
            ${statCards}
          </div>

          <!-- Interactive Quick Roster (All 8 Alumni at a glance) -->
          <div class="bento-card rounded-3xl p-6 lg:p-8 gsap-reveal">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 class="text-xs uppercase tracking-[0.2em] text-amber-400 font-semibold">Indeks Absolwentów • Wybierz rozdział lub przewijaj w dół</h2>
                <p class="text-sm text-slate-400 mt-0.5">Użyj kółka myszy, aby płynnie podróżować przez dekady, lub klawiszy strzałek <kbd class="px-1.5 py-0.5 text-xs bg-white/10 rounded border border-white/20 text-slate-200">←</kbd> <kbd class="px-1.5 py-0.5 text-xs bg-white/10 rounded border border-white/20 text-slate-200">→</kbd> podczas prezentacji.</p>
              </div>
              <button
                type="button"
                data-jump-target="athlete-henryk-latocha"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-amber-500/20 shrink-0"
              >
                <span>Rozpocznij Podróż</span>
                <i data-lucide="arrow-down" class="w-4 h-4"></i>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              ${rosterGrid}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================================================
  // 3. ACT DIVIDER BANNER
  // ==========================================================================
  function renderActBanner(act) {
    const theme = getThemeClasses(act.theme);
    return `
      <div id="section-${act.id}" data-section-era="${act.theme}" class="py-16 px-4 lg:px-8 relative">
        <div class="max-w-[1360px] mx-auto">
          <div class="bento-card rounded-3xl p-8 lg:p-12 border ${theme.accentBorder} relative overflow-hidden gsap-reveal">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono-stat uppercase tracking-widest border ${theme.badge} mb-3">
                  <span>${act.number}</span>
                  <span>•</span>
                  <span>${act.years}</span>
                </div>
                <h2 class="font-serif-ceremonial text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  ${act.title}
                </h2>
              </div>
              <p class="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed lg:text-right">
                ${act.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 4. ATHLETE SECTION COMPONENTS (BENTO + EDITORIAL + GALLERY)
  // ==========================================================================
  function buildHeroVisualCard(athlete, theme) {
    const isArchival = athlete.heroFrameType === "archival-gold";
    const isMemorial = athlete.heroFrameType === "memorial-gold";

    let imageContainerHTML = "";
    if (isMemorial) {
      imageContainerHTML = `
        <div class="frame-memorial-gold mx-auto max-w-sm">
          <div class="rounded-xl overflow-hidden border border-amber-400/40 relative group cursor-zoom-in">
            <a href="${athlete.heroImage}" class="glightbox" data-gallery="gallery-${athlete.id}" data-glightbox="title: ${athlete.name}">
              <img src="${athlete.heroImage}" alt="${athlete.name}" class="w-full h-auto max-h-[430px] object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            </a>
          </div>
          <div class="mt-3 text-center">
            <div class="text-xs font-serif-ceremonial italic text-amber-200/90">${athlete.heroCaption}</div>
          </div>
        </div>`;
    } else if (isArchival) {
      imageContainerHTML = `
        <div class="frame-archival-passepartout mx-auto">
          <div class="rounded-md overflow-hidden relative group cursor-zoom-in bg-slate-900">
            <a href="${athlete.heroImage}" class="glightbox" data-gallery="gallery-${athlete.id}" data-glightbox="title: ${athlete.name}">
              <img src="${athlete.heroImage}" alt="${athlete.name}" class="w-full h-auto max-h-[450px] object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            </a>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2 text-xs text-slate-700 font-medium px-1">
            <span class="italic font-serif-ceremonial text-sm text-slate-800">${athlete.heroCaption}</span>
            <span class="shrink-0 text-[11px] uppercase tracking-wider text-amber-800 font-bold">Archiwum</span>
          </div>
        </div>`;
    } else {
      imageContainerHTML = `
        <div class="rounded-2xl overflow-hidden border border-white/15 bg-slate-900 relative group shadow-2xl">
          <a href="${athlete.heroImage}" class="glightbox block relative" data-gallery="gallery-${athlete.id}" data-glightbox="title: ${athlete.name}">
            <img src="${athlete.heroImage}" alt="${athlete.name}" class="w-full h-[420px] sm:h-[460px] object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <p class="text-xs text-slate-200/95 bg-slate-950/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                ${athlete.heroCaption}
              </p>
              <span class="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                <i data-lucide="maximize-2" class="w-4 h-4"></i>
              </span>
            </div>
          </a>
        </div>`;
    }

    const clubsPills = athlete.clubs
      .map(
        (c) =>
          `<span class="px-2.5 py-1 rounded-lg text-xs bg-white/[0.05] border border-white/10 text-slate-200">${c}</span>`
      )
      .join("");

    const honorsList = athlete.honors
      .map(
        (h) => `
        <li class="flex items-center gap-2 text-xs text-amber-200/95">
          <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
          <span>${h}</span>
        </li>`
      )
      .join("");

    return `
      <div class="lg:col-span-5 xl:col-span-4">
        <div class="lg:sticky lg:top-24 space-y-5">
          <!-- Main Visual Frame -->
          ${imageContainerHTML}

          <!-- Athlete Metadata Card -->
          <div class="bento-card rounded-2xl p-6 space-y-4">
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">Metryczka Absolwenta</span>
              <span class="font-mono-stat text-xs ${theme.accentText} font-bold">Rozdział 0${athlete.index} / 08</span>
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="flex items-start gap-2.5">
                <i data-lucide="graduation-cap" class="w-4 h-4 ${theme.accentText} shrink-0 mt-0.5"></i>
                <div>
                  <div class="text-slate-400">Edukacja szkolna</div>
                  <div class="text-white font-medium">${athlete.schoolYears}</div>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <i data-lucide="calendar" class="w-4 h-4 ${theme.accentText} shrink-0 mt-0.5"></i>
                <div>
                  <div class="text-slate-400">Data urodzenia / Epoka</div>
                  <div class="text-white font-medium">${athlete.birthDate}</div>
                </div>
              </div>
            </div>

            <div>
              <div class="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Barwy klubowe i reprezentacyjne</div>
              <div class="flex flex-wrap gap-1.5">
                ${clubsPills}
              </div>
            </div>

            <div class="pt-3 border-t border-white/10">
              <div class="text-[11px] uppercase tracking-wider text-amber-400/90 font-semibold mb-2">Kluczowe odznaczenia i tytuły</div>
              <ul class="space-y-1.5">
                ${honorsList}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function buildSpecialTrophyShowcase(athlete) {
    const cards = athlete.trophyCabinet
      .map(
        (item) => `
        <div class="bento-card rounded-2xl p-6 border border-amber-400/25 hover:border-amber-400/60 transition-all relative overflow-hidden group">
          <div class="flex items-start justify-between gap-4 mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono-stat font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
              ${item.year} • ${item.badge}
            </span>
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            </div>
          </div>
          <h4 class="font-serif-ceremonial text-2xl font-bold text-white mb-2">${item.title}</h4>
          <p class="text-sm text-slate-300 leading-relaxed">${item.desc}</p>
        </div>`
      )
      .join("");

    return `
      <div class="bento-card rounded-3xl p-6 sm:p-8 border border-amber-400/30">
        <div class="mb-6 pb-4 border-b border-white/10">
          <div class="text-xs uppercase tracking-[0.2em] text-amber-400 font-semibold">Gablota Trofeów i Pamięci</div>
          <h3 class="font-serif-ceremonial text-2xl sm:text-3xl font-bold text-white mt-1">
            Dwie Pasje: Od Boisk II Ligi do Podium Mistrzostw Polski w Skacie
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cards}
        </div>
      </div>
    `;
  }

  function buildAthleteGalleryBento(athlete, theme) {
    const itemsHTML = athlete.gallery
      .map((img, idx) => {
        const isArchivalDoc = img.type === "document" || img.type === "archival";
        const spanClass =
          idx === 0
            ? "sm:col-span-2 sm:row-span-2"
            : idx === 3 && athlete.gallery.length > 6
            ? "sm:col-span-2"
            : "";

        const heightClass = "h-64 sm:h-full";
        const typeLabel =
          img.type === "podium"
            ? "Podium / Dekoracja"
            : img.type === "action"
            ? "W Akcji"
            : img.type === "document"
            ? "Dokument / Prasa"
            : "Archiwum";

        return `
          <a
            href="${img.src}"
            class="glightbox gallery-item-card bento-card block ${spanClass} ${heightClass} group"
            data-gallery="gallery-${athlete.id}"
            data-photo-type="${img.type}"
            data-glightbox="title: ${img.title}"
          >
            <img
              src="${img.src}"
              alt="${img.title}"
              loading="lazy"
              class="w-full h-full object-cover object-top ${isArchivalDoc ? "p-2 bg-[#f5efe4] rounded-xl" : ""}"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity"></div>
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-slate-950/75 text-slate-200 border border-white/15 backdrop-blur-md">
                ${typeLabel}
              </span>
            </div>
            <div class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <i data-lucide="zoom-in" class="w-4 h-4"></i>
            </div>
            <div class="absolute bottom-3.5 left-4 right-4">
              <div class="font-serif-ceremonial text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors leading-snug drop-shadow-md">${img.title}</div>
            </div>
          </a>`;
      })
      .join("");

    return `
      <div class="bento-card rounded-3xl p-6 sm:p-8" data-gallery-container="${athlete.id}">
        <div class="mb-6 pb-4 border-b border-white/10">
          <div class="text-xs uppercase tracking-[0.2em] ${theme.accentText} font-semibold">Archiwum Fotograficzne i Pamiątki (${athlete.gallery.length} zdjęć)</div>
          <h3 class="font-serif-ceremonial text-2xl sm:text-3xl font-bold text-white mt-0.5">
            Galeria Kariery – Kliknij dowolne zdjęcie, aby powiększyć na pełny ekran
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:auto-rows-[240px] gap-4" data-gallery-grid="${athlete.id}">
          ${itemsHTML}
        </div>
      </div>
    `;
  }

  function renderAthleteSection(athlete) {
    const theme = getThemeClasses(athlete.eraTheme);

    // 4 Bento Stat Cards
    const bentoStatsHTML = athlete.bentoStats
      .map(
        (st) => `
        <div class="bento-card rounded-2xl p-5 ${st.highlight ? `bg-gradient-to-br ${theme.statHighlight}` : ""}">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="font-display-sport text-3xl sm:text-4xl font-bold text-white tracking-tight">${st.value}</span>
            <div class="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center ${theme.accentText}">
              <i data-lucide="${st.icon}" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-sm font-bold text-white">${st.label}</div>
          <div class="text-xs text-slate-300/80 mt-0.5 leading-snug">${st.sub}</div>
        </div>`
      )
      .join("");

    // Story paragraphs
    const storySectionsHTML = athlete.storySections
      .map(
        (sec) => `
        <div class="space-y-2">
          <h4 class="font-serif-ceremonial text-xl sm:text-2xl font-bold text-amber-200/95">${sec.heading}</h4>
          <p class="text-sm sm:text-base text-slate-200/90 leading-relaxed font-normal">${sec.body}</p>
        </div>`
      )
      .join("");

    // Achievements list
    const achievementsHTML = athlete.achievements
      .map(
        (ach) => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-4 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
          <div class="flex items-start sm:items-center gap-3">
            <span class="font-mono-stat text-xs font-bold ${theme.accentText} min-w-[95px] shrink-0">${ach.year}</span>
            <span class="text-sm text-white font-medium">${ach.title}</span>
          </div>
          <div class="shrink-0 self-start sm:self-center">
            ${getTierBadge(ach.tier)}
          </div>
        </div>`
      )
      .join("");

    const familySub = athlete.familyNameNote
      ? `<span class="text-xl sm:text-2xl font-normal italic text-slate-300 ml-2">(${athlete.familyNameNote})</span>`
      : "";

    const bottomShowcaseHTML = athlete.isSinglePhotoTrophyLayout
      ? buildSpecialTrophyShowcase(athlete)
      : buildAthleteGalleryBento(athlete, theme);

    const quoteHTML =
      athlete.quote && athlete.quote.text
        ? `
                <!-- Highlighted Personal Quote / Testimony -->
                <blockquote class="mt-6 p-6 rounded-2xl bg-gradient-to-br from-amber-500/12 via-slate-900/90 to-slate-950 border border-amber-400/30 relative">
                  <i data-lucide="quote" class="w-8 h-8 text-amber-400/30 absolute top-4 right-5"></i>
                  <p class="font-serif-ceremonial italic text-xl sm:text-2xl text-amber-100 leading-relaxed relative z-10">
                    „${athlete.quote.text}”
                  </p>
                  <footer class="mt-3 text-xs uppercase tracking-widest text-amber-400/90 font-semibold">
                    — ${athlete.quote.author}
                  </footer>
                </blockquote>`
        : "";

    return `
      <article
        id="athlete-${athlete.id}"
        data-slide-section="athlete-${athlete.id}"
        data-athlete-section="${athlete.id}"
        data-section-era="${athlete.eraTheme}"
        class="py-20 px-4 lg:px-8 border-t border-white/[0.07] relative"
      >
        <div class="max-w-[1360px] mx-auto">
          <!-- Section Top Header -->
          <div class="mb-10 gsap-reveal">
            <div class="flex flex-wrap items-center gap-2.5 mb-3">
              <span class="px-3.5 py-1 rounded-full text-xs font-mono-stat uppercase tracking-widest border ${theme.badge}">
                Sylwetka 0${athlete.index} • ${athlete.actNumber}
              </span>
              <span class="px-3.5 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-slate-200 border border-white/10 flex items-center gap-1.5">
                <i data-lucide="${athlete.disciplineIcon}" class="w-3.5 h-3.5 ${theme.accentText}"></i>
                <span>${athlete.discipline}</span>
              </span>
            </div>

            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 class="font-serif-ceremonial text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                ${athlete.name}${familySub}
              </h2>
            </div>
            <p class="text-lg sm:text-xl ${theme.accentText} font-serif-ceremonial italic mt-1">
              ${athlete.titleRole}
            </p>
          </div>

          <!-- Two-Column Asymmetric Layout (Sticky Portrait Left + Bento Content Right) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            ${buildHeroVisualCard(athlete, theme)}

            <!-- Right Column: Bento Stats + Editorial Biography + Achievements + Gallery -->
            <div class="lg:col-span-7 xl:col-span-8 space-y-6">
              <!-- 4 Bento Grid Stat Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 gsap-reveal">
                ${bentoStatsHTML}
              </div>

              <!-- Editorial Biography & Quote Bento Card -->
              <div class="bento-card rounded-3xl p-6 sm:p-9 space-y-6 gsap-reveal">
                <div class="text-base sm:text-lg text-white font-medium leading-relaxed border-l-4 border-amber-400 pl-4 py-1 bg-amber-500/[0.04] rounded-r-xl">
                  ${athlete.lead}
                </div>

                <div class="space-y-5 pt-2">
                  ${storySectionsHTML}
                </div>
                ${quoteHTML}
              </div>

              <!-- Curated Medal & Milestone Timeline -->
              <div class="bento-card rounded-3xl p-6 sm:p-8 gsap-reveal">
                <div class="flex items-center justify-between gap-2 mb-5 pb-3 border-b border-white/10">
                  <div>
                    <div class="text-xs uppercase tracking-[0.2em] ${theme.accentText} font-semibold">Kamienie Milowe i Dorobek Medalowy</div>
                    <h3 class="font-serif-ceremonial text-2xl font-bold text-white">Najważniejsze Osiągnięcia Sportowe</h3>
                  </div>
                  <i data-lucide="trophy" class="w-6 h-6 text-amber-400"></i>
                </div>
                <div class="space-y-2.5">
                  ${achievementsHTML}
                </div>
              </div>

              <!-- Gallery Bento or Special Trophy Cabinet -->
              <div class="gsap-reveal">
                ${bottomShowcaseHTML}
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // ==========================================================================
  // 5. PATRON & COMMEMORATIVE PLAQUES INITIATIVE SECTION
  // ==========================================================================
  function renderPatronSection() {
    const patron = DATA.school.patron;
    if (!patron) return "";

    return `
      <section id="section-patron" data-slide-section="section-patron" data-section-era="amber" class="py-20 px-4 lg:px-8 border-t border-white/10 relative">
        <div class="max-w-[1360px] mx-auto">
          <div class="mb-10 gsap-reveal">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono-stat uppercase tracking-widest border bg-amber-500/15 text-amber-300 border-amber-500/35 mb-3">
              <i data-lucide="landmark" class="w-3.5 h-3.5"></i>
              <span>${patron.badge}</span>
            </div>
            <h2 class="font-serif-ceremonial text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Pamięć i Uznanie w Murach Szkoły
            </h2>
            <p class="text-base sm:text-lg text-slate-300/90 mt-2 max-w-3xl">
              Projekt „Poczet Wybitnych Sportowców” towarzyszy trwałemu upamiętnieniu naszych Mistrzów poprzez stałą ekspozycję tablic pamiątkowych w Szkole Podstawowej nr 1 w Bieruniu.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <!-- Left: Prof. Krzysztof Ficek Card -->
            <div class="lg:col-span-6 bento-card rounded-3xl p-6 sm:p-8 flex flex-col justify-center gap-6 gsap-reveal">
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <a
                  href="${patron.portrait}"
                  class="glightbox shrink-0 group relative rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-xl w-36 h-36 sm:w-40 sm:h-40 bg-slate-900 cursor-zoom-in"
                  data-gallery="gallery-patron"
                  data-glightbox="title: ${patron.name}"
                >
                  <img src="${patron.portrait}" alt="${patron.name}" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                </a>

                <div>
                  <div class="text-xs uppercase tracking-[0.2em] text-amber-400 font-semibold mb-1">Fundator i Inicjator</div>
                  <h3 class="font-serif-ceremonial text-2xl sm:text-3xl font-bold text-white leading-tight">
                    ${patron.name}
                  </h3>
                  <p class="text-xs sm:text-sm text-amber-200/90 mt-2 leading-relaxed">
                    ${patron.role}
                  </p>
                </div>
              </div>

              <div class="space-y-4 pt-4 border-t border-white/10">
                <p class="text-sm sm:text-base text-slate-200/90 leading-relaxed">
                  ${patron.bio}
                </p>
                <div class="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.06] border-l-4 border-amber-400">
                  <div class="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1.5">Cel i idea ufundowania tablic</div>
                  <p class="text-sm sm:text-base text-white/95 leading-relaxed">
                    ${patron.mission}
                  </p>
                </div>
              </div>
            </div>

            <!-- Right: Commemorative Plaques Photo Slot (TBD Placeholder) -->
            <div class="lg:col-span-6 bento-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5 gsap-reveal">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <div class="text-xs uppercase tracking-[0.2em] text-amber-400 font-semibold">Ekspozycja Szkolna</div>
                  <h3 class="font-serif-ceremonial text-2xl sm:text-3xl font-bold text-white mt-0.5">
                    Stałe Tablice Pamiątkowe w SP nr 1
                  </h3>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-mono-stat font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                  TBD • Wkrótce
                </span>
              </div>

              <a
                href="${patron.plaquesImage}"
                class="glightbox gallery-item-card block rounded-2xl overflow-hidden border border-amber-400/30 bg-slate-950 relative group flex-1 min-h-[280px] sm:min-h-[340px]"
                data-gallery="gallery-patron"
                data-glightbox="title: ${patron.plaquesTitle}"
              >
                <img
                  src="${patron.plaquesImage}"
                  alt="${patron.plaquesTitle}"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div class="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-950/75 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <i data-lucide="zoom-in" class="w-4 h-4"></i>
                </div>
              </a>

              <p class="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                W tym miejscu po uroczystym odsłonięciu pojawi się fotografia pamiątkowych tablic umieszczonych na stałe w budynku Szkoły Podstawowej nr 1 w Bieruniu.
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================================================
  // 6. EPILOGUE / CEREMONIAL FINALE
  // ==========================================================================
  function renderEpilogue() {
    const portraitsCircle = DATA.athletes
      .map(
        (a) => `
        <button
          type="button"
          data-jump-target="athlete-${a.id}"
          class="group text-center flex flex-col items-center p-3 rounded-2xl hover:bg-white/5 transition-all"
        >
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400/50 group-hover:border-amber-300 group-hover:scale-105 transition-all shadow-lg mb-3 bg-slate-900">
            <img src="${a.heroImage}" alt="${a.name}" class="w-full h-full object-cover object-top" />
          </div>
          <div class="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">${a.name.replace("śp. ", "")}</div>
          <div class="text-[11px] text-slate-400">${a.discipline.split("•")[0].trim()}</div>
        </button>`
      )
      .join("");

    return `
      <section id="section-epilogue" data-slide-section="section-epilogue" data-section-era="amber" class="py-28 px-4 lg:px-8 border-t border-white/10 relative">
        <div class="max-w-5xl mx-auto text-center">
          <div class="bento-card rounded-3xl p-8 sm:p-14 border border-amber-400/35 relative overflow-hidden gsap-reveal">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto mb-6">
              <i data-lucide="award" class="w-7 h-7"></i>
            </div>

            <div class="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold mb-3">
              ${DATA.school.name} • Duma Pokoleń
            </div>

            <h2 class="font-serif-ceremonial text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5">
              Każda Wielka Droga Zaczyna Się na Szkolnej Sali
            </h2>

            <p class="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Historie naszych Absolwentów pokazują, że z murów Szkoły Podstawowej nr 1 w Bieruniu
              prowadzi prosta droga na stadiony Europy, podia Mistrzostw Polski i areny Igrzysk Olimpijskich.
              Dziękujemy za emocje, wzór wytrwałości i dumę, jaką dajecie kolejnym rocznikom uczniów!
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 pt-6 border-t border-white/10">
              ${portraitsCircle}
            </div>

            <div class="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                data-jump-target="section-prologue"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all"
              >
                <i data-lucide="arrow-up" class="w-4 h-4"></i>
                <span>Powrót na Początek Prezentacji</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==========================================================================
  // 6. FULL PAGE ASSEMBLY & INTERACTIVITY INITIALIZATION
  // ==========================================================================
  function buildFullPage() {
    const appRoot = document.getElementById("app-root");
    if (!appRoot) return;

    let mainContent = renderNavigation() + `<main class="relative z-10">` + renderPrologue();

    let lastActId = null;
    DATA.athletes.forEach((athlete) => {
      if (athlete.actId !== lastActId) {
        const actObj = DATA.school.acts.find((a) => a.id === athlete.actId);
        if (actObj) {
          mainContent += renderActBanner(actObj);
        }
        lastActId = athlete.actId;
      }
      mainContent += renderAthleteSection(athlete);
    });

    mainContent += renderPatronSection() + renderEpilogue() + `</main>`;
    appRoot.innerHTML = mainContent;

    // Collect ordered slide sections for Ceremony Mode (Prologue + 8 Athletes + Epilogue = 10 scenes)
    slideTargets = Array.from(document.querySelectorAll("[data-slide-section]")).map((el) => el.id);
  }

  function initSmartHeaderRibbon() {
    const nav = document.getElementById("header-timeline-nav");
    if (!nav) return;

    let isHoveringNav = false;
    let hoverVelocity = 0;
    let virtualScrollLeft = nav.scrollLeft || 0;
    let autoDirection = 1; // 1 = right, -1 = left
    let edgePauseFrames = 0;

    nav.addEventListener("mouseenter", () => {
      isHoveringNav = true;
      virtualScrollLeft = nav.scrollLeft;
    });

    nav.addEventListener("mousemove", (e) => {
      isHoveringNav = true;
      const rect = nav.getBoundingClientRect();
      if (rect.width <= 0) return;
      // Normalized position from -1 (left edge) to +1 (right edge)
      const relX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const deadzone = 0.22; // Center 22% holds steady for easy clicking
      if (Math.abs(relX) < deadzone) {
        hoverVelocity = 0;
      } else {
        const intensity = (Math.abs(relX) - deadzone) / (1 - deadzone);
        hoverVelocity = Math.sign(relX) * Math.pow(intensity, 1.35) * 6.5;
      }
    });

    nav.addEventListener("mouseleave", () => {
      isHoveringNav = false;
      hoverVelocity = 0;
    });

    // Also allow mouse wheel horizontal panning over the ribbon
    nav.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          virtualScrollLeft += e.deltaY * 0.7;
          const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
          virtualScrollLeft = Math.max(0, Math.min(maxScroll, virtualScrollLeft));
          nav.scrollLeft = virtualScrollLeft;
        }
      },
      { passive: false }
    );

    function tickRibbon() {
      const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
      if (maxScroll > 2) {
        if (isHoveringNav) {
          // 1. User is hovering on the header ribbon: pan left/right based on cursor X
          if (hoverVelocity !== 0) {
            virtualScrollLeft = Math.max(0, Math.min(maxScroll, virtualScrollLeft + hoverVelocity));
            nav.scrollLeft = virtualScrollLeft;
          }
        } else if (activeAthleteId) {
          // 2. User is viewing a specific athlete section: smoothly center that athlete's pill & hold steady
          const activePill = nav.querySelector(`[data-athlete-pill="${activeAthleteId}"]`);
          if (activePill) {
            const navRect = nav.getBoundingClientRect();
            const pillRect = activePill.getBoundingClientRect();
            const pillCenterInNav = pillRect.left - navRect.left + nav.scrollLeft + pillRect.width / 2;
            const targetScroll = Math.max(0, Math.min(maxScroll, pillCenterInNav - nav.clientWidth / 2));
            const diff = targetScroll - virtualScrollLeft;
            if (Math.abs(diff) > 0.4) {
              virtualScrollLeft += diff * 0.085;
              nav.scrollLeft = virtualScrollLeft;
            }
          }
        } else {
          // 3. User is at Prologue or Epilogue (not on any specific person): gently auto-scroll back & forth
          if (edgePauseFrames > 0) {
            edgePauseFrames--;
          } else {
            virtualScrollLeft += autoDirection * 0.42;
            if (virtualScrollLeft >= maxScroll) {
              virtualScrollLeft = maxScroll;
              autoDirection = -1;
              edgePauseFrames = 45;
            } else if (virtualScrollLeft <= 0) {
              virtualScrollLeft = 0;
              autoDirection = 1;
              edgePauseFrames = 45;
            }
            nav.scrollLeft = virtualScrollLeft;
          }
        }
      }
      requestAnimationFrame(tickRibbon);
    }

    requestAnimationFrame(tickRibbon);
  }

  function scrollToSectionId(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;

    const idx = slideTargets.indexOf(targetId);
    if (idx !== -1) {
      setActiveSlide(targetId, idx);
    }

    if (lenis) {
      lenis.scrollTo(el, { offset: -64, duration: 1.15 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function updateSlideBadge() {
    const badge = document.getElementById("slide-counter-badge");
    if (badge && slideTargets.length) {
      const current = String(currentSlideIndex + 1).padStart(2, "0");
      const total = String(slideTargets.length).padStart(2, "0");
      badge.textContent = `${current} / ${total}`;
    }
  }

  function initCeremonyControls() {
    // Jump buttons
    document.querySelectorAll("[data-jump-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-jump-target");
        scrollToSectionId(target);
      });
    });

    const prevBtn = document.getElementById("btn-prev-slide");
    const nextBtn = document.getElementById("btn-next-slide");
    const ceremonyBtn = document.getElementById("btn-ceremony-mode");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentSlideIndex > 0) {
          scrollToSectionId(slideTargets[currentSlideIndex - 1]);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentSlideIndex < slideTargets.length - 1) {
          scrollToSectionId(slideTargets[currentSlideIndex + 1]);
        }
      });
    }

    if (ceremonyBtn) {
      ceremonyBtn.addEventListener("click", toggleCeremonyFullscreen);
    }

    // Keyboard navigation for Ceremony Presentation Mode (Arrows / PageUp / PageDown / F)
    window.addEventListener("keydown", (e) => {
      // Do not intercept keys when GLightbox modal is open
      if (document.body.classList.contains("glightbox-open")) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (currentSlideIndex < slideTargets.length - 1) {
          scrollToSectionId(slideTargets[currentSlideIndex + 1]);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (currentSlideIndex > 0) {
          scrollToSectionId(slideTargets[currentSlideIndex - 1]);
        }
      } else if (e.key === "f" || e.key === "F") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleCeremonyFullscreen();
        }
      }
    });
  }

  function toggleCeremonyFullscreen() {
    isCeremonyMode = !isCeremonyMode;
    document.body.classList.toggle("ceremony-mode", isCeremonyMode);

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function initAnimationsAndScroll() {
    // 1. Initialize Lenis Smooth Scroll
    if (typeof window.Lenis !== "undefined") {
      lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
      });

      if (typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined") {
        lenis.on("scroll", window.ScrollTrigger.update);
        window.gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }
    }

    // 2. Initialize GSAP + ScrollTrigger
    if (typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined") {
      window.gsap.registerPlugin(window.ScrollTrigger);

      // Reveal animations for cards and headers
      document.querySelectorAll(".gsap-reveal").forEach((el) => {
        window.gsap.fromTo(
          el,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none"
            }
          }
        );
      });

      // Era background theme shifts
      document.querySelectorAll("[data-section-era]").forEach((sec) => {
        const era = sec.getAttribute("data-section-era");
        window.ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => document.body.setAttribute("data-era", era),
          onEnterBack: () => document.body.setAttribute("data-era", era)
        });
      });

      // Active slide & navigation pill tracking
      slideTargets.forEach((secId, idx) => {
        const el = document.getElementById(secId);
        if (!el) return;
        window.ScrollTrigger.create({
          trigger: el,
          start: "top 48%",
          end: "bottom 48%",
          onEnter: () => setActiveSlide(secId, idx),
          onEnterBack: () => setActiveSlide(secId, idx)
        });
      });
    }

    // 3. Scroll progress bar listener
    window.addEventListener(
      "scroll",
      () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        const bar = document.getElementById("scroll-progress-bar");
        if (bar) bar.style.width = `${pct}%`;
      },
      { passive: true }
    );
  }

  function setActiveSlide(secId, idx) {
    currentSlideIndex = idx;
    updateSlideBadge();

    activeAthleteId = secId && secId.startsWith("athlete-") ? secId.replace("athlete-", "") : null;

    document.querySelectorAll("[data-athlete-pill]").forEach((pill) => {
      const pillTarget = `athlete-${pill.getAttribute("data-athlete-pill")}`;
      pill.classList.toggle("active", pillTarget === secId);
    });
  }

  function initLightboxAndIcons() {
    if (typeof window.lucide !== "undefined") {
      window.lucide.createIcons();
    }
    if (typeof window.GLightbox !== "undefined") {
      lightbox = window.GLightbox({
        selector: ".glightbox",
        touchNavigation: true,
        loop: true,
        zoomable: true,
        draggable: true
      });
    }
  }

  // Boot application on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    buildFullPage();
    initLightboxAndIcons();
    initSmartHeaderRibbon();
    initCeremonyControls();
    initAnimationsAndScroll();
  });
})();
