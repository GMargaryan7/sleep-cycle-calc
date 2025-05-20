// Add these to the beginning of your script.js file
function formatToTimeInput(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatTimeForDisplay(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

function getRecommendation(cycleNumber) {
    if (cycleNumber <= 3) {
        return {
            level: 'short',
            text: 'Short',
            className: 'result-item--short',
            badgeClass: 'badge--short'
        };
    } else if (cycleNumber === 4) {
        return {
            level: 'fair',
            text: 'Fair',
            className: 'result-item--fair',
            badgeClass: 'badge--fair'
        };
    } else if (cycleNumber === 5 || cycleNumber === 6) {
        return {
            level: 'optimal',
            text: 'Optimal',
            className: 'result-item--optimal',
            badgeClass: 'badge--optimal'
        };
    } else {
        return {
            level: 'extended',
            text: 'Extended',
            className: 'result-item--extended',
            badgeClass: 'badge--extended'
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
            // --- THEME TOGGLE LOGIC ---
            const themeToggle = document.getElementById('themeToggle');
            const sunIcon = document.querySelector('.sun-icon');
            const moonIcon = document.querySelector('.moon-icon');
            const slumberImage = document.getElementById('slumberImage');
            // Placeholder image URLs use neutral text colors, so they don't need to change with accent color swaps.
            const darkImageUrl = 'https://placehold.co/600x400/0A0F1A/A0AEC0?text=Sleep+Cycles';
            const lightImageUrl = 'https://placehold.co/600x400/F9FAFB/4B5563?text=Sleep+Cycles';


            // Function to apply theme
            const applyTheme = (isDark) => {
                if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    moonIcon.classList.remove('hidden');
                    sunIcon.classList.add('hidden');
                    if (slumberImage) slumberImage.src = darkImageUrl;
                } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    sunIcon.classList.remove('hidden');
                    moonIcon.classList.add('hidden');
                    if (slumberImage) slumberImage.src = lightImageUrl;
                }
            };

            // Check local storage for saved theme
            const savedTheme = localStorage.getItem('theme');
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            let currentThemeIsDark;

            if (savedTheme) {
                currentThemeIsDark = savedTheme === 'dark';
            } else {
                currentThemeIsDark = prefersDark; // Default to system preference
            }

            applyTheme(currentThemeIsDark);
            themeToggle.checked = !currentThemeIsDark; // If dark, toggle is off (unchecked)

            themeToggle.addEventListener('change', () => {
                const isDark = !themeToggle.checked; // If checked, it means light mode is on
                applyTheme(isDark);
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });


            // Get current year for footer
            document.getElementById('currentYear').textContent = new Date().getFullYear();

            // --- DOM Elements ---
            const bedTimeInput = document.getElementById('bedTime');
            const wakeUpTimeTargetInput = document.getElementById('wakeUpTimeTarget');
            const addFallAsleepTimeWakeUpCheckbox = document.getElementById('addFallAsleepTimeWakeUp');
            const calculateWakeUpButton = document.getElementById('calculateWakeUpButton');
            const calculateWakeUpNowButton = document.getElementById('calculateWakeUpNowButton'); // New button
            const bedTimeError = document.getElementById('bedTimeError');
            const addFallAsleepTimeBedTimeCheckbox = document.getElementById('addFallAsleepTimeBedTime');
            const calculateBedTimeButton = document.getElementById('calculateBedTimeButton');
            const wakeUpTimeTargetError = document.getElementById('wakeUpTimeTargetError');

            // Nap Calculator DOM Elements
            const napStartTimeInput = document.getElementById('napStartTime');
            const napStartTimeError = document.getElementById('napStartTimeError');
            const calculate20minNapButton = document.getElementById('calculate20minNap');
            const calculate30minNapButton = document.getElementById('calculate30minNap');
            const calculate90minNapButton = document.getElementById('calculate90minNap');
            const napResultsContainer = document.getElementById('napResultsContainer');

            // --- Constants ---
            const CYCLE_DURATION_MINUTES = 90;
            const FALL_ASLEEP_OFFSET_MINUTES = 15;
            const NUM_CYCLES_DISPLAY = 7; 

            // --- Helper Functions (Moved to Global Scope for Testing) ---
            // function formatToTimeInput(date) { ... } // Now global
            // function formatTimeForDisplay(date) { ... } // Now global
            // function getRecommendation(cycleNumber) { ... } // Now global

            function displayResults(containerId, title, results, generalRecommendation) {
                const container = document.getElementById(containerId);
                container.innerHTML = ''; 

                if (results.length === 0 && title === '') { 
                    return;
                } else if (results.length === 0 && title !== '') { 
                    let html = `<h3 class="results-title">${title}</h3>`;
                    html += `<p class="text-slate-400">No suitable times found based on your input.</p>`;
                    container.innerHTML = html;
                    return;
                }
                
                let html = `<h3 class="results-title">${title}</h3>`;
                results.forEach(result => {
                    const recommendation = getRecommendation(result.cycleNumber); // Uses updated logic
                    let mostRecommendedClass = (result.cycleNumber === 5 || result.cycleNumber === 6) ? 'result-item--most-recommended' : '';
                    html += `
                        <div class="result-item ${recommendation.className} ${mostRecommendedClass}">
                            <div class="result-item-main">
                                <strong>${result.time}</strong>
                                <div class="cycle-details">${result.cycleInfo} &bull; ${result.duration}</div>
                            </div>
                            <span class="recommendation-badge ${recommendation.badgeClass}">${recommendation.text}</span>
                        </div>`;
                });
                if (generalRecommendation) {
                    html += `<p class="recommendation-text">${generalRecommendation}</p>`;
                }
                container.innerHTML = html;
            }

            // --- Auto-population ---
            const now = new Date();
            bedTimeInput.value = formatToTimeInput(now);
            wakeUpTimeTargetInput.value = "08:00";
            if(napStartTimeInput) napStartTimeInput.value = formatToTimeInput(now); // Auto-populate nap start time

            // --- Nap Calculation Function ---
            function calculateNapWakeUpTime(startTimeInputElement, napDurationMinutes) {
                if (!startTimeInputElement.value) {
                    napStartTimeError.textContent = 'Please specify your planned nap start time.';
                    startTimeInputElement.classList.add('input-error');
                    napResultsContainer.innerHTML = ''; // Clear previous results
                    return null;
                } else {
                    napStartTimeError.textContent = '';
                    startTimeInputElement.classList.remove('input-error');
                }

                const [hours, minutes] = startTimeInputElement.value.split(':').map(Number);
                let napTime = new Date();
                napTime.setHours(hours, minutes, 0, 0);
                napTime.setMinutes(napTime.getMinutes() + napDurationMinutes);
                return napTime;
            }


            // --- Refactored function for generating wake-up suggestions ---
            function generateWakeUpSuggestions(initialSleepTimeDate, resultsContainerId, fallAsleepOffsetCheckboxElement) {
                let sleepTime = new Date(initialSleepTimeDate.getTime()); // Clone the date
                const isOffsetApplied = fallAsleepOffsetCheckboxElement.checked;

                if (isOffsetApplied) {
                    sleepTime.setMinutes(sleepTime.getMinutes() + FALL_ASLEEP_OFFSET_MINUTES);
                }

                const wakeUpTimes = [];
                for (let i = 1; i <= NUM_CYCLES_DISPLAY; i++) {
                    let wakeUpTimeResult = new Date(sleepTime.getTime());
                    wakeUpTimeResult.setMinutes(wakeUpTimeResult.getMinutes() + (i * CYCLE_DURATION_MINUTES));
                    
                    let totalMinutesForDurationCalc = i * CYCLE_DURATION_MINUTES;
                    if (isOffsetApplied) {
                         totalMinutesForDurationCalc += FALL_ASLEEP_OFFSET_MINUTES;
                    }

                    const h = Math.floor(totalMinutesForDurationCalc / 60);
                    const m = totalMinutesForDurationCalc % 60;
                    let durationString = "";
                    if (h > 0) durationString += `${h}h `;
                    if (m > 0) durationString += `${m}m`;
                    if (durationString === "") durationString = "0m"; 
                    
                    let durationDisplay = durationString.trim() + " sleep";
                    if (isOffsetApplied) {
                        durationDisplay += " (includes ~15min to fall asleep)";
                    }

                    wakeUpTimes.push({
                        time: formatTimeForDisplay(wakeUpTimeResult),
                        cycleNumber: i,
                        cycleInfo: `${i} Cycle${i > 1 ? 's' : ''}`,
                        duration: durationDisplay
                    });
                }
                displayResults(resultsContainerId, 'Optimal Wake-Up Windows:', wakeUpTimes, 'Aligning your wake-up time with the end of a sleep cycle can significantly improve how refreshed you feel. Aim for 5-6 cycles for best results.');
            }
            
            // --- Function for generating bedtime suggestions ---
            function generateBedTimeSuggestions(targetWakeUpTimeDate, resultsContainerId, fallAsleepOffsetCheckboxElement) {
                const isOffsetApplied = fallAsleepOffsetCheckboxElement.checked;
                const idealBedTimes = [];

                for (let i = 1; i <= NUM_CYCLES_DISPLAY; i++) {
                    let bedTime = new Date(targetWakeUpTimeDate.getTime());
                    bedTime.setMinutes(bedTime.getMinutes() - (i * CYCLE_DURATION_MINUTES));

                    if (isOffsetApplied) {
                        bedTime.setMinutes(bedTime.getMinutes() - FALL_ASLEEP_OFFSET_MINUTES);
                    }
                    
                    let totalMinutesForDurationCalc = i * CYCLE_DURATION_MINUTES;
                    if (isOffsetApplied) {
                        totalMinutesForDurationCalc += FALL_ASLEEP_OFFSET_MINUTES;
                    }

                    const h = Math.floor(totalMinutesForDurationCalc / 60);
                    const m = totalMinutesForDurationCalc % 60;
                    let durationString = "";
                    if (h > 0) durationString += `${h}h `;
                    if (m > 0) durationString += `${m}m`;
                    if (durationString === "") durationString = "0m"; 
                    
                    let durationDisplay = durationString.trim() + " sleep";
                    if (isOffsetApplied) {
                        durationDisplay += " (includes ~15min to fall asleep)";
                    }

                    idealBedTimes.push({
                        time: formatTimeForDisplay(bedTime),
                        cycleNumber: i,
                        cycleInfo: `${i} Cycle${i > 1 ? 's' : ''}`,
                        duration: durationDisplay
                    });
                }
                displayResults(resultsContainerId, 'Suggested Bedtime Windows:', idealBedTimes.reverse(), 'Choosing a bedtime that allows for full sleep cycles helps you wake up feeling restored. The optimal range is typically 5-6 cycles.');
            }

            // --- Event Listeners ---
            bedTimeInput.addEventListener('input', () => {
                bedTimeError.textContent = '';
                bedTimeInput.classList.remove('input-error');
            });

            wakeUpTimeTargetInput.addEventListener('input', () => {
                wakeUpTimeTargetError.textContent = '';
                wakeUpTimeTargetInput.classList.remove('input-error');
            });

            if (napStartTimeInput) {
                napStartTimeInput.addEventListener('input', () => {
                    napStartTimeError.textContent = '';
                    napStartTimeInput.classList.remove('input-error');
                    // napResultsContainer.innerHTML = ''; // Optionally clear results on input change
                });
            }
            
            // Nap Button Event Listeners
            if (calculate20minNapButton) {
                calculate20minNapButton.addEventListener('click', () => {
                    const napDuration = 20;
                    const wakeUpTime = calculateNapWakeUpTime(napStartTimeInput, napDuration);
                    if (wakeUpTime) {
                        const formattedTime = formatTimeForDisplay(wakeUpTime);
                        napResultsContainer.innerHTML = `
                            <p class="text-lg">For a ${napDuration}-min power nap, wake up at: <strong class="text-xl">${formattedTime}</strong></p>
                            <p class="text-sm text-slate-400">(Nap starts at ${napStartTimeInput.value}, duration: ${napDuration} minutes)</p>`;
                        napStartTimeError.textContent = ''; // Clear error on successful calculation
                    }
                });
            }

            if (calculate30minNapButton) {
                calculate30minNapButton.addEventListener('click', () => {
                    const napDuration = 30;
                    const wakeUpTime = calculateNapWakeUpTime(napStartTimeInput, napDuration);
                    if (wakeUpTime) {
                        const formattedTime = formatTimeForDisplay(wakeUpTime);
                        napResultsContainer.innerHTML = `
                            <p class="text-lg">For a ${napDuration}-min nap, wake up at: <strong class="text-xl">${formattedTime}</strong></p>
                            <p class="text-sm text-slate-400">(Nap starts at ${napStartTimeInput.value}, duration: ${napDuration} minutes)</p>`;
                        napStartTimeError.textContent = ''; 
                    }
                });
            }

            if (calculate90minNapButton) {
                calculate90minNapButton.addEventListener('click', () => {
                    const napDuration = 90;
                    const wakeUpTime = calculateNapWakeUpTime(napStartTimeInput, napDuration);
                    if (wakeUpTime) {
                        const formattedTime = formatTimeForDisplay(wakeUpTime);
                        napResultsContainer.innerHTML = `
                            <p class="text-lg">For a ${napDuration}-min cycle, wake up at: <strong class="text-xl">${formattedTime}</strong></p>
                            <p class="text-sm text-slate-400">(Nap starts at ${napStartTimeInput.value}, duration: ${napDuration} minutes)</p>`;
                        napStartTimeError.textContent = '';
                    }
                });
            }

            calculateWakeUpButton.addEventListener('click', () => {
                if (!bedTimeInput.value) {
                    bedTimeError.textContent = 'Please specify your planned sleep time.';
                    bedTimeInput.classList.add('input-error');
                    displayResults('wakeUpResultsContainer', '', [], ''); 
                    return;
                } else {
                    bedTimeError.textContent = '';
                    bedTimeInput.classList.remove('input-error');
                }

                const [hours, minutes] = bedTimeInput.value.split(':').map(Number);
                let initialSleepTime = new Date();
                initialSleepTime.setHours(hours, minutes, 0, 0);
                
                generateWakeUpSuggestions(initialSleepTime, 'wakeUpResultsContainer', addFallAsleepTimeWakeUpCheckbox);
            });

            calculateWakeUpNowButton.addEventListener('click', () => {
                bedTimeError.textContent = ''; // Clear any previous errors
                bedTimeInput.classList.remove('input-error'); // Clear error styling

                const now = new Date();
                bedTimeInput.value = formatToTimeInput(now); // Update the input field

                generateWakeUpSuggestions(now, 'wakeUpResultsContainer', addFallAsleepTimeWakeUpCheckbox);
            });

            calculateBedTimeButton.addEventListener('click', () => {
                if (!wakeUpTimeTargetInput.value) {
                    wakeUpTimeTargetError.textContent = 'Please set your desired wake-up time.';
                    wakeUpTimeTargetInput.classList.add('input-error');
                    displayResults('bedTimeResultsContainer', '', [], ''); 
                    return;
                } else {
                    wakeUpTimeTargetError.textContent = '';
                    wakeUpTimeTargetInput.classList.remove('input-error');
                }

                const [hours, minutes] = wakeUpTimeTargetInput.value.split(':').map(Number);
                let targetWakeUpTime = new Date();
                targetWakeUpTime.setHours(hours, minutes, 0, 0);
                
                generateBedTimeSuggestions(targetWakeUpTime, 'bedTimeResultsContainer', addFallAsleepTimeBedTimeCheckbox);
            });
        });
