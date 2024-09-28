function AppendHistory(message, is_ai = false) {
    const chatHistory = document.querySelector(".chat-history");
    if (!chatHistory) return;
    const newMessage = document.createElement("div");
    if (is_ai) {
        newMessage.classList.add("ai-message");
    } else {
        newMessage.classList.add("user-message");
    }
    const newMessageText = document.createElement("span");
    newMessageText.innerHTML = message;
    newMessage.appendChild(newMessageText);
    chatHistory.append(newMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function EditMessage(element, newText) {
    if (!element || !newText) return;
    element.querySelector("span").innerHTML = newText;
}

