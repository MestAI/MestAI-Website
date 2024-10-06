const api_url = 'https://proxy.mubilop.tech/v1/chat/completions';
let models = [];
let conversationHistory = [];

async function fetchAndGetReqModels() {
    try {
        const response = await fetch(api_url.replace('/chat/completions', '/models'));
        if (!response.ok) {
            TimeNotification(10, i18next.t('error'), i18next.t('network_not_ok', { status: response.status, statusText: response.statusText }));
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        models = data.data.filter(model => model.type === "chat.completions").map(model => ({
            text: model.id,
            value: model.id
        }));

        models.sort((a, b) => a.text.localeCompare(b.text));
        const totalModelsCountElement = document.getElementById('totalModelsCount');
        if (totalModelsCountElement) {
            totalModelsCountElement.textContent = models.length;
        } else {
            console.error('Error: #totalModelsCount element not found');
        }
        return models;
    } catch (error) {
        TimeNotification(10, i18next.t('error'), i18next.t('fetch_error', { error: error.message }));
        console.error("Error:", error);
        return [];
    }
}

async function populateDropdown() {
    try {
        document.getElementById('models').disabled = true;
        const models = await fetchAndGetReqModels();
        document.getElementById('load-text').remove();
        if (models.length === 0) {
            throw new Error(i18next.t('no_models'));
        }
        document.getElementById('modelsForm').style.display = 'flex';
        document.getElementById('load-button').disabled = false;
        document.getElementById('load-button').textContent = i18next.t('confirm');

        let selectedModel = localStorage.getItem('choice');
        const modelOptions = models.map(model => 
            `<option value="${model.value}" ${selectedModel === model.value ? 'selected' : ''}>${model.text}</option>`
        ).join('');

        document.getElementById('modelsList').innerHTML = modelOptions;
        document.getElementById('models').disabled = false;
        document.getElementById('models').focus();
    } catch (error) {
        console.error("Error in populateDropdown:", error);
        TimeNotification(10, i18next.t('error'), error.message);
    }
}

window.onload = populateDropdown;

document.getElementById('chat-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const userInput = document.getElementById('userInput').value;
    AppendHistory(userInput, false);
    AppendHistory(` <img src='./imgs/loading.gif'> ${i18next.t('thinking')}`, true);
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
            TimeNotification(10, i18next.t('error'), i18next.t('network_not_ok', { status: response.status, statusText: response.statusText }));
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let botResponse = data.choices[0].message.content;
        botResponse = convertMarkdown(botResponse);
        conversationHistory.push({ role: "assistant", content: botResponse });

        EditMessage(document.querySelector(".ai-message:last-child"), botResponse);
    } catch (error) {
        EditMessage(document.querySelector(".ai-message:last-child"), `<img src='./imgs/cross.png', alt='❌' width='16px'> ${i18next.t('error_occurred', { error: error.message })}`);
        TimeNotification(10, i18next.t('error'), i18next.t('error_occurred', { error: error.message }));
        console.error("Error:", error);
    } finally {
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
