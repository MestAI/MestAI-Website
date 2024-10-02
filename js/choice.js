document.getElementById('choice').addEventListener('submit', function(event) {
	event.preventDefault();
	const selectedModel = document.getElementById('models').value;
	localStorage.setItem('choice', selectedModel);
	document.getElementById('choice').style.display = 'none';
	document.getElementById('chat-form').style.display = 'flex';
	console.log(`Selected model: ${selectedModel}`);
});

function chatHide() {
    document.getElementById("chat-form").style.display ="none";
}

chatHide();

