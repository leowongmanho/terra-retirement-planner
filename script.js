document.addEventListener("DOMContentLoaded", () => {

  const steps =
    Array.from(
      document.querySelectorAll(".planner-step")
    );

  const prevBtn =
    document.getElementById("prevBtn");

  const nextBtn =
    document.getElementById("nextBtn");

  const stepLabel =
    document.getElementById("stepLabel");

  const progressBar =
    document.getElementById("progressBar");

  const lifestyleCards =
    document.querySelectorAll(".lifestyle-card");

  const todayExpenseInput =
    document.getElementById("todayExpense");

  const acceptedExpenseInput =
    document.getElementById("acceptedExpense");

  const age80Options =
    document.querySelectorAll(
      'input[name="age80ExpenseOption"]'
    );


  let currentStep = 1;

  let acceptedExpenseAuto = true;


  /* =================================
     基本工具
  ================================= */

  const number = (id) => {

    const el =
      document.getElementById(id);

    return el
      ? Number(el.value) || 0
      : 0;
  };


  const money = (value) => {

    return (
      "HK$ " +
      Math.round(value || 0)
        .toLocaleString("en-HK")
    );
  };


  const compactMoney = (value) => {

    const amount =
      Number(value) || 0;


    if (amount >= 1000000) {

      return (
        "HK$" +
        (amount / 1000000).toFixed(1) +
        "M"
      );
    }


    if (amount >= 1000) {

      return (
        "HK$" +
        Math.round(amount / 1000) +
        "K"
      );
    }


    return (
      "HK$" +
      Math.round(amount)
    );
  };


  const percentage = (id) => {

    return number(id) / 100;
  };


  /* =================================
     80歲後生活費選項
  ================================= */

  function shouldReduceAfter80() {

    const selected =
      document.querySelector(
        'input[name="age80ExpenseOption"]:checked'
      );


    if (!selected) {

      return true;
    }


    return (
      selected.value === "reduce"
    );
  }


  function ageExpenseFactor(age) {

    if (
      age >= 80 &&
      shouldReduceAfter80()
    ) {

      return 0.70;
    }


    return 1;
  }


  /* =================================
     基本退休資料
  ================================= */

  function getBasicData() {

    const currentAge =
      number("currentAge");

    const retirementAge =
      number("retirementAge");

    const lifeExpectancy =
      number("lifeExpectancy");

    const inflation =
      percentage("inflationRate");


    const yearsToRetire =
      Math.max(
        retirementAge - currentAge,
        0
      );


    const retirementYears =
      Math.max(
        lifeExpectancy - retirementAge,
        0
      );


    return {
      currentAge,
      retirementAge,
      lifeExpectancy,
      inflation,
      yearsToRetire,
      retirementYears
    };
  }


  /* =================================
     退休第一年生活費
  ================================= */

  function calculateSuggestedExpense() {

    const {
      yearsToRetire,
      inflation,
      retirementAge
    } = getBasicData();


    const todayExpense =
      number("todayExpense");


    let suggested =
      todayExpense *
      Math.pow(
        1 + inflation,
        yearsToRetire
      );


    /*
      如果客戶本身退休時已經80歲或以上，
      才需要在第一年直接套用70%。
    */

    if (
      retirementAge >= 80 &&
      shouldReduceAfter80()
    ) {

      suggested *= 0.70;
    }


    const output =
      document.getElementById(
        "suggestedExpense"
      );


    if (output) {

      output.textContent =
        todayExpense > 0
          ? money(suggested) + " / 月"
          : "HK$ —";
    }


    return suggested;
  }


  function updateSuggestedAndAccepted() {

    const suggested =
      calculateSuggestedExpense();


    if (
      acceptedExpenseInput &&
      acceptedExpenseAuto
    ) {

      acceptedExpenseInput.value =
        suggested > 0
          ? Math.round(suggested)
          : "";
    }


    return suggested;
  }


  function getRetirementMonthlyExpense() {

    const accepted =
      number("acceptedExpense");


    if (accepted > 0) {

      return accepted;
    }


    return calculateSuggestedExpense();
  }


  /* =================================
     退休年度支出
  ================================= */

  function calculateRetirementExpenses() {

    const {
      retirementAge,
      retirementYears,
      inflation
    } = getBasicData();


    const firstMonthlyExpense =
      getRetirementMonthlyExpense();


    let totalExpense = 0;

    const rows = [];


    for (
      let year = 0;
      year < retirementYears;
      year++
    ) {

      const age =
        retirementAge + year;


      let factor = 1;


      /*
        如果退休年齡未到80歲，
        到80歲先開始下調30%。

        如果退休第一年已經80歲或以上，
        firstMonthlyExpense 已經調整過，
        所以避免再乘一次0.70。
      */

      if (
        retirementAge < 80 &&
        age >= 80 &&
        shouldReduceAfter80()
      ) {

        factor = 0.70;
      }


      const monthlyExpense =
        firstMonthlyExpense *
        Math.pow(
          1 + inflation,
          year
        ) *
        factor;


      const annualExpense =
        monthlyExpense * 12;


      totalExpense +=
        annualExpense;


      rows.push({
        year: year + 1,
        age,
        monthlyExpense,
        annualExpense,
        reducedAfter80:
          age >= 80 &&
          shouldReduceAfter80()
      });
    }


    return {
      firstMonthlyExpense,
      totalExpense,
      rows
    };
  }


  /* =================================
     Step 2 圖表
  ================================= */

  function createExpenseTrendChart(rows) {

    if (
      !rows ||
      rows.length === 0
    ) {

      return "";
    }


    const width = 760;
    const height = 330;

    const paddingLeft = 72;
    const paddingRight = 30;
    const paddingTop = 34;
    const paddingBottom = 58;


    const chartWidth =
      width -
      paddingLeft -
      paddingRight;


    const chartHeight =
      height -
      paddingTop -
      paddingBottom;


    const values =
      rows.map(
        row => row.annualExpense
      );


    const maxValue =
      Math.max(...values);


    const minValue =
      Math.min(...values);


    const range =
      Math.max(
        maxValue - minValue,
        1
      );


    const points =
      rows.map(
        (row, index) => {

          const x =
            paddingLeft +
            (
              index /
              Math.max(
                rows.length - 1,
                1
              )
            ) *
            chartWidth;


          const normalized =
            (
              row.annualExpense -
              minValue
            ) /
            range;


          const y =
            paddingTop +
            chartHeight -
            normalized *
            chartHeight;


          return {
            x,
            y,
            year: row.year,
            age: row.age,
            value: row.annualExpense
          };
        }
      );


    const linePoints =
      points
        .map(
          point =>
            `${point.x},${point.y}`
        )
        .join(" ");


    const areaPoints =
      [
        `${paddingLeft},${paddingTop + chartHeight}`,

        ...points.map(
          point =>
            `${point.x},${point.y}`
        ),

        `${paddingLeft + chartWidth},${paddingTop + chartHeight}`
      ].join(" ");


    const horizontalLines = [];


    for (
      let i = 0;
      i <= 4;
      i++
    ) {

      const ratio =
        i / 4;


      const y =
        paddingTop +
        chartHeight -
        ratio *
        chartHeight;


      const value =
        minValue +
        ratio *
        range;


      horizontalLines.push(`

        <line
          x1="${paddingLeft}"
          y1="${y}"
          x2="${paddingLeft + chartWidth}"
          y2="${y}"
          stroke="#eadfcd"
          stroke-width="1"
        />


        <text
          x="${paddingLeft - 12}"
          y="${y + 5}"
          text-anchor="end"
          font-size="12"
          fill="#687386"
        >
          ${compactMoney(value)}
        </text>

      `);
    }


    const startPoint =
      points[0];


    const endPoint =
      points[
        points.length - 1
      ];


    const middlePoint =
      points[
        Math.floor(
          points.length / 2
        )
      ];


    const age80Point =
      points.find(
        point =>
          point.age === 80
      );


    let age80Marker = "";


    if (
      age80Point &&
      shouldReduceAfter80()
    ) {

      age80Marker = `

        <line
          x1="${age80Point.x}"
          y1="${paddingTop}"
          x2="${age80Point.x}"
          y2="${paddingTop + chartHeight}"
          stroke="#9f1020"
          stroke-width="2"
          stroke-dasharray="6 6"
        />


        <text
          x="${age80Point.x + 8}"
          y="${paddingTop + 16}"
          font-size="12"
          fill="#9f1020"
        >
          80歲後 -30%
        </text>

      `;
    }


    const modeDescription =
      shouldReduceAfter80()

        ? "80歲後假設日常生活消費下降30%，其後繼續按通脹調整。"

        : "80歲後維持原有生活費水平，並繼續按通脹調整。";


    return `

      <div
        class="expense-chart-card"
        style="
          margin-top:22px;
          padding:22px;
          border:1px solid #eadfcd;
          border-radius:18px;
          background:#fffdf8;
        "
      >

        <h3
          style="
            margin:0 0 4px;
            color:#122f57;
          "
        >
          退休年度生活開支趨勢
        </h3>


        <p
          style="
            margin:0 0 16px;
            color:#687386;
            font-size:14px;
          "
        >
          ${modeDescription}
        </p>


        <div
          style="
            width:100%;
            overflow-x:auto;
          "
        >

          <svg
            viewBox="0 0 ${width} ${height}"
            width="100%"
            style="
              min-width:620px;
              display:block;
            "
          >

            <defs>

              <linearGradient
                id="expenseAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stop-color="#d7a922"
                  stop-opacity="0.28"
                />

                <stop
                  offset="100%"
                  stop-color="#d7a922"
                  stop-opacity="0.02"
                />

              </linearGradient>

            </defs>


            ${horizontalLines.join("")}


            <polygon
              points="${areaPoints}"
              fill="url(#expenseAreaGradient)"
            />


            <polyline
              points="${linePoints}"
              fill="none"
              stroke="#d7a922"
              stroke-width="5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />


            ${age80Marker}


            <line
              x1="${paddingLeft}"
              y1="${paddingTop + chartHeight}"
              x2="${paddingLeft + chartWidth}"
              y2="${paddingTop + chartHeight}"
              stroke="#122f57"
              stroke-width="2"
            />


            <text
              x="${startPoint.x}"
              y="${height - 22}"
              text-anchor="start"
              font-size="13"
              fill="#687386"
            >
              ${startPoint.age}歲
            </text>


            <text
              x="${middlePoint.x}"
              y="${height - 22}"
              text-anchor="middle"
              font-size="13"
              fill="#687386"
            >
              ${middlePoint.age}歲
            </text>


            <text
              x="${endPoint.x}"
              y="${height - 22}"
              text-anchor="end"
              font-size="13"
              fill="#687386"
            >
              ${endPoint.age}歲
            </text>

          </svg>

        </div>

      </div>

    `;
  }


  /* =================================
     資產
  ================================= */

  function compoundValue(
    balance,
    annualRate,
    years
  ) {

    return (
      balance *
      Math.pow(
        1 + annualRate,
        years
      )
    );
  }


  function calculateAssets() {

    const {
      yearsToRetire
    } = getBasicData();


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


  /* =================================
     MPF
  ================================= */

  function calculateMPF() {

    const {
      yearsToRetire
    } = getBasicData();


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
      Math.pow(
        1 + annualRate,
        yearsToRetire
      );


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
            ) /
            monthlyRate
          );

      } else {

        futureContribution =
          monthly *
          months;
      }
    }


    const total =
      futureBalance +
      futureContribution;


    const output =
      document.getElementById(
        "futureMPF"
      );


    if (output) {

      output.textContent =
        money(total);
    }


    return total;
  }


  /* =================================
     固定退休收入
  ================================= */

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


  /* =================================
     缺口
  ================================= */

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
      assets.total +
      mpf;


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


  /* =================================
     Step 2
  ================================= */

  function updateExpenseSummary() {

    const container =
      document.getElementById(
        "expenseSummary"
      );


    if (!container) return;


    const data =
      calculateRetirementExpenses();


    if (
      !data.firstMonthlyExpense
    ) {

      container.innerHTML =
        "<p>請先完成第一步的退休生活費設定。</p>";

      return;
    }


    const {
      retirementYears
    } = getBasicData();


    const chart =
      createExpenseTrendChart(
        data.rows
      );


    let html = `

      <div class="result-grid">

        <div class="calculation-preview">

          <p>
            退休第一年每月生活費
          </p>

          <strong>
            ${money(
              data.firstMonthlyExpense
            )}
          </strong>

        </div>


        <div class="calculation-preview">

          <p>
            預計退休年期
          </p>

          <strong>
            ${retirementYears} 年
          </strong>

        </div>

      </div>


      <div class="calculation-preview">

        <p>
          整個退休期估算總支出
        </p>

        <strong>
          ${money(
            data.totalExpense
          )}
        </strong>

      </div>


      ${chart}


      <h3
        style="
          margin-top:28px;
        "
      >
        退休年度支出預覽
      </h3>

    `;


    data.rows
      .slice(0, 10)
      .forEach(
        row => {

          html += `

            <p
              style="
                padding:8px 0;
                border-bottom:
                  1px solid #f0ebe1;
              "
            >

              ${row.age} 歲
              （退休第 ${row.year} 年）：

              <strong>
                ${money(
                  row.annualExpense
                )}
              </strong>

              / 年

              ${
                row.age === 80 &&
                shouldReduceAfter80()

                  ? `
                    <span
                      style="
                        color:#9f1020;
                        font-weight:700;
                        font-size:13px;
                      "
                    >
                      （生活費調整 -30%）
                    </span>
                  `

                  : ""
              }

            </p>

          `;
        }
      );


    if (
      data.rows.length > 10
    ) {

      html += `

        <p
          style="
            margin-top:12px;
            color:#687386;
          "
        >

          ……其餘
          ${data.rows.length - 10}
          年將按上述設定繼續計算。

        </p>

      `;
    }


    container.innerHTML =
      html;
  }


  /* =================================
     Step 6
  ================================= */

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


    if (totalExpense) {

      totalExpense.textContent =
        money(
          data.expense.totalExpense
        );
    }


    if (totalAssets) {

      totalAssets.textContent =
        money(
          data.totalAssets
        );
    }


    if (income) {

      income.textContent =
        money(
          data.income.totalIncome
        );
    }


    if (gap) {

      gap.textContent =
        data.gap > 0

          ? money(data.gap) +
            " 缺口"

          : money(
              Math.abs(
                data.gap
              )
            ) +
            " 盈餘";
    }
  }


  /* =================================
     Step 8
  ================================= */

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
      percentage(
        "bankOnlyReturn"
      );


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
      planned -
      bankOnly;


    container.innerHTML = `

      <div class="result-grid">

        <div class="result-box">

          <span>
            乜都唔做，只放銀行
          </span>

          <strong>
            ${money(bankOnly)}
          </strong>

        </div>


        <div class="result-box">

          <span>
            按目前退休規劃
          </span>

          <strong>
            ${money(planned)}
          </strong>

        </div>


        <div class="result-box">

          <span>
            兩者差距
          </span>

          <strong>
            ${money(difference)}
          </strong>

        </div>

      </div>

    `;
  }


  /* =================================
     Step 9
  ================================= */

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


    if (finalExpense) {

      finalExpense.textContent =
        money(
          data.expense
            .firstMonthlyExpense
        );
    }


    if (finalTotalExpense) {

      finalTotalExpense.textContent =
        money(
          data.expense
            .totalExpense
        );
    }


    if (finalAssets) {

      finalAssets.textContent =
        money(
          data.totalAssets
        );
    }


    if (finalGap) {

      finalGap.textContent =
        data.gap > 0

          ? money(
              data.gap
            ) +
            " 缺口"

          : money(
              Math.abs(
                data.gap
              )
            ) +
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


    let remainingAssets =
      data.totalAssets;


    const fixedIncomeAnnual =
      data.income.monthlyIncome *
      12;


    let html = `

      <div
        style="
          overflow-x:auto;
        "
      >

        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin-top:20px;
          "
        >

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


    data.expense.rows
      .forEach(
        row => {

          const withdrawal =
            Math.max(
              row.annualExpense -
              fixedIncomeAnnual,
              0
            );


          remainingAssets -=
            withdrawal;


          if (
            remainingAssets < 0
          ) {

            remainingAssets = 0;
          }


          html += `

            <tr>

              <td>
                ${row.age}
              </td>

              <td>
                ${money(
                  row.annualExpense
                )}
              </td>

              <td>
                ${money(
                  fixedIncomeAnnual
                )}
              </td>

              <td>
                ${money(
                  withdrawal
                )}
              </td>

              <td>
                ${money(
                  remainingAssets
                )}
              </td>

            </tr>

          `;
        }
      );


    html += `

          </tbody>

        </table>

      </div>

    `;


    container.innerHTML =
      html;
  }


  /* =================================
     導航
  ================================= */

  function showStep(step) {

    currentStep =
      Math.min(
        Math.max(
          step,
          1
        ),
        steps.length
      );


    steps.forEach(
      (
        section,
        index
      ) => {

        section.style.display =
          index ===
          currentStep - 1

            ? "block"

            : "none";
      }
    );


    if (stepLabel) {

      stepLabel.textContent =
        `第 ${currentStep} 步，共 ${steps.length} 步`;
    }


    if (progressBar) {

      progressBar.style.width =
        `${
          (
            currentStep /
            steps.length
          ) *
          100
        }%`;
    }


    if (prevBtn) {

      prevBtn.style.display =
        "block";
    }


    if (nextBtn) {

      nextBtn.textContent =
        currentStep ===
        steps.length

          ? "完成退休規劃"

          : "下一步";
    }


    if (
      currentStep === 2
    ) {

      updateExpenseSummary();
    }


    if (
      currentStep === 4
    ) {

      calculateMPF();
    }


    if (
      currentStep === 6
    ) {

      updateGapResult();
    }


    if (
      currentStep === 8
    ) {

      updateComparison();
    }


    if (
      currentStep === 9
    ) {

      updateFinalSummary();
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =================================
     Step 1 驗證
  ================================= */

  function validateStepOne() {

    const {
      currentAge,
      retirementAge,
      lifeExpectancy
    } = getBasicData();


    if (!currentAge) {

      alert(
        "請輸入目前年齡。"
      );

      return false;
    }


    if (
      !retirementAge ||
      retirementAge <=
        currentAge
    ) {

      alert(
        "退休年齡必須高於目前年齡。"
      );

      return false;
    }


    if (
      !lifeExpectancy ||
      lifeExpectancy <=
        retirementAge
    ) {

      alert(
        "預計壽命必須高於退休年齡。"
      );

      return false;
    }


    if (
      !number(
        "todayExpense"
      )
    ) {

      alert(
        "請輸入生活費，或選擇基本、舒適或豐裕生活模式。"
      );

      return false;
    }


    return true;
  }


  /* =================================
     下一步
  ================================= */

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

          showStep(
            currentStep
          );

        } else {

          alert(
            "退休規劃已完成。"
          );
        }
      }
    );
  }


  /* =================================
     上一步
  ================================= */

  if (prevBtn) {

    prevBtn.addEventListener(
      "click",
      () => {

        if (
          currentStep > 1
        ) {

          currentStep--;

          showStep(
            currentStep
          );

        } else {

          window.location.href =
            "index.html";
        }
      }
    );
  }


  /* =================================
     Step 1 即時計算
  ================================= */

  [
    "currentAge",
    "retirementAge",
    "inflationRate"
  ].forEach(
    id => {

      const el =
        document.getElementById(id);


      if (el) {

        el.addEventListener(
          "input",
          updateSuggestedAndAccepted
        );


        el.addEventListener(
          "change",
          updateSuggestedAndAccepted
        );
      }
    }
  );


  /* =================================
     生活模式選擇
  ================================= */

  lifestyleCards
    .forEach(
      card => {

        card.addEventListener(
          "click",
          () => {

            lifestyleCards
              .forEach(
                item => {

                  item.classList.remove(
                    "selected"
                  );
                }
              );


            card.classList.add(
              "selected"
            );


            const expense =
              Number(
                card.dataset.expense
              ) || 0;


            if (
              todayExpenseInput
            ) {

              todayExpenseInput.value =
                expense;
            }


            acceptedExpenseAuto =
              true;


            updateSuggestedAndAccepted();
          }
        );
      }
    );


  /* =================================
     客戶自行修改今日生活費
  ================================= */

  if (
    todayExpenseInput
  ) {

    todayExpenseInput
      .addEventListener(
        "input",
        () => {

          lifestyleCards
            .forEach(
              item => {

                item.classList.remove(
                  "selected"
                );
              }
            );


          acceptedExpenseAuto =
            true;


          updateSuggestedAndAccepted();
        }
      );
  }


  /* =================================
     客戶自行修改最終生活費
  ================================= */

  if (
    acceptedExpenseInput
  ) {

    acceptedExpenseInput
      .addEventListener(
        "input",
        () => {

          acceptedExpenseAuto =
            false;
        }
      );
  }


  /* =================================
     Step 2
     80歲後生活費選擇
  ================================= */

  age80Options
    .forEach(
      option => {

        option.addEventListener(
          "change",
          () => {

            /*
              Step 2即時重新畫圖
              及重新計算總支出
            */

            updateExpenseSummary();


            /*
              如之後再去Step 6 / 9，
              calculateGap會自動使用
              最新選項。
            */

          }
        );
      }
    );


  /* =================================
     預設顯示第一步
  ================================= */

  showStep(1);

});
