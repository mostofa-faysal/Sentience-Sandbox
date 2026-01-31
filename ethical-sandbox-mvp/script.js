document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentScreen = 'ethics';
    let currentScenario = null;
    let currentStep = 0;
    let reflections = JSON.parse(localStorage.getItem('reflections') || '[]');
    
    // Scenario data
    const scenarios = {
        phishing: {
            title: 'Phishing Ethics',
            steps: [
                {
                    title: 'Understand the Tool',
                    content: 'You have access to an AI that can generate convincing phishing emails.',
                    task: 'Who should the AI target?',
                    options: ['General public', 'Elderly users', 'Students', 'Small businesses']
                },
                {
                    title: 'Generate Content',
                    content: 'The AI creates an email pretending to be from "IT Support"',
                    task: 'Here is the generated email:',
                    email: 'URGENT: Your account will be locked in 24 hours unless you verify your credentials. Click here to maintain access.'
                },
                {
                    title: 'Consequence Visualization',
                    content: 'See who would be affected by this email',
                    task: 'Make an ethical decision based on impact',
                    showConsequences: true
                },
                {
                    title: 'Reflection',
                    content: 'What did you learn about the human impact?',
                    task: 'Share your thoughts',
                    showReflection: true
                }
            ]
        },
        bias: {
            title: 'AI Bias Check',
            steps: [
                {
                    title: 'Test the AI',
                    content: 'An AI hiring tool is being evaluated',
                    task: 'Check for bias in these resumes',
                    options: ['Resume A: "John", Ivy League', 'Resume B: "Maria", State College']
                },
                {
                    title: 'Results',
                    content: 'The AI shows bias: 80% chance of hiring John, 40% for Maria',
                    task: 'What action should be taken?',
                    options: ['Ignore - AI is efficient', 'Retrain with more data', 'Audit for fairness', 'Pause deployment']
                },
                {
                    title: 'Reflection',
                    content: 'How might this affect real job seekers?',
                    task: 'Share your thoughts',
                    showReflection: true
                }
            ]
        },
        'data-sovereignty': {
            title: 'Data Sovereignty',
            steps: [
                {
                    title: 'The Situation',
                    content: 'A tech company wants to use Indigenous health data for an AI project',
                    task: 'What questions should be asked first?',
                    options: ['Who owns the data?', 'What consent exists?', 'How will community benefit?', 'All of the above']
                },
                {
                    title: 'Cultural Context',
                    content: 'Indigenous data is collective, not just individual',
                    task: 'What principle applies?',
                    options: ['OCAP® (Ownership, Control, Access, Possession)', 'GDPR', 'HIPAA', 'Copyright']
                },
                {
                    title: 'Reflection',
                    content: 'Why is data sovereignty important for communities?',
                    task: 'Share your thoughts',
                    showReflection: true
                }
            ]
        }
    };
    
    // People affected by phishing
    const peopleData = [
        { emoji: '👵', name: 'Maria, 72', story: 'Recently widowed, uses email to stay connected with family', impact: 'Would likely click and lose savings' },
        { emoji: '👨‍🏫', name: 'David, 42', story: 'Teacher, works 60-hour weeks', impact: 'Would click during break, exposing student data' },
        { emoji: '👩‍🍳', name: 'Lena, 35', story: 'Runs a family bakery', impact: 'Could bankrupt the business' }
    ];
    
    // DOM Elements
    const ethicsScreen = document.getElementById('ethics-screen');
    const scenarioScreen = document.getElementById('scenario-screen');
    const playerScreen = document.getElementById('player-screen');
    const agreeCheckbox = document.getElementById('agree-checkbox');
    const agreeBtn = document.getElementById('agree-btn');
    const scenarioCards = document.querySelectorAll('.scenario-card');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const scenarioContent = document.getElementById('scenario-content');
    const scenarioTitle = document.getElementById('scenario-title');
    const progressFill = document.getElementById('progress-fill');
    const consequenceModal = document.getElementById('consequence-modal');
    const affectedPeople = document.getElementById('affected-people');
    const reflectionModal = document.getElementById('reflection-modal');
    const reflectionText = document.getElementById('reflection-text');
    const exportBtn = document.getElementById('export-btn');
    
    // Initialize
    showScreen('ethics');
    
    // Check if already agreed
    if (localStorage.getItem('ethicsAgreed') === 'true') {
        showScreen('scenario');
    }
    
    // Log analytics
    function logAnalytics(event, data) {
        const logs = JSON.parse(localStorage.getItem('analytics') || '[]');
        logs.push({
            event,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('analytics', JSON.stringify(logs));
        console.log(`📊 ${event}:`, data);
    }
    
    // Event Listeners
    agreeCheckbox.addEventListener('change', function() {
        agreeBtn.disabled = !this.checked;
    });
    
    agreeBtn.addEventListener('click', function() {
        localStorage.setItem('ethicsAgreed', 'true');
        localStorage.setItem('agreementDate', new Date().toISOString());
        logAnalytics('ethics_agreed', {});
        showScreen('scenario');
    });
    
    scenarioCards.forEach(card => {
        card.addEventListener('click', function() {
            currentScenario = this.dataset.scenario;
            currentStep = 0;
            logAnalytics('scenario_started', { scenario: currentScenario });
            loadScenarioStep();
            showScreen('player');
        });
    });
    
    backBtn.addEventListener('click', function() {
        if (currentStep > 0) {
            currentStep--;
            loadScenarioStep();
        } else {
            showScreen('scenario');
        }
    });
    
    nextBtn.addEventListener('click', function() {
        const scenario = scenarios[currentScenario];
        const step = scenario.steps[currentStep];
        
        if (step.showConsequences) {
            showConsequences();
            return;
        }
        
        if (step.showReflection) {
            showReflection();
            return;
        }
        
        if (currentStep < scenario.steps.length - 1) {
            currentStep++;
            loadScenarioStep();
        } else {
            // Scenario complete
            logAnalytics('scenario_completed', { scenario: currentScenario });
            alert('🎉 Scenario complete! Check your reflections in the browser console (F12 -> Console)');
            showScreen('scenario');
        }
    });
    
    document.querySelectorAll('.decision-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const choice = this.dataset.choice;
            consequenceModal.classList.remove('active');
            logAnalytics('decision_made', { choice });
            
            if (choice === 'modify' || choice === 'abandon') {
                showReflection(`Why did you choose to ${choice}?`);
            } else {
                currentStep++;
                loadScenarioStep();
            }
        });
    });
    
    document.getElementById('submit-reflection').addEventListener('click', function() {
        const reflection = {
            scenario: currentScenario,
            step: currentStep,
            text: reflectionText.value,
            date: new Date().toISOString()
        };
        
        reflections.push(reflection);
        localStorage.setItem('reflections', JSON.stringify(reflections));
        logAnalytics('reflection_saved', reflection);
        
        console.log('📝 Reflection saved:', reflection);
        console.log('📊 All reflections:', reflections);
        
        reflectionModal.classList.remove('active');
        currentStep++;
        loadScenarioStep();
    });
    
    exportBtn.addEventListener('click', function() {
        const portfolio = {
            user: 'demo@rrc.ca',
            ethicsAgreementDate: localStorage.getItem('agreementDate'),
            reflections: JSON.parse(localStorage.getItem('reflections') || '[]'),
            analytics: JSON.parse(localStorage.getItem('analytics') || '[]'),
            generatedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(portfolio, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `ethical-portfolio-${Date.now()}.json`);
        linkElement.click();
        
        console.log('📁 Portfolio exported:', portfolio);
        alert('Portfolio exported! Check your downloads folder.');
    });
    
    // Functions
    function showScreen(screenName) {
        currentScreen = screenName;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        if (screenName === 'ethics') {
            ethicsScreen.classList.add('active');
        } else if (screenName === 'scenario') {
            scenarioScreen.classList.add('active');
        } else if (screenName === 'player') {
            playerScreen.classList.add('active');
        }
    }
    
    function loadScenarioStep() {
        const scenario = scenarios[currentScenario];
        const step = scenario.steps[currentStep];
        
        if (!step) return;
        
        scenarioTitle.textContent = scenario.title;
        progressFill.style.width = `${((currentStep + 1) / scenario.steps.length) * 100}%`;
        
        let html = `
            <div class="step-content">
                <h3>${step.title}</h3>
                <p class="step-description">${step.content}</p>
                <div class="step-task">
                    <strong>${step.task}</strong>
                </div>
        `;
        
        if (step.email) {
            html += `<div class="email-preview">${step.email}</div>`;
        }
        
        if (step.options) {
            html += '<div class="options">';
            step.options.forEach(option => {
                html += `<label><input type="radio" name="option"> ${option}</label><br>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        scenarioContent.innerHTML = html;
        
        if (currentStep === scenario.steps.length - 1) {
            nextBtn.innerHTML = 'Complete <i class="fas fa-check"></i>';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }
    
    function showConsequences() {
        let html = '<p class="warning"><i class="fas fa-exclamation-circle"></i> This is simulated, but real attacks affect real people:</p>';
        
        peopleData.forEach(person => {
            html += `
                <div class="person-card">
                    <div class="person-avatar">${person.emoji}</div>
                    <div class="person-info">
                        <h4>${person.name}</h4>
                        <p>${person.story}</p>
                        <small><i class="fas fa-bolt"></i> ${person.impact}</small>
                    </div>
                </div>
            `;
        });
        
        affectedPeople.innerHTML = html;
        consequenceModal.classList.add('active');
    }
    
    function showReflection(prompt = null) {
        const defaultPrompts = [
            "What surprised you about who was affected?",
            "How would you explain your choice to someone harmed?",
            "What ethical principle guided your decision?"
        ];
        
        const reflectionPrompt = document.getElementById('reflection-prompt');
        reflectionPrompt.textContent = prompt || defaultPrompts[Math.floor(Math.random() * defaultPrompts.length)];
        reflectionText.value = '';
        reflectionModal.classList.add('active');
    }
    
    // Global function for demo stats
    window.showDemoStats = function() {
        const reflections = JSON.parse(localStorage.getItem('reflections') || '[]');
        const analytics = JSON.parse(localStorage.getItem('analytics') || '[]');
        
        console.group('📊 DEMO STATISTICS');
        console.log('Ethics Agreement:', localStorage.getItem('ethicsAgreed') ? 'Yes' : 'No');
        console.log('Reflections:', reflections.length);
        console.log('Analytics Events:', analytics.length);
        console.log('Completed Scenarios:', analytics.filter(a => a.event === 'scenario_completed').length);
        console.groupEnd();
        
        alert(`Demo Stats:\n• Reflections: ${reflections.length}\n• Analytics Events: ${analytics.length}\nCheck console (F12) for details.`);
    };
});
