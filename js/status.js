const api_url_models = 'https://penguinai.abby.is-a.dev/v1/models';
const api_url_chat_completions = 'https://penguinai.abby.is-a.dev/v1/chat/completions';

async function fetchAndGetReqModels() {
    try {
        const response = await fetch(api_url_models);
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

async function displayModels() {
    const models = await fetchAndGetReqModels();
    const statusTable = document.getElementById('model-status-table');
    const statusText = document.getElementById('model-status-progress');
    statusTable.innerHTML = `
        <tr>
            <th>Model</th>
            <th>Status</th>
        </tr>
    `;

    if (models.length === 0) {
        statusText.textContent = 'No models found.';
        return;
    }

    statusText.textContent = `Total models: ${models.length} | Checking...`;

    models.forEach(model => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = model.text;
        row.appendChild(nameCell);

        const statusCell = document.createElement('td');
        statusCell.id = `status-${model.value}`;
        statusCell.textContent = 'Checking...';
        row.appendChild(statusCell);

        statusTable.appendChild(row);
    });

    checkModelStatusInBatches(models);
}

async function checkModelStatusInBatches(models) {
    const batchSize = 5;
    let failed = 0;
    let checked = 0;
    const total = models.length;
    const statusText = document.getElementById('model-status-progress');
    let statusTextCopy = "Models Status:\n";

    for (let i = 0; i < total; i += batchSize) {
        const batch = models.slice(i, i + batchSize);
        await Promise.all(batch.map(async (model) => {
            const statusCell = document.getElementById(`status-${model.value}`);
            try {
                const response = await fetch(api_url_chat_completions, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: model.value,
                        messages: [{ role: "user", content: "hi" }]
                    }),
                });

                checked++;

                if (response.ok) {
                    statusCell.textContent = '✅ Up'; // Checkmark for successful status
                    statusTextCopy += `${model.text} >> ✅ Up\n`;
                } else {
                    statusCell.textContent = `❌ Down`;
                    statusTextCopy += `${model.text} >> ❌ Down\n`;
                    failed++;
                }
            } catch (error) {
                const errorMessage = error.message || 'Unknown error';
                statusCell.textContent = `❌ Error: ${errorMessage}`;
                statusTextCopy += `${model.text} >> ❌ Error: ${errorMessage}\n`;
                failed++;
            }
        }));

        let successfulProc = Math.round(((total - failed) / total) * 100);
        let failedProc = Math.round((failed / total) * 100);
        let checkedProc = Math.round((checked / total) * 100);
        statusText.textContent = `Total models: ${total} | Checked: ${checked} (${checkedProc}%) | Successful: ${total - failed} (${successfulProc}%) | Failed: ${failed} (${failedProc}%)`;
    }

    statusTextCopy += `\nTotal models: ${total} | Checked: ${checked} | Successful: ${total - failed} | Failed: ${failed}`;
    statusTextCopy += "\nCheck again here: https://mestai.online/status/";

    statusText.innerHTML = `${statusText.innerHTML}<br><br><button onclick="copyText(\`${statusTextCopy}\`)">Copy result</button>`;
}

function copyText(textToCopy) {
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert(`Copied to clipboard:\n\n${textToCopy}`);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

window.onload = displayModels;
