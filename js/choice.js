document.getElementById('choice').addEventListener('submit', function(event) {
	event.preventDefault();
	const selectedModel = document.getElementById('models').value;
	localStorage.setItem('choice', selectedModel);
	document.getElementById('choice').remove();
    document.getElementById('chat-form').style.display = 'flex';
});

function chatHide() {
    document.getElementById("chat-form").style.display = "none";
    }

    document.getElementById('choice').addEventListener('submit', function(event) {
    event.preventDefault();
    const selectedModel = document.getElementById('models').value;
    localStorage.setItem('choice', selectedModel);
    document.getElementById('choice').style.display = 'none'; // Hide the choice form
    document.getElementById('chat-form').style.display = 'block'; // Unhide the chat-form
    });


chatHide(); // Call the chatHide function to initially hide the chat-form