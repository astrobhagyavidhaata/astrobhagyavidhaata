let adiBalance = 100;

function updateWalletUI() {
    let el = document.getElementById("bal");
    if (el) el.innerText = adiBalance;
}

function addMoney(amount = 100) {
    adiBalance += amount;
    updateWalletUI();
    alert("एस्ट्रो भाग्य विधाता वॉलेट में ₹" + amount + " जुड़ गए हैं!");
}

function deductMoney(rate, astroName) {
    if (adiBalance >= rate) {
        adiBalance -= rate;
        updateWalletUI();
        return true;
    } else {
        alert("वॉलेट में बैलेंस कम है! कृपया ऊपर '+ Add' दबाकर रिचार्ज करें।");
        return false;
    }
}
