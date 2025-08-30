// --- CONFIGURAÇÃO GLOBAL ---
// A chave da API FOI REMOVIDA DAQUI. As chamadas serão para o nosso próprio backend.

let questionsData = []; // Irá armazenar as questões carregadas do JSON

// --- LÓGICA DO SIMULADOR (MODIFICADA) ---
// ... (toda a sua lógica de `currentExam`, `userAnswers`, etc., continua aqui) ...

// Elementos DOM (Adicionar os novos elementos da dica)
const hintButton = document.getElementById("hintButton");
const hintModal = document.getElementById("hintModal");
const hintClose = document.getElementById("hintClose");
const hintContent = document.getElementById("hintContent");

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener("DOMContentLoaded", async function() {
    await loadQuestions(); // Carrega as questões do JSON primeiro
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
    // ... o resto da sua função initializeApp ...
}

function setupEventListeners() {
    // ... (todos os seus event listeners originais) ...
    
    // Novos listeners para o Modo Dica
    hintButton.addEventListener("click", getHint);
    hintClose.addEventListener("click", () => hintModal.style.display = "none");
}

// ... (toda a sua lógica de startExam, renderQuestion, etc. continua aqui) ...

// --- FUNÇÃO MODIFICADA PARA PROCESSAR RESULTADOS ---
async function processResultsWithAI() {
    // ... (lógica para mostrar a mensagem de carregamento) ...

    try {
        const examDataForAnalysis = { /* ... */ };
        const stats = calculateBasicStats(examDataForAnalysis);
        
        // **CHAMADA SEGURA PARA O NOSSO BACKEND**
        const response = await fetch("/api/analyze-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ examDataForAnalysis, stats }),
        });

        if (!response.ok) {
            throw new Error("Falha ao obter análise do servidor.");
        }

        const data = await response.json();
        const aiAnalysis = data.analysis.replace(/```html/g, '').replace(/```/g, ''); // Limpa a resposta

        displayResults(stats, aiAnalysis);
        
    } catch (error) {
        console.error("Erro ao processar resultados:", error);
        displayErrorResults(error);
    }
}

// --- NOVAS FUNÇÕES PARA O MODO DICA ---
async function getHint() {
    const currentQuestion = currentExam.questions[currentQuestionIndex];
    
    hintModal.style.display = 'flex';
    hintContent.innerHTML = `<div class="spinner"></div><p>Analisando a questão para gerar sua dica...</p>`;

    try {
        const response = await fetch('/api/get-hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionText: currentQuestion.text })
        });

        if (!response.ok) {
            throw new Error('O servidor não conseguiu gerar uma dica.');
        }

        const data = await response.json();
        hintContent.innerHTML = data.hint;

    } catch (error) {
        hintContent.innerHTML = `<p style="color: var(--error-color);">Desculpe, não foi possível gerar uma dica no momento. Tente novamente.</p>`;
        console.error("Erro ao buscar dica:", error);
    }
}


// --- FUNÇÃO MODIFICADA PARA DOWNLOAD DE PDF ---
function downloadPDF() {
    const resultsContent = document.getElementById('resultsContent');
    if (!resultsContent || resultsContent.style.display === 'none') {
        alert('⚠️ Nenhum resultado disponível para download.');
        return;
    }

    const element = resultsContent; // O elemento que queremos converter
    const opt = {
      margin:       1,
      filename:     `relatorio-enade-psi-${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Gera o PDF diretamente
    html2pdf().set(opt).from(element).save();
}

// ... (o resto do seu código JavaScript) ...

