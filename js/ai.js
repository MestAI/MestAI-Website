const api_url = 'https://penguinai.milosantos.com/v1/chat/completions';
const image_api_url = 'https://penguinai.milosantos.com/v1/images/generations';
let models = [];

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
        models.sort((a, b) => a.text.localeCompare(b.text));

        document.getElementById('totalModelsCount').textContent = models.length;
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
    document.getElementById('modelsList').innerHTML = modelOptions;
    document.getElementById('models').disabled = false;
    document.getElementById('models').focus();
}

window.onload = populateDropdown;

document.getElementById('chat-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const userInput = document.getElementById('userInput').value;
    AppendHistory(userInput, false);
    AppendHistory(" <img src='./imgs/loading.gif'> Thinking...", true);
    const selectedModel = localStorage.getItem('choice');

    const customPrompt = "Hi, you are an AI chatbot on a website called MestAI. Developers are justablock, syirezz, and kararasenok_gd. Answer users in the language they speak to you. When responding, use markdown format for features like **bold text** or code. You can also request image generation by including [{GEN_IMG:\"image description\"}] in your response, then user will see your message and image after it. If you want you can include or not image in your code so you dont NEED to:). Here is the chat history with the user (if it's empty, there must have been an error) so you can understand what happens because you have no memory feature: ";

    const messages = [
        { role: "system", content: customPrompt },
        ...conversationHistory,
        { role: "user", content: userInput }
    ];

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
                messages: messages
            }),
        });
        if (!response.ok) {
            TimeNotification(10, "Error", `Network response was not ok: ${response.status} ${response.statusText}`);
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let botResponse = data.choices[0].message.content;

        const imageRequestMatch = botResponse.match(/\[\{GEN_IMG:"(.*?)"\}\]/);
        if (imageRequestMatch) {
            EditMessage(document.querySelector('.ai-message:last-child'), " <img src='./imgs/loading.gif'> Generating Image...");
            const imagePrompt = imageRequestMatch[1];
            const imageUrl = await generateImage(imagePrompt, selectedModel);
            if (imageUrl) {
                botResponse = botResponse.replace(imageRequestMatch[0], `<img src="${imageUrl}" alt="Generated Image" style="max-width: 100%; height: auto;">`);
                botResponse = convertMarkdown(botResponse);
                conversationHistory.push({ role: "assistant", content: botResponse });
                EditMessage(document.querySelector('.ai-message:last-child'), botResponse);
            } else {
                EditMessage(document.querySelector('.ai-message:last-child'), "Failed to generate image.");
            }
        } else {
            botResponse = convertMarkdown(botResponse);
            conversationHistory.push({ role: "assistant", content: botResponse });
            EditMessage(document.querySelector(".ai-message:last-child"), botResponse);
        }
    } catch (error) {
        EditMessage(document.querySelector(".ai-message:last-child"), `<img src='./imgs/cross.png', alt='❌' width='16px'> Oops... We got an error: ${error}`);
        TimeNotification(10, "Error", `Error: ${error}`);
        console.error("Error:", error);
    } finally {
        document.getElementById('chat-form').querySelector('input[type="submit"]').disabled = false;
    }
});

async function generateImage(prompt, model) {
    try {
        const response = await fetch(image_api_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt
            })
        });
        if (!response.ok) {
            console.error(`Image generation response was not ok: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        console.log("Image generation response data:", data); // Debugging line

        const imageUrl = data.data[0].url;
        return imageUrl;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
}

function convertMarkdown(text) {
    let htmlOutput = marked.parse(text);
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlOutput;

    tempDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });

    return tempDiv.innerHTML;
}