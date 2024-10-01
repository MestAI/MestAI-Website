const api_url = 'https://proxy.mubilop.tech/v1/chat/completions';

let conversationHistory = [];

async function fetchAndGetReqModels() {
    try {
        const response = await fetch(api_url.replace('/chat/completions', '/models'));
        if (!response.ok) {
            TimeNotification(10, "Error", `Network response was not ok: ${response.status} ${response.statusText}`);
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let models = [];
        data.data.forEach(model => {
            if (model.type !== "chat.completions") return;
            models.push({ text: model.id, value: model.id });
        });
        return models;
    } catch (error) {
        TimeNotification(10, "Error", `Error fetching models: ${error}`);
        console.error("Error:", error);
        return [];
    }
}

async function populateDropdown() {
    document.getElementById('models').disabled = true;
    const models = await fetchAndGetReqModels();
    document.getElementById('load-text').remove();
    document.getElementById('modelsForm').style.display = 'flex';
    document.getElementById('load-button').disabled = false;
    document.getElementById('load-button').textContent = 'Load';
    let selectedModel = localStorage.getItem('choice');
    const modelOptions = models.map(model => `<option value="${model.value}" ${selectedModel === model.value ? 'selected' : ''}>${model.text}</option>`).join('');
    document.getElementById('models').innerHTML = modelOptions;
    document.getElementById('models').disabled = false;
}

window.onload = populateDropdown;

document.getElementById('chat-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const userInput = document.getElementById('userInput').value;
    AppendHistory(userInput, false);
    AppendHistory(" <img src='./imgs/loading.gif'> Thinking...", true);
    const selectedModel = localStorage.getItem('choice');
    const messages = [{ role: "user", content: userInput }];
    conversationHistory.push({ role: "user", content: userInput });

	document.getElementById('chat-form').querySelector('input[type="submit"]').disabled = true;

    try {
        const response = await fetch(api_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://gptcall.net/',
                'Referer': 'https://gptcall.net/'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: conversationHistory
            }),
        });
        if (!response.ok) {
            TimeNotification(10, "Error", `Network response was not ok: ${response.status} ${response.statusText}`);
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let botResponse = data.choices[0].message.content;
        botResponse = convertMarkdown(botResponse);
        conversationHistory.push({ role: "assistant", content: botResponse });

        EditMessage(document.querySelector(".ai-message:last-child"), botResponse);
    } catch (error) {
        EditMessage(document.querySelector(".ai-message:last-child"), `<img src='./imgs/cross.png', alt='❌' width='16px'> Oops... We got an error: ${error}`);
        TimeNotification(10, "Error", `Error: ${error}`);
        console.error("Error:", error);
    } finally{
		document.getElementById('chat-form').querySelector('input[type="submit"]').disabled = false;
	}
});

function convertMarkdown(text) {
    let htmlOutput = marked.parse(text);
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlOutput;

    tempDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });

    return tempDiv.innerHTML;
}