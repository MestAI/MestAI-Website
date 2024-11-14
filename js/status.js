const api_url_models = 'https://penguinai.milosantos.com/v1/models';
const api_url_model_status = 'https://penguinai.milosantos.com/v1/api/working?model=';

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

    checkModelStatus(models);
}

async function checkModelStatus(models) {
    let failed = 0;
    let checked = 0;
    let total = models.length;
    const statusText = document.getElementById('model-status-progress');
    let statusTextCopy = "Models Status:\n";

    for (const model of models) {
        const statusCell = document.getElementById(`status-${model.value}`);

        try {
            const response = await fetch(api_url_model_status + model.value);
            const data = await response.text();

            checked++;

            if (data == "True") {
                statusCell.textContent = '✅ Up'; // Checkmark for successful status
                statusTextCopy += `${model.text} >> ✅ Up\n`;
            } else {
                statusCell.textContent = `❌ Down`;
                statusTextCopy += `${model.text} >> ❌ Down\n`;
                failed++;
            }
        } catch (error) {
            statusCell.textContent = `❌ Error: ${error}`;
            statusTextCopy += `${model.text} >> ❌ Error: ${error}\n`;
            failed++;
        }

        let successfulProc = Math.floor((total - failed) / total * 100);
        let failedProc = Math.floor(failed / total * 100);
        let checkedProc = Math.floor(checked / total * 100);
        statusText.textContent = `Total models: ${total} | Checked: ${checked} (${checkedProc}%) | Successful: ${total - failed} (${successfulProc}%) | Failed: ${failed} (${failedProc}%)`;
    }
    statusTextCopy += `\nTotal models: ${total} | Checked: ${checked} | Successful: ${total - failed} | Failed: ${failed}`;
    statusTextCopy += "\nCheck again here: https://mestai.online/status/";

    statusText.innerHTML = `${statusText.innerHTML}<br><br><button onclick="copyText(\`${statusTextCopy}\`)">Copy result</button>`;
}

function copyText(textToCopy) {
    const tempInput = document.createElement('textarea');
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert(`Copied to clipboard:\n\n${textToCopy}`);
}

window.onload = displayModels;
