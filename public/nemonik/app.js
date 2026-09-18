let kanjiData = [];
let srsData = JSON.parse(localStorage.getItem('nemonik_srs') || '{}');
let lastLogin = localStorage.getItem('nemonik_last_login');
let currentStreak = parseInt(localStorage.getItem('nemonik_streak') || '0');

let activeQueue = [];
let currentIndex = 0;

// Screens
const dashboardScreen = document.getElementById('dashboard-screen');
const studyScreen = document.getElementById('study-screen');

// Elements
const cardContainer = document.getElementById('card-container');
const btnShowAnswer = document.getElementById('btn-show-answer');
const srsRatingContainer = document.getElementById('srs-rating-container');
const themeToggle = document.getElementById('theme-toggle');
const homeLogo = document.getElementById('home-logo');

// Quiz Elements
const quizModal = document.getElementById('quiz-modal');
const quizResultModal = document.getElementById('quiz-result-modal');
const quizQuestion = document.getElementById('quiz-question');
const quizPrompt = document.getElementById('quiz-prompt');
const quizOptions = document.getElementById('quiz-options');
const quizScoreEl = document.getElementById('quiz-score');

let quizScore = 0;
let quizQuestionsAnswered = 0;
let quizCurrentTarget = null;
let quizType = 1;
let mistakes = [];

// Initialize
async function init() {
    try {
        const response = await fetch('data.json');
        kanjiData = await response.json();
        
        checkStreak();
        syncSrsData();
        updateDashboardStats();
        setupTheme();
        
    } catch (error) {
        console.error("Failed to load data", error);
    }
}

// Theme
function setupTheme() {
    const isDark = localStorage.getItem('nemonik_theme') === 'dark';
    if (isDark) document.body.setAttribute('data-theme', 'dark');
    
    themeToggle.addEventListener('click', () => {
        const currentlyDark = document.body.getAttribute('data-theme') === 'dark';
        if (currentlyDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('nemonik_theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('nemonik_theme', 'dark');
        }
    });
}

// Streak Management
function checkStreak() {
    const today = new Date().toDateString();
    if (lastLogin !== today) {
        if (lastLogin) {
            const lastDate = new Date(lastLogin);
            const diffTime = Math.abs(new Date() - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) {
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }
        localStorage.setItem('nemonik_last_login', today);
        localStorage.setItem('nemonik_streak', currentStreak);
    }
}

// SRS Data Setup
function syncSrsData() {
    kanjiData.forEach(k => {
        if (!srsData[k.no]) {
            srsData[k.no] = {
                status: 'baru', // baru, belajar, hafal, ulang
                nextReview: Date.now(),
                interval: 1, // in days
                ease: 2.5
            };
        }
    });
    saveSrs();
}

function saveSrs() {
    localStorage.setItem('nemonik_srs', JSON.stringify(srsData));
}

// Dashboard
function updateDashboardStats() {
    const now = Date.now();
    let counts = { baru: 0, belajar: 0, hafal: 0, ulang: 0 };
    let total = kanjiData.length;
    let reviewCount = 0;

    kanjiData.forEach(k => {
        const srs = srsData[k.no];
        counts[srs.status]++;
        if (srs.status !== 'baru' && srs.nextReview <= now) {
            reviewCount++;
        }
    });

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-streak').textContent = currentStreak + " Hari";
    
    document.getElementById('stat-baru').textContent = counts.baru;
    document.getElementById('stat-belajar').textContent = counts.belajar;
    document.getElementById('stat-hafal').textContent = counts.hafal;
    document.getElementById('stat-ulang').textContent = counts.ulang;

    document.getElementById('review-count').textContent = reviewCount;
}

// Navigation
homeLogo.addEventListener('click', () => {
    studyScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    updateDashboardStats();
});

document.getElementById('btn-back-study').addEventListener('click', () => {
    studyScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    updateDashboardStats();
});

// Start Study / Review
document.getElementById('btn-start-study').addEventListener('click', () => {
    // Pick 'baru' and 'belajar'
    activeQueue = kanjiData.filter(k => srsData[k.no].status === 'baru' || srsData[k.no].status === 'belajar');
    if(activeQueue.length === 0) activeQueue = kanjiData; // fallback
    startStudySession();
});

document.getElementById('btn-start-review').addEventListener('click', () => {
    const now = Date.now();
    activeQueue = kanjiData.filter(k => srsData[k.no].status !== 'baru' && srsData[k.no].nextReview <= now);
    if(activeQueue.length === 0) {
        alert("Tidak ada kartu yang perlu direview saat ini!");
        return;
    }
    startStudySession();
});

function startStudySession() {
    // Shuffle queue
    activeQueue.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    
    dashboardScreen.classList.add('hidden');
    studyScreen.classList.remove('hidden');
    renderStudyCard();
}

// Render Card in Study Mode
function renderStudyCard() {
    if (currentIndex >= activeQueue.length) {
        alert("Sesi selesai!");
        studyScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        updateDashboardStats();
        return;
    }

    const data = activeQueue[currentIndex];
    document.getElementById('study-progress-text').textContent = (currentIndex + 1) + " / " + activeQueue.length;

    // Reset controls
    btnShowAnswer.classList.remove('hidden');
    srsRatingContainer.classList.add('hidden');

    const buildVocabList = (list) => {
        if (!list || list.length === 0) return '<p class="vocab-arti">-</p>';
        return list.map(v => 
            '<li class="vocab-item">' +
                '<span class="vocab-kana">' + v.kana + '</span>' +
                '<span class="vocab-kanji">' + v.kata + '</span>' +
                '<span class="vocab-arti">' + v.arti + '</span>' +
            '</li>'
        ).join('');
    };

    const imgSelesai = data.img_selesai_potong || data.img_kanji_bersih || '';
    const imgKonteks = data.img_kanji_nama || '';
    
    // Initial State: Hidden body
    const html = 
        '<div class="flashcard">' +
            '<div class="flashcard-top">' +
                '<div class="img-left">' +
                    '<img src="' + imgSelesai + '" alt="Kanji" onerror="this.style.display=\'none\'">' +
                '</div>' +
                '<div class="img-right">' +
                    (imgKonteks ? '<img src="' + imgKonteks + '" alt="Konteks" onerror="this.style.display=\'none\'">' : '<div style="color:var(--text-muted)">Visual Tidak Tersedia</div>') +
                '</div>' +
            '</div>' +
            '<div id="flashcard-details" class="flashcard-body hidden-content">' +
                '<h2 class="arti-title">' + data.arti + '</h2>' +
                '<div class="kanji-title">' + data.kanji + '</div>' +
                '<div class="readings">' +
                    '<div class="reading-box">' +
                        '<div class="reading-label">Onyomi</div>' +
                        '<div class="reading-text">' + (data.onyomi && data.onyomi !== '—' ? data.onyomi : '-') + '</div>' +
                    '</div>' +
                    '<div class="reading-box">' +
                        '<div class="reading-label">Kunyomi</div>' +
                        '<div class="reading-text">' + (data.kunyomi && data.kunyomi !== '—' ? data.kunyomi : '-') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="vocab-section">' +
                    '<div class="vocab-col">' +
                        '<h4>Kosakata Onyomi</h4>' +
                        '<ul class="vocab-list">' + buildVocabList(data.kosakata_onyomi) + '</ul>' +
                    '</div>' +
                    '<div class="vocab-col">' +
                        '<h4>Kosakata Kunyomi</h4>' +
                        '<ul class="vocab-list">' + buildVocabList(data.kosakata_kunyomi) + '</ul>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    cardContainer.innerHTML = html;
}

btnShowAnswer.addEventListener('click', () => {
    document.getElementById('flashcard-details').classList.remove('hidden-content');
    btnShowAnswer.classList.add('hidden');
    srsRatingContainer.classList.remove('hidden');
});

// SRS Rating System
document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const rating = parseInt(e.target.dataset.rating);
        processSrsRating(rating);
    });
});

function processSrsRating(rating) {
    const data = activeQueue[currentIndex];
    const srs = srsData[data.no];

    // rating: 1 (Lupa/Salah), 2 (Sulit), 3 (Mudah)
    if (rating === 1) {
        srs.status = 'ulang';
        srs.interval = 1;
        srs.ease = Math.max(1.3, srs.ease - 0.2);
    } else if (rating === 2) {
        srs.status = 'belajar';
        srs.interval = Math.max(1, srs.interval * 1.2);
        srs.ease = Math.max(1.3, srs.ease - 0.15);
    } else if (rating === 3) {
        srs.status = 'hafal';
        srs.interval = Math.max(1, srs.interval * srs.ease);
        srs.ease = srs.ease + 0.15;
    }

    // Convert interval (days) to ms and add to now
    const ONE_DAY = 24 * 60 * 60 * 1000;
    srs.nextReview = Date.now() + (srs.interval * ONE_DAY);
    
    saveSrs();
    
    currentIndex++;
    renderStudyCard();
}

// ---------------- QUIZ SYSTEM ----------------
document.getElementById('btn-start-quiz').addEventListener('click', () => {
    quizScore = 0;
    quizQuestionsAnswered = 0;
    mistakes = [];
    document.getElementById('quiz-score').textContent = 'Skor: 0';
    quizModal.classList.remove('hidden');
    generateQuizQuestion();
});

document.getElementById('close-quiz-btn').addEventListener('click', () => {
    quizModal.classList.add('hidden');
    showQuizResult();
});

document.getElementById('btn-quiz-done').addEventListener('click', () => {
    quizResultModal.classList.add('hidden');
    updateDashboardStats();
});

function generateQuizQuestion() {
    if (kanjiData.length < 4) return;
    
    // Priority: Belajar & Ulang
    let pool = kanjiData.filter(k => srsData[k.no].status === 'ulang' || srsData[k.no].status === 'belajar');
    if (pool.length < 4) pool = kanjiData; // fallback to all
    
    const correctTarget = pool[Math.floor(Math.random() * pool.length)];
    quizCurrentTarget = correctTarget;
    
    // Random Quiz Type (1, 2, or 3)
    quizType = Math.floor(Math.random() * 3) + 1;
    let correctAnswerStr = "";
    
    if (quizType === 1) {
        quizPrompt.textContent = "Apa arti dari kanji ini?";
        quizQuestion.textContent = correctTarget.kanji;
        correctAnswerStr = correctTarget.arti;
    } else if (quizType === 2) {
        quizPrompt.textContent = "Pilih kanji yang memiliki arti berikut:";
        quizQuestion.textContent = correctTarget.arti;
        correctAnswerStr = correctTarget.kanji;
    } else {
        quizPrompt.textContent = "Mana cara baca (Onyomi/Kunyomi) yang benar?";
        quizQuestion.textContent = correctTarget.kanji;
        correctAnswerStr = (correctTarget.kunyomi && correctTarget.kunyomi !== '—') ? correctTarget.kunyomi : correctTarget.onyomi;
    }

    let options = [correctAnswerStr];
    while(options.length < 4) {
        let wrongTarget = kanjiData[Math.floor(Math.random() * kanjiData.length)];
        let wrongStr = "";
        
        if (quizType === 1) wrongStr = wrongTarget.arti;
        else if (quizType === 2) wrongStr = wrongTarget.kanji;
        else wrongStr = (wrongTarget.kunyomi && wrongTarget.kunyomi !== '—') ? wrongTarget.kunyomi : wrongTarget.onyomi;
        
        if (!options.includes(wrongStr) && wrongStr !== '—') {
            options.push(wrongStr);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    quizOptions.innerHTML = options.map(opt => {
        const safeOpt = opt.replace(/'/g, "\\'");
        return '<button class="quiz-option" onclick="checkQuizAnswer(\'' + safeOpt + '\', \'' + correctAnswerStr.replace(/'/g, "\\'") + '\')">' + opt + '</button>';
    }).join('');
}

window.checkQuizAnswer = function(selected, correct) {
    quizQuestionsAnswered++;
    if (selected === correct) {
        quizScore++;
        // Optional subtle visual feedback
        document.querySelector('.modal-content').style.boxShadow = "0 0 20px var(--success)";
        setTimeout(() => document.querySelector('.modal-content').style.boxShadow = "none", 300);
    } else {
        mistakes.push(quizCurrentTarget);
        // Penalize in SRS internally
        let srs = srsData[quizCurrentTarget.no];
        if (srs.status === 'hafal' || srs.status === 'belajar') {
            srs.status = 'ulang';
            srs.ease = Math.max(1.3, srs.ease - 0.2);
            saveSrs();
        }
        
        document.querySelector('.modal-content').style.boxShadow = "0 0 20px var(--danger)";
        setTimeout(() => document.querySelector('.modal-content').style.boxShadow = "none", 300);
    }
    
    document.getElementById('quiz-score').textContent = 'Skor: ' + quizScore;
    
    if (quizQuestionsAnswered >= 10) {
        quizModal.classList.add('hidden');
        showQuizResult();
    } else {
        generateQuizQuestion();
    }
}

function showQuizResult() {
    document.getElementById('final-score').textContent = quizScore + " / " + quizQuestionsAnswered;
    const accuracy = quizQuestionsAnswered > 0 ? Math.round((quizScore / quizQuestionsAnswered) * 100) : 0;
    document.getElementById('final-accuracy').textContent = accuracy + "%";
    
    const mistakesContainer = document.getElementById('mistakes-container');
    const mistakesList = document.getElementById('mistakes-list');
    
    if (mistakes.length > 0) {
        mistakesContainer.classList.remove('hidden');
        // Deduplicate mistakes
        const uniqueMistakes = [...new Set(mistakes)];
        mistakesList.innerHTML = uniqueMistakes.map(m => '<li><strong>' + m.kanji + '</strong> - ' + m.arti + '</li>').join('');
    } else {
        mistakesContainer.classList.add('hidden');
    }
    
    quizResultModal.classList.remove('hidden');
}

// Start
init();
