        // ========== SPLASH & ONBOARDING SYSTEM ==========
        let currentSlide = 0;
        const totalSlides = 6;
        
        // User preferences
        let userGoal = null;
        let userStyle = null;
        
        function selectGoal(btn, goal) {
            document.querySelectorAll('.goal-option').forEach(b => {
                b.style.borderColor = '#e8dcc7';
                b.style.background = '#fff';
            });
            btn.style.borderColor = '#5d4037';
            btn.style.background = '#f5f0e8';
            userGoal = goal;
        }
        
        function selectStyle(btn, style) {
            document.querySelectorAll('.style-option').forEach(b => {
                b.style.borderColor = '#e8dcc7';
                b.style.background = '#fff';
            });
            btn.style.borderColor = '#5d4037';
            btn.style.background = '#f5f0e8';
            userStyle = style;
        }
        
        // Splash screen
        function initSplash() {
            const hasSeenOnboarding = localStorage.getItem('breathCafeOnboarding');
            
            // Show splash for 2.5 seconds
            setTimeout(() => {
                document.getElementById('splashScreen').classList.add('hidden');
                
                // If already seen onboarding, hide it too
                if (hasSeenOnboarding) {
                    document.getElementById('onboardingOverlay').classList.add('hidden');
                }
            }, 2500);
        }
        
        function checkOnboarding() {
            const hasSeenOnboarding = localStorage.getItem('breathCafeOnboarding');
            if (hasSeenOnboarding) {
                document.getElementById('onboardingOverlay').classList.add('hidden');
            }
        }
        
        function goToSlide(num) {
            currentSlide = num;
            document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
            document.getElementById('slide' + num).classList.add('active');
            
            // Update all dots across all slides
            document.querySelectorAll('.onboarding-dots').forEach(dotsContainer => {
                dotsContainer.querySelectorAll('.onboarding-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === num);
                });
            });
        }
        
        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                goToSlide(currentSlide + 1);
            }
        }
        
        function prevSlide() {
            if (currentSlide > 0) {
                goToSlide(currentSlide - 1);
            }
        }
        
        function skipOnboarding() {
            finishOnboarding();
        }
        
        function finishOnboarding() {
            localStorage.setItem('breathCafeOnboarding', 'true');
            document.getElementById('onboardingOverlay').classList.add('hidden');
            // Go to emotion page for first brew
            goTo('emotion');
        }
        
        // Reset onboarding (for testing)
        function resetOnboarding() {
            localStorage.removeItem('breathCafeOnboarding');
            location.reload();
        }
        
        // Initialize splash on page load
        document.addEventListener('DOMContentLoaded', function() {
            initSplash();
            initExperienceMode();
        });

        // ========== DATA PERSISTENCE SYSTEM ==========
        const DB = {
            load: function() {
                const saved = localStorage.getItem('breathCafeData');
                if (saved) {
                    return JSON.parse(saved);
                }
                return {
                    user: { name: 'Coffee Lover', email: '', level: 1, joinDate: new Date().toISOString() },
                    stats: { totalBrews: 0, streak: 0, lastBrewDate: null, moodImproved: 0, moodTotal: 0 },
                    stamps: [],
                    history: [],
                    journalEntries: [],
                    coffeeCount: { mocha: 0, americano: 0, latte: 0, coldbrew: 0, caramel: 0 },
                    weeklyBrews: [0, 0, 0, 0],
                    timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
                    achievements: { streak7: false, streak30: false, mochaMaster: false, earlyBird: false, first10: false },
                    emotionJourney: [],
                    settings: { darkMode: false, sound: true, vibration: true, dailyReminder: true, reminderTime: '09:00' }
                };
            },
            save: function(data) { localStorage.setItem('breathCafeData', JSON.stringify(data)); },
            get: function() { return this.load(); },
            update: function(key, value) {
                const data = this.load();
                data[key] = value;
                this.save(data);
                return data;
            },
            addBrew: function(brewData) {
                const data = this.load();
                // Add to history
                data.history.unshift(brewData);
                // Add stamp
                data.stamps.push({ date: new Date().toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'}), coffee: brewData.coffeeIcon, filled: true });
                // Update stats
                data.stats.totalBrews++;
                data.stats.moodTotal++;
                // Check mood improvement
                const negativeEmotions = ['sad', 'anxious', 'angry', 'tired'];
                const positiveEmotions = ['joy', 'calm'];
                if (negativeEmotions.includes(brewData.beforeEmotion) && positiveEmotions.includes(brewData.afterEmotion)) {
                    data.stats.moodImproved++;
                }
                // Update streak
                const today = new Date().toDateString();
                const lastBrew = data.stats.lastBrewDate ? new Date(data.stats.lastBrewDate).toDateString() : null;
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (lastBrew === yesterday) {
                    data.stats.streak++;
                } else if (lastBrew !== today) {
                    data.stats.streak = 1;
                }
                data.stats.lastBrewDate = new Date().toISOString();
                // Update coffee count
                if (data.coffeeCount[brewData.coffeeType] !== undefined) {
                    data.coffeeCount[brewData.coffeeType]++;
                }
                // Update time of day
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) data.timeOfDay.morning++;
                else if (hour >= 12 && hour < 17) data.timeOfDay.afternoon++;
                else if (hour >= 17 && hour < 21) data.timeOfDay.evening++;
                else data.timeOfDay.night++;
                // Update weekly brews
                const weekNum = Math.floor((new Date().getDate() - 1) / 7);
                if (weekNum < 4) data.weeklyBrews[weekNum]++;
                // Check achievements
                if (data.stats.streak >= 7) data.achievements.streak7 = true;
                if (data.stats.streak >= 30) data.achievements.streak30 = true;
                if (data.coffeeCount.mocha >= 10) data.achievements.mochaMaster = true;
                if (data.timeOfDay.morning >= 5) data.achievements.earlyBird = true;
                if (data.stats.totalBrews >= 10) data.achievements.first10 = true;
                // Update level
                data.user.level = Math.floor(data.stats.totalBrews / 5) + 1;
                // Add to emotion journey
                data.emotionJourney.push({
                    date: new Date().toISOString(),
                    day: new Date().getDay(),
                    before: brewData.beforeEmotion,
                    after: brewData.afterEmotion,
                    icon: brewData.afterIcon
                });
                // Keep only last 7 days of emotion journey
                if (data.emotionJourney.length > 7) {
                    data.emotionJourney = data.emotionJourney.slice(-7);
                }
                this.save(data);
                return data;
            },
            addJournalEntry: function(text) {
                const data = this.load();
                data.journalEntries.unshift({
                    date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
                    text: text,
                    timestamp: new Date().toISOString()
                });
                this.save(data);
                return data;
            }
        };

        // Load saved data on startup
        let userData = DB.load();
        
        const st = {
            curr: 'welcome',
            emotion: null, emotionIcon: null, emotionText: null,
            coffee: null, breathData: {inhale: 5, hold: 4, exhale: 7},
            afterEmotion: null, afterIcon: null, afterText: null,
            note: '', rating: 0,
            holding: false, phase: 0, timer: 0, phaseTime: 0, interval: null,
            cycle: 1, totalCycles: 3, cyclePhase: 0,
            stamps: userData.stamps,
            history: userData.history,
            journalEntries: userData.journalEntries
        };

        const coffees = {
            mocha: {icon: '🫖', name: 'Mocha', tag: 'Warm & Comforting', inhale: 5, hold: 4, exhale: 7, steps: [
                {n: 'Grinding (5s)', d: 'Prepare slowly, breathe deeply'},
                {n: 'Heating (4s)', d: 'Let warmth settle'},
                {n: 'Brewing (7s)', d: 'Release slowly like comfort'}
            ]},
            americano: {icon: '☕', name: 'Americano', tag: 'Clear & Balanced', inhale: 4, hold: 2, exhale: 4, steps: [
                {n: 'Pouring (4s)', d: 'Steady rhythm'},
                {n: 'Blooming (2s)', d: 'Find balance'},
                {n: 'Extracting (4s)', d: 'Even flow'}
            ]},
            latte: {icon: '🥛', name: 'Latte', tag: 'Smooth & Gentle', inhale: 5, hold: 3, exhale: 6, steps: [
                {n: 'Brewing (5s)', d: 'Deep breath'},
                {n: 'Steaming (3s)', d: 'Gentle hold'},
                {n: 'Pouring (6s)', d: 'Smooth release'}
            ]},
            coldbrew: {icon: '🧊', name: 'Cold Brew', tag: 'Cool & Patient', inhale: 6, hold: 3, exhale: 6, steps: [
                {n: 'Chilling (6s)', d: 'Deep slow breath'},
                {n: 'Steeping (3s)', d: 'Patient hold'},
                {n: 'Cooling (6s)', d: 'Long release'}
            ]},
            caramel: {icon: '🍯', name: 'Caramel', tag: 'Sweet & Rich', inhale: 4, hold: 3, exhale: 5, steps: [
                {n: 'Base (4s)', d: 'Gentle breath'},
                {n: 'Syrup (3s)', d: 'Sweet hold'},
                {n: 'Mixing (5s)', d: 'Rich release'}
            ]}
        };

        const emotionMap = {sad: 'mocha', anxious: 'americano', angry: 'coldbrew', tired: 'espresso', joy: 'caramel', calm: 'latte'};

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('sidebarOverlay').classList.toggle('active');
            document.getElementById('hamburgerBtn').classList.toggle('active');
        }

        function goTo(page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(page).classList.add('active');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            // Update header nav
            document.querySelectorAll('.header-nav-item').forEach(n => {
                n.classList.remove('active');
                if ((page === 'welcome' && n.textContent.includes('Home')) ||
                    (page === 'emotion' && n.textContent.includes('Brew')) ||
                    (page === 'journal' && n.textContent.includes('Journal')) ||
                    (page === 'stats' && n.textContent.includes('Stats'))) {
                    n.classList.add('active');
                }
            });
            st.curr = page;
            if (page === 'stamps') initStamps();
            if (page === 'journal') initJournal();
            if (page === 'stats') updateStatsPage();
            if (page === 'welcome') updateWelcomePage();
            if (page === 'account') updateAccountPage();
            window.scrollTo(0, 0);
        }
        
        // Update Stats page with real data
        function updateStatsPage() {
            userData = DB.load();
            
            // Main stats
            const totalBrews = userData.stats.totalBrews;
            const streak = userData.stats.streak;
            const moodRate = userData.stats.moodTotal > 0 
                ? Math.round((userData.stats.moodImproved / userData.stats.moodTotal) * 100) 
                : 0;
            
            // Find favorite coffee
            let favCoffee = '☕';
            let maxCount = 0;
            for (const [coffee, count] of Object.entries(userData.coffeeCount)) {
                if (count > maxCount) {
                    maxCount = count;
                    favCoffee = coffees[coffee]?.icon || '☕';
                }
            }
            
            // Update main stats display
            const statsCards = document.querySelectorAll('#stats .stat-card .stat-number');
            if (statsCards.length >= 4) {
                statsCards[0].textContent = totalBrews;
                statsCards[1].textContent = streak + '🔥';
                statsCards[2].textContent = maxCount > 0 ? favCoffee : '-';
                statsCards[3].textContent = moodRate + '%';
            }
            
            // Update coffee chart bars
            const coffeeOrder = ['mocha', 'americano', 'latte', 'coldbrew'];
            const totalCoffee = Object.values(userData.coffeeCount).reduce((a, b) => a + b, 0) || 1;
            coffeeOrder.forEach((coffee, i) => {
                const bars = document.querySelectorAll('#stats .bar-fill');
                if (bars[i]) {
                    const count = userData.coffeeCount[coffee] || 0;
                    const percent = Math.round((count / totalCoffee) * 100);
                    bars[i].style.width = percent + '%';
                    bars[i].textContent = count;
                }
            });
            
            // Update weekly bars
            const weekBars = document.querySelectorAll('#stats .chart-container:nth-of-type(2) .bar-fill');
            const maxWeek = Math.max(...userData.weeklyBrews, 1);
            userData.weeklyBrews.forEach((count, i) => {
                if (weekBars[i]) {
                    const percent = Math.round((count / maxWeek) * 100);
                    weekBars[i].style.width = percent + '%';
                    weekBars[i].textContent = count;
                }
            });
            
            // Update emotion journey
            updateEmotionJourney();
            
            // Update time of day
            updateTimeOfDay();
            
            // Update achievements
            updateAchievements();
            
            // Update ranking (based on total brews)
            updateRanking();
        }
        
        function updateEmotionJourney() {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date().getDay();
            const emotionDivs = document.querySelectorAll('#stats .stats-card:nth-of-type(3) > div > div:nth-child(2) > div');
            
            if (emotionDivs.length >= 7) {
                // Reset all days
                emotionDivs.forEach((div, i) => {
                    const iconDiv = div.querySelector('div:first-child');
                    if (iconDiv) {
                        iconDiv.textContent = '❓';
                        iconDiv.style.opacity = '0.3';
                    }
                });
                
                // Fill in from emotion journey
                userData.emotionJourney.forEach(entry => {
                    const dayIndex = entry.day;
                    if (emotionDivs[dayIndex]) {
                        const iconDiv = emotionDivs[dayIndex].querySelector('div:first-child');
                        if (iconDiv) {
                            iconDiv.textContent = entry.icon;
                            iconDiv.style.opacity = '1';
                        }
                    }
                });
            }
        }
        
        function updateTimeOfDay() {
            const times = ['morning', 'afternoon', 'evening', 'night'];
            const total = Object.values(userData.timeOfDay).reduce((a, b) => a + b, 0) || 1;
            const timeDivs = document.querySelectorAll('#stats .stats-card:nth-of-type(5) .stat-number, #stats .stats-card:nth-of-type(5) div[style*="font-weight: 600"]');
        }
        
        function updateAchievements() {
            const achDivs = document.querySelectorAll('#stats .stats-card:last-child > div > div:nth-child(2) > div');
            const achievements = [
                { key: 'streak7', icon: '🔥' },
                { key: 'mochaMaster', icon: '🫖' },
                { key: 'earlyBird', icon: '🌅' },
                { key: 'streak30', icon: '🏆' }
            ];
            
            achDivs.forEach((div, i) => {
                if (achievements[i]) {
                    const unlocked = userData.achievements[achievements[i].key];
                    const iconDiv = div.querySelector('div:first-child');
                    if (iconDiv) {
                        iconDiv.style.opacity = unlocked ? '1' : '0.4';
                        iconDiv.style.background = unlocked 
                            ? iconDiv.style.background 
                            : 'var(--border)';
                    }
                }
            });
        }
        
        function updateRanking() {
            const totalBrews = userData.stats.totalBrews;
            let rank = 100;
            let percentile = 50;
            
            if (totalBrews >= 50) { rank = 1; percentile = 99; }
            else if (totalBrews >= 40) { rank = 3; percentile = 97; }
            else if (totalBrews >= 30) { rank = 5; percentile = 95; }
            else if (totalBrews >= 20) { rank = 10; percentile = 90; }
            else if (totalBrews >= 10) { rank = 25; percentile = 75; }
            else if (totalBrews >= 5) { rank = 50; percentile = 50; }
            
            const rankDiv = document.querySelector('#stats .stats-card:nth-of-type(2) .stat-number, #stats div[style*="font-size: 24px"]');
        }
        
        function updateWelcomePage() {
            userData = DB.load();
            // Update welcome page stats if elements exist
            const welcomeStats = document.querySelectorAll('#welcome .stat-card .stat-number');
            if (welcomeStats.length >= 4) {
                welcomeStats[0].textContent = userData.stats.streak;
                welcomeStats[1].textContent = userData.stats.totalBrews;
            }
        }

        function selectEmotion(id, icon, text) {
            document.querySelectorAll('.emotion-card').forEach(c => c.classList.remove('selected'));
            event.target.closest('.emotion-card').classList.add('selected');
            st.emotion = id;
            st.emotionIcon = icon;
            st.emotionText = text;
            setTimeout(() => {
                showRec(id);
                goTo('recommendation');
            }, 500);
        }

        function showRec(emo) {
            const type = emotionMap[emo] || 'mocha';
            const c = coffees[type];
            st.coffee = type;
            st.breathData = {inhale: c.inhale, hold: c.hold, exhale: c.exhale};
            document.getElementById('currEmotion').textContent = st.emotionText;
            document.getElementById('currIcon').textContent = st.emotionIcon;
            document.getElementById('recIcon').textContent = c.icon;
            document.getElementById('recName').textContent = c.name;
            document.getElementById('recTag').textContent = `"${c.tag}"`;
            document.getElementById('inhaleT').textContent = c.inhale + 's';
            document.getElementById('holdT').textContent = c.hold + 's';
            document.getElementById('exhaleT').textContent = c.exhale + 's';
            const total = c.inhale + c.hold + c.exhale;
            document.querySelectorAll('.breath-visual')[0].style.height = (c.inhale/total*60) + 'px';
            document.querySelectorAll('.breath-visual')[1].style.height = (c.hold/total*60) + 'px';
            document.querySelectorAll('.breath-visual')[2].style.height = (c.exhale/total*60) + 'px';
            document.getElementById('s1n').textContent = c.steps[0].n;
            document.getElementById('s1d').textContent = c.steps[0].d;
            document.getElementById('s2n').textContent = c.steps[1].n;
            document.getElementById('s2d').textContent = c.steps[1].d;
            document.getElementById('s3n').textContent = c.steps[2].n;
            document.getElementById('s3d').textContent = c.steps[2].d;
        }

        function changeRec(type) {
            const c = coffees[type];
            st.coffee = type;
            st.breathData = {inhale: c.inhale, hold: c.hold, exhale: c.exhale};
            document.getElementById('recIcon').textContent = c.icon;
            document.getElementById('recName').textContent = c.name;
            document.getElementById('recTag').textContent = `"${c.tag}"`;
            document.getElementById('inhaleT').textContent = c.inhale + 's';
            document.getElementById('holdT').textContent = c.hold + 's';
            document.getElementById('exhaleT').textContent = c.exhale + 's';
            const total = c.inhale + c.hold + c.exhale;
            document.querySelectorAll('.breath-visual')[0].style.height = (c.inhale/total*60) + 'px';
            document.querySelectorAll('.breath-visual')[1].style.height = (c.hold/total*60) + 'px';
            document.querySelectorAll('.breath-visual')[2].style.height = (c.exhale/total*60) + 'px';
            document.getElementById('s1n').textContent = c.steps[0].n;
            document.getElementById('s1d').textContent = c.steps[0].d;
            document.getElementById('s2n').textContent = c.steps[1].n;
            document.getElementById('s2d').textContent = c.steps[1].d;
            document.getElementById('s3n').textContent = c.steps[2].n;
            document.getElementById('s3d').textContent = c.steps[2].d;
        }

        function startBrew() {
            goTo('brewing');
            st.phase = 0;
            st.timer = 0;
            st.phaseTime = 0;
            st.cycle = 1;
            st.cyclePhase = 0;
            updateCycleDots();
            updatePhase();
        }

        function hold() {
            st.holding = true;
            document.getElementById('holdBtn').classList.add('holding');
            if (!st.interval) {
                st.interval = setInterval(() => {
                    if (st.holding) {
                        st.timer++;
                        st.phaseTime++;
                        updateBrewUI();
                        const phases = [st.breathData.inhale, st.breathData.hold, st.breathData.exhale];
                        if (st.phaseTime >= phases[st.cyclePhase]) {
                            st.phaseTime = 0;
                            st.cyclePhase++;
                            if (st.cyclePhase >= 3) {
                                st.cyclePhase = 0;
                                st.cycle++;
                                updateCycleDots();
                                if (st.cycle > st.totalCycles) {
                                    complete();
                                    return;
                                }
                            }
                            updatePhase();
                        }
                    }
                }, 1000);
            }
        }
        
        function updateCycleDots() {
            document.getElementById('cycleCount').textContent = Math.min(st.cycle, st.totalCycles);
            for (let i = 1; i <= st.totalCycles; i++) {
                const dot = document.getElementById('dot' + i);
                if (i < st.cycle) {
                    dot.className = 'cycle-dot completed';
                } else if (i === st.cycle) {
                    dot.className = 'cycle-dot active';
                } else {
                    dot.className = 'cycle-dot';
                }
            }
        }

        function unhold() {
            st.holding = false;
            document.getElementById('holdBtn').classList.remove('holding');
        }

        function updatePhase() {
            const phases = [
                {title: 'GRINDING BEANS', action: 'Inhale ↑', desc: '"Prepare slowly, breathe deeply"', dur: st.breathData.inhale, emoji: '🫘'},
                {title: 'HEATING WATER', action: 'Hold —', desc: '"Let warmth settle"', dur: st.breathData.hold, emoji: '♨️'},
                {title: 'BREWING', action: 'Exhale ↓', desc: '"Release slowly"', dur: st.breathData.exhale, emoji: '☕'}
            ];
            const p = phases[st.cyclePhase];
            document.getElementById('phaseTitle').textContent = p.title;
            document.getElementById('phaseAction').textContent = p.action;
            document.getElementById('phaseDesc').textContent = p.desc;
            document.getElementById('phaseEmoji').textContent = p.emoji;
        }

        function updateBrewUI() {
            const m = Math.floor(st.timer / 60);
            const s = st.timer % 60;
            document.getElementById('brewTimer').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            const phases = [st.breathData.inhale, st.breathData.hold, st.breathData.exhale];
            const rem = phases[st.cyclePhase] - st.phaseTime;
            document.getElementById('phaseTime').textContent = rem + 's left';
            
            // Update progress circle
            const totalPerCycle = st.breathData.inhale + st.breathData.hold + st.breathData.exhale;
            const completedCycles = (st.cycle - 1) * totalPerCycle;
            const currentCycleTime = st.cyclePhase === 0 ? st.phaseTime : 
                                    st.cyclePhase === 1 ? st.breathData.inhale + st.phaseTime :
                                    st.breathData.inhale + st.breathData.hold + st.phaseTime;
            const totalTime = completedCycles + currentCycleTime;
            const totalDuration = st.totalCycles * totalPerCycle;
            const progress = totalTime / totalDuration;
            const circumference = 2 * Math.PI * 80;
            const offset = circumference - (progress * circumference);
            document.getElementById('progressCircle').style.strokeDashoffset = offset;
            document.getElementById('phaseProgress').textContent = Math.round(progress * 100) + '%';
            
            // Update coffee level
            const coffeeProgress = Math.min(progress * 100, 100);
            document.getElementById('coffeeLevel').style.height = coffeeProgress + '%';
            
            // Update hold button progress
            const phaseProgress = (st.phaseTime / phases[st.cyclePhase]) * 100;
            document.getElementById('holdProgress').style.width = phaseProgress + '%';
        }

        function confirmStop() {
            if (confirm('Stop brewing?')) {
                clearInterval(st.interval);
                st.interval = null;
                goTo('recommendation');
            }
        }

        function complete() {
            clearInterval(st.interval);
            st.interval = null;
            setTimeout(() => {
                goTo('reflection');
                initRef();
            }, 1000);
        }

        function initRef() {
            const c = coffees[st.coffee];
            document.getElementById('refCoffee').textContent = c.name;
            document.getElementById('beforeIcon').textContent = st.emotionIcon;
            document.getElementById('beforeText').textContent = st.emotionText;
            document.querySelectorAll('.emotion-option').forEach(o => o.classList.remove('selected'));
            document.getElementById('sipNote').value = '';
            document.getElementById('charCount').textContent = '0/100';
            resetStars();
            st.afterEmotion = null;
            st.note = '';
            st.rating = 0;
        }

        function selectAfter(id, icon, text) {
            document.querySelectorAll('.emotion-option').forEach(o => o.classList.remove('selected'));
            event.target.closest('.emotion-option').classList.add('selected');
            st.afterEmotion = id;
            st.afterIcon = icon;
            st.afterText = text;
        }

        function updateCount() {
            const t = document.getElementById('sipNote');
            document.getElementById('charCount').textContent = t.value.length + '/100';
            st.note = t.value;
        }

        function rate(r) {
            st.rating = r;
            const stars = document.querySelectorAll('.star');
            stars.forEach((s, i) => {
                if (i < r) {
                    s.textContent = '★';
                    s.classList.add('active');
                } else {
                    s.textContent = '☆';
                    s.classList.remove('active');
                }
            });
        }

        function resetStars() {
            document.querySelectorAll('.star').forEach(s => {
                s.textContent = '☆';
                s.classList.remove('active');
            });
        }

        function saveRef() {
            if (!st.afterEmotion) {
                showToast('Please select how you feel now', 'error');
                return;
            }
            if (st.rating === 0) {
                showToast('Please rate your experience', 'error');
                return;
            }
            const c = coffees[st.coffee];
            const brewData = {
                date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
                coffee: c.icon + ' ' + c.name,
                coffeeIcon: c.icon,
                coffeeType: st.coffee,
                before: st.emotionIcon,
                after: st.afterIcon,
                beforeT: st.emotionText,
                afterT: st.afterText,
                beforeEmotion: st.emotion,
                afterEmotion: st.afterEmotion,
                dur: formatTime(st.timer),
                rating: st.rating,
                note: st.note,
                timestamp: new Date().toISOString()
            };
            
            // Save to localStorage via DB
            userData = DB.addBrew(brewData);
            
            // Update local state
            st.history = userData.history;
            st.stamps = userData.stamps;
            
            // Show success message
            showToast('Brewing saved! Keep up the great work 🎉');
            
            setTimeout(() => goTo('stamps'), 500);
        }

        function formatTime(sec) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return m + ':' + String(s).padStart(2, '0');
        }

        function initStamps() {
            userData = DB.load();
            const prog = (st.stamps.length / 10) * 100;
            const remaining = 10 - st.stamps.length;
            
            // Update progress
            document.getElementById('stampProg').textContent = st.stamps.length + '/10 stamps';
            document.getElementById('stampBar').style.width = prog + '%';
            
            // Update reward text
            const rewardEl = document.getElementById('stampReward');
            if (rewardEl) {
                if (remaining > 0) {
                    rewardEl.textContent = `🎁 ${remaining} more for reward!`;
                } else {
                    rewardEl.textContent = '🎉 Reward unlocked!';
                }
            }
            
            // Update streak
            const streakEl = document.getElementById('stampStreak');
            if (streakEl) {
                streakEl.textContent = userData.stats.streak + ' Day Streak!';
            }
            
            // Update mindful stats
            const totalBrews = userData.stats.totalBrews;
            const avgBreathsPerSession = 24; // 3 cycles × 8 breaths approx
            const avgMinutesPerSession = 2;
            
            const totalBreathsEl = document.getElementById('totalBreaths');
            if (totalBreathsEl) {
                totalBreathsEl.textContent = (totalBrews * avgBreathsPerSession).toLocaleString();
            }
            
            const totalMinutesEl = document.getElementById('totalMinutes');
            if (totalMinutesEl) {
                totalMinutesEl.textContent = (totalBrews * avgMinutesPerSession).toLocaleString();
            }
            
            const moodPercentEl = document.getElementById('moodImprovePercent');
            if (moodPercentEl && userData.stats.moodTotal > 0) {
                const percent = Math.round((userData.stats.moodImproved / userData.stats.moodTotal) * 100);
                moodPercentEl.textContent = percent + '%';
            }
            
            // Update achievements
            if (userData.stats.totalBrews >= 1) {
                const achFirst = document.getElementById('achFirst');
                if (achFirst) achFirst.classList.add('unlocked');
            }
            if (userData.stats.streak >= 7) {
                const achWeek = document.getElementById('achWeek');
                if (achWeek) achWeek.classList.add('unlocked');
            }
            if (userData.coffeeCount.mocha >= 10) {
                const achMaster = document.getElementById('achMaster');
                if (achMaster) achMaster.classList.add('unlocked');
            }
            if (userData.stats.totalBrews >= 30) {
                const achZen = document.getElementById('achZen');
                if (achZen) achZen.classList.add('unlocked');
            }
            
            // Update motivational quote
            const quotes = [
                { text: "Breathing in, I calm my body. Breathing out, I smile.", author: "Thich Nhat Hanh" },
                { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
                { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
                { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" },
                { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
                { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" }
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            const quoteEl = document.getElementById('mindfulQuote');
            if (quoteEl) {
                quoteEl.innerHTML = `"${randomQuote.text}"`;
                quoteEl.nextElementSibling.textContent = `— ${randomQuote.author}`;
            }
            
            // Render stamp grid
            const grid = document.getElementById('stampGrid');
            grid.innerHTML = '';
            for (let i = 0; i < 10; i++) {
                const slot = document.createElement('div');
                slot.className = 'stamp';
                if (i < st.stamps.length) {
                    slot.classList.add('filled');
                    slot.textContent = st.stamps[i].coffee;
                    const date = document.createElement('div');
                    date.className = 'stamp-date';
                    date.textContent = st.stamps[i].date;
                    slot.appendChild(date);
                } else {
                    slot.innerHTML = '<span style="opacity: 0.3; font-size: 20px;">☕</span>';
                }
                grid.appendChild(slot);
            }
            
            // Render history
            const list = document.getElementById('histList');
            list.innerHTML = '';
            st.history.slice(0, 5).forEach(e => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-date">${e.date}</div>
                    <div class="history-coffee">${e.coffee}</div>
                    <div class="history-emotions">${e.before} ${e.beforeT} → ${e.after} ${e.afterT} <span style="margin-left:auto;">${e.dur}</span></div>
                    ${e.note ? '<div class="history-note">"' + e.note + '"</div>' : ''}
                    <div style="margin-top:8px;">${'★'.repeat(e.rating)}${'☆'.repeat(5 - e.rating)}</div>
                `;
                list.appendChild(item);
            });
            document.getElementById('histCount').textContent = '(' + st.history.length + ' entries)';
        }

        function toggleHist() {
            const list = document.getElementById('histList');
            const toggle = document.querySelector('.history-toggle span');
            if (list.classList.contains('show')) {
                list.classList.remove('show');
                toggle.textContent = '▼ View Brewing History';
            } else {
                list.classList.add('show');
                toggle.textContent = '▲ Hide Brewing History';
            }
        }

        function initJournal() {
            const thisWeek = document.getElementById('thisWeekList');
            const lastWeek = document.getElementById('lastWeekList');
            thisWeek.innerHTML = '';
            lastWeek.innerHTML = '';
            
            // Show journal entries first
            st.journalEntries.slice(0, 2).forEach((entry, idx) => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `
                    <div class="card">
                        <div class="history-date">${entry.date}</div>
                        <div style="font-size: 14px; color: var(--text); line-height: 1.6; margin-top: 8px;">${entry.text}</div>
                    </div>
                `;
                if (idx === 0) thisWeek.appendChild(item);
                else lastWeek.appendChild(item);
            });
            
            st.history.slice(0, 2).forEach(e => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `
                    <div class="card">
                        <div class="history-date">${e.date}</div>
                        <div class="history-coffee">${e.coffee}</div>
                        <div class="history-emotions">${e.before} ${e.beforeT} → ${e.after} ${e.afterT}</div>
                        ${e.note ? '<div class="history-note" style="margin-top:8px;">"' + e.note + '"</div>' : ''}
                        <div style="margin-top:8px;">${'★'.repeat(e.rating)}${'☆'.repeat(5 - e.rating)}</div>
                    </div>
                `;
                thisWeek.appendChild(item);
            });
            st.history.slice(2, 4).forEach(e => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `
                    <div class="card">
                        <div class="history-date">${e.date}</div>
                        <div class="history-coffee">${e.coffee}</div>
                        <div class="history-emotions">${e.before} ${e.beforeT} → ${e.after} ${e.afterT}</div>
                    </div>
                `;
                lastWeek.appendChild(item);
            });
            const cal = document.getElementById('calGrid');
            cal.innerHTML = '';
            for (let i = 1; i <= 30; i++) {
                const day = document.createElement('div');
                day.className = 'calendar-day';
                day.textContent = i;
                if ([20, 21, 22, 24].includes(i)) {
                    day.classList.add('has-brew');
                    const icon = document.createElement('div');
                    icon.className = 'calendar-icon';
                    icon.textContent = '☕';
                    day.appendChild(icon);
                }
                cal.appendChild(day);
            }
            
            // Add character counter
            const textarea = document.getElementById('journalEntry');
            if (textarea) {
                textarea.addEventListener('input', function() {
                    document.getElementById('journalCharCount').textContent = this.value.length + '/300';
                });
            }
        }
        
        function saveJournalEntry() {
            const textarea = document.getElementById('journalEntry');
            const text = textarea.value.trim();
            if (!text) {
                showToast('Please write something first', 'error');
                return;
            }
            
            // Save to localStorage via DB
            userData = DB.addJournalEntry(text);
            st.journalEntries = userData.journalEntries;
            
            textarea.value = '';
            document.getElementById('journalCharCount').textContent = '0/300';
            initJournal();
            showToast('Entry saved to your journal! 📖');
        }

        function switchTab(tab) {
            document.querySelectorAll('.journal-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            if (tab === 'timeline') {
                document.getElementById('timelineView').style.display = 'block';
                document.getElementById('calendarView').style.display = 'none';
            } else {
                document.getElementById('timelineView').style.display = 'none';
                document.getElementById('calendarView').style.display = 'block';
            }
        }

        initStamps();
        
        // Live Stats Animation for Community Stats
        function updateLiveStats() {
            const liveBrews = document.getElementById('liveBrews');
            const todayBrews = document.getElementById('todayBrews');
            if (liveBrews && todayBrews) {
                // Random fluctuation for "brewing now"
                let current = parseInt(liveBrews.textContent.replace(/,/g, ''));
                let change = Math.floor(Math.random() * 20) - 8;
                let newVal = Math.max(800, Math.min(2000, current + change));
                liveBrews.textContent = newVal.toLocaleString();
                
                // Slowly increase today's brews
                let today = parseInt(todayBrews.textContent.replace(/,/g, ''));
                today += Math.floor(Math.random() * 3);
                todayBrews.textContent = today.toLocaleString();
            }
        }
        setInterval(updateLiveStats, 3000);

        // ========== SETTINGS & PREFERENCES ==========
        const appSettings = {
            darkMode: false,
            sound: true,
            vibration: true,
            dailyReminder: true,
            streakAlerts: true,
            weeklySummary: false,
            reminderTime: '9:00 AM',
            language: 'en'
        };

        // Load settings from localStorage
        function loadSettings() {
            const saved = localStorage.getItem('breathCafeSettings');
            if (saved) {
                Object.assign(appSettings, JSON.parse(saved));
            }
            applySettings();
        }

        // Save settings to localStorage
        function saveSettings() {
            localStorage.setItem('breathCafeSettings', JSON.stringify(appSettings));
        }

        // Apply settings to UI
        function applySettings() {
            // Update toggle switches
            const toggleMap = {
                'toggleDarkMode': 'darkMode',
                'toggleSound': 'sound',
                'toggleVibration': 'vibration',
                'toggleDailyReminder': 'dailyReminder',
                'toggleStreakAlerts': 'streakAlerts',
                'toggleWeeklySummary': 'weeklySummary'
            };
            
            for (const [id, setting] of Object.entries(toggleMap)) {
                const toggle = document.getElementById(id);
                if (toggle) {
                    toggle.classList.toggle('active', appSettings[setting]);
                }
            }
            
            // Update reminder time display
            const timeDisplay = document.getElementById('reminderTimeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = appSettings.reminderTime;
            }
        }

        // Toggle setting
        function toggleSetting(setting) {
            appSettings[setting] = !appSettings[setting];
            saveSettings();
            applySettings();
            showToast(appSettings[setting] ? 'Enabled' : 'Disabled');
        }

        // ========== EXPERIENCE MODE FUNCTIONS ==========
        let experienceMode = localStorage.getItem('breathCafeMode') || 'gamified';
        
        function setExperienceMode(mode) {
            experienceMode = mode;
            localStorage.setItem('breathCafeMode', mode);
            
            // Update UI
            document.getElementById('pureModeOption').classList.toggle('active', mode === 'pure');
            document.getElementById('gamifiedModeOption').classList.toggle('active', mode === 'gamified');
            
            // Apply mode to body
            if (mode === 'pure') {
                document.body.classList.add('pure-mode');
                showToast('Pure Mode: Just you and your breath');
            } else {
                document.body.classList.remove('pure-mode');
                showToast('Gamified Mode: Observe how this affects you');
            }
            
            // Hide/show gamification elements
            applyExperienceMode();
        }
        
        function applyExperienceMode() {
            const gamifiedElements = document.querySelectorAll('.gamified-only');
            const isPure = experienceMode === 'pure';
            
            gamifiedElements.forEach(el => {
                el.style.display = isPure ? 'none' : '';
            });
            
            // Also hide streak badge in header
            const streakBadge = document.querySelector('.streak-badge');
            if (streakBadge) {
                streakBadge.style.display = isPure ? 'none' : '';
            }
        }
        
        function initExperienceMode() {
            const savedMode = localStorage.getItem('breathCafeMode') || 'gamified';
            experienceMode = savedMode;
            
            if (savedMode === 'pure') {
                document.body.classList.add('pure-mode');
                document.getElementById('pureModeOption')?.classList.add('active');
                document.getElementById('gamifiedModeOption')?.classList.remove('active');
            } else {
                document.getElementById('gamifiedModeOption')?.classList.add('active');
                document.getElementById('pureModeOption')?.classList.remove('active');
            }
            
            applyExperienceMode();
        }

        // ========== RESEARCH REFLECTION FUNCTIONS ==========
        let researchData = JSON.parse(localStorage.getItem('breathCafeResearch')) || {
            timePerception: { longer: 0, same: 0, shorter: 0 },
            paceControl: { interface: 0, me: 0, together: 0 },
            gamificationEffect: { yes: 0, no: 0, pressure: 0 },
            observations: []
        };
        
        function selectResearchAnswer(question, answer) {
            // Save to research data
            if (question === 'time') {
                researchData.timePerception[answer]++;
            } else if (question === 'control') {
                researchData.paceControl[answer]++;
            } else if (question === 'gamification') {
                researchData.gamificationEffect[answer]++;
            }
            
            localStorage.setItem('breathCafeResearch', JSON.stringify(researchData));
        }
        
        function saveObservation() {
            const input = document.querySelector('.final-input');
            const text = input.value.trim();
            
            if (!text) {
                showToast('Please write your reflection', 'error');
                return;
            }
            
            researchData.observations.push({
                text: text,
                date: new Date().toISOString(),
                mode: experienceMode
            });
            
            localStorage.setItem('breathCafeResearch', JSON.stringify(researchData));
            input.value = '';
            showToast('Reflection saved!');
        }
        
        function updateExperimentDuration() {
            // Calculate duration based on breath data
            if (st.breathData) {
                const cycleTime = st.breathData.inhale + st.breathData.hold + st.breathData.exhale;
                const totalTime = cycleTime * st.totalCycles;
                const minutes = Math.floor(totalTime / 60);
                const seconds = totalTime % 60;
                const durationEl = document.getElementById('expDuration');
                if (durationEl) {
                    durationEl.textContent = `${minutes} min ${seconds} sec`;
                }
            }
        }

        // ========== MODAL FUNCTIONS ==========
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            document.body.style.overflow = '';
        }

        function closeModalOnOverlay(event) {
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        function openLanguageModal() {
            openModal('languageModal');
        }

        function openTimePickerModal() {
            openModal('timePickerModal');
        }

        // ========== PROFILE FUNCTIONS ==========
        function saveProfile() {
            const name = document.getElementById('editName').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            
            if (!name) {
                showToast('Please enter a name', 'error');
                return;
            }
            
            // Save to localStorage
            const profile = { name, email };
            localStorage.setItem('breathCafeProfile', JSON.stringify(profile));
            
            // Update UI
            document.getElementById('accountUserName').textContent = name;
            document.getElementById('accountUserEmail').textContent = email;
            
            closeModal('editProfileModal');
            showToast('Profile updated!');
        }

        function loadProfile() {
            const saved = localStorage.getItem('breathCafeProfile');
            if (saved) {
                const profile = JSON.parse(saved);
                document.getElementById('editName').value = profile.name;
                document.getElementById('editEmail').value = profile.email;
                document.getElementById('accountUserName').textContent = profile.name;
                document.getElementById('accountUserEmail').textContent = profile.email;
            }
        }

        function changePassword() {
            const current = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            if (!current || !newPass || !confirm) {
                showToast('Please fill all fields', 'error');
                return;
            }
            
            if (newPass !== confirm) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            if (newPass.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }
            
            // Clear fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            closeModal('changePasswordModal');
            showToast('Password updated!');
        }

        function connectAccount(provider) {
            showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connection coming soon!`);
        }

        function confirmLogout() {
            if (confirm('Are you sure you want to log out?')) {
                showToast('Logged out successfully');
                // In a real app, this would clear session and redirect
                setTimeout(() => {
                    goTo('welcome');
                }, 1000);
            }
        }

        // ========== LANGUAGE FUNCTIONS ==========
        function selectLanguage(lang, element) {
            document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('selected'));
            element.classList.add('selected');
            appSettings.language = lang;
            saveSettings();
            closeModal('languageModal');
            showToast('Language updated!');
        }

        // ========== TIME PICKER FUNCTIONS ==========
        function saveReminderTime() {
            const hour = document.getElementById('reminderHour').value;
            const minute = document.getElementById('reminderMinute').value;
            const period = document.getElementById('reminderPeriod').value;
            
            appSettings.reminderTime = `${hour}:${minute} ${period}`;
            saveSettings();
            applySettings();
            closeModal('timePickerModal');
            showToast('Reminder time saved!');
        }

        // ========== CALENDAR FUNCTIONS ==========
        let currentCalendarDate = new Date();

        function changeMonth(delta) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
            renderCalendar();
        }

        function renderCalendar() {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            
            // Update month display
            document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
            
            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Get brew dates from history
            const brewDates = st.history.map(h => {
                const d = new Date(h.timestamp || h.date);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    return d.getDate();
                }
                return null;
            }).filter(d => d !== null);
            
            // Render calendar
            const cal = document.getElementById('calGrid');
            cal.innerHTML = '';
            
            // Empty cells for days before first day of month
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'calendar-day';
                empty.style.opacity = '0.3';
                cal.appendChild(empty);
            }
            
            // Days of month
            for (let i = 1; i <= daysInMonth; i++) {
                const day = document.createElement('div');
                day.className = 'calendar-day';
                day.textContent = i;
                
                // Check if this day has a brew
                if (brewDates.includes(i)) {
                    day.classList.add('has-brew');
                    const icon = document.createElement('div');
                    icon.className = 'calendar-icon';
                    icon.textContent = '☕';
                    day.appendChild(icon);
                }
                
                // Highlight today
                const today = new Date();
                if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    day.style.border = '2px solid var(--coffee-medium)';
                    day.style.fontWeight = '700';
                }
                
                cal.appendChild(day);
            }
        }

        // ========== ACCORDION FUNCTIONS ==========
        function toggleAccordion(header) {
            const accordion = header.parentElement;
            accordion.classList.toggle('open');
        }

        // ========== TOAST NOTIFICATION ==========
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            const toastIcon = toast.querySelector('.toast-icon');
            
            toastMessage.textContent = message;
            toastIcon.textContent = type === 'success' ? '✓' : '!';
            toastIcon.style.background = type === 'success' ? '#4CAF50' : '#f44336';
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2500);
        }

        // ========== UPDATE ACCOUNT PAGE ==========
        function updateAccountPage() {
            userData = DB.load();
            document.getElementById('accountTotalBrews').textContent = userData.stats.totalBrews;
            document.getElementById('accountStreak').textContent = userData.stats.streak;
            document.getElementById('accountStamps').textContent = userData.stamps.length;
            
            const level = userData.user.level;
            let memberStatus = 'Bronze';
            if (level >= 10) memberStatus = 'Diamond';
            else if (level >= 7) memberStatus = 'Gold';
            else if (level >= 4) memberStatus = 'Silver';
            
            document.getElementById('accountUserLevel').textContent = `Level ${level} · ${memberStatus} Member`;
        }

        // ========== CALENDAR PAGE FUNCTIONS ==========
        let calendarPageMonth = new Date().getMonth();
        let calendarPageYear = new Date().getFullYear();
        
        // Sample brew data for demo - Updated to December 2025 with research data
        const sampleBrewData = {
            '2025-12-01': [{ 
                type: 'mocha', icon: '🫖', before: '😰', after: '😌', time: '9:30 AM',
                duration: '2m 16s',
                timePerception: 'longer',
                paceControl: 'together',
                note: 'Monday morning anxiety. The slow breathing helped.',
                beforeLabel: 'Anxious', afterLabel: 'Calm'
            }],
            '2025-12-02': [{ 
                type: 'latte', icon: '🥛', before: '😴', after: '😊', time: '10:15 AM',
                duration: '1m 52s',
                timePerception: 'shorter',
                paceControl: 'interface',
                note: 'Needed energy, got more than expected.',
                beforeLabel: 'Tired', afterLabel: 'Joy'
            }],
            '2025-12-03': [
                { type: 'americano', icon: '☕', before: '😤', after: '😌', time: '8:00 AM',
                  duration: '2m 00s', timePerception: 'longer', paceControl: 'me',
                  note: 'Frustrated with work. Took control of my pace.', beforeLabel: 'Angry', afterLabel: 'Calm' },
                { type: 'mocha', icon: '🫖', before: '😰', after: '😌', time: '3:30 PM',
                  duration: '2m 16s', timePerception: 'same', paceControl: 'together',
                  note: 'Afternoon slump. Second brew of the day.', beforeLabel: 'Anxious', afterLabel: 'Calm' }
            ],
            '2025-12-04': [{ 
                type: 'coldbrew', icon: '🧊', before: '😤', after: '😌', time: '2:00 PM',
                duration: '2m 24s',
                timePerception: 'longer',
                paceControl: 'together',
                note: 'The cold brew pattern really cooled me down.',
                beforeLabel: 'Angry', afterLabel: 'Calm'
            }],
            '2025-12-05': [{ 
                type: 'caramel', icon: '🍯', before: '😊', after: '😊', time: '11:00 AM',
                duration: '1m 48s',
                timePerception: 'shorter',
                paceControl: 'me',
                note: 'Already happy, just wanted to pause and appreciate.',
                beforeLabel: 'Joy', afterLabel: 'Joy'
            }],
            '2025-12-06': [{ 
                type: 'latte', icon: '🥛', before: '😢', after: '😌', time: '9:00 AM',
                duration: '2m 08s',
                timePerception: 'longer',
                paceControl: 'interface',
                note: 'Sad morning. Let the interface guide me.',
                beforeLabel: 'Sad', afterLabel: 'Calm'
            }],
            '2025-12-07': [{ 
                type: 'mocha', icon: '🫖', before: '😰', after: '😌', time: '10:30 AM',
                duration: '2m 16s',
                timePerception: 'longer',
                paceControl: 'together',
                note: 'Sunday reset. Preparing for the week.',
                beforeLabel: 'Anxious', afterLabel: 'Calm'
            }],
            '2025-12-08': [
                { type: 'americano', icon: '☕', before: '😴', after: '😊', time: '7:30 AM',
                  duration: '2m 00s', timePerception: 'same', paceControl: 'me',
                  note: 'Early start. Needed clarity.', beforeLabel: 'Tired', afterLabel: 'Joy' },
                { type: 'latte', icon: '🥛', before: '😰', after: '😌', time: '4:00 PM',
                  duration: '2m 08s', timePerception: 'longer', paceControl: 'together',
                  note: 'Pre-presentation nerves. This helped.', beforeLabel: 'Anxious', afterLabel: 'Calm' }
            ],
            '2025-12-09': [{ 
                type: 'mocha', icon: '🫖', before: '😰', after: '😌', time: '9:30 AM',
                duration: '2m 16s',
                timePerception: 'longer',
                paceControl: 'together',
                note: 'Open studio tomorrow. Finding my center.',
                beforeLabel: 'Anxious', afterLabel: 'Calm'
            }],
            '2025-12-10': [{ 
                type: 'americano', icon: '☕', before: '😰', after: '😌', time: '8:00 AM',
                duration: '2m 00s',
                timePerception: 'longer',
                paceControl: 'me',
                note: 'Open studio day. I chose my own pace today.',
                beforeLabel: 'Anxious', afterLabel: 'Calm'
            }]
        };
        
        function changeCalendarMonth(delta) {
            calendarPageMonth += delta;
            if (calendarPageMonth > 11) {
                calendarPageMonth = 0;
                calendarPageYear++;
            } else if (calendarPageMonth < 0) {
                calendarPageMonth = 11;
                calendarPageYear--;
            }
            renderCalendarPage();
        }
        
        function renderCalendarPage() {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            
            // Update month title
            const monthTitle = document.getElementById('calendarPageMonth');
            if (monthTitle) {
                monthTitle.textContent = `${monthNames[calendarPageMonth]} ${calendarPageYear}`;
            }
            
            // Render calendar grid
            const grid = document.getElementById('calendarPageGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            const firstDay = new Date(calendarPageYear, calendarPageMonth, 1).getDay();
            const daysInMonth = new Date(calendarPageYear, calendarPageMonth + 1, 0).getDate();
            const today = new Date();
            
            // Empty cells for days before the 1st
            for (let i = 0; i < firstDay; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day-cell';
                emptyCell.style.opacity = '0.3';
                emptyCell.style.pointerEvents = 'none';
                grid.appendChild(emptyCell);
            }
            
            // Days of the month
            let monthBrews = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('div');
                cell.className = 'calendar-day-cell';
                
                const dateStr = `${calendarPageYear}-${String(calendarPageMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const brews = sampleBrewData[dateStr];
                
                // Check if today
                if (day === today.getDate() && 
                    calendarPageMonth === today.getMonth() && 
                    calendarPageYear === today.getFullYear()) {
                    cell.classList.add('today');
                }
                
                // Check if future
                const cellDate = new Date(calendarPageYear, calendarPageMonth, day);
                if (cellDate > today) {
                    cell.classList.add('future');
                }
                
                // Check if has brews
                if (brews && brews.length > 0) {
                    cell.classList.add('has-brew');
                    monthBrews += brews.length;
                }
                
                // Day number
                const dayNum = document.createElement('div');
                dayNum.className = 'calendar-day-num';
                dayNum.textContent = day;
                cell.appendChild(dayNum);
                
                // Emotion indicator if has brew
                if (brews && brews.length > 0) {
                    const emotion = document.createElement('div');
                    emotion.className = 'calendar-day-emotion';
                    emotion.textContent = brews[brews.length - 1].after; // Show last emotion
                    cell.appendChild(emotion);
                }
                
                // Click handler
                cell.onclick = () => showDayDetail(dateStr, day);
                
                grid.appendChild(cell);
            }
            
            // Update stats
            const monthBrewsEl = document.getElementById('calMonthBrews');
            if (monthBrewsEl) monthBrewsEl.textContent = monthBrews;
        }
        
        function showDayDetail(dateStr, day) {
            const brews = sampleBrewData[dateStr];
            const detailContainer = document.getElementById('calendarDayBrews');
            const detailCard = document.getElementById('calendarDayDetail');
            
            if (!detailContainer || !detailCard) return;
            
            // Update title
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const titleEl = detailCard.querySelector('.calendar-detail-title');
            if (titleEl) {
                titleEl.innerHTML = `<span>📅</span> ${monthNames[calendarPageMonth]} ${day}, ${calendarPageYear}`;
            }
            
            if (!brews || brews.length === 0) {
                detailContainer.innerHTML = `
                    <div style="text-align: center; padding: 32px; color: var(--text-light);">
                        <div style="font-size: 48px; margin-bottom: 12px;">🍃</div>
                        <div style="font-size: 16px; margin-bottom: 8px;">No brewing sessions</div>
                        <div style="font-size: 13px; color: #999;">This day is waiting for a mindful moment</div>
                        <button class="btn btn-primary" style="margin-top: 20px; padding: 12px 24px;" onclick="goTo('emotion')">
                            Start Brewing ☕
                        </button>
                    </div>
                `;
            } else {
                const timePerceptionLabels = {
                    'longer': '⏱️ Time felt longer than usual',
                    'shorter': '⏱️ Time felt shorter than usual', 
                    'same': '⏱️ Time felt about the same'
                };
                const paceControlLabels = {
                    'interface': '🎮 The interface led the pace',
                    'me': '🎮 I controlled the pace',
                    'together': '🎮 We moved together'
                };
                
                detailContainer.innerHTML = brews.map((brew, index) => `
                    <div style="background: white; border-radius: 16px; padding: 20px; margin-bottom: ${index < brews.length - 1 ? '16px' : '0'}; border: 1px solid var(--border);">
                        <!-- Header: Coffee Type & Time -->
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="font-size: 32px;">${brew.icon}</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 18px; color: var(--coffee-dark);">${brew.type.charAt(0).toUpperCase() + brew.type.slice(1)}</div>
                                    <div style="font-size: 13px; color: var(--text-light);">${brew.time} · ${brew.duration || '2m 16s'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Emotion Transition -->
                        <div style="background: linear-gradient(135deg, #f5f0e8, #e8dcc7); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 8px; font-weight: 600;">EMOTIONAL JOURNEY</div>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
                                <div style="text-align: center;">
                                    <div style="font-size: 36px; margin-bottom: 4px;">${brew.before}</div>
                                    <div style="font-size: 12px; color: var(--text-light);">${brew.beforeLabel || 'Before'}</div>
                                </div>
                                <div style="font-size: 24px; color: var(--coffee-light);">→</div>
                                <div style="text-align: center;">
                                    <div style="font-size: 36px; margin-bottom: 4px;">${brew.after}</div>
                                    <div style="font-size: 12px; color: var(--text-light);">${brew.afterLabel || 'After'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Research Data -->
                        <div style="background: #fafafa; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 12px; font-weight: 600;">🔬 RESEARCH OBSERVATIONS</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--coffee-dark);">
                                    ${timePerceptionLabels[brew.timePerception] || '⏱️ Time perception not recorded'}
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--coffee-dark);">
                                    ${paceControlLabels[brew.paceControl] || '🎮 Pace control not recorded'}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Personal Note -->
                        ${brew.note ? `
                        <div style="background: #fffdf8; border-left: 3px solid var(--coffee-medium); padding: 12px 16px; border-radius: 0 8px 8px 0;">
                            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 6px; font-weight: 600;">✍️ YOUR NOTE</div>
                            <div style="font-family: 'Caveat', cursive; font-size: 17px; color: var(--coffee-dark); line-height: 1.5;">"${brew.note}"</div>
                        </div>
                        ` : ''}
                    </div>
                `).join('');
            }
            
            // Scroll to detail card
            detailCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        function initCalendarPage() {
            renderCalendarPage();
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            initStamps();
            initJournal();
            loadProfile();
            loadSettings();
            renderCalendar();
            initExperienceMode();
            initCalendarPage();
        });
