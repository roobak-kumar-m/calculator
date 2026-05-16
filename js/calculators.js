(function () {
  const page = document.body.dataset.page || "home";

  function parseNumber(value) {
    const cleaned = String(value ?? "").replace(/,/g, "");
    return Number.parseFloat(cleaned);
  }

  function toMoney(value, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  }

  function toPlain(value, digits = 2) {
    return Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "0.00";
  }

  function setError(id, message) {
    const node = document.getElementById(id);
    if (node) node.textContent = message || "";
  }

  function clearErrors(ids) {
    ids.forEach((id) => setError(id, ""));
  }

  function showResult(node) {
    if (node) node.hidden = false;
  }

  function renderTable(tbody, rows) {
    tbody.innerHTML = rows.join("");
  }

  function initHome() {
    const search = document.getElementById("toolSearch");
    const cards = Array.from(document.querySelectorAll("[data-tool-card]"));
    const emptyState = document.getElementById("noResults");
    if (!search || !cards.length) return;

    const filterCards = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const haystack = `${card.dataset.search || ""} ${card.textContent || ""}`.toLowerCase();
        const match = !query || haystack.includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });

      if (emptyState) emptyState.hidden = visible !== 0;
    };

    search.addEventListener("input", filterCards);
    filterCards();
  }

  function initStickyAd() {
    const stickyAd = document.getElementById("stickyAd");
    if (!stickyAd) return;
    const button = stickyAd.querySelector(".ad-close");
    if (button) {
      button.addEventListener("click", () => {
        stickyAd.style.display = "none";
      });
    }
  }

  function initEmi() {
    const form = document.getElementById("emiForm");
    if (!form) return;
    const output = document.getElementById("emiResult");
    const tableBody = document.getElementById("emiTableBody");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["emiLoanError", "emiRateError", "emiTenureError"]);

      const principal = parseNumber(document.getElementById("emiLoanAmount").value);
      const annualRate = parseNumber(document.getElementById("emiInterestRate").value);
      const tenureMonths = parseNumber(document.getElementById("emiTenure").value);

      let valid = true;
      if (!Number.isFinite(principal) || principal <= 0) {
        setError("emiLoanError", "Enter a loan amount greater than 0.");
        valid = false;
      }
      if (!Number.isFinite(annualRate) || annualRate < 0) {
        setError("emiRateError", "Enter a valid annual interest rate.");
        valid = false;
      }
      if (!Number.isFinite(tenureMonths) || tenureMonths <= 0) {
        setError("emiTenureError", "Enter a loan tenure in months.");
        valid = false;
      }
      if (!valid) return;

      const monthlyRate = annualRate / 100 / 12;
      const emi = monthlyRate === 0 ? principal / tenureMonths : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
      const totalPayable = emi * tenureMonths;
      const totalInterest = totalPayable - principal;

      if (tenureDisplay) {
        tenureDisplay.textContent = `${tenureMonths} months`;
      }

      const rows = [];
      let balance = principal;
      for (let month = 1; month <= tenureMonths; month += 1) {
        const interest = balance * monthlyRate;
        const principalPaid = emi - interest;
        const closingBalance = month === tenureMonths ? 0 : Math.max(0, balance - principalPaid);
        rows.push(
          `<tr><td>${month}</td><td>${toMoney(balance)}</td><td>${toMoney(emi)}</td><td>${toMoney(interest)}</td><td>${toMoney(principalPaid)}</td><td>${toMoney(closingBalance)}</td></tr>`
        );
        balance = closingBalance;
      }

      document.getElementById("emiMonthly").textContent = toMoney(emi);
      document.getElementById("emiTotalPayable").textContent = toMoney(totalPayable);
      document.getElementById("emiTotalInterest").textContent = toMoney(totalInterest);
      renderTable(tableBody, rows);
      document.getElementById('emiTenureDisplay').textContent = tenureMonths + ' months';
      showResult(output);
    });
  }

  function initCompound() {
    const form = document.getElementById("compoundForm");
    if (!form) return;
    const output = document.getElementById("compoundResult");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["compoundPrincipalError", "compoundRateError", "compoundYearsError"]);

      const principal = parseNumber(document.getElementById("compoundPrincipal").value);
      const rate = parseNumber(document.getElementById("compoundRate").value);
      const frequency = Number.parseInt(document.getElementById("compoundFrequency").value, 10);
      const years = parseNumber(document.getElementById("compoundYears").value);

      let valid = true;
      if (!Number.isFinite(principal) || principal <= 0) {
        setError("compoundPrincipalError", "Enter a principal amount greater than 0.");
        valid = false;
      }
      if (!Number.isFinite(rate) || rate < 0) {
        setError("compoundRateError", "Enter a valid annual rate.");
        valid = false;
      }
      if (!Number.isFinite(years) || years <= 0) {
        setError("compoundYearsError", "Enter a positive number of years.");
        valid = false;
      }
      if (!valid) return;

      const amount = principal * Math.pow(1 + rate / 100 / frequency, frequency * years);
      document.getElementById("compoundFinalAmount").textContent = toMoney(amount);
      document.getElementById("compoundInterestEarned").textContent = toMoney(amount - principal);
      showResult(output);
    });
  }

  function initTip() {
    const form = document.getElementById("tipForm");
    const slider = document.getElementById("tipPercent");
    const sliderValue = document.getElementById("tipPercentValue");
    if (!form) return;
    const output = document.getElementById("tipResult");

    if (slider && sliderValue) {
      const updateSlider = () => {
        sliderValue.textContent = `${slider.value}%`;
      };
      slider.addEventListener("input", updateSlider);
      updateSlider();
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["tipBillError", "tipPeopleError"]);

      const bill = parseNumber(document.getElementById("tipBill").value);
      const percent = parseNumber(document.getElementById("tipPercent").value);
      const people = parseNumber(document.getElementById("tipPeople").value);

      let valid = true;
      if (!Number.isFinite(bill) || bill <= 0) {
        setError("tipBillError", "Enter a bill amount greater than 0.");
        valid = false;
      }
      if (!Number.isFinite(people) || people <= 0) {
        setError("tipPeopleError", "Enter at least 1 person.");
        valid = false;
      }
      if (!valid) return;

      const tipAmount = bill * (percent / 100);
      const totalBill = bill + tipAmount;
      const perPerson = totalBill / people;

      document.getElementById("tipAmount").textContent = toMoney(tipAmount);
      document.getElementById("tipTotalBill").textContent = toMoney(totalBill);
      document.getElementById("tipPerPerson").textContent = toMoney(perPerson);
      showResult(output);
    });
  }

  function initDiscount() {
    const form = document.getElementById("discountForm");
    if (!form) return;
    const output = document.getElementById("discountResult");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["discountPriceError", "discountPercentError"]);

      const price = parseNumber(document.getElementById("discountPrice").value);
      const percent = parseNumber(document.getElementById("discountPercent").value);

      let valid = true;
      if (!Number.isFinite(price) || price <= 0) {
        setError("discountPriceError", "Enter an original price greater than 0.");
        valid = false;
      }
      if (!Number.isFinite(percent) || percent < 0) {
        setError("discountPercentError", "Enter a valid discount percentage.");
        valid = false;
      }
      if (!valid) return;

      const discountAmount = price * (percent / 100);
      const finalPrice = price - discountAmount;
      document.getElementById("discountAmount").textContent = toMoney(discountAmount);
      document.getElementById("discountFinalPrice").textContent = toMoney(finalPrice);
      document.getElementById("discountSaved").textContent = toMoney(discountAmount);
      showResult(output);
    });
  }

  function initCurrency() {
    const form = document.getElementById("currencyForm");
    if (!form) return;
    const output = document.getElementById("currencyResult");
    const ratesToUSD = {
      USD: 1,
      EUR: 1.08,
      GBP: 1.27,
      INR: 0.012,
      CAD: 0.74,
      AUD: 0.66,
      JPY: 0.0067,
      CNY: 0.14,
      CHF: 1.12,
      SGD: 0.74,
      NZD: 0.61,
      AED: 0.27,
      HKD: 0.13,
      SEK: 0.094,
      NOK: 0.093,
      DKK: 0.145,
      ZAR: 0.055,
      BRL: 0.19,
      MXN: 0.058,
      KRW: 0.00075,
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["currencyAmountError"]);

      const amount = parseNumber(document.getElementById("currencyAmount").value);
      const from = document.getElementById("currencyFrom").value;
      const to = document.getElementById("currencyTo").value;

      if (!Number.isFinite(amount) || amount <= 0) {
        setError("currencyAmountError", "Enter an amount greater than 0.");
        return;
      }

      const usd = amount * (ratesToUSD[from] || 1);
      const converted = usd / (ratesToUSD[to] || 1);
      document.getElementById("currencyConverted").textContent = `${to} ${toPlain(converted, 2)}`;
      document.getElementById("currencyNote").textContent = "Rates are approximate. For exact rates check your bank.";
      showResult(output);
    });
  }

  function initPercentage() {
    const form = document.getElementById("percentageForm");
    if (!form) return;
    const output = document.getElementById("percentageResult");
    const modeButtons = Array.from(document.querySelectorAll("[data-percentage-mode]"));
    const modeInput = document.getElementById("percentageMode");
    let mode = modeInput ? modeInput.value : "of";

    const syncMode = () => {
      modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.percentageMode === mode));
      if (modeInput) modeInput.value = mode;
    };

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        mode = button.dataset.percentageMode;
        syncMode();
      });
    });
    syncMode();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["percentageXError", "percentageYError"]);

      const x = parseNumber(document.getElementById("percentageX").value);
      const y = parseNumber(document.getElementById("percentageY").value);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        setError("percentageXError", "Enter valid numbers in both fields.");
        return;
      }

      let answer;
      let label;
      if (mode === "of") {
        answer = (x / 100) * y;
        label = `${x}% of ${y}`;
      } else if (mode === "what") {
        if (y === 0) {
          setError("percentageYError", "Y must be greater than 0.");
          return;
        }
        answer = (x / y) * 100;
        label = `${x} is what percent of ${y}`;
      } else {
        if (x === 0) {
          setError("percentageXError", "X must be greater than 0.");
          return;
        }
        answer = ((y - x) / x) * 100;
        label = `Percentage change from ${x} to ${y}`;
      }

      document.getElementById("percentageAnswer").textContent = mode === "change" ? `${toPlain(answer, 2)}%` : toPlain(answer, 2);
      document.getElementById("percentageLabel").textContent = label;
      showResult(output);
    });
  }

  function progressiveTax(income, brackets, deduction = 0) {
    const taxableIncome = Math.max(0, income - deduction);
    let remaining = taxableIncome;
    let lastLimit = 0;
    let tax = 0;
    const rows = [];

    brackets.forEach((bracket) => {
      const upper = bracket.limit;
      const span = upper === Infinity ? remaining : Math.max(0, Math.min(remaining, upper - lastLimit));
      const bracketTax = span * bracket.rate;
      tax += bracketTax;
      rows.push({ label: bracket.label, amount: span, tax: bracketTax, rate: bracket.rate });
      remaining -= span;
      lastLimit = upper;
    });

    return { tax, taxableIncome, rows };
  }

  function initSalaryTax() {
    const form = document.getElementById("taxForm");
    if (!form) return;
    const output = document.getElementById("taxResult");
    const tbody = document.getElementById("taxTableBody");
    const currencyForCountry = { US: "USD", UK: "GBP", India: "INR", Canada: "CAD" };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["taxSalaryError"]);

      const salary = parseNumber(document.getElementById("taxSalary").value);
      const country = document.getElementById("taxCountry").value;
      if (!Number.isFinite(salary) || salary <= 0) {
        setError("taxSalaryError", "Enter a gross salary greater than 0.");
        return;
      }

      const countryConfigs = {
        US: {
          deduction: 14600,
          brackets: [
            { limit: 11600, rate: 0.1, label: "10% to $11,600" },
            { limit: 47150, rate: 0.12, label: "12% to $47,150" },
            { limit: 100525, rate: 0.22, label: "22% to $100,525" },
            { limit: 191950, rate: 0.24, label: "24% to $191,950" },
            { limit: 243725, rate: 0.32, label: "32% to $243,725" },
            { limit: Infinity, rate: 0.35, label: "35% above $243,725" },
          ],
        },
        UK: {
          deduction: 12570,
          brackets: [
            { limit: 37700, rate: 0.2, label: "20% basic rate" },
            { limit: 125140, rate: 0.4, label: "40% higher rate" },
            { limit: Infinity, rate: 0.45, label: "45% additional rate" },
          ],
        },
        India: {
          deduction: 0,
          brackets: [
            { limit: 300000, rate: 0, label: "0% up to ₹3,00,000" },
            { limit: 600000, rate: 0.05, label: "5% to ₹6,00,000" },
            { limit: 900000, rate: 0.1, label: "10% to ₹9,00,000" },
            { limit: 1200000, rate: 0.15, label: "15% to ₹12,00,000" },
            { limit: 1500000, rate: 0.2, label: "20% to ₹15,00,000" },
            { limit: Infinity, rate: 0.3, label: "30% above ₹15,00,000" },
          ],
        },
        Canada: {
          deduction: 15000,
          brackets: [
            { limit: 55867, rate: 0.15, label: "15% to CAD 55,867" },
            { limit: 111733, rate: 0.205, label: "20.5% to CAD 111,733" },
            { limit: 173205, rate: 0.26, label: "26% to CAD 173,205" },
            { limit: 246752, rate: 0.29, label: "29% to CAD 246,752" },
            { limit: Infinity, rate: 0.33, label: "33% above CAD 246,752" },
          ],
        },
      };

      const config = countryConfigs[country];
      const taxData = progressiveTax(salary, config.brackets, config.deduction);
      const takeHome = salary - taxData.tax;

      document.getElementById("taxTakeHome").textContent = toMoney(takeHome, currencyForCountry[country]);
      document.getElementById("taxTotalTax").textContent = toMoney(taxData.tax, currencyForCountry[country]);
      document.getElementById("taxDisclaimer").textContent = "This is an estimate only. Consult a tax professional for accurate figures.";

      renderTable(
        tbody,
        taxData.rows.map((row) => `<tr><td>${row.label}</td><td>${toMoney(row.amount, currencyForCountry[country])}</td><td>${toMoney(row.tax, currencyForCountry[country])}</td></tr>`)
      );
      showResult(output);
    });
  }

  function initRetirement() {
    const form = document.getElementById("retirementForm");
    if (!form) return;
    const output = document.getElementById("retirementResult");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors(["retirementAgeError", "retirementSavingsError"]);

      const currentAge = parseNumber(document.getElementById("retirementCurrentAge").value);
      const retirementAge = parseNumber(document.getElementById("retirementAge").value);
      const savings = parseNumber(document.getElementById("retirementSavings").value);
      const contribution = parseNumber(document.getElementById("retirementContribution").value);
      const returnRate = parseNumber(document.getElementById("retirementReturn").value);

      let valid = true;
      if (!Number.isFinite(currentAge) || !Number.isFinite(retirementAge) || retirementAge <= currentAge) {
        setError("retirementAgeError", "Retirement age must be greater than current age.");
        valid = false;
      }
      if (!Number.isFinite(savings) || savings < 0) {
        setError("retirementSavingsError", "Enter a valid savings amount.");
        valid = false;
      }
      if (!valid) return;

      const months = Math.max(0, (retirementAge - currentAge) * 12);
      const monthlyRate = returnRate / 100 / 12;
      const futureSavings = savings * Math.pow(1 + monthlyRate, months);
      const futureContributions = monthlyRate === 0 ? contribution * months : contribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      const corpus = futureSavings + futureContributions;
      const totalContributed = savings + contribution * months;
      const growth = corpus - totalContributed;

      document.getElementById("retirementCorpus").textContent = toMoney(corpus);
      document.getElementById("retirementContributed").textContent = toMoney(totalContributed);
      document.getElementById("retirementGrowth").textContent = toMoney(growth);
      showResult(output);
    });
  }

  if (page === "home") {
    initHome();
  }

  initStickyAd();
  initEmi();
  initCompound();
  initTip();
  initDiscount();
  initCurrency();
  initPercentage();
  initSalaryTax();
  initRetirement();
})();