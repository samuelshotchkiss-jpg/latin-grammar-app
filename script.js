document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const textContainer = document.getElementById('text-container');
    const questionPrompt = document.getElementById('question-prompt');
    const scoreCounter = document.getElementById('score-counter');
    const scoreLabel = document.getElementById('score-label');
    const scoreValue = document.getElementById('score-value');
    const incorrectCounter = document.getElementById('incorrect-counter');
    const trialCounter = document.getElementById('trial-counter');
    const finishButton = document.getElementById('finish-button');
    const questionSelector = document.getElementById('question-selector');
    const completionMessage = document.getElementById('completion-message');
    const completionTitle = document.getElementById('completion-title');
    const completionText = document.getElementById('completion-text');
    const completionCloseButton = document.getElementById('completion-close-button');
    const resetButton = document.getElementById('reset-button');
    const hintsContainer = document.getElementById('hints-container');
    const hint1Checkbox = document.getElementById('hint1');
    const hint1Wrapper = document.getElementById('hint1-wrapper');
    const hint2Checkbox = document.getElementById('hint2');
    const hint2Wrapper = document.getElementById('hint2-wrapper');

    // --- APP STATE ---
    let storyData = [];
    const POS_CATEGORIES = ['Noun', 'Verb', 'Adjective'];
    let appState = {};
    let currentPOS = 'Noun';
    let currentTextName = 'default_story';

    // --- STATE MANAGEMENT ---
    function createInitialState(pos) {
        const allMatchingItems = storyData.filter(item => (item.pos && (Array.isArray(item.pos) ? item.pos.includes(pos) : item.pos === pos)));
        const simpleItems = allMatchingItems.filter(item => !item.compositeVerb);
        const compositeVerbIds = new Set(allMatchingItems.filter(item => item.compositeVerb).map(item => item.compositeVerb));
        const totalPossible = simpleItems.length + compositeVerbIds.size;
        return {
            attempts: 0, isAnswered: false, isAttempting: true, isComplete: false, totalPossible: totalPossible,
            wordStatus: storyData.map(() => ({ status: 'none', selected: false, tooltipShown: false }))
        };
    }
    function loadState(pos) {
        const key = `latinAppProgress_${currentTextName}_${pos}`;
        const savedState = localStorage.getItem(key);
        appState[pos] = savedState ? JSON.parse(savedState) : createInitialState(pos);
    }
    function saveState(pos) {
        const key = `latinAppProgress_${currentTextName}_${pos}`;
        localStorage.setItem(key, JSON.stringify(appState[pos]));
    }
    function resetAllProgress() {
        if (confirm("Are you sure you want to reset all progress for all categories? This cannot be undone.")) {
            localStorage.clear();
            initializeApp();
        }
    }

    // --- UI RENDERING ---
    function renderUI() {
        renderText();
        updateCounters();
        renderButtonsAndLockState();
        renderHints();
    }
    function renderText() {
        document.querySelectorAll('.word, .sentence').forEach(el => {
            el.classList.remove('hint-noun', 'hint-verb', 'hint-adjective', 'hint-sentence-highlight');
        });
        const state = appState[currentPOS];
        state.wordStatus.forEach((wordState, index) => {
            const wordEl = document.querySelector(`.word[data-word-index="${index}"]`);
            if (!wordEl) return;
            wordEl.classList.remove('selected', 'correct', 'incorrect');
            if (wordState.selected) wordEl.classList.add('selected');
            if (wordState.status === 'correct') wordEl.classList.add('correct');
            if (wordState.status === 'incorrect') wordEl.classList.add('incorrect');
        });
    }
   function updateCounters() {
        const state = appState[currentPOS];
        if (!state.isAnswered) {
            [scoreCounter, incorrectCounter, trialCounter].forEach(el => el.classList.add('hidden'));
            return;
        }
        [scoreCounter, incorrectCounter, trialCounter].forEach(el => el.classList.remove('hidden'));
        
        const selectedWordsData = [];
        state.wordStatus.forEach((wordState, index) => { if (wordState.selected) selectedWordsData.push(storyData[index]); });

        const correctSelectedItems = selectedWordsData.filter(item => item.pos && (Array.isArray(item.pos) ? item.pos.includes(currentPOS) : item.pos === currentPOS));
        const simpleCorrect = correctSelectedItems.filter(item => !item.compositeVerb).length;
        const compositeCorrectIds = new Set(correctSelectedItems.filter(item => item.compositeVerb).map(item => item.compositeVerb));
        const correctSelectedCount = simpleCorrect + compositeCorrectIds.size;

        // --- THIS IS THE CORRECTED LOGIC ---
        
        // 1. Declare the variable ONCE with `let`.
        let incorrectSelectedCount = 0;

        if (state.isAttempting) {
            // While attempting, ONLY count words that have already been graded as incorrect.
            state.wordStatus.forEach((wordState) => {
                if (wordState.selected && wordState.status === 'incorrect') {
                    incorrectSelectedCount++;
                }
            });
        } else {
            // After checking, count all newly selected incorrect items.
            // 2. ASSIGN to the existing variable, do not redeclare with `const`.
            const incorrectSelectedItems = selectedWordsData.filter(item => !item.pos || !(Array.isArray(item.pos) ? item.pos.includes(currentPOS) : item.pos === currentPOS));
            incorrectSelectedCount = incorrectSelectedItems.length;
        }
        // --- END OF CORRECTION ---

        scoreLabel.textContent = state.isAttempting ? "Selected" : "Correct";
        scoreValue.innerHTML = `<span class="${state.isAttempting ? 'provisional-score' : ''}">${correctSelectedCount}</span> / ${state.totalPossible}`;
        incorrectCounter.textContent = `Incorrect: ${incorrectSelectedCount}`;
        trialCounter.textContent = `Attempts: ${state.attempts}`;
    }
    function renderButtonsAndLockState() {
        const state = appState[currentPOS];
        textContainer.classList.toggle('locked', state.isComplete);
        finishButton.disabled = state.isComplete;
        POS_CATEGORIES.forEach(pos => {
            const button = document.querySelector(`#question-selector button[data-pos="${pos}"]`);
            if (appState[pos]) {
                button.classList.toggle('completed', appState[pos].isComplete);
                button.querySelector('.completion-check').textContent = appState[pos].isComplete ? '✓' : '';
            }
        });
    }
    function renderHints() {
        hintsContainer.classList.remove('hidden');
        const state = appState[currentPOS];
        const correctItems = storyData.filter((item, index) => state.wordStatus[index].status === 'correct' && (Array.isArray(item.pos) ? item.pos.includes(currentPOS) : item.pos === currentPOS));
        const simpleCorrect = correctItems.filter(item => !item.compositeVerb).length;
        const compositeCorrectIds = new Set(correctItems.filter(item => item.compositeVerb).map(item => item.compositeVerb));
        const correctUnitsCount = simpleCorrect + compositeCorrectIds.size;
        const completion = state.totalPossible > 0 ? (correctUnitsCount / state.totalPossible) : 0;
        if (completion >= 0.5) {
            hint1Checkbox.disabled = false;
            hint1Wrapper.removeAttribute('data-tooltip');
        } else {
            hint1Checkbox.disabled = true;
            hint1Checkbox.checked = false;
            hint1Wrapper.setAttribute('data-tooltip', 'Unlock at 50% completion');
        }
        if (completion >= 0.75) {
            hint2Checkbox.disabled = false;
            hint2Wrapper.removeAttribute('data-tooltip');
        } else {
            hint2Checkbox.disabled = true;
            hint2Checkbox.checked = false;
            hint2Wrapper.setAttribute('data-tooltip', 'Unlock at 75% completion');
        }
        applyHintEffects();
    }
    function applyHintEffects() {
        if (hint1Checkbox.checked) {
            POS_CATEGORIES.forEach(pos => {
                if (pos !== currentPOS && appState[pos]) {
                    appState[pos].wordStatus.forEach((wordState, index) => {
                        const wordData = storyData[index];
                        const isDualPos = Array.isArray(wordData.pos) && wordData.pos.includes(currentPOS);
                        if (wordState.status === 'correct' && !isDualPos) {
                            const wordEl = document.querySelector(`.word[data-word-index="${index}"]`);
                            if (wordEl) wordEl.classList.add(`hint-${pos.toLowerCase()}`);
                        }
                    });
                }
            });
        }
        if (hint2Checkbox.checked) {
            const sentences = textContainer.querySelectorAll('span.sentence');
            sentences.forEach(sentence => {
                let hasMissingWord = false;
                const wordsInSentence = sentence.querySelectorAll('.word');
                for (const wordEl of wordsInSentence) {
                    const index = parseInt(wordEl.dataset.wordIndex, 10);
                    const wordState = appState[currentPOS].wordStatus[index];
                    const wordData = storyData[index];
                    const isTargetPOS = wordData.pos && (Array.isArray(wordData.pos) ? wordData.pos.includes(currentPOS) : wordData.pos === currentPOS);
                    if (isTargetPOS && wordState.status !== 'correct') {
                        hasMissingWord = true;
                        break;
                    }
                }
                if (hasMissingWord) sentence.classList.add('hint-sentence-highlight');
            });
        }
    }
    function removeAllSpeechBubbles() { document.querySelectorAll('.speech-bubble').forEach(bubble => bubble.remove()); }

    function displayTooltips(tooltipQueue) {
        removeAllSpeechBubbles();
        if (tooltipQueue.length === 0) return;

        const renderedBubbles = [];

        // First pass: create all bubbles and get their initial info
        tooltipQueue.forEach(info => {
            const bubble = document.createElement('div');
            bubble.className = 'speech-bubble';
            bubble.innerHTML = info.message;
            bubble.addEventListener('click', () => bubble.remove());
            info.anchor.appendChild(bubble);
            renderedBubbles.push({ element: bubble, rect: bubble.getBoundingClientRect() });
        });

        // Second pass: de-collision
        for (let i = 0; i < renderedBubbles.length; i++) {
            for (let j = 0; j < i; j++) {
                const bubbleA = renderedBubbles[i];
                const bubbleB = renderedBubbles[j];
                const rectA = bubbleA.rect;
                const rectB = bubbleB.rect;

                // Check for horizontal overlap
                if (rectA.left < rectB.right && rectA.right > rectB.left) {
                    // If they overlap, flip the current bubble to be below
                    bubbleA.element.classList.add('below');
                    // Update its rect for subsequent checks, though this simple model doesn't need it
                    bubbleA.rect = bubbleA.element.getBoundingClientRect();
                    break; // Move to the next bubble
                }
            }
        }

        // Third pass: viewport alignment and making visible
        const viewportWidth = window.innerWidth;
        renderedBubbles.forEach(bubbleInfo => {
            const { element, rect } = bubbleInfo;
            if (rect.right > viewportWidth - 10) element.classList.add('align-right');
            if (rect.left < 10) element.classList.add('align-left');
            element.classList.add('visible');
        });
    }

    function showCompletionMessage(attempts, incorrectSelectionsOnFinalAttempt, totalPossible) {
        let type, title, text;
        if (incorrectSelectionsOnFinalAttempt >= totalPossible && incorrectSelectionsOnFinalAttempt > 5) {
            type = 'warning'; title = 'System Gamed?'; text = 'You selected every correct answer, but also a large number of incorrect ones. The goal is precision, not completion.';
        } else if (attempts <= 2 && incorrectSelectionsOnFinalAttempt <= 3) {
            type = 'congrats'; title = 'Excellent Work!'; text = `Congratulations! You finished in just ${attempts} attempt(s) with high accuracy. Well done!`;
        } else {
            type = 'encourage'; title = 'Category Complete!'; text = `You did it! You found all the correct words. Great job persisting!`;
        }
        completionMessage.className = type;
        completionTitle.textContent = title;
        completionText.textContent = text;
        completionMessage.classList.remove('hidden');
    }

    // --- CORE LOGIC ---
    function switchQuestionTab(pos) {
        if (appState[currentPOS]) saveState(currentPOS);
        currentPOS = pos;
        loadState(currentPOS);
        questionPrompt.textContent = (pos === 'Noun') ? "Find all the Nouns and Pronouns." : `Find all the ${pos}s.`;
        document.querySelectorAll('#question-selector button').forEach(btn => btn.classList.toggle('active', btn.dataset.pos === pos));
        removeAllSpeechBubbles();
        completionMessage.classList.add('hidden');
        renderUI();
    }
    function checkAnswers() {
        const state = appState[currentPOS];
        if (state.isComplete) return;
        state.isAttempting = false;
        state.isAnswered = true;
        
        let incorrectCount = 0;
        const tooltipsToShow = []; // The queue for our new system

        state.wordStatus.forEach((wordState, index) => {
            if (wordState.selected) {
                const wordData = storyData[index];
                const isTargetPOS = wordData.pos && (Array.isArray(wordData.pos) ? wordData.pos.includes(currentPOS) : wordData.pos === currentPOS);
                
                if (isTargetPOS) { 
                    wordState.status = 'correct'; 
                } else { 
                    wordState.status = 'incorrect'; 
                    incorrectCount++; 
                }

                // Check for tooltips regardless of correct/incorrect status
                if (!wordState.tooltipShown && wordData.feedback && typeof wordData.feedback[currentPOS] !== 'undefined') {
                    const message = wordData.feedback[currentPOS];
                    if (message) { // Only queue if there's a message
                        const wordEl = document.querySelector(`.word[data-word-index="${index}"]`);
                        tooltipsToShow.push({ anchor: wordEl.parentElement, message: message });
                    }
                    wordState.tooltipShown = true; // Mark as handled
                }
            }
        });
        
        displayTooltips(tooltipsToShow); // NEW: Call the master tooltip function

        const correctItems = storyData.filter((item, index) => state.wordStatus[index].status === 'correct' && (Array.isArray(item.pos) ? item.pos.includes(currentPOS) : item.pos === currentPOS));
        const simpleCorrect = correctItems.filter(item => !item.compositeVerb).length;
        const compositeCorrectIds = new Set(correctItems.filter(item => item.compositeVerb).map(item => item.compositeVerb));
        const totalCorrectUnits = simpleCorrect + compositeCorrectIds.size;
        
        if (totalCorrectUnits === state.totalPossible) {
            state.isComplete = true;
            showCompletionMessage(state.attempts, incorrectCount, state.totalPossible);
        }

        saveState(currentPOS);
        renderUI();
    }

    // --- INITIALIZATION ---
    function buildTextDOM() {
        textContainer.innerHTML = '';
        let currentParagraph = document.createElement('p');
        textContainer.appendChild(currentParagraph);
        storyData.forEach((item, index) => {
            if (item.type === 'break') {
                currentParagraph = document.createElement('p');
                textContainer.appendChild(currentParagraph);
                return;
            }
            const wordContainer = document.createElement('span');
            wordContainer.className = 'word-container';
            const span = document.createElement('span');
            span.textContent = item.word;
            if (item.pos && item.pos !== 'Punctuation') {
                span.classList.add('word');
                span.dataset.wordIndex = index;
                if (item.compositeVerb) { span.dataset.compositeVerb = item.compositeVerb; }
                span.addEventListener('click', (e) => {
                    const clickedEl = e.target;
                    const clickedIndex = parseInt(clickedEl.dataset.wordIndex, 10);
                    const state = appState[currentPOS];
                        if (state.isComplete || state.wordStatus[clickedIndex].status === 'incorrect' || state.wordStatus[clickedIndex].status === 'correct') return;                   
                        if (!state.isAttempting) {
                        state.isAttempting = true;
                        state.attempts++;
                    }
                    const compositeId = clickedEl.dataset.compositeVerb;
                    const newSelectedState = !state.wordStatus[clickedIndex].selected;
                    if (compositeId) {
                        document.querySelectorAll(`[data-composite-verb="${compositeId}"]`).forEach(partnerEl => {
                            const partnerIndex = parseInt(partnerEl.dataset.wordIndex, 10);
                            state.wordStatus[partnerIndex].selected = newSelectedState;
                        });
                    } else {
                        state.wordStatus[clickedIndex].selected = newSelectedState;
                    }
                    renderUI();
                });
            } else {
                span.classList.add('punctuation');
            }
            wordContainer.appendChild(span);
            currentParagraph.appendChild(wordContainer);
            const nextItem = storyData[index + 1];
            if (!item.noSpaceAfter && nextItem && nextItem.pos !== 'Punctuation') {
                currentParagraph.appendChild(document.createTextNode(' '));
            }
        });
        textContainer.querySelectorAll('p').forEach(p => {
            let sentenceContent = [];
            const children = Array.from(p.childNodes);
            children.forEach(child => {
                sentenceContent.push(child);
                const isSentenceEnd = (child.nodeType === Node.ELEMENT_NODE && child.querySelector('.punctuation') && (child.textContent.includes('.') || child.textContent.includes('!') || child.textContent.includes('?')));
                if (isSentenceEnd) {
                    const sentenceSpan = document.createElement('span');
                    sentenceSpan.className = 'sentence';
                    sentenceContent.forEach(node => sentenceSpan.appendChild(node));
                    p.appendChild(sentenceSpan);
                    sentenceContent = [];
                }
            });
            if (sentenceContent.length > 0) {
                const sentenceSpan = document.createElement('span');
                sentenceSpan.className = 'sentence';
                sentenceContent.forEach(node => sentenceSpan.appendChild(node));
                p.appendChild(sentenceSpan);
            }
        });
    }

    async function initializeApp() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const textIdentifier = urlParams.get('text');
            let fileName;
            if (textIdentifier) {
                currentTextName = textIdentifier;
                fileName = `${textIdentifier}.json`;
            } else {
                currentTextName = 'default_story';
                fileName = 'data.json';
            }
            const response = await fetch(fileName);
            if (!response.ok) { throw new Error(`Could not load file: ${fileName}`); }
            storyData = await response.json();
            buildTextDOM();
            POS_CATEGORIES.forEach(pos => loadState(pos));
            switchQuestionTab(currentPOS);
        } catch (error) {
            console.error("FATAL ERROR during initialization:", error);
            textContainer.innerHTML = "<p style='color:red;'><b>Error:</b> Could not load story data. Check console for details.</p>";
        }
    }

    // --- EVENT LISTENERS ---
    finishButton.addEventListener('click', checkAnswers);
    completionCloseButton.addEventListener('click', () => completionMessage.classList.add('hidden'));
    resetButton.addEventListener('click', resetAllProgress);
    questionSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.pos !== currentPOS) {
            switchQuestionTab(button.dataset.pos);
        }
    });
    hint1Checkbox.addEventListener('change', renderUI);
    hint2Checkbox.addEventListener('change', renderUI);

    initializeApp();
});