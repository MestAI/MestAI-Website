const api_url = 'https://penguinai.milosantos.com/v1/chat/completions';

async function fetchAndGetReqModels() {
    try {
        const response = await fetch(api_url.replace('/chat/completions', '/models'));
        if (!response.ok) {
            console.error(`Network response was not ok: ${response.status} ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        let models = [];
        data.data.forEach(model => {
            if (model.type !== "chat.completions") return;
            models.push({ text: model.id, value: model.id });
        });
        models.sort((a, b) => a.text.localeCompare(b.text));
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

async function checkModelStatus() {
    const models = await fetchAndGetReqModels();
    const statusList = document.getElementById('model-status-list');
    statusList.innerHTML = '';

    for (const model of models) {
        const listItem = document.createElement('li');
        listItem.textContent = model.text;
        statusList.appendChild(listItem);

        try {
            const response = await fetch(api_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model.value,
                    messages: [{ role: "user", content: "hi" }]
                }),
            });

            if (response.ok) {
                listItem.innerHTML += ' &#10004;'; // Unicode for checkmark
            } else {
                listItem.innerHTML += ' ❌'; // Cross emoji
            }
        } catch (error) {
            listItem.innerHTML += ' ❌'; // Cross emoji
        }
    }
}

window.onload = checkModelStatus;