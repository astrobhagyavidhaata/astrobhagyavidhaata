
/*
 * Astro Bhagya Vidhata — Secure Wallet
 * ₹5 प्रति मिनट
 * असली बैलेंस केवल सर्वर नियंत्रित करेगा।
 */

(() => {
  "use strict";

  const API = {
    wallet: "/api/wallet",
    recharge: "/api/payments/create-order",
    start: "/api/consultations/start",
    heartbeat: "/api/consultations/heartbeat",
    stop: "/api/consultations/stop"
  };

  const RATE = 5;
  let consultationId = null;
  let timer = null;
  let busy = false;

  const $ = id => document.getElementById(id);

  function message(text, error = false) {
    const box = $("walletMessage") || $("message");
    if (!box) return;

    box.textContent = text;
    box.style.display = "block";
    box.style.color = error ? "#ffb4ab" : "#f5d994";
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? {
          "Content-Type": "application/json"
        } : {}),
        ...(options.headers || {})
      }
    });

    let data = {};

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data.message || "सर्वर से संपर्क नहीं हो पाया।"
      );
    }

    return data;
  }

  function updateWallet(wallet) {
    if (!wallet || typeof wallet.balancePaise !== "number") {
      return;
    }

    const balance = (wallet.balancePaise / 100).toFixed(2);

    const element = $("bal");

    if (element) {
      element.textContent = balance;
    }

    document.querySelectorAll("[data-wallet-balance]")
      .forEach(el => {
        el.textContent = "₹" + balance;
      });

    document.dispatchEvent(
      new CustomEvent("astro:wallet-updated", {
        detail: wallet
      })
    );
  }

  async function loadWallet() {
    try {
      const data = await request(API.wallet);

      if (!data.wallet) {
        throw new Error("वॉलेट जानकारी उपलब्ध नहीं है।");
      }

      updateWallet(data.wallet);

      return data.wallet;

    } catch (error) {
      message(
        "वॉलेट सर्वर तैयार नहीं है: " + error.message,
        true
      );

      throw error;
    }
  }

  async function addMoney(amount = 100) {
    const rupees = Number(amount);

    if (
      !Number.isFinite(rupees) ||
      rupees < 10 ||
      rupees > 50000
    ) {
      message("रिचार्ज ₹10 से ₹50,000 के बीच होना चाहिए।", true);
      return false;
    }

    try {
      const order = await request(API.recharge, {
        method: "POST",
        body: JSON.stringify({
          amountPaise: Math.round(rupees * 100)
        })
      });

      if (!order.checkoutUrl) {
        throw new Error("भुगतान लिंक नहीं मिला।");
      }

      // Payment credit only after verified payment webhook.
      window.location.assign(order.checkoutUrl);

      return true;

    } catch (error) {
      message(error.message, true);
      return false;
    }
  }

  async function startConsultation(astrologerId) {
    if (consultationId || busy) {
      message("एक परामर्श पहले से चल रहा है।", true);
      return false;
    }

    busy = true;

    try {
      const data = await request(API.start, {
        method: "POST",
        body: JSON.stringify({
          astrologerId: astrologerId || null,
          ratePaisePerMinute: RATE * 100
        })
      });

      if (!data.consultation?.id) {
        throw new Error("परामर्श शुरू नहीं हो पाया।");
      }

      consultationId = data.consultation.id;

      timer = window.setInterval(heartbeat, 15000);

      message("परामर्श शुरू हो गया। शुल्क ₹5 प्रति मिनट।");

      document.dispatchEvent(
        new CustomEvent("astro:consultation-started", {
          detail: data.consultation
        })
      );

      return true;

    } catch (error) {
      message(error.message, true);
      return false;

    } finally {
      busy = false;
    }
  }

  async function heartbeat() {
    if (!consultationId || busy) return;

    busy = true;

    try {
      const data = await request(API.heartbeat, {
        method: "POST",
        body: JSON.stringify({
          consultationId
        })
      });

      if (data.wallet) {
        updateWallet(data.wallet);
      }

      if (data.consultation?.status === "stopped") {
        clearTimer();
        consultationId = null;
        message("परामर्श सत्र समाप्त हो गया।");
      }

    } catch (error) {
      message(
        "बिलिंग सर्वर से संपर्क टूट गया। सर्वर पुष्टि आवश्यक है।",
        true
      );

    } finally {
      busy = false;
    }
  }

  function clearTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  async function stopConsultation() {
    if (!consultationId) return true;

    const id = consultationId;

    clearTimer();
    consultationId = null;

    try {
      const data = await request(API.stop, {
        method: "POST",
        body: JSON.stringify({
          consultationId: id
        })
      });

      if (data.wallet) updateWallet(data.wallet);

      message("परामर्श समाप्त हो गया।");

      document.dispatchEvent(
        new CustomEvent("astro:consultation-stopped", {
          detail: data.consultation || { id }
        })
      );

      return true;

    } catch (error) {
      consultationId = id;
      message(error.message, true);
      return false;
    }
  }

  // पुराने client-side नकली deduction को बंद रखा गया है।
  function deductMoney() {
    message(
      "सुरक्षित बिलिंग के लिए सर्वर से परामर्श शुरू करें।",
      true
    );
    return false;
  }

  window.AstroWallet = Object.freeze({
    ratePerMinute: RATE,
    loadWallet,
    addMoney,
    startConsultation,
    stopConsultation,
    deductMoney
  });

  window.addMoney = addMoney;
  window.deductMoney = deductMoney;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadWallet().catch(() => {});
    }, { once: true });
  } else {
    loadWallet().catch(() => {});
  }

})();
