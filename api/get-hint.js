export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method not allowed' });
    }
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const { questionText } = request.body;

        if (!questionText) {
            return response.status(400).json({ error: 'Texto da questão é obrigatório.' });
        }

        const prompt = `
            Você é um tutor de Psicologia para o exame ENADE. Sua função é dar uma dica construtiva sobre a questão abaixo, SEM NUNCA REVELAR A RESPOSTA CORRETA ou invalidar as outras opções diretamente.

            Sua dica deve:
            1.  Contextualizar o tema principal da questão.
            2.  Apontar para os conceitos teóricos ou éticos chave que o aluno precisa lembrar para resolver a questão.
            3.  Fazer uma pergunta reflexiva que guie o raciocínio do aluno na direção certa.
            4.  NÃO diga "A resposta correta é...", "A opção X está errada porque..." ou qualquer coisa similar. Apenas forneça contexto e orientação.

            **Questão para análise:**
            "${questionText}"

            Formate sua resposta em HTML simples, usando parágrafos <p> e negrito <strong> para destacar conceitos importantes.
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4 },
        };

        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) throw new Error('Falha na comunicação com a API Gemini.');
        
        const data = await geminiResponse.json();
        const hint = data.candidates[0].content.parts[0].text;

        response.status(200).json({ hint });

    } catch (error) {
        console.error("Erro na função get-hint:", error);
        response.status(500).json({ error: 'Não foi possível gerar a dica.' });
    }
}

