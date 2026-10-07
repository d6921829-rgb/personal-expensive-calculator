const PRICES = {
  add: 2,        // + and -
  mul: 5,        // *, / and %
  decimal: 1,    // surcharge per decimal number
  reveal: 3,     // flat fee to see the answer
  topupAmount: 50,
  topupFee: 5,
};

let balance = 100;
let expression = "";

const $balance = document.getElementById("balance");
const $expr = document.getElementById("expr");
const $result = document.getElementById("result");
const $status = document.getElementById("status");
const $calc = document.querySelector(".calc");

function money(n) {
  return "₹" + n.toFixed(2);
}

function render() {
  $balance.textContent = money(balance);
  $balance.classList.toggle("low", balance < 10);
  $expr.textContent = expression.replace(/\*/g, "×").replace(/\//g, "÷");
}

function say(msg, type = "") {
  $status.textContent = msg;
  $status.className = "status " + type;
}

function cost(expr) {
  let total = PRICES.reveal;
  for (const ch of expr) {
    if ("+-".includes(ch)) total += PRICES.add;
    else if ("*/%".includes(ch)) total += PRICES.mul;
  }
  const decimals = expr.match(/\d*\.\d+|\d+\./g);
  if (decimals) total += decimals.length * PRICES.decimal;
  return total;
}

function calculate() {
  if (!expression) return;
  if (!/^[\d+\-*/%.\s]+$/.test(expression)) {
    say("Invalid expression. No refund.", "error");
    return;
  }

  const fee = cost(expression);
  if (fee > balance) {
    $calc.classList.remove("shake");
    void $calc.offsetWidth; // restart animation
    $calc.classList.add("shake");
    say(`This costs ${money(fee)} and you have ${money(balance)}. Top up.`, "error");
    return;
  }

  let value;
  try {
    // Safe here: input was validated to digits and operators only.
    value = Function(`"use strict"; return (${expression})`)();
  } catch {
    balance -= fee;
    say(`Syntax error. We still charged you ${money(fee)}.`, "error");
    render();
    return;
  }

  if (!Number.isFinite(value)) {
    balance -= fee;
    say(`Math says no. Fee of ${money(fee)} kept.`, "error");
    render();
    return;
  }

  balance -= fee;
  value = Math.round(value * 1e8) / 1e8;
  $result.textContent = value;
  expression = String(value);
  say(`Charged ${money(fee)}. Thanks for your business!`, "good");
  render();
}

function press(key) {
  if (key === "C") {
    expression = "";
    $result.textContent = "0";
    say("Cleared. Clearing is free (for now).");
  } else if (key === "⌫") {
    expression = expression.slice(0, -1);
  } else if (key === "=") {
    calculate();
    return;
  } else {
    expression += key;
  }
  render();
}

document.getElementById("keys").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-key]");
  if (btn) press(btn.dataset.key);
});

document.getElementById("topup").addEventListener("click", () => {
  balance += PRICES.topupAmount - PRICES.topupFee;
  say(`Added ${money(PRICES.topupAmount)}, minus ${money(PRICES.topupFee)} fee.`, "good");
  render();
});

document.addEventListener("keydown", (e) => {
  if (/^[\d+\-*/%.]$/.test(e.key)) press(e.key);
  else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); press("="); }
  else if (e.key === "Backspace") press("⌫");
  else if (e.key === "Escape") press("C");
});

render();