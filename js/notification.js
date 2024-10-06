async function TimeNotification(time, title, body) {
    console.log("Running TimeNotification");
    const notifications = document.getElementById("notifications");
    if (!notifications) {
        console.log("No notifications element");
        return;
    }
    var notificationDiv = document.createElement("div");
    notificationDiv.className = "notification";
    notificationDiv.innerText = `${i18next.t(title)}\n${i18next.t(body)}`;
    notifications.appendChild(notificationDiv);
    console.log("Added notification");
    setTimeout(() => {
        notificationDiv.remove();
        console.log("Removed notification");
    }, time * 1000);
    console.log("Timeout set");
}
