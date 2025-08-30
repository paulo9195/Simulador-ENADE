export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method not allowed' });
    }

    // A chave API é lida das variáveis de ambiente do servidor, de forma segura
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const { examDataForAnalysis, stats } = request.body;

        // Construir o prompt (mesma lógica que você já tinha)
        const userResponses = examDataForAnalysis.questions.map(q => {
            // ... (lógica para formatar as respostas do usuário)
        }).join('\n');
        
        const prompt = `
            Você é um tutor especialista em Psicologia e na prova do ENADE...
            **Resumo do Desempenho:**
            - Prova: ${examDataForAnalysis.examType}
            - Aproveitamento: ${stats.score}%
            **Respostas do Estudante:**
            ${userResponses}
            **Sua Tarefa (retorne em formato HTML):**
            ... (resto do seu prompt detalhado)
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            // ... (configurações de geração)
        };

        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            console.error("Erro da API Gemini:", errorBody);
            throw new Error(`Erro na API: ${geminiResponse.statusText}`);
        }

        const data = await geminiResponse.json();
        const aiContent = data.candidates[0].content.parts[0].text;

        // Retorna a análise para o frontend
        response.status(200).json({ analysis: aiContent });

    } catch (error) {
        console.error("Erro na função analyze-results:", error);
        response.status(500).json({ error: 'Falha ao processar a análise.', details: error.message });
    }
}

