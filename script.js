document.addEventListener("DOMContentLoaded", () => {

  const steps = Array.from(document.querySelectorAll(".planner-step"));
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const stepLabel = document.getElementById("stepLabel");
  const progressBar = document.getElementById("progressBar");

  let currentStep = 1;

  const number = (id) => {
    const el = document.getElementById(id);
    return el ? Number(el.value) || 0 : 0;
  };

  const money = (value) =>
    "HK$ " + Math.round(value || 0).toLocaleString("en-HK");

  const percentage = (id) => number(id) / 100;


  /* =========================
     基本退休資料
  ========================== */

  function getBasicData() {

    const currentAge = number("currentAge");
    const retirementAge = number("retirementAge");
    const lifeExpectancy = number("lifeExpectancy");

    const inflation = percentage("inflationRate");

    const yearsToRetire =
      Math.max(retirementAge - currentAge, 0);

    const retirementYears =
      Math.max(lifeExpectancy - retirementAge, 0);

    return {
      currentAge,
      retirementAge,
      lifeExpectancy,
      inflation,
      yearsToRetire,
      retirementYears
    };
  }


  /* =========================
     退休第一年生活費
  ========================== */

  function calculateSuggestedExpense() {

    const {
      yearsToRetire,
      inflation
    } = getBasicData();

    const todayExpense = number("todayExpense");

    const suggested =
      todayExpense *
      Math.pow(1 + inflation, yearsToRetire);

    const output =
      document.getElementById("suggestedExpense");

    if (output) {
      output.textContent =
        todayExpense > 0
          ? money(suggested) + " / 月"
          : "HK$ —";
    }

    return suggested;
  }


  function getRetirementMonthlyExpense() {

    const accepted = number("acceptedExpense");

    if (accepted > 0) {
      return accepted;
    }

    return calculateSuggestedExpense();
  }


  /* =========================
     退休總支出
  ========================== */

  function calculateRetirementExpenses() {

    const {
      retirementYears,
      inflation
    } = getBasicData();

    const firstMonthlyExpense =
      getRetirementMonthlyExpense();

    let totalExpense = 0;
    const rows = [];

    for (let year = 0; year < retirementYears; year++) {

      const monthlyExpense =
        firstMonthlyExpense *
        Math.pow(1 + inflation, year);

      const annualExpense =
        monthlyExpense * 12;

      totalExpense += annualExpense;

      rows.push({
        year: year + 1,
        monthlyExpense,
        annualExpense
      });
    }

    return {
      firstMonthlyExpense,
      totalExpense,
      rows
    };
  }


  /* =========================
     一般資產退休時價值
  ========================== */

  function compoundValue(
    balance,
    annualRate,
    years
  ) {

    return balance *
      Math.pow(1 + annualRate, years);
  }


  function calculateAssets() {

    const { yearsToRetire } =
      getBasicData();

    const cash =
      compoundValue(
        number("cashBalance"),
        percentage("cashReturn"),
        yearsToRetire
      );

    const fixed =
      compoundValue(
        number("fixedBalance"),
        percentage("fixedReturn"),
        yearsToRetire
      );

    const insurance =
      compoundValue(
        number("insuranceBalance"),
        percentage("insuranceReturn"),
        yearsToRetire
      );

    const investment =
      compoundValue(
        number("investmentBalance"),
        percentage("investmentReturn"),
        yearsToRetire
      );

    return {
      cash,
      fixed,
      insurance,
      investment,
      total:
        cash +
        fixed +
        insurance +
        investment
    };
  }


  /* =========================
     MPF
  ========================== */

  function calculateMPF() {

    const { yearsToRetire } =
      getBasicData();

    const balance =
      number("mpfBalance");

    const monthly =
      number("mpfMonthly");

    const annualRate =
      percentage("mpfReturn");

    const months =
      yearsToRetire * 12;

    const monthlyRate =
      annualRate / 12;

    const futureBalance =
      balance *
      Math.pow(1 + annualRate, yearsToRetire);

    let futureContribution = 0;

    if (months > 0) {

      if (monthlyRate > 0) {

        futureContribution =
          monthly *
          (
            (
              Math.pow(
                1 + monthlyRate,
                months
              ) - 1
            ) / monthlyRate
          );

      } else {

        futureContribution =
          monthly * months;
      }
    }

    const total =
      futureBalance +
      futureContribution;

    const output =
      document.getElementById("futureMPF");

    if (output) {
      output.textContent = money(total);
    }

    return total;
  }


  /* =========================
     固定退休收入
  ========================== */

  function calculateRetirementIncome() {

    const {
      retirementYears
    } = getBasicData();

    const monthlyIncome =
      number("governmentSupport") +
      number("familySupport") +
      number("rentalIncome") +
      number("hkAnnuity") +
      number("reverseMortgage") +
      number("otherIncome");

    const totalIncome =
      monthlyIncome *
      12 *
      retirementYears;

    return {
      monthlyIncome,
      totalIncome
    };
  }


  /* =========================
     退休缺口
  ========================== */

  function calculateGap() {

    const expense =
      calculateRetirementExpenses();

    const assets =
      calculateAssets();

    const mpf =
      calculateMPF();

    const income =
      calculateRetirementIncome();

    const totalAssets =
      assets.total + mpf;

    const gap =
      expense.totalExpense -
      totalAssets -
      income.totalIncome;

    return {
      expense,
      assets,
      mpf,
      income,
      totalAssets,
      gap
    };
  }


  /* =========================
     Step 2 支出顯示
  ========================== */

  function updateExpenseSummary() {

    const container =
      document.getElementById("expenseSummary");

    if (!container) return;

    const {
      firstMonthlyExpense,
      totalExpense,
      rows
    } = calculateRetirementExpenses();

    if (!firstMonthlyExpense) {

      container.innerHTML =
        "<p>請先完成第一步的退休生活費設定。</p>";

      return;
    }

    let html = `
      <div class="calculation-preview">
        <p>退休第一年每月生活費</p>
        <strong>${money(firstMonthlyExpense)}</strong>
      </div>

      <div class="calculation-preview">
        <p>整個退休期估算總支出</p>
        <strong>${money(totalExpense)}</strong>
      </div>

      <h3>退休年度支出預覽</h3>
    `;

    rows.slice(0, 10).forEach((row) => {

      html += `
        <p>
          退休第 ${row.year} 年：
          ${money(row.annualExpense)} / 年
        </p>
      `;
    });

    if (rows.length > 10) {
      html += `
        <p>
          ……其餘 ${rows.length - 10} 年
          將繼續按通脹計算。
        </p>
      `;
    }

    container.innerHTML = html;
  }


  /* =========================
     Step 6 缺口結果
  ========================== */

  function updateGapResult() {

    const data =
      calculateGap();

    const totalExpense =
      document.getElementById(
        "totalExpenseResult"
      );

    const totalAssets =
      document.getElementById(
        "totalAssetsResult"
      );

    const income =
      document.getElementById(
        "incomeValueResult"
      );

    const gap =
      document.getElementById(
        "retirementGapResult"
      );

    if (totalExpense)
      totalExpense.textContent =
        money(data.expense.totalExpense);

    if (totalAssets)
      totalAssets.textContent =
        money(data.totalAssets);

    if (income)
      income.textContent =
        money(data.income.totalIncome);

    if (gap) {

      if (data.gap > 0) {

        gap.textContent =
          money(data.gap) + " 缺口";

      } else {

        gap.textContent =
          money(Math.abs(data.gap)) +
          " 盈餘";
      }
    }
  }


  /* =========================
     Step 8 銀行 VS 規劃
  ========================== */

  function updateComparison() {

    const container =
      document.getElementById(
        "comparisonResult"
      );

    if (!container) return;

    const {
      yearsToRetire
    } = getBasicData();

    const assets =
      calculateAssets();

    const currentTotal =
      number("cashBalance") +
      number("fixedBalance") +
      number("insuranceBalance") +
      number("investmentBalance") +
      number("mpfBalance");

    const bankRate =
      percentage("bankOnlyReturn");

    const bankOnly =
      compoundValue(
        currentTotal,
        bankRate,
        yearsToRetire
      );

    const planned =
      assets.total +
      calculateMPF();

    const difference =
      planned - bankOnly;

    container.innerHTML = `

      <div class="result-grid">

        <div class="result-box">
          <span>乜都唔做，只放銀行</span>
          <strong>${money(bankOnly)}</strong>
        </div>

        <div class="result-box">
          <span>按目前退休規劃</span>
          <strong>${money(planned)}</strong>
        </div>

        <div class="result-box">
          <span>兩者差距</span>
          <strong>${money(difference)}</strong>
        </div>

      </div>
    `;
  }


  /* =========================
     Step 9 年度現金流
  ========================== */

  function updateFinalSummary() {

    const data =
      calculateGap();

    const finalExpense =
      document.getElementById(
        "finalExpense"
      );

    const finalTotalExpense =
      document.getElementById(
        "finalTotalExpense"
      );

    const finalAssets =
      document.getElementById(
        "finalAssets"
      );

    const finalGap =
      document.getElementById(
        "finalGap"
      );

    if (finalExpense)
      finalExpense.textContent =
        money(
          data.expense.firstMonthlyExpense
        );

    if (finalTotalExpense)
      finalTotalExpense.textContent =
        money(
          data.expense.totalExpense
        );

    if (finalAssets)
      finalAssets.textContent =
        money(
          data.totalAssets
        );

    if (finalGap) {

      finalGap.textContent =
        data.gap > 0
          ? money(data.gap) + " 缺口"
          : money(Math.abs(data.gap)) +
            " 盈餘";
    }

    createCashflowTable();
  }


  function createCashflowTable() {

    const container =
      document.getElementById(
        "cashflowTable"
      );

    if (!container) return;

    const data =
      calculateGap();

    const {
      retirementAge,
      retirementYears,
      inflation
    } = getBasicData();

    let remainingAssets =
      data.totalAssets;

    const fixedIncomeAnnual =
      data.income.monthlyIncome * 12;

    let html = `
      <div style="overflow-x:auto;">
      <table style="
        width:100%;
        border-collapse:collapse;
        margin-top:20px;
      ">

      <thead>
        <tr>
          <th>年齡</th>
          <th>年度支出</th>
          <th>固定收入</th>
          <th>資產提款</th>
          <th>年末剩餘資產</th>
        </tr>
      </thead>

      <tbody>
    `;

    for (
      let year = 0;
      year < retirementYears;
      year++
    ) {

      const annualExpense =
        data.expense.firstMonthlyExpense *
        12 *
        Math.pow(1 + inflation, year);

      const withdrawal =
        Math.max(
          annualExpense -
          fixedIncomeAnnual,
          0
        );

      remainingAssets -= withdrawal;

      if (remainingAssets < 0)
        remainingAssets = 0;

      html += `
        <tr>
          <td>
            ${retirementAge + year}
          </td>

          <td>
            ${money(annualExpense)}
          </td>

          <td>
            ${money(fixedIncomeAnnual)}
          </td>

          <td>
            ${money(withdrawal)}
          </td>

          <td>
            ${money(remainingAssets)}
          </td>
        </tr>
      `;
    }

    html += `
      </tbody>
      </table>
      </div>
    `;

    container.innerHTML = html;
  }


  /* =========================
     頁面導航
  ========================== */

  function showStep(step) {

    currentStep =
      Math.min(
        Math.max(step, 1),
        steps.length
      );

    steps.forEach((section, index) => {

      section.style.display =
        index === currentStep - 1
          ? "block"
          : "none";
    });

    if (stepLabel) {

      stepLabel.textContent =
        `第 ${currentStep} 步，共 ${steps.length} 步`;
    }

    if (progressBar) {

      progressBar.style.width =
        `${(currentStep / steps.length) * 100}%`;
    }

    if (prevBtn) {

      prevBtn.style.display =
        currentStep === 1
          ? "none"
          : "block";
    }

    if (nextBtn) {

      nextBtn.textContent =
        currentStep === steps.length
          ? "完成退休規劃"
          : "下一步";
    }


    /* 每頁即時計算 */

    if (currentStep === 2)
      updateExpenseSummary();

    if (currentStep === 4)
      calculateMPF();

    if (currentStep === 6)
      updateGapResult();

    if (currentStep === 8)
      updateComparison();

    if (currentStep === 9)
      updateFinalSummary();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =========================
     Step 1 驗證
  ========================== */

  function validateStepOne() {

    const {
      currentAge,
      retirementAge,
      lifeExpectancy
    } = getBasicData();

    if (!currentAge) {
      alert("請輸入目前年齡。");
      return false;
    }

    if (
      !retirementAge ||
      retirementAge <= currentAge
    ) {

      alert(
        "退休年齡必須高於目前年齡。"
      );

      return false;
    }

    if (
      !lifeExpectancy ||
      lifeExpectancy <= retirementAge
    ) {

      alert(
        "預計壽命必須高於退休年齡。"
      );

      return false;
    }

    if (!number("todayExpense")) {

      alert(
        "請輸入如果今日退休，希望每月有多少生活費。"
      );

      return false;
    }

    return true;
  }


  /* =========================
     按鈕
  ========================== */

  if (nextBtn) {

    nextBtn.addEventListener(
      "click",
      () => {

        if (
          currentStep === 1 &&
          !validateStepOne()
        ) {
          return;
        }

        if (
          currentStep <
          steps.length
        ) {

          currentStep++;

          showStep(currentStep);

        } else {

          alert(
            "退休規劃已完成。"
          );
        }
      }
    );
  }


  if (prevBtn) {

    prevBtn.addEventListener(
      "click",
      () => {

        if (currentStep > 1) {

          currentStep--;

          showStep(currentStep);
        }
      }
    );
  }


  /* =========================
     Step 1 即時計算
  ========================== */

  [
    "currentAge",
    "retirementAge",
    "inflationRate",
    "todayExpense"
  ].forEach((id) => {

    const el =
      document.getElementById(id);

    if (el) {

      el.addEventListener(
        "input",
        calculateSuggestedExpense
      );
    }
  });


  /* 預設顯示第一步 */

  showStep(1);

});
