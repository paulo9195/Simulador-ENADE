// --- CONFIGURAÇÃO GLOBAL ---
// IMPORTANTE: Insira sua chave de API do Google Gemini aqui.
// ATENÇÃO: Esta chave ficará visível no código do seu site.
const GEMINI_API_KEY = "AIzaSyBlYYTCQemR5ffOmgE4M2HKsr63Ab6A8AE";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

let questionsData = [];
let currentExam = {};
let userAnswers = {};
let currentQuestionIndex = 0;

// Elementos DOM
const startScreen = document.getElementById("startScreen");
const examSelection = document.getElementById("examSelection");
const startButton = document.getElementById("startButton");
const questionScreen = document.getElementById("questionScreen");
const questionContainer = document.getElementById("questionContainer");
const navigationContainer = document.getElementById("navigationContainer");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const finishButton = document.getElementById("finishButton");
const questionCounter = document.getElementById("questionCounter");
const resultsScreen = document.getElementById("resultsScreen");
const resultsContent = document.getElementById("resultsContent");
const downloadPdfButton = document.getElementById("downloadPdfButton");
const restartButton = document.getElementById("restartButton");
const hintButton = document.getElementById("hintButton");
const hintModal = document.getElementById("hintModal");
const hintClose = document.getElementById("hintClose");
const hintContent = document.getElementById("hintContent");

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener("DOMContentLoaded", async function() {
    await loadQuestions();
    initializeApp();
});

async function loadQuestions() {
    try {
        const response = await fetch("questions.json");
        if (!response.ok) throw new Error("Não foi possível carregar as questões.");
        questionsData = await response.json();
    } catch (error) {
        console.error("Erro fatal:", error);
        document.body.innerHTML = '<p>Erro ao carregar as questões. Tente recarregar a página.</p>';
    }
}

function initializeApp() {
    setupEventListeners();
    startScreen.style.display = 'flex';
    questionScreen.style.display = 'none';
    resultsScreen.style.display = 'none';
}

function setupEventListeners() {
    startButton.addEventListener("click", startExam);
    prevButton.addEventListener("click", () => navigateQuestion(-1));
    nextButton.addEventListener("click", () => navigateQuestion(1));
    finishButton.addEventListener("click", finishExam);
    downloadPdfButton.addEventListener("click", downloadPDF);
    restartButton.addEventListener("click", () => location.reload());
    hintButton.addEventListener("click", getHint);
    hintClose.addEventListener("click", () => hintModal.style.display = "none");
}

function startExam() {
    const selectedExam = examSelection.value;
    currentExam = {
        type: selectedExam,
        questions: questionsData, 
    };
    userAnswers = {};
    currentQuestionIndex = 0;

    startScreen.style.display = 'none';
    resultsScreen.style.display = 'none';
    questionScreen.style.display = 'flex';

    renderQuestion();
}

function renderQuestion() {
    const question = currentExam.questions[currentQuestionIndex];
    let optionsHTML = '';

    if (question.formato === 'múltipla escolha') {
        optionsHTML = question.opcoes.map((opt, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isChecked = userAnswers[question.id] === optionLetter;
            return `
                <div class="option">
                    <input type="radio" id="opt${index}" name="question${currentQuestionIndex}" value="${optionLetter}" ${isChecked ? 'checked' : ''}>
                    <label for="opt${index}"><strong>${optionLetter})</strong> ${opt}</label>
                </div>
            `;
        }).join('');
    } else {
        const savedAnswer = userAnswers[question.id] || '';
        optionsHTML = `
            <div class="discursive-answer">
                <textarea id="discursiveText" placeholder="Digite sua resposta aqui...">${savedAnswer}</textarea>
            </div>
        `;
    }

    questionContainer.innerHTML = `
        <div class="question-header">
            <h3>Questão ${currentQuestionIndex + 1}</h3>
            <p>${question.texto}</p>
        </div>
        <div class="options-container">${optionsHTML}</div>
    `;

    // Adiciona listeners para salvar a resposta automaticamente
    document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`).forEach(input => {
        input.addEventListener('change', (e) => saveAnswer(question.id, e.target.value));
    });
    if (document.getElementById('discursiveText')) {
        document.getElementById('discursiveText').addEventListener('input', (e) => saveAnswer(question.id, e.target.value));
    }

    updateNavigation();
}

function saveAnswer(questionId, answer) {
    userAnswers[questionId] = answer;
}

function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentExam.questions.length) {
        currentQuestionIndex = newIndex;
        renderQuestion();
    }
}

function updateNavigation() {
    questionCounter.textContent = `${currentQuestionIndex + 1} / ${currentExam.questions.length}`;
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.style.display = currentQuestionIndex === currentExam.questions.length - 1 ? 'none' : 'inline-block';
    finishButton.style.display = currentQuestionIndex === currentExam.questions.length - 1 ? 'inline-block' : 'none';
}

function finishExam() {
    if (confirm("Você tem certeza que deseja finalizar o simulado?")) {
        processResultsWithAI();
    }
}

function calculateBasicStats(examData) {
    let correctAnswers = 0;
    const totalObjective = examData.questions.filter(q => q.formato === 'múltipla escolha').length;
    
    examData.questions.forEach(q => {
        if (q.formato === 'múltipla escolha' && userAnswers[q.id] === q.correta) {
            correctAnswers++;
        }
    });

    const score = totalObjective > 0 ? ((correctAnswers / totalObjective) * 100).toFixed(1) : 0;
    return { score, correctAnswers, totalObjective };
}

async function processResultsWithAI() {
    questionScreen.style.display = 'none';
    resultsScreen.style.display = 'flex';
    resultsContent.innerHTML = `
        <div class="loading-analysis">
            <div class="spinner"></div>
            <h3>Analisando seu desempenho...</h3>
            <p>Aguarde, a IA está preparando seu feedback personalizado.</p>
        </div>
    `;

    const examDataForAnalysis = {
        examType: currentExam.type,
        questions: currentExam.questions.map(q => ({
            ...q,
            userAnswer: userAnswers[q.id] || "Não respondida"
        }))
    };
    const stats = calculateBasicStats(examDataForAnalysis);

    const userResponses = examDataForAnalysis.questions.map(q => {
        return `Questão: "${q.texto}"\nResposta do Aluno: ${q.userAnswer}\n`;
    }).join('\n');
    
    const prompt = `
        Você é um tutor especialista em Psicologia e na prova do ENADE. Sua tarefa é analisar o desempenho de um estudante em um simulado e fornecer um feedback construtivo e detalhado em formato HTML.

        **Resumo do Desempenho:**
        - Prova: ${examDataForAnalysis.examType}
        - Aproveitamento (Questões Objetivas): ${stats.score}% (${stats.correctAnswers} de ${stats.totalObjective})
        - Total de Questões: ${examDataForAnalysis.questions.length}

        **Respostas do Estudante:**
        ${userResponses}

        **Sua Tarefa (retorne APENAS o código HTML):**
        1.  **Crie um Título Principal:** Use \`<h2>Análise de Desempenho - Psicologia ENADE</h2>\`.
        2.  **Faça uma Análise Geral:** Em um parágrafo \`<p>\`, comente o desempenho geral do aluno. Seja encorajador, mas realista. Destaque pontos fortes e áreas que precisam de mais atenção com base nas respostas.
        3.  **Crie a Seção "Pontos Fortes":** Use \`<h3>🧠 Pontos Fortes</h3>\`. Em uma lista \`<ul>\`, identifique 2 ou 3 temas ou tipos de questão onde o aluno demonstrou bom conhecimento (mesmo que a resposta não esteja 100% correta, mas o raciocínio foi bom). Use \`<strong>\` para destacar os temas.
        4.  **Crie a Seção "Áreas para Melhorar":** Use \`<h3>📚 Áreas para Melhorar</h3>\`. Em uma lista \`<ul>\`, identifique 2 ou 3 temas onde o aluno errou ou mostrou dificuldade. Seja específico. Por exemplo, em vez de "Ética", diga "Aplicação do código de ética em situações de risco".
        5.  **Crie um Plano de Estudos Sugerido:** Use \`<h3>🚀 Plano de Estudos Sugerido</h3>\`. Crie uma tabela \`<table>\` com duas colunas: "Tópico" e "Sugestão de Estudo". Sugira 3 tópicos específicos baseados nas dificuldades do aluno. As sugestões devem ser práticas (ex: "Revisar a RAPS e seus componentes", "Praticar questões de psicometria sobre validade e fidedignidade").
        6.  **Adicione uma Mensagem Final Motivacional:** Termine com um parágrafo \`<p class="motivacional">\` encorajador.

        **IMPORTANTE:** O resultado deve ser apenas o código HTML, sem markdown, ```html ou qualquer outra coisa.
    `;

    try {
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Falha ao obter análise da IA.");
        }

        const data = await response.json();
        const aiAnalysis = data.candidates[0].content.parts[0].text;
        displayResults(stats, aiAnalysis);
    } catch (error) {
        console.error("Erro ao processar resultados:", error);
        displayErrorResults(error);
    }
}

function displayResults(stats, aiAnalysis) {
    const resultsHTML = `
        <div class="results-summary">
            <h2>Seu Desempenho</h2>
            <div class="score-circle">
                <span>${stats.score}%</span>
                <small>de acerto</small>
            </div>
            <p>Você acertou <strong>${stats.correctAnswers}</strong> de <strong>${stats.totalObjective}</strong> questões objetivas.</p>
        </div>
        <div class="ai-feedback">${aiAnalysis}</div>
    `;
    resultsContent.innerHTML = resultsHTML;
}

function displayErrorResults(error) {
    resultsContent.innerHTML = `
        <div class="error-analysis">
            <h3>😕 Ops! Ocorreu um erro</h3>
            <p>Não foi possível gerar a análise da IA no momento. Verifique sua conexão ou a chave de API no código.</p>
            <p><small>Detalhe do erro: ${error.message}</small></p>
        </div>
    `;
}

async function getHint() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "SUA_CHAVE_API_VAI_AQUI") {
        alert("Por favor, insira sua chave de API no arquivo script.js para usar esta funcionalidade.");
        return;
    }

    const currentQuestion = currentExam.questions[currentQuestionIndex];
    hintModal.style.display = 'flex';
    hintContent.innerHTML = `<div class="spinner"></div><p>Analisando a questão para gerar sua dica...</p>`;

    const prompt = `
        Você é um tutor de Psicologia para o exame ENADE. Sua função é dar uma dica construtiva sobre a questão abaixo, SEM NUNCA REVELAR A RESPOSTA CORRETA ou invalidar as outras opções diretamente.

        Sua dica deve:
        1.  Contextualizar o tema principal da questão.
        2.  Apontar para os conceitos teóricos ou éticos chave que o aluno precisa lembrar para resolver a questão.
        3.  Fazer uma pergunta reflexiva que guie o raciocínio do aluno na direção certa.
        4.  NÃO diga "A resposta correta é...", "A opção X está errada porque..." ou qualquer coisa similar. Apenas forneça contexto e orientação.

        **Questão para análise:**
        "${currentQuestion.texto}"

        Formate sua resposta em HTML simples, usando parágrafos <p> e negrito <strong> para destacar conceitos importantes.
    `;

    try {
        const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } };
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Falha na comunicação com a API Gemini.');
        
        const data = await response.json();
        const hint = data.candidates[0].content.parts[0].text;
        hintContent.innerHTML = hint;

    } catch (error) {
        hintContent.innerHTML = `<p style="color: red;">Desculpe, não foi possível gerar a dica no momento. Tente novamente.</p>`;
        console.error("Erro ao buscar dica:", error);
    }
}

function downloadPDF() {
    const element = resultsContent;
    if (!element || element.children.length === 0) {
        alert('Nenhum resultado disponível para download.');
        return;
    }
    
    const opt = {
      margin:       1,
      filename:     `relatorio-enade-psi-${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}

