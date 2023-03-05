function sendMessageToAndroid(text) {
    try {
        Android.showToast(text);
    } catch (e) {
    }
}
