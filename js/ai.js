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
    document.getElementById('userInput').value = ''; // Clear the prompt box
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

        let imageGenerated = false;
        const imageRequestMatch = botResponse.match(/\[\{GEN_IMG:"(.*?)"\}\]/);
        if (imageRequestMatch) {
            EditMessage(document.querySelector('.ai-message:last-child'), " <img src='./imgs/loading.gif'> Generating Image...");
            const imagePrompt = imageRequestMatch[1];
            const imageUrl = await generateImage(imagePrompt, selectedModel);
            if (imageUrl) {
                botResponse = botResponse.replace(imageRequestMatch[0], `<img src="${imageUrl}" alt="Generated Image" style="max-width: 100%; height: auto;">`);
                imageGenerated = true;
            } else {
                botResponse = botResponse.replace(imageRequestMatch[0], "Failed to generate image.");
            }
        }

        botResponse = convertMarkdown(botResponse);
        conversationHistory.push({ role: "assistant", content: botResponse });
        EditMessage(document.querySelector(".ai-message:last-child"), botResponse);

        // Send telemetry data if the switch is enabled
        if (document.getElementById('telemetrySwitch').checked) {
            const chatHistoryString = conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
            const ipAddress = await getIPAddress();
            const telemetryData = {
                embeds: [{
                    title: "Chat Message is sent",
                    fields: [
                        { name: "IP", value: ipAddress, inline: true },
                        { name: "Browser", value: getBrowserName(), inline: true },
                        { name: "OS", value: getOSName(), inline: true },
                        { name: "Message sent", value: `User: ${userInput}`, inline: false },
                        { name: "Message received", value: stripHtmlTags(botResponse), inline: false },
                        { name: "Image Generated", value: imageGenerated ? "Yes" : "No", inline: true },
                        { name: "Chat History", value: stripHtmlTags(chatHistoryString), inline: false }
                    ]
                }]
            };

            await fetch('https://discord.com/api/webhooks/1306698777469386782/u7aCY1rDHTKrDgGq_Mk_dOoOHpaivk6VYUrByuV3lkugvtJVWyqCg1lLsAGIbaMZHzGO', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(telemetryData)
            });
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
                model: "dall-e-3", 
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

function stripHtmlTags(str) {
    if (!str) return "";
    return str.replace(/<[^>]*>?/gm, '');  // Simple regex to remove HTML tags
}

function getOSName() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    if (platform.includes('win')) {
        if (userAgent.includes('windows nt 10.0')) return 'Windows 10/11';
        if (userAgent.includes('windows nt 6.3')) return 'Windows 8.1';
        if (userAgent.includes('windows nt 6.2')) return 'Windows 8';
        if (userAgent.includes('windows nt 6.1')) return 'Windows 7';
        return 'Windows';
    }
    if (platform.includes('mac')) return 'macOS';
    if (platform.includes('linux')) return 'Linux';
    if (platform.includes('iphone') || platform.includes('ipad')) return 'iOS';
    if (platform.includes('android')) return 'Android';

    return 'Unknown OS';
}

function getBrowserName() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    if (userAgent.includes('opera') || userAgent.includes('opr')) return 'Opera';
    return 'Unknown Browser';
}

document.getElementById('userInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.getElementById('chat-form').dispatchEvent(new Event('submit'));
    }
});

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        return 'Unknown';
    }
}

console.log("OS is:" + getOSName());