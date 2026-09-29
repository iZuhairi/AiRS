// --- Navigation Logic (Sidebar -> Sections) ---
function navigate(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('animate-slide-up');
    });
    
    const target = document.getElementById(`sec-${sectionId}`);
    if(target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('animate-slide-up'), 10);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-cisco-primary', 'text-white');
        btn.classList.add('bg-transparent', 'text-slate-600');
    });
    
    const activeBtn = document.getElementById(`btn-${sectionId}`);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-cisco-primary', 'text-white');
        activeBtn.classList.remove('bg-transparent', 'text-slate-600');
    }
}

// --- Interactive Topology Logic (Scenarios & Slides) ---
let currentScenario = 1;
let currentSlide = 1;

// Konfigurasi jumlah slide ikut lakaran leader (S1: 7 langkah, S2: 3 langkah)
const slidesConfig = {
    1: 7, 
    2: 3  
};

// Fungsi bila pengguna tekan Tab di atas (S1, S2)
function goToScenario(num) {
    currentScenario = num;
    currentSlide = 1; // Sentiasa mula dari Slide 1 bila tukar senario
    updateSliderUI();
}

// Fungsi bila tekan butang PREV
function prevSlide() {
    if (currentSlide > 1) {
        currentSlide--;
        updateSliderUI();
    }
}

// Fungsi bila tekan butang NEXT
function nextSlide() {
    if (currentSlide < slidesConfig[currentScenario]) {
        currentSlide++;
        updateSliderUI();
    }
}

// Enjin pengemaskinian UI (Teks & Animasi Topologi)
function updateSliderUI() {
    // 1. Update warna tab senario (biru jika aktif)
    document.querySelectorAll('.scenario-tab').forEach((tab, index) => {
        let i = index + 1;
        if(tab) {
            tab.className = i === currentScenario 
                ? "scenario-tab active px-6 py-2 rounded-lg text-sm font-semibold bg-white text-cisco-primary shadow-sm transition-all" 
                : "scenario-tab px-6 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 bg-transparent transition-all";
        }
    });

    // 2. Sembunyikan SEMUA teks penerangan dahulu
    document.querySelectorAll('.scenario-text').forEach(el => el.classList.add('hidden'));

    // 3. Paparkan teks yang betul (Contoh: text-s1-slide2)
    const activeText = document.getElementById(`text-s${currentScenario}-slide${currentSlide}`);
    if (activeText) activeText.classList.remove('hidden');

    // 4. TUKAR STATE TOPOLOGI KANAN SECARA AUTOMATIK!
    // Bahagian ni yang akan 'trigger' animasi CSS untuk laluan packet & kelipan lampu port
    const topoContainer = document.getElementById('topology-container');
    if (topoContainer) {
        topoContainer.setAttribute('data-state', `s${currentScenario}-${currentSlide}`);
    }

    // 5. Update nombor slide dan status butang (Disable kalau tak boleh gerak)
    const totalSlides = slidesConfig[currentScenario];
    const indicator = document.getElementById('slide-indicator');
    if(indicator) indicator.innerText = `SLIDE ${currentSlide} OF ${totalSlides}`;
    
    const btnPrev = document.getElementById('btn-prev');
    if(btnPrev) btnPrev.disabled = currentSlide === 1; // Tak boleh undur kalau dah di slide 1
    
    const btnNext = document.getElementById('btn-next');
    if(btnNext) btnNext.disabled = currentSlide === totalSlides; // Tak boleh mara kalau dah di slide akhir
}

// --- Dummy Website iFrame Navigation Logic ---
function changeIframePage(fileName, urlPath, clickedBtn) {
    const iframe = document.getElementById('airs-iframe');
    if(iframe) iframe.src = fileName;
    
    const urlBar = document.getElementById('browser-url');
    if(urlBar) urlBar.innerHTML = `<i class="fa-solid fa-lock text-slate-400"></i> 127.0.0.1:5000 / ${urlPath}`;
    
    document.querySelectorAll('.dummy-nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600');
        btn.classList.add('text-slate-600', 'hover:bg-slate-50');
    });
    
    if (clickedBtn && !clickedBtn.innerText.includes('Logout')) {
        clickedBtn.classList.remove('text-slate-600', 'hover:bg-slate-50');
        clickedBtn.classList.add('bg-blue-50', 'text-blue-600');
    }
}