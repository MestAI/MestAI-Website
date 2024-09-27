const api_url = 'https://reverse.mubi.tech/v1/chat/completions'; 
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
	document.getElementById('load-button').disabled = true;
	document.getElementById('load-button').textContent = 'Loading...';
	const models = await fetchAndGetReqModels();
	document.getElementById('load-button').disabled = false;
	document.getElementById('load-button').textContent = 'Load';
	let selectedModel = localStorage.getItem('choice');
	const modelOptions = models.map(model => `<option value="${model.value}" ${selectedModel === model.value ? 'selected' : ''}>${model.text}</option>`).join('');
	document.getElementById('models').innerHTML = modelOptions;
	document.getElementById('models').disabled = false;
}

window.onload = populateDropdown;
document.getElementById('chat-form').addEventListener('submit', async function(event) {
	event.preventDefault();
	document.getElementById('result-bot').textContent = 'Waiting for response...';
	const userInput = document.getElementById('userInput').value;
	const selectedModel = localStorage.getItem('choice');
	const messages = [{ role: "user", content: userInput }];
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
		const botResponse = data.choices[0].message.content;
		document.getElementById('result-bot').textContent = botResponse;
	} catch (error) {
		TimeNotification(10, "Error", `Error: ${error}`);
		console.error("Error:", error);
	}
});

