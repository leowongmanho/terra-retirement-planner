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
        (amount / 1000000)
          .toFixed(1) +
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
        retirementAge -
        currentAge,
        0
      );


    const retirementYears =
      Math.max(
        lifeExpectancy -
        retirementAge,
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

          ? money(suggested) +
            " / 月"

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
        retirementAge +
        year;


      let factor = 1;


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
        monthlyExpense *
        12;


      totalExpense +=
        annualExpense;


      rows.push({

        year:
          year + 1,

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
    const height = 350;

    const paddingLeft = 76;
    const paddingRight = 30;
    const paddingTop = 38;
    const paddingBottom = 62;


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
        row =>
          row.annualExpense
      );


    const actualMaxValue =
      Math.max(...values);


    /*
      Y軸由0開始，
      避免80歲下降30%
      視覺上被誇大。
    */

    const minValue = 0;


    const maxValue =
      Math.max(
        actualMaxValue * 1.10,
        1
      );


    const range =
      maxValue -
      minValue;


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
          y="${paddingTop + 18}"
          font-size="12"
          fill="#9f1020"
          font-weight="700"
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
            display:flex;
            gap:22px;
            flex-wrap:wrap;
            margin-bottom:14px;
            font-size:13px;
            color:#687386;
          "
        >

          <span>

            退休第一年：

            <strong
              style="
                color:#122f57;
              "
            >
              ${money(
                startPoint.value
              )} / 年
            </strong>

          </span>


          <span>

            最高年度支出：

            <strong
              style="
                color:#122f57;
              "
            >
              ${money(
                actualMaxValue
              )} / 年
            </strong>

          </span>

        </div>


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


            ${points
              .map(
                (point, index) => {

                  const showPoint =
                    index === 0 ||
                    index ===
                      points.length - 1 ||
                    point.age === 80;


                  if (!showPoint) {

                    return "";
                  }


                  return `

                    <circle
                      cx="${point.x}"
                      cy="${point.y}"
                      r="6"
                      fill="#ffffff"
                      stroke="#9f1020"
                      stroke-width="3"
                    />

                  `;
                }
              )
              .join("")}


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
     資產複利
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


  /* =================================
     Step 3 資產計算
  ================================= */

  function calculateAssets() {

    const {
      yearsToRetire
    } = getBasicData();


    const cashBalance =
      number("cashBalance");

    const fixedBalance =
      number("fixedBalance");

    const insuranceBalance =
      number("insuranceBalance");

    const investmentBalance =
      number("investmentBalance");


    const cash =
      compoundValue(
        cashBalance,
        percentage("cashReturn"),
        yearsToRetire
      );


    const fixed =
      compoundValue(
        fixedBalance,
        percentage("fixedReturn"),
        yearsToRetire
      );


    const insurance =
      compoundValue(
        insuranceBalance,
        percentage("insuranceReturn"),
        yearsToRetire
      );


    const investment =
      compoundValue(
        investmentBalance,
        percentage("investmentReturn"),
        yearsToRetire
      );


    const currentTotal =
      cashBalance +
      fixedBalance +
      insuranceBalance +
      investmentBalance;


    const futureTotal =
      cash +
      fixed +
      insurance +
      investment;


    return {

      cashBalance,
      fixedBalance,
      insuranceBalance,
      investmentBalance,

      cash,
      fixed,
      insurance,
      investment,

      currentTotal,

      futureTotal,

      growth:
        futureTotal -
        currentTotal,

      total:
        futureTotal
    };
  }


  /* =================================
     Step 3 資產增值預覽
  ================================= */

  function updateAssetSummary() {

    const step3 =
      document.querySelector(
        '.planner-step[data-step="3"]'
      );


    if (!step3) {

      return;
    }


    let container =
      document.getElementById(
        "assetProjectionSummary"
      );


    if (!container) {

      container =
        document.createElement(
          "div"
        );


      container.id =
        "assetProjectionSummary";


      /*
        自動放在第3頁所有input之後。
        不需要修改planner.html。
      */

      step3.appendChild(
        container
      );
    }


    const data =
      calculateAssets();


    const {
      yearsToRetire
    } = getBasicData();


    function assetCard(
      title,
      current,
      future
    ) {

      const growth =
        future -
        current;


      return `

        <div
          style="
            padding:18px;
            border:1px solid #eadfcd;
            border-radius:16px;
            background:#fffdf8;
          "
        >

          <div
            style="
              font-size:16px;
              font-weight:800;
              color:#122f57;
              margin-bottom:12px;
            "
          >
            ${title}
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(
                  3,
                  minmax(0,1fr)
                );
              gap:12px;
            "
          >

            <div>

              <span
                style="
                  display:block;
                  color:#687386;
                  font-size:13px;
                "
              >
                現有金額
              </span>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  color:#122f57;
                  font-size:18px;
                "
              >
                ${money(current)}
              </strong>

            </div>


            <div>

              <span
                style="
                  display:block;
                  color:#687386;
                  font-size:13px;
                "
              >
                預計增值
              </span>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  color:#9f1020;
                  font-size:18px;
                "
              >
                + ${money(growth)}
              </strong>

            </div>


            <div>

              <span
                style="
                  display:block;
                  color:#687386;
                  font-size:13px;
                "
              >
                退休時預計
              </span>

              <strong
                style="
                  display:block;
                  margin-top:4px;
                  color:#122f57;
                  font-size:18px;
                "
              >
                ${money(future)}
              </strong>

            </div>

          </div>

        </div>

      `;
    }


    container.innerHTML = `

      <div
        style="
          margin-top:30px;
        "
      >

        <h3
          style="
            margin-bottom:6px;
          "
        >
          資產增值預覽
        </h3>


        <p
          style="
            color:#687386;
            margin-bottom:18px;
          "
        >

          根據你設定的預期回報率，
          以下估算現有資產在

          <strong
            style="
              color:#122f57;
            "
          >
            ${yearsToRetire} 年
          </strong>

          後退休時的預計價值。

        </p>


        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );
            gap:14px;
          "
        >

          ${assetCard(
            "銀行活期存款",
            data.cashBalance,
            data.cash
          )}


          ${assetCard(
            "定息戶口",
            data.fixedBalance,
            data.fixed
          )}


          ${assetCard(
            "保險戶口",
            data.insuranceBalance,
            data.insurance
          )}


          ${assetCard(
            "投資戶口",
            data.investmentBalance,
            data.investment
          )}

        </div>


        <div
          style="
            margin-top:18px;
            padding:22px;
            border-radius:18px;
            background:#122f57;
            color:#ffffff;
          "
        >

          <div
            style="
              margin-bottom:14px;
              font-size:17px;
              font-weight:800;
            "
          >
            資產總覽
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(
                  3,
                  minmax(0,1fr)
                );
              gap:16px;
            "
          >

            <div>

              <span
                style="
                  display:block;
                  opacity:0.72;
                  font-size:13px;
                "
              >
                現有總資產
              </span>

              <strong
                style="
                  display:block;
                  margin-top:5px;
                  font-size:22px;
                "
              >
                ${money(
                  data.currentTotal
                )}
              </strong>

            </div>


            <div>

              <span
                style="
                  display:block;
                  opacity:0.72;
                  font-size:13px;
                "
              >
                預計總增值
              </span>

              <strong
                style="
                  display:block;
                  margin-top:5px;
                  font-size:22px;
                  color:#d7a922;
                "
              >
                + ${money(
                  data.growth
                )}
              </strong>

            </div>


            <div>

              <span
                style="
                  display:block;
                  opacity:0.72;
                  font-size:13px;
                "
              >
                退休時預計總資產
              </span>

              <strong
                style="
                  display:block;
                  margin-top:5px;
                  font-size:22px;
                "
              >
                ${money(
                  data.futureTotal
                )}
              </strong>

            </div>

          </div>

        </div>


        <p
          style="
            margin-top:12px;
            color:#687386;
            font-size:13px;
            line-height:1.7;
          "
        >

          *以上只按你輸入的預期回報率作複利估算，
          不代表保證回報，實際結果可能有所不同。

        </p>

      </div>

    `;
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
      yearsToRetire *
      12;


    const monthlyRate =
      annualRate /
      12;


    const futureBalance =
      balance *
      Math.pow(
        1 + annualRate,
        yearsToRetire
      );


    let futureContribution =
      0;


    if (months > 0) {

      if (
        monthlyRate > 0
      ) {

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
     退休缺口
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
     Step 2 顯示
  ================================= */

  function updateExpenseSummary() {

    const container =
      document.getElementById(
        "expenseSummary"
      );


    if (!container) {

      return;
    }


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


      <div
        style="
          margin-top:18px;
          padding:15px 18px;
          background:#fff8f7;
          border-left:4px solid #9f1020;
          border-radius:10px;
          color:#27364a;
          font-size:14px;
          line-height:1.75;
        "
      >

        <strong>
          提示：
        </strong>


        ${
          shouldReduceAfter80()

            ? `
              本規劃假設 80 歲後日常生活消費下降 30%，
              並在其後年份繼續按通脹調整；
              實際支出仍會因個人生活模式及醫療需要而有所不同。
            `

            : `
              你已選擇維持80歲後原有生活費水平，
              系統會繼續按通脹調整；
              實際支出仍會因個人生活模式及醫療需要而有所不同。
            `
        }

      </div>


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
          data.expense
            .totalExpense
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
          data.income
            .totalIncome
        );
    }


    if (gap) {

      gap.textContent =
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
  }


  /* =================================
     Step 8
  ================================= */

  function updateComparison() {

    const container =
      document.getElementById(
        "comparisonResult"
      );


    if (!container) {

      return;
    }


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


    if (!container) {

      return;
    }


    const data =
      calculateGap();


    let remainingAssets =
      data.totalAssets;


    const fixedIncomeAnnual =
      data.income
        .monthlyIncome *
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

            remainingAssets =
              0;
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
     頁面導航
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


    /*
      第3頁：
      即時計算資產退休預計值
    */

    if (
      currentStep === 3
    ) {

      updateAssetSummary();
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

      behavior:
        "smooth"

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
        document.getElementById(
          id
        );


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
     80歲後生活費選擇
  ================================= */

  age80Options
    .forEach(
      option => {

        option.addEventListener(
          "change",
          () => {

            updateExpenseSummary();
          }
        );
      }
    );


  /* =================================
     Step 3
     資產即時計算
  ================================= */

  [
    "cashBalance",
    "cashReturn",

    "fixedBalance",
    "fixedReturn",

    "insuranceBalance",
    "insuranceReturn",

    "investmentBalance",
    "investmentReturn"
  ].forEach(
    id => {

      const el =
        document.getElementById(
          id
        );


      if (el) {

        el.addEventListener(
          "input",
          () => {

            updateAssetSummary();
          }
        );


        el.addEventListener(
          "change",
          () => {

            updateAssetSummary();
          }
        );
      }
    }
  );


  /* =================================
     預設第一步
  ================================= */

  showStep(1);

});
