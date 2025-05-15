document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const inputText = document.getElementById('input-text');
    const generateBtn = document.getElementById('generate-btn');
    const exampleBtn = document.getElementById('example-btn');
    const flashcardSection = document.getElementById('flashcard-section');
    const flashcard = document.getElementById('flashcard');
    const questionEl = document.getElementById('question');
    const answerEl = document.getElementById('answer');
    const questionTypeEl = document.getElementById('question-type');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const currentCardEl = document.getElementById('current-card');
    const totalCardsEl = document.getElementById('total-cards');
    const totalCardsStatEl = document.getElementById('total-cards-stat');
    const viewedCardsStatEl = document.getElementById('viewed-cards-stat');
    const masteredCardsStatEl = document.getElementById('mastered-cards-stat');
    const progressBar = document.getElementById('progress-bar');
    const saveBtn = document.getElementById('save-btn');
    const newDeckBtn = document.getElementById('new-deck-btn');
    const tabButtons = document.querySelectorAll('.tab');
    
    // Options
    const autoGenerateCheckbox = document.getElementById('auto-generate');
    const includeDefinitionsCheckbox = document.getElementById('include-definitions');
    const includeConceptualCheckbox = document.getElementById('include-conceptual');
    const includeFillBlanksCheckbox = document.getElementById('include-fill-blanks');
    
    // State variables
    let flashcards = [];
    let currentCardIndex = 0;
    let viewedCards = new Set();
    let masteredCards = new Set();
    let bookmarkedCards = new Set();
    let currentFilter = 'all';
    let filteredCards = [];
    
    // Question types
    const QUESTION_TYPES = {
        DEFINITION: 'Definition',
        CONCEPTUAL: 'Conceptual',
        FILL_BLANK: 'Fill-in-blank',
        RELATIONSHIP: 'Relationship',
        EXAMPLE: 'Example',
        COMPARISON: 'Comparison',
        APPLICATION: 'Application'
    };
    
    // Difficulty levels
    const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
    
    // Example study material
    const EXAMPLE_TEXT = "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a by-product.\n\nThe water cycle, also known as the hydrologic cycle, describes the continuous movement of water on, above and below the surface of the Earth. Water can change states among liquid, vapor, and ice at various places in the water cycle.\n\nMitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell's biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP).\n\nOsmosis is the movement of water molecules through a selectively permeable membrane from an area of lower solute concentration to an area of higher solute concentration. This process equalizes the concentration of solutes on both sides of the membrane.\n\nCellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert biochemical energy from nutrients into ATP, and then release waste products.";
    
    // Initialize tabs
    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            tabButtons.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.tab;
            applyFilters();
            if (filteredCards.length > 0) {
                displayCard(0);
            }
        });
    });
    
    // Load example text
    exampleBtn.addEventListener('click', function() {
        inputText.value = EXAMPLE_TEXT;
        inputText.classList.add('pulse');
        setTimeout(() => {
            inputText.classList.remove('pulse');
        }, 600);
    });
    
    // Generate flashcards from input text
    generateBtn.addEventListener('click', function() {
        const text = inputText.value.trim();
        
        if (!text) {
            alert('Please enter some text to generate flashcards.');
            return;
        }
        
        generateFlashcards(text);
        flashcardSection.style.display = 'block';
        
        // Reset state
        viewedCards.clear();
        masteredCards.clear();
        bookmarkedCards.clear();
        
        // Apply filters
        applyFilters();
        
        // Display first card
        if (filteredCards.length > 0) {
            displayCard(0);
        }
        
        // Update stats
        updateStats();
        
        // Scroll to flashcard section
        flashcardSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Apply current filter to flashcards
    function applyFilters() {
        switch (currentFilter) {
            case 'definitions':
                filteredCards = flashcards.filter(card => card.type === QUESTION_TYPES.DEFINITION);
                break;
            case 'conceptual':
                filteredCards = flashcards.filter(card => 
                    card.type === QUESTION_TYPES.CONCEPTUAL || 
                    card.type === QUESTION_TYPES.RELATIONSHIP ||
                    card.type === QUESTION_TYPES.COMPARISON ||
                    card.type === QUESTION_TYPES.APPLICATION);
                break;
            case 'fill-blanks':
                filteredCards = flashcards.filter(card => card.type === QUESTION_TYPES.FILL_BLANK);
                break;
            default:
                filteredCards = [...flashcards];
        }
        
        // Update totals
        totalCardsEl.textContent = filteredCards.length;
        updateProgress();
    }
    
    // Generate questions and answers from text
    function generateFlashcards(text) {
        // Split text into paragraphs
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        flashcards = [];
        
        // Process each paragraph
        paragraphs.forEach(paragraph => {
            const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
            
            if (sentences.length === 0) return;
            
            // Extract concepts and key terms
            const mainConcepts = extractConcepts(paragraph);
            const keyTerms = extractKeyTerms(paragraph);
            
            // 1. Definition questions
            if (includeDefinitionsCheckbox.checked) {
                keyTerms.forEach(term => {
                    if (term.length > 3) {
                        flashcards.push({
                            question: `What is ${term}?`,
                            answer: findDefinition(term, paragraph),
                            type: QUESTION_TYPES.DEFINITION,
                            difficulty: getRandomDifficulty(),
                            viewed: false,
                            mastered: false,
                            bookmarked: false
                        });
                    }
                });
            }
            
            // 2. Conceptual questions
            if (includeConceptualCheckbox.checked) {
                mainConcepts.forEach(concept => {
                    // Generate different question types
                    const questionTypes = [
                        { type: QUESTION_TYPES.CONCEPTUAL, template: `Explain the concept of ${concept}.` },
                        { type: QUESTION_TYPES.RELATIONSHIP, template: `How does ${concept} relate to ${getRandomItem(keyTerms, [concept])}?` },
                        { type: QUESTION_TYPES.EXAMPLE, template: `Provide an example of ${concept}.` },
                        { type: QUESTION_TYPES.APPLICATION, template: `How is ${concept} applied in real-world scenarios?` }
                    ];
                    
                    // Pick a random question type
                    const questionType = getRandomItem(questionTypes);
                    
                    flashcards.push({
                        question: questionType.template,
                        answer: paragraph,
                        type: questionType.type,
                        difficulty: getRandomDifficulty(),
                        viewed: false,
                        mastered: false,
                        bookmarked: false
                    });
                    
                    // If there are multiple concepts, create comparison questions
                    if (mainConcepts.length > 1 && Math.random() > 0.5) {
                        const otherConcept = getRandomItem(mainConcepts, [concept]);
                        flashcards.push({
                            question: `Compare and contrast ${concept} and ${otherConcept}.`,
                            answer: paragraph,
                            type: QUESTION_TYPES.COMPARISON,
                            difficulty: 'hard',
                            viewed: false,
                            mastered: false,
                            bookmarked: false
                        });
                    }
                });
            }
            
            // 3. Fill-in-the-blank questions
            if (includeFillBlanksCheckbox.checked) {
                sentences.forEach(sentence => {
                    if (sentence.length > 20) {
                        const words = sentence.split(/\s+/);
                        if (words.length > 5) {
                            // Find important words to blank out
                            const potentialBlanks = extractKeyWords(sentence);
                            if (potentialBlanks.length > 0) {
                                const blankWord = getRandomItem(potentialBlanks);
                                const regex = new RegExp(`\\b${blankWord}\\b`, 'i');
                                const questionText = sentence.replace(regex, '________');
                                
                                flashcards.push({
                                    question: `Fill in the blank: "${questionText}"`,
                                    answer: blankWord,
                                    type: QUESTION_TYPES.FILL_BLANK,
                                    difficulty: 'medium',
                                    viewed: false,
                                    mastered: false,
                                    bookmarked: false
                                });
                            }
                        }
                    }
                });
            }
            
            // 4. Auto-generated questions (if enabled)
            if (autoGenerateCheckbox.checked) {
                // Generate "why" questions
                const whyQuestion = generateWhyQuestion(paragraph, mainConcepts);
                if (whyQuestion) {
                    flashcards.push({
                        question: whyQuestion,
                        answer: paragraph,
                        type: QUESTION_TYPES.CONCEPTUAL,
                        difficulty: 'hard',
                        viewed: false,
                        mastered: false,
                        bookmarked: false
                    });
                }
                
                // Generate "how" questions
                const howQuestion = generateHowQuestion(paragraph, mainConcepts);
                if (howQuestion) {
                    flashcards.push({
                        question: howQuestion,
                        answer: paragraph,
                        type: QUESTION_TYPES.CONCEPTUAL,
                        difficulty: 'hard',
                        viewed: false,
                        mastered: false,
                        bookmarked: false
                    });
                }
            }
        });
        
        // Ensure we have at least one card per paragraph
        if (flashcards.length < paragraphs.length) {
            paragraphs.forEach((paragraph, index) => {
                if (flashcards.filter(card => card.answer === paragraph).length === 0) {
                    const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
                    flashcards.push({
                        question: `Summarize what you know about: "${firstSentence}..."`,
                        answer: paragraph,
                        type: QUESTION_TYPES.CONCEPTUAL,
                        difficulty: 'medium',
                        viewed: false,
                        mastered: false,
                        bookmarked: false
                    });
                }
            });
        }
        
        // Shuffle the cards
        shuffleArray(flashcards);
        
        // Update stats
        totalCardsStatEl.textContent = flashcards.length;
    }
    
    // Helper function to extract key concepts from a paragraph
    function extractConcepts(paragraph) {
        const concepts = [];
        
        // Look for common patterns indicating main concepts
        const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Check first sentence for definitions
        const firstSentence = sentences[0].trim();
        const definitionPatterns = [
            /(\w+(?:\s+\w+){0,2})\s+is\s+(?:defined as|the process|a process|the)/i,
            /(\w+(?:\s+\w+){0,2})\s+are\s+(?:defined as|processes|structures|organelles)/i,
            /(?:The|A)\s+(\w+(?:\s+\w+){0,2})\s+(?:is|refers to|describes)/i
        ];
        
        // Extract potential concepts from the first sentence
        definitionPatterns.forEach(pattern => {
            const match = firstSentence.match(pattern);
            if (match && match[1] && match[1].length > 3) {
                concepts.push(match[1].trim());
            }
        });
        
        // If no concepts found in first sentence, try to extract from paragraph
        if (concepts.length === 0) {
            // Look for capitalized terms that might be important concepts
            const capitalizedTerms = paragraph.match(/\b[A-Z][a-z]{3,}\b/g);
            if (capitalizedTerms) {
                capitalizedTerms.forEach(term => {
                    if (!concepts.includes(term)) {
                        concepts.push(term);
                    }
                });
            }
            
            // Look for scientific terms with specific endings
            const scientificTerms = paragraph.match(/\b\w+(?:sis|lysis|genesis|tion|ology|cycle|system)\b/gi);
            if (scientificTerms) {
                scientificTerms.forEach(term => {
                    if (!concepts.includes(term)) {
                        concepts.push(term);
                    }
                });
            }
        }
        
        // If still no concepts, get the most frequent nouns
        if (concepts.length === 0) {
            const words = paragraph.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
            const wordCounts = {};
            words.forEach(word => {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
            
            // Get the top 2 most frequent words as potential concepts
            const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
            sortedWords.slice(0, 2).forEach(word => {
                concepts.push(word);
            });
        }
        
        return [...new Set(concepts)]; // Remove duplicates
    }
    
    // Extract key terms from a paragraph
    function extractKeyTerms(paragraph) {
        const terms = [];
        
        // Scientific/academic terms
        const academicTerms = paragraph.match(/\b[a-z]+(?:sis|lysis|genesis|tion|ology|cycle|system|process)\b/gi);
        if (academicTerms) {
            academicTerms.forEach(term => terms.push(term.trim()));
        }
        
        // Look for terms in quotes or parentheses
        const quotedTerms = paragraph.match(/"([^"]+)"/g);
        if (quotedTerms) {
            quotedTerms.forEach(term => terms.push(term.replace(/"/g, '').trim()));
        }
        
        const parenthesisTerms = paragraph.match(/\(([^)]+)\)/g);
        if (parenthesisTerms) {
            parenthesisTerms.forEach(term => terms.push(term.replace(/[()]/g, '').trim()));
        }
        
        // Look for terms with specific prefixes/suffixes
        const specificTerms = paragraph.match(/\b(?:hydr|photo|bio|geo|thermo|electro|chromo|aero|neuro|psycho|socio|eco)\w{4,}\b/gi);
        if (specificTerms) {
            specificTerms.forEach(term => terms.push(term.trim()));
        }
        
        // Extract potential terms after "called", "known as", "termed"
        const namedTerms = paragraph.match(/(?:called|known as|termed|named)\s+(?:the\s+)?(\w+(?:\s+\w+){0,2})/gi);
        if (namedTerms) {
            namedTerms.forEach(match => {
                const term = match.replace(/(?:called|known as|termed|named)\s+(?:the\s+)?/i, '').trim();
                terms.push(term);
            });
        }
        
        // Find definition terms (usually at the start of sentences)
        const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        sentences.forEach(sentence => {
            const match = sentence.trim().match(/^(?:The\s+)?(\w+(?:\s+\w+){0,2})\s+(?:is|are|refers to|describes)/i);
            if (match && match[1]) {
                terms.push(match[1].trim());
            }
        });
        
        // Remove duplicates and filter out short terms
        return [...new Set(terms)].filter(term => term.length > 3);
    }
    
    // Find the definition of a term in a paragraph
    function findDefinition(term, paragraph) {
        // Try to find the sentence containing the term
        const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // First look for explicit definitions
        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(term.toLowerCase()) && 
                (sentence.toLowerCase().includes(" is ") || 
                 sentence.toLowerCase().includes(" are ") ||
                 sentence.toLowerCase().includes(" refers to ") ||
                 sentence.toLowerCase().includes(" defined as "))) {
                return sentence.trim();
            }
        }
        
        // If no explicit definition, return the sentence containing the term
        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(term.toLowerCase())) {
                return sentence.trim();
            }
        }
        
        // If term not found in any sentence, return the first sentence
        return sentences[0].trim();
    }
    
    // Extract key words that would be good candidates for fill-in-the-blank
    function extractKeyWords(sentence) {
        const words = sentence.match(/\b[a-zA-Z]{4,}\b/g) || [];
        
        // Filter out common words
        const commonWords = ['this', 'that', 'these', 'those', 'from', 'with', 'their', 'which', 'where', 'when', 'what', 'have', 'been', 'about', 'through'];
        const filteredWords = words.filter(word => 
            !commonWords.includes(word.toLowerCase()) && 
            word.length > 4 &&
            !/^(?:are|were|have|has|had|the|and|but|for|nor|yet|however|therefore)$/i.test(word)
        );
        
        return filteredWords;
    }
    
    // Generate a "why" question based on the paragraph content
    function generateWhyQuestion(paragraph, concepts) {
        if (concepts.length === 0) return null;
        
        // Look for cause-effect relationships
        if (paragraph.match(/\b(?:cause|causes|caused|because|result|results|resulting|due to|lead|leads|leading)\b/i)) {
            return `Why does ${getRandomItem(concepts)} occur or happen?`;
        }
        
        // Look for importance indicators
        if (paragraph.match(/\b(?:important|significance|crucial|essential|vital|necessary|key)\b/i)) {
            return `Why is ${getRandomItem(concepts)} important?`;
        }
        
        // Generic why question
        return `Why is ${getRandomItem(concepts)} significant in this context?`;
    }
    
    // Generate a "how" question based on the paragraph content
    function generateHowQuestion(paragraph, concepts) {
        if (concepts.length === 0) return null;
        
        // Look for process descriptions
        if (paragraph.match(/\b(?:process|step|steps|stages|procedure|mechanism|method|approach)\b/i)) {
            return `How does ${getRandomItem(concepts)} work or function?`;
        }
        
        // Look for relationship indicators
        if (paragraph.match(/\b(?:related|relationship|connection|linked|associated|interaction|affects|influences)\b/i)) {
            const otherConcept = concepts.length > 1 ? getRandomItem(concepts.filter(c => c !== concepts[0])) : null;
            return otherConcept ? 
                `How does ${concepts[0]} interact with or affect ${otherConcept}?` : 
                `How does ${concepts[0]} interact with its environment?`;
        }
        
        // Generic how question
        return `How can ${getRandomItem(concepts)} be explained?`;
    }
    
    // Generate an application question
    function generateApplicationQuestion(concept) {
        const templates = [
            `How is ${concept} applied in real-world scenarios?`,
            `What are practical applications of ${concept}?`,
            `How might ${concept} be used to solve problems?`,
            `Give an example of ${concept} in action.`
        ];
        
        return getRandomItem(templates);
    }
    
    // Generate a critical thinking question
    function generateCriticalQuestion(concept) {
        const templates = [
            `What would happen if ${concept} didn't exist or stopped functioning?`,
            `How might ${concept} evolve or change in the future?`,
            `What are potential limitations or drawbacks of ${concept}?`,
            `How might you improve or enhance ${concept}?`
        ];
        
        return getRandomItem(templates);
    }
    
    // Get a random item from an array, excluding items in the excludeList
    function getRandomItem(array, excludeList = []) {
        const filteredArray = array.filter(item => !excludeList.includes(item));
        if (filteredArray.length === 0) return null;
        return filteredArray[Math.floor(Math.random() * filteredArray.length)];
    }
    
    // Get a random difficulty level
    function getRandomDifficulty() {
        const weights = [0.3, 0.5, 0.2]; // 30% easy, 50% medium, 20% hard
        const random = Math.random();
        if (random < weights[0]) return 'easy';
        if (random < weights[0] + weights[1]) return 'medium';
        return 'hard';
    }
    
    // Shuffle an array (Fisher-Yates algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Display a card by index
    function displayCard(index) {
        if (filteredCards.length === 0) return;
        
        currentCardIndex = index;
        const card = filteredCards[currentCardIndex];
        
        // Update question and answer content
        questionEl.textContent = card.question;
        answerEl.textContent = card.answer;
        questionTypeEl.textContent = card.type;
        
        // Update card counter
        currentCardEl.textContent = currentCardIndex + 1;
        
        // Update bookmark status
        if (bookmarkedCards.has(card)) {
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            bookmarkBtn.classList.add('active');
        } else {
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            bookmarkBtn.classList.remove('active');
        }
        
        // Update difficulty indicator
        const difficultyIndicator = document.querySelector('.difficulty-indicator');
        difficultyIndicator.className = 'difficulty-indicator ' + card.difficulty;
        
        // Reset card flip
        flashcard.classList.remove('flipped');
        
        // Mark card as viewed
        if (!viewedCards.has(card)) {
            viewedCards.add(card);
            updateStats();
        }
        
        // Update progress
        updateProgress();
    }
    
    // Update progress bar and stats
    function updateProgress() {
        if (filteredCards.length === 0) {
            progressBar.style.width = '0%';
            return;
        }
        
        const progress = ((currentCardIndex + 1) / filteredCards.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Update deck statistics
    function updateStats() {
        viewedCardsStatEl.textContent = viewedCards.size;
        masteredCardsStatEl.textContent = masteredCards.size;
        
        // Calculate viewed percentage for the current filtered set
        const viewedCount = filteredCards.filter(card => viewedCards.has(card)).length;
        const viewedPercentage = filteredCards.length > 0 ? (viewedCount / filteredCards.length) * 100 : 0;
        
        // Update progress bar
        progressBar.style.width = `${viewedPercentage}%`;
    }
    
    // Flip card functionality
    flipBtn.addEventListener('click', function() {
        flashcard.classList.toggle('flipped');
    });
    
    // Navigate to previous card
    prevBtn.addEventListener('click', function() {
        if (currentCardIndex > 0) {
            displayCard(currentCardIndex - 1);
        }
    });
    
    // Navigate to next card
    nextBtn.addEventListener('click', function() {
        if (currentCardIndex < filteredCards.length - 1) {
            displayCard(currentCardIndex + 1);
        } else {
            // Loop back to the first card
            displayCard(0);
        }
    });
    
    // Bookmark current card
    bookmarkBtn.addEventListener('click', function() {
        const currentCard = filteredCards[currentCardIndex];
        
        if (bookmarkedCards.has(currentCard)) {
            bookmarkedCards.delete(currentCard);
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            bookmarkBtn.classList.remove('active');
        } else {
            bookmarkedCards.add(currentCard);
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            bookmarkBtn.classList.add('active');
        }
    });
    
    // Reset for new deck
    newDeckBtn.addEventListener('click', function() {
        flashcardSection.style.display = 'none';
        inputText.value = '';
        flashcards = [];
        filteredCards = [];
        currentCardIndex = 0;
        viewedCards.clear();
        masteredCards.clear();
        bookmarkedCards.clear();
        updateStats();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Save deck (simulated)
    saveBtn.addEventListener('click', function() {
        alert('Deck saved successfully! (This is a demo feature)');
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (flashcardSection.style.display === 'block') {
            switch(e.key) {
                case 'ArrowLeft':
                    prevBtn.click();
                    break;
                case 'ArrowRight':
                    nextBtn.click();
                    break;
                case ' ':  // Space bar
                    flipBtn.click();
                    break;
                case 'b':
                    bookmarkBtn.click();
                    break;
            }
        }
    });
    
    // Enable touch swipe functionality for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;
    
    flashcard.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    flashcard.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left - next card
            nextBtn.click();
        }
        if (touchEndX > touchStartX + 50) {
            // Swipe right - previous card
            prevBtn.click();
        }
        if (Math.abs(touchEndX - touchStartX) < 30) {
            // Tap - flip card
            flipBtn.click();
        }
    }
    
    // Add additional features: Card mastery functionality
    flashcard.addEventListener('dblclick', function() {
        const currentCard = filteredCards[currentCardIndex];
        
        if (masteredCards.has(currentCard)) {
            masteredCards.delete(currentCard);
        } else {
            masteredCards.add(currentCard);
        }
        
        updateStats();
        flashcard.classList.add('pulse');
        setTimeout(() => {
            flashcard.classList.remove('pulse');
        }, 600);
    });
    
    // Add hint functionality
    const hintBtn = document.createElement('button');
    hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint';
    hintBtn.className = 'control-btn';
    document.querySelector('.controls').insertBefore(hintBtn, flipBtn);
    
    hintBtn.addEventListener('click', function() {
        const currentCard = filteredCards[currentCardIndex];
        
        // Generate a hint based on the answer
        let hint = '';
        
        if (currentCard.type === QUESTION_TYPES.DEFINITION) {
            // For definitions, give the first letter and length
            const definition = currentCard.answer;
            hint = `The definition starts with "${definition.charAt(0)}" and is about ${Math.ceil(definition.length / 20)} sentence(s) long.`;
        } else if (currentCard.type === QUESTION_TYPES.FILL_BLANK) {
            // For fill-in-the-blank, give the first letter and length
            const answer = currentCard.answer;
            hint = `The answer starts with "${answer.charAt(0)}" and has ${answer.length} letters.`;
        } else {
            // For other types, extract key terms from the answer
            const keywords = extractKeyTerms(currentCard.answer);
            if (keywords.length > 0) {
                hint = `The answer involves the concept of "${getRandomItem(keywords)}".`;
            } else {
                hint = "Try to recall the main concept discussed in this section.";
            }
            }
        
        // Display the hint
        alert(hint);
    });
    
    // Add shuffle deck functionality
    const shuffleBtn = document.createElement('button');
    shuffleBtn.innerHTML = '<i class="fas fa-random"></i> Shuffle';
    shuffleBtn.className = 'control-btn';
    document.querySelector('.controls').appendChild(shuffleBtn);
    
    shuffleBtn.addEventListener('click', function() {
        if (filteredCards.length > 0) {
            shuffleArray(filteredCards);
            displayCard(0);
            
            // Animation feedback
            flashcardSection.classList.add('shake');
            setTimeout(() => {
                flashcardSection.classList.remove('shake');
            }, 500);
        }
    });
    
    // Add difficulty filter functionality
    const difficultyFilter = document.createElement('div');
    difficultyFilter.className = 'difficulty-filter';
    difficultyFilter.innerHTML = `
        <span>Difficulty: </span>
        <select id="difficulty-select">
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
        </select>
    `;
    
    document.querySelector('.flashcard-options').appendChild(difficultyFilter);
    
    const difficultySelect = document.getElementById('difficulty-select');
    difficultySelect.addEventListener('change', function() {
        const selectedDifficulty = difficultySelect.value;
        
        // Apply difficulty filter
        if (selectedDifficulty === 'all') {
            // Just re-apply current tab filter without difficulty filter
            applyFilters();
        } else {
            // Filter by both tab and difficulty
            const originalFiltered = [...filteredCards];
            filteredCards = originalFiltered.filter(card => card.difficulty === selectedDifficulty);
        }
        
        // Reset to first card if we have cards
        if (filteredCards.length > 0) {
            displayCard(0);
        } else {
            alert('No cards match this difficulty level. Showing all cards.');
            difficultySelect.value = 'all';
            applyFilters();
            if (filteredCards.length > 0) {
                displayCard(0);
            }
        }
        
        // Update totals
        totalCardsEl.textContent = filteredCards.length;
        updateProgress();
    });
    
    // Add study timer functionality
    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer-display';
    timerDisplay.innerHTML = `
        <i class="fas fa-clock"></i> <span id="timer">00:00</span>
        <button id="timer-toggle" class="small-btn"><i class="fas fa-play"></i></button>
    `;
    
    document.querySelector('.flashcard-stats').appendChild(timerDisplay);
    
    const timerEl = document.getElementById('timer');
    const timerToggleBtn = document.getElementById('timer-toggle');
    
    let timerRunning = false;
    let timerInterval;
    let timerSeconds = 0;
    
    timerToggleBtn.addEventListener('click', function() {
        if (timerRunning) {
            // Stop timer
            clearInterval(timerInterval);
            timerRunning = false;
            timerToggleBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            // Start timer
            timerInterval = setInterval(updateTimer, 1000);
            timerRunning = true;
            timerToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });
    
    function updateTimer() {
        timerSeconds++;
        const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
        const seconds = (timerSeconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;
    }
    
    // Add export functionality
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Export';
    exportBtn.className = 'secondary-btn';
    document.querySelector('.deck-actions').appendChild(exportBtn);
    
    exportBtn.addEventListener('click', function() {
        if (flashcards.length === 0) {
            alert('No flashcards to export.');
            return;
        }
        
        // Create export data
        const exportData = {
            date: new Date().toISOString(),
            totalCards: flashcards.length,
            mastered: Array.from(masteredCards).map(card => flashcards.indexOf(card)),
            bookmarked: Array.from(bookmarkedCards).map(card => flashcards.indexOf(card)),
            cards: flashcards.map(card => ({
                question: card.question,
                answer: card.answer,
                type: card.type,
                difficulty: card.difficulty
            }))
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flashcards-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Add import functionality
    const importBtn = document.createElement('button');
    importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import';
    importBtn.className = 'secondary-btn';
    document.querySelector('.deck-actions').insertBefore(importBtn, exportBtn);
    
    importBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validate format
                    if (!importedData.cards || !Array.isArray(importedData.cards)) {
                        throw new Error('Invalid file format');
                    }
                    
                    // Import cards
                    flashcards = importedData.cards.map(card => ({
                        ...card,
                        viewed: false,
                        mastered: false,
                        bookmarked: false
                    }));
                    
                    // Import mastered cards
                    masteredCards.clear();
                    if (importedData.mastered && Array.isArray(importedData.mastered)) {
                        importedData.mastered.forEach(index => {
                            if (flashcards[index]) {
                                masteredCards.add(flashcards[index]);
                            }
                        });
                    }
                    
                    // Import bookmarked cards
                    bookmarkedCards.clear();
                    if (importedData.bookmarked && Array.isArray(importedData.bookmarked)) {
                        importedData.bookmarked.forEach(index => {
                            if (flashcards[index]) {
                                bookmarkedCards.add(flashcards[index]);
                            }
                        });
                    }
                    
                    // Reset viewed cards
                    viewedCards.clear();
                    
                    // Show flashcard section
                    flashcardSection.style.display = 'block';
                    
                    // Apply filters and show first card
                    applyFilters();
                    if (filteredCards.length > 0) {
                        displayCard(0);
                    }
                    
                    // Update stats
                    updateStats();
                    
                    // Scroll to flashcard section
                    flashcardSection.scrollIntoView({ behavior: 'smooth' });
                    
                    alert(`Successfully imported ${flashcards.length} flashcards.`);
                } catch (err) {
                    alert('Error importing flashcards: ' + err.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
    
    // Add print functionality
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '<i class="fas fa-print"></i> Print';
    printBtn.className = 'secondary-btn';
    document.querySelector('.deck-actions').appendChild(printBtn);
    
    printBtn.addEventListener('click', function() {
        if (flashcards.length === 0) {
            alert('No flashcards to print.');
            return;
        }
        
        // Create a printable version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Flashcards</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .card { border: 1px solid #ccc; margin-bottom: 20px; page-break-inside: avoid; }
                    .question { background-color: #f0f0f0; padding: 15px; font-weight: bold; }
                    .answer { padding: 15px; border-top: 1px dashed #ccc; }
                    .card-info { padding: 10px; font-size: 12px; color: #666; border-top: 1px solid #ccc; }
                    @media print {
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
                <h1>Flashcards</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
                <div id="cards-container"></div>
            </body>
            </html>
        `);
        
        const cardsContainer = printWindow.document.getElementById('cards-container');
        
        flashcards.forEach((card, index) => {
            const cardDiv = printWindow.document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.innerHTML = `
                <div class="question">Q: ${card.question}</div>
                <div class="answer">A: ${card.answer}</div>
                <div class="card-info">
                    Type: ${card.type} | 
                    Difficulty: ${card.difficulty} | 
                    Card: ${index + 1}/${flashcards.length}
                </div>
            `;
            cardsContainer.appendChild(cardDiv);
        });
    });
    
    // Init with example if needed
    if (window.location.hash === '#demo') {
        exampleBtn.click();
        setTimeout(() => {
            generateBtn.click();
        }, 500);
    }
});