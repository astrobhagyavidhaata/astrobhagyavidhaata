(() => {
  "use strict";

  const shareButton = document.getElementById("shareAppButton");
  const installButton = document.getElementById("installAppButton");
  let installPrompt = null;
  const appUrl = "https://astrobhagyavidhaata.in/";

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    if (installButton) {
      installButton.textContent = "ऐप इंस्टॉल हो गया";
      installButton.disabled = true;
    }
  });

  shareButton?.addEventListener("click", async () => {
    const shareData = {
      title: "Astro Bhagya Vidhata",
      text: "वैदिक ज्योतिष और जन्म कुंडली के लिए Astro Bhagya Vidhata देखें:",
      url: appUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(appUrl);
        shareButton.textContent = "लिंक कॉपी हो गया";
        setTimeout(() => { shareButton.textContent = "↗ शेयर"; }, 2200);
      } else {
        window.prompt("इस लिंक को कॉपी करके शेयर करें:", appUrl);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(appUrl);
          shareButton.textContent = "लिंक कॉपी हो गया";
          setTimeout(() => { shareButton.textContent = "↗ शेयर"; }, 2200);
        } catch {
          window.prompt("इस लिंक को कॉपी करके शेयर करें:", appUrl);
        }
      }
    }
  });

  installButton?.addEventListener("click", async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === "accepted") installButton.textContent = "इंस्टॉल हो रहा है...";
      installPrompt = null;
      return;
    }
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      installButton.textContent = "ऐप पहले से इंस्टॉल है";
      return;
    }
    window.alert("Chrome में ऊपर ⋮ मेन्यू खोलें और 'ऐप इंस्टॉल करें' या 'होम स्क्रीन पर जोड़ें' चुनें।");
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(error => {
        console.warn("App service worker registration failed:", error);
      });
    });
  }
})();
