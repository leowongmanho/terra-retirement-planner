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

  const mpfProfileCards =
    document.querySelectorAll(
      ".mpf-profile-card"
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
     客戶資料 / 規劃日期
  ================================= */

  function formatDateHK(value) {

    if (!value) {
      return "—";
    }


    const parts =
      String(value).split("-");


    if (parts.length !== 3) {
      return value;
    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }


  function getClientInfo() {

    const nameEl =
      document.getElementById("clientName");


    const dateEl =
      document.getElementById("planningDate");


    return {
      clientName:
        nameEl && nameEl.value.trim()
          ? nameEl.value.trim()
          : "—",

      planningDate:
        dateEl ? dateEl.value : ""
    };
  }


  function addOneYearToDate(value) {

    if (!value) {
      return "";
    }


    const [
      year,
      month,
      day
    ] =
      value.split("-").map(Number);


    if (
      !year ||
      !month ||
      !day
    ) {
      return "";
    }


    const date =
      new Date(
        year + 1,
        month - 1,
        day
      );


    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0")
    ].join("-");
  }


  function setDefaultPlanningDate() {

    const dateEl =
      document.getElementById(
        "planningDate"
      );


    if (
      !dateEl ||
      dateEl.value
    ) {
      return;
    }


    const today =
      new Date();


    const localDate = [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(2, "0"),
      String(
        today.getDate()
      ).padStart(2, "0")
    ].join("-");


    dateEl.value =
      localDate;
  }


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

  function getExpenseSplit() {
    let essentialPct = Math.max(0, Math.min(number("essentialExpensePct"), 100));
    let enjoymentPct = Math.max(0, Math.min(number("enjoymentExpensePct"), 100));
    if (essentialPct + enjoymentPct <= 0) {
      essentialPct = 70;
      enjoymentPct = 30;
    }
    return { essentialPct, enjoymentPct };
  }

  function updateExpenseSplitPreview() {
    const total = number("todayExpense");
    const split = getExpenseSplit();
    const essentialEl = document.getElementById("essentialExpensePreview");
    const enjoymentEl = document.getElementById("enjoymentExpensePreview");
    if (essentialEl) essentialEl.textContent = money(total * split.essentialPct / 100) + " / 月";
    if (enjoymentEl) enjoymentEl.textContent = money(total * split.enjoymentPct / 100) + " / 月";
  }

  function getMpfAccessAge() {
    const selected = document.querySelector('input[name="mpfAccessAge"]:checked');
    return selected ? Number(selected.value) || 65 : 65;
  }

  function getSemiRetirementData() {
    const enabledEl = document.getElementById("semiRetirementEnabled");
    const basic = getBasicData();
    const enabled = Boolean(enabledEl && enabledEl.checked);
    const income = enabled ? number("semiRetirementIncome") : 0;
    const startAge = enabled ? (number("semiRetirementStartAge") || basic.retirementAge) : basic.retirementAge;
    const endAge = enabled ? (number("semiRetirementEndAge") || Math.min(getMpfAccessAge(), basic.lifeExpectancy)) : basic.retirementAge;
    return { enabled, income, startAge, endAge: Math.max(endAge, startAge) };
  }

  function getSemiRetirementIncomeAtAge(age) {
    const data = getSemiRetirementData();
    return data.enabled && data.income > 0 && age >= data.startAge && age < data.endAge
      ? data.income
      : 0;
  }

  function syncSemiRetirementUI() {
    const data = getSemiRetirementData();
    const fields = document.getElementById("semiRetirementFields");
    const preview = document.getElementById("incomeSemiRetirementPreview");
    if (fields) fields.hidden = !data.enabled;
    if (preview) preview.textContent = money(data.enabled ? data.income : 0);
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


    updateCashBufferTargetUI();
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
     銀行 + 定息 + 保險 + 股票 + 基金
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

    const stockBalance =
      number("stockBalance");

    const fundBalance =
      number("fundBalance");


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


    const stock =
      compoundValue(
        stockBalance,
        percentage("stockReturn"),
        yearsToRetire
      );


    const fund =
      compoundValue(
        fundBalance,
        percentage("fundReturn"),
        yearsToRetire
      );


    const currentTotal =
      cashBalance +
      fixedBalance +
      insuranceBalance +
      stockBalance +
      fundBalance;


    const futureTotal =
      cash +
      fixed +
      insurance +
      stock +
      fund;


    return {

      cashBalance,
      fixedBalance,
      insuranceBalance,
      stockBalance,
      fundBalance,

      cash,
      fixed,
      insurance,
      stock,
      fund,

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
            "股票戶口",
            data.stockBalance,
            data.stock
          )}


          ${assetCard(
            "基金戶口",
            data.fundBalance,
            data.fund
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
     Step 4
     MPF 即時計算
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


    /* 現有 MPF 增值 */

    const futureBalance =
      balance *
      Math.pow(
        1 + annualRate,
        yearsToRetire
      );


    /* 每月供款未來價值 */

    let futureContribution = 0;


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


    /*
      真正供款本金
      不包括投資增值
    */

    const contributionPrincipal =
      monthly *
      months;


    const total =
      futureBalance +
      futureContribution;


    /*
      投資增值 =
      最終總值
      - 現有MPF本金
      - 未來新增供款本金
    */

    const investmentGrowth =
      total -
      balance -
      contributionPrincipal;


    /* 預計退休時 MPF */

    const output =
      document.getElementById(
        "futureMPF"
      );


    if (output) {

      output.textContent =
        money(total);
    }


    /* 現有 MPF */

    const currentPreview =
      document.getElementById(
        "mpfCurrentPreview"
      );


    if (currentPreview) {

      currentPreview.textContent =
        money(balance);
    }


    /* 新增供款本金 */

    const contributionPreview =
      document.getElementById(
        "mpfContributionPreview"
      );


    if (contributionPreview) {

      contributionPreview.textContent =
        money(
          contributionPrincipal
        );
    }


    /* 預計投資增值 */

    const growthPreview =
      document.getElementById(
        "mpfGrowthPreview"
      );


    if (growthPreview) {

      growthPreview.textContent =
        (
          investmentGrowth >= 0
            ? "+ "
            : ""
        ) +
        money(
          investmentGrowth
        );
    }


    /* 距離退休 */

    const yearsPreview =
      document.getElementById(
        "mpfYearsPreview"
      );


    if (yearsPreview) {

      yearsPreview.textContent =
        `${yearsToRetire} 年`;
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

    const firstFive = data.rows.slice(0, Math.min(5, data.rows.length));
    const lastThree = data.rows.length > 5 ? data.rows.slice(-3) : [];

    const renderExpenseRows = rows => rows.map(
      row => `
        <div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #f0ebe1;">
          <span style="color:#687386;font-size:12px;">${row.age}歲 · 第${row.year}年</span>
          <strong style="color:#122f57;font-size:12px;">${money(row.annualExpense)}</strong>
        </div>
      `
    ).join("");

    const firstAnnual =
      data.rows[0]
        ? data.rows[0].annualExpense
        : 0;

    const lastAnnual =
      data.rows.length
        ? data.rows[data.rows.length - 1].annualExpense
        : 0;

    const expenseIncreasePct =
      firstAnnual > 0
        ? ((lastAnnual / firstAnnual) - 1) * 100
        : 0;


    html += `
      <div style="display:grid;grid-template-columns:1fr 56px 1fr;gap:12px;align-items:stretch;margin-top:10px;">
        <div style="padding:14px;border:1px solid #eadfcd;border-radius:14px;background:#fffdf8;">
          <strong style="display:block;color:#122f57;font-size:14px;margin-bottom:6px;">退休初期 · 首5年</strong>
          ${renderExpenseRows(firstFive)}
        </div>

        <div style="display:flex;align-items:center;justify-content:center;color:#d7a922;font-size:26px;font-weight:900;">…</div>

        <div style="padding:14px;border:2px solid #d7a922;border-radius:14px;background:#fff9e8;">
          <strong style="display:block;color:#7f1020;font-size:14px;margin-bottom:6px;">退休後期 · 最後3年</strong>
          ${renderExpenseRows(lastThree)}
        </div>
      </div>

      <div style="margin-top:12px;padding:12px 14px;border-radius:12px;background:#122f57;color:#ffffff;display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;text-align:center;">
        <strong style="font-size:13px;">退休第1年 ${money(firstAnnual)}</strong>
        <span style="color:#d7a922;font-size:18px;font-weight:900;">→</span>
        <strong style="font-size:13px;">最後1年 ${money(lastAnnual)}</strong>
        <span style="color:#d7a922;font-size:13px;font-weight:900;">+${expenseIncreasePct.toFixed(0)}%</span>
      </div>
    `;


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
     解決方案 / Whole Picture
  ================================= */

  function getOneOffWithdrawalMode() {
    const selected =
      document.querySelector(
        'input[name="oneOffWithdrawalMode"]:checked'
      );

    return selected
      ? selected.value
      : "normal";
  }


  function calculateOneOffFourPercentProjection(
    startAssets,
    annualRate
  ) {

    const {
      retirementYears
    } = getBasicData();

    const initialAssets =
      Math.max(
        Number(startAssets) || 0,
        0
      );

    const annualWithdrawal =
      initialAssets * 0.04;

    let balance =
      initialAssets;

    let totalWithdrawn = 0;

    for (
      let year = 0;
      year < retirementYears;
      year++
    ) {

      const take =
        Math.min(
          balance,
          annualWithdrawal
        );

      balance -= take;
      totalWithdrawn += take;

      balance *=
        1 + annualRate;
    }

    return {
      initialAssets,
      annualWithdrawal,
      monthlyWithdrawal:
        annualWithdrawal / 12,
      totalWithdrawn,
      endingAssets:
        Math.max(balance, 0)
    };
  }


  function simulateFinalRetirementPicture() {
    const gapData = calculateGap();
    const simulation = gapData.simulation;
    const solution = calculateStep7Solutions();
    const fourPercent = getOneOffWithdrawalMode() === "fourPercent";

    const pools = {
      lump: Math.max(solution.lumpFuture || 0, 0),
      saving: Math.max(solution.savingFuture || 0, 0),
      oneOff: Math.max(solution.oneOffInvestmentFuture || 0, 0),
      tenYear: Math.max(solution.tenYearInvestmentFuture || 0, 0)
    };

    /*
      Step 8 與 Step 7 分開：
      Step 7 負責累積方案；Step 8 負責退休後實際使用次序。

      晚年簡化原則：
      較需要管理／市場波動較高的投資資產較早補位，
      較簡單的儲蓄及整筆安排留到較後。
    */
    const solutionUseOrder = [
      "oneOff",
      "tenYear",
      "lump",
      "saving"
    ];

    const oneOffAnnualLimit = pools.oneOff * 0.04;
    let totalSolutionUsed = 0;
    let remainingGap = 0;

    const rows = simulation.rows.map(row => {
      let need = Math.max(row.unmetShortfall || 0, 0);

      const solutionWithdrawals = {
        lump: 0,
        saving: 0,
        oneOff: 0,
        tenYear: 0
      };

      const usePool = (key, limit = Infinity) => {
        if (need <= 0 || pools[key] <= 0) return;

        const take = Math.min(
          need,
          pools[key],
          limit
        );

        pools[key] -= take;
        need -= take;
        solutionWithdrawals[key] += take;
        totalSolutionUsed += take;
      };

      solutionUseOrder.forEach(key => {
        if (
          key === "oneOff" &&
          fourPercent
        ) {
          usePool(
            "oneOff",
            oneOffAnnualLimit
          );
        } else {
          usePool(key);
        }
      });

      if (
        fourPercent &&
        pools.oneOff > 0
      ) {
        pools.oneOff *=
          1 + percentage("oneOffInvestmentReturn");
      }

      remainingGap += need;

      return {
        ...row,
        solutionWithdrawals,
        solutionUsed:
          Object.values(solutionWithdrawals)
            .reduce((a, b) => a + b, 0),
        remainingShortfall: need,
        solutionBalances: { ...pools }
      };
    });

    return {
      rows,
      totalSolutionUsed,
      remainingGap,
      endingSolutionAssets:
        Object.values(pools)
          .reduce((a, b) => a + b, 0),
      solution,
      simulation,
      solutionUseOrder
    };
  }


  function createStep8GapTimelineChart(finalPicture) {
    const rows = finalPicture.rows || [];

    if (!rows.length) {
      return "";
    }

    const basic = getBasicData();
    const startAge = basic.retirementAge;
    const endAge = basic.lifeExpectancy;
    const totalYears = Math.max(endAge - startAge, 1);

    const originalShortfallRows =
      rows.filter(
        row =>
          (row.unmetShortfall || 0) > 0
      );

    const firstGapAge =
      originalShortfallRows.length
        ? originalShortfallRows[0].age
        : null;

    const baseEndAge =
      firstGapAge !== null
        ? Math.max(
            startAge,
            firstGapAge - 1
          )
        : endAge;

    const age80Pct =
      startAge < 80 &&
      endAge > 80
        ? (
            (80 - startAge) /
            totalYears
          ) * 100
        : null;

    const makeTrack = (
      leftPct,
      widthPct,
      color
    ) => `
      <div style="position:relative;height:18px;border-radius:999px;background:#eee7da;overflow:hidden;">
        ${
          age80Pct !== null
            ? `
              <div style="position:absolute;left:${age80Pct}%;top:0;width:2px;height:100%;background:#7f1020;opacity:.55;z-index:2;"></div>
            `
            : ""
        }
        <div style="position:absolute;left:${leftPct}%;width:${widthPct}%;height:100%;border-radius:999px;background:${color};"></div>
      </div>
    `;

    const baseWidthPct =
      Math.max(
        3,
        Math.min(
          100,
          (
            (baseEndAge - startAge + 1) /
            totalYears
          ) * 100
        )
      );

    const baseRow = `
      <div style="display:grid;grid-template-columns:150px 1fr 120px;gap:10px;align-items:center;margin:9px 0;">
        <strong style="color:#122f57;font-size:11px;">現有資產基礎</strong>
        ${makeTrack(0, baseWidthPct, "#bfc8d4")}
        <span style="text-align:right;color:#687386;font-size:10px;">
          ${
            firstGapAge !== null
              ? `${startAge}–${baseEndAge}歲`
              : `${startAge}–${endAge}歲`
          }
        </span>
      </div>
    `;

    const solutionKeys = [
      ["oneOff", "一次性投資", "#7f1020"],
      ["tenYear", "十年投資計劃", "#122f57"],
      ["lump", "靈活整筆投入", "#d7a922"],
      ["saving", "五年儲蓄計劃", "#6d7f99"]
    ];

    const bars =
      solutionKeys
        .map(
          ([key, label, color]) => {

            const usedRows =
              rows.filter(
                row =>
                  row.solutionWithdrawals &&
                  (
                    row.solutionWithdrawals[key] ||
                    0
                  ) > 0
              );

            if (!usedRows.length) {
              return "";
            }

            const first =
              usedRows[0].age;

            const last =
              usedRows[
                usedRows.length - 1
              ].age;

            const leftPct =
              Math.max(
                0,
                (
                  (first - startAge) /
                  totalYears
                ) * 100
              );

            const widthPct =
              Math.max(
                3,
                Math.min(
                  100 - leftPct,
                  (
                    (last - first + 1) /
                    totalYears
                  ) * 100
                )
              );

            const totalUsed =
              usedRows.reduce(
                (total, row) =>
                  total +
                  (
                    row.solutionWithdrawals[key] ||
                    0
                  ),
                0
              );

            return `
              <div style="display:grid;grid-template-columns:150px 1fr 120px;gap:10px;align-items:center;margin:9px 0;">
                <strong style="color:#122f57;font-size:11px;">${label}</strong>
                ${makeTrack(leftPct, widthPct, color)}
                <span style="text-align:right;color:#687386;font-size:10px;">${first}–${last}歲 · ${money(totalUsed)}</span>
              </div>
            `;
          }
        )
        .join("");

    const finalShortfallRows =
      rows.filter(
        row =>
          (row.remainingShortfall || 0) > 0
      );

    const resultText =
      finalShortfallRows.length
        ? `尚有缺口 ${money(finalPicture.remainingGap)}`
        : `已覆蓋至 ${endAge} 歲`;

    const age80Label =
      age80Pct !== null
        ? `
          <div style="display:grid;grid-template-columns:150px 1fr 120px;gap:10px;align-items:center;margin-bottom:4px;">
            <span></span>
            <div style="position:relative;height:14px;">
              <span style="position:absolute;left:${age80Pct}%;transform:translateX(-50%);color:#7f1020;font-size:8px;font-weight:900;white-space:nowrap;">80歲 · 晚年簡化</span>
            </div>
            <span></span>
          </div>
        `
        : "";

    return `
      <div style="padding:14px;border:1px solid #eadfcd;border-radius:14px;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="color:#687386;font-size:10px;">${startAge}歲</span>
          <strong style="color:${finalShortfallRows.length ? "#7f1020" : "#122f57"};font-size:12px;">${resultText}</strong>
          <span style="color:#687386;font-size:10px;">${endAge}歲</span>
        </div>

        ${age80Label}
        ${baseRow}
        ${
          bars ||
          '<div style="padding:12px;color:#687386;font-size:11px;text-align:center;">Step 7 尚未設定補位方案。</div>'
        }
      </div>
    `;
  }
  function createStep8GapPieChart(
    preparedResources,
    gapAmount
  ) {
    const prepared =
      Math.max(
        Number(preparedResources) || 0,
        0
      );

    const gap =
      Math.max(
        Number(gapAmount) || 0,
        0
      );

    const total =
      Math.max(
        prepared + gap,
        1
      );

    const preparedPct =
      Math.max(
        0,
        Math.min(
          100,
          (prepared / total) * 100
        )
      );

    const gapPct =
      Math.max(
        0,
        Math.min(
          100,
          (gap / total) * 100
        )
      );

    /*
      Exploded Pie：
      用 SVG 真正畫出兩塊實心 Pie，
      缺口那一塊向外拉開，形成「補上這一塊就完整」的視覺。
    */

    const size = 290;
    const cx = 145;
    const cy = 145;
    const radius = 104;

    const gapAngle =
      gapPct / 100 * 360;

    /*
      將缺口置於左下方，較似「尚待補上的最後一塊」。
    */
    const gapMidAngle = 220;
    const gapStartAngle =
      gapMidAngle - gapAngle / 2;

    const gapEndAngle =
      gapMidAngle + gapAngle / 2;

    const polar = (
      centerX,
      centerY,
      r,
      angleDeg
    ) => {
      const rad =
        (angleDeg - 90) *
        Math.PI /
        180;

      return {
        x:
          centerX +
          r * Math.cos(rad),

        y:
          centerY +
          r * Math.sin(rad)
      };
    };

    const slicePath = (
      centerX,
      centerY,
      r,
      startAngle,
      endAngle
    ) => {
      const start =
        polar(
          centerX,
          centerY,
          r,
          endAngle
        );

      const end =
        polar(
          centerX,
          centerY,
          r,
          startAngle
        );

      const largeArcFlag =
        endAngle -
          startAngle <=
        180
          ? 0
          : 1;

      return [
        `M ${centerX} ${centerY}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        "Z"
      ].join(" ");
    };

    const gapOffset = 22;
    const gapMidRad =
      (gapMidAngle - 90) *
      Math.PI /
      180;

    const gapCx =
      cx +
      gapOffset *
      Math.cos(gapMidRad);

    const gapCy =
      cy +
      gapOffset *
      Math.sin(gapMidRad);

    const fullCirclePath = `
      M ${cx} ${cy - radius}
      A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}
      Z
    `;

    const gapPath =
      gapPct > 0
        ? slicePath(
            gapCx,
            gapCy,
            radius,
            gapStartAngle,
            gapEndAngle
          )
        : "";

    /*
      主體先畫完整藍色圓，再用背景色切走缺口位置；
      再將鮮紅缺口向外拉開。
    */
    const cutoutPath =
      gapPct > 0
        ? slicePath(
            cx,
            cy,
            radius + 2,
            gapStartAngle,
            gapEndAngle
          )
        : "";

    const gapLabelAngle =
      gapMidAngle;

    const gapLabelPos =
      polar(
        gapCx,
        gapCy,
        radius * 0.60,
        gapLabelAngle
      );

    const preparedLabelAngle =
      (gapMidAngle + 180) % 360;

    const preparedLabelPos =
      polar(
        cx,
        cy,
        radius * 0.52,
        preparedLabelAngle
      );

    return `
      <div
        style="
          display:grid;
          justify-items:center;
          gap:8px;
        "
      >
        <svg
          viewBox="0 0 ${size} ${size}"
          width="100%"
          style="
            max-width:340px;
            display:block;
            overflow:visible;
          "
          aria-label="退休資金缺口圓餅圖"
        >
          <defs>
            <linearGradient
              id="terraPreparedPie"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stop-color="#006BFF"
              />
              <stop
                offset="100%"
                stop-color="#123A8C"
              />
            </linearGradient>

            <linearGradient
              id="terraGapPie"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stop-color="#FF3B30"
              />
              <stop
                offset="100%"
                stop-color="#C8102E"
              />
            </linearGradient>

            <filter
              id="terraPieShadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="170%"
            >
              <feDropShadow
                dx="0"
                dy="10"
                stdDeviation="8"
                flood-color="#122f57"
                flood-opacity=".20"
              />
            </filter>

            <filter
              id="terraGapShadow"
              x="-40%"
              y="-40%"
              width="180%"
              height="190%"
            >
              <feDropShadow
                dx="0"
                dy="12"
                stdDeviation="7"
                flood-color="#7f1020"
                flood-opacity=".30"
              />
            </filter>
          </defs>

          <g filter="url(#terraPieShadow)">
            <path
              d="${fullCirclePath}"
              fill="url(#terraPreparedPie)"
            />

            ${
              gapPct > 0
                ? `
                  <path
                    d="${cutoutPath}"
                    fill="#fffdf8"
                  />
                `
                : ""
            }
          </g>

          ${
            gapPct > 0
              ? `
                <path
                  d="${gapPath}"
                  fill="url(#terraGapPie)"
                  filter="url(#terraGapShadow)"
                  stroke="#ffffff"
                  stroke-width="3"
                />
              `
              : ""
          }

          <text
            x="${preparedLabelPos.x}"
            y="${preparedLabelPos.y - 6}"
            text-anchor="middle"
            fill="#ffffff"
            font-size="13"
            font-weight="900"
          >
            已準備
          </text>

          <text
            x="${preparedLabelPos.x}"
            y="${preparedLabelPos.y + 16}"
            text-anchor="middle"
            fill="#ffffff"
            font-size="22"
            font-weight="900"
          >
            ${preparedPct.toFixed(0)}%
          </text>

          ${
            gapPct > 0
              ? `
                <text
                  x="${gapLabelPos.x}"
                  y="${gapLabelPos.y - 5}"
                  text-anchor="middle"
                  fill="#ffffff"
                  font-size="11"
                  font-weight="900"
                >
                  缺口
                </text>

                <text
                  x="${gapLabelPos.x}"
                  y="${gapLabelPos.y + 14}"
                  text-anchor="middle"
                  fill="#ffffff"
                  font-size="19"
                  font-weight="900"
                >
                  ${gapPct.toFixed(0)}%
                </text>
              `
              : ""
          }
        </svg>

        <div
          style="
            display:flex;
            gap:16px;
            flex-wrap:wrap;
            justify-content:center;
            font-size:10px;
            font-weight:800;
          "
        >
          <span style="color:#123A8C;">
            ● 已準備 ${preparedPct.toFixed(0)}%
          </span>

          <span style="color:#E31B23;">
            ● 缺口 ${gapPct.toFixed(0)}%
          </span>
        </div>
      </div>
    `;
  }


  function updateActionPlan() {

    const basic =
      getBasicData();

    const gapData =
      calculateGap();

    const simulation =
      gapData.simulation;

    const solution =
      calculateStep7Solutions();

    const currentGap =
      Math.max(
        simulation.fundingGap || 0,
        0
      );

    const solutionTotal =
      Math.max(
        solution.totalFuture || 0,
        0
      );

    const coverage =
      currentGap > 0
        ? (
            solutionTotal /
            currentGap
          ) * 100
        : 100;

    const remainingGap =
      Math.max(
        currentGap -
        solutionTotal,
        0
      );

    const surplus =
      Math.max(
        solutionTotal -
        currentGap,
        0
      );

    const combinedRetirementAssets =
      Math.max(
        simulation.initialAssets || 0,
        0
      ) +
      solutionTotal;

    const setText =
      (
        id,
        value
      ) => {
        const el =
          document.getElementById(id);
        if (el) {
          el.textContent = value;
        }
      };

    const clientInfo =
      getClientInfo();

    setText(
      "step8ClientName",
      clientInfo.clientName
    );

    setText(
      "step8PlanningDate",
      formatDateHK(
        clientInfo.planningDate
      )
    );

    setText(
      "step8RetirementAge",
      `${basic.retirementAge}歲`
    );

    setText(
      "step8LifeExpectancy",
      `${basic.lifeExpectancy}歲`
    );

    setText(
      "step8MonthlyExpense",
      money(
        gapData.expense
          .firstMonthlyExpense
      )
    );

    setText(
      "step8TotalExpense",
      money(
        gapData.expense
          .totalExpense
      )
    );

    setText(
      "step8ProjectedAssets",
      money(
        simulation.initialAssets
      )
    );

    setText(
      "step8Gap",
      money(currentGap)
    );

    const preparedResources =
      Math.max(
        gapData.expense.totalExpense -
        currentGap,
        0
      );

    setText(
      "step8PreparedResources",
      money(preparedResources)
    );

    setText(
      "step8GapOverviewAmount",
      money(currentGap)
    );

    const gapDonut =
      document.getElementById(
        "step8GapPieChart"
      );

    if (gapDonut) {
      gapDonut.innerHTML =
        createStep8GapPieChart(
          preparedResources,
          currentGap
        );
    }

    const positiveGapMessage =
      document.getElementById(
        "step8PositiveGapMessage"
      );

    if (positiveGapMessage) {
      positiveGapMessage.textContent =
        currentGap > 0
          ? `只需要再準備 ${money(currentGap)}，便可享受更完善的退休生活。`
          : "你的退休資源已覆蓋目前規劃需要，可繼續為更理想的退休生活增加儲備。";
    }

    setText(
      "step8SolutionTotal",
      money(solutionTotal)
    );

    setText(
      "step8CoverageText",
      `覆蓋率 ${Math.max(coverage,0).toFixed(0)}%`
    );

    setText(
      "step8LumpFuture",
      money(solution.lumpFuture)
    );

    setText(
      "step8SavingFuture",
      money(solution.savingFuture)
    );

    setText(
      "step8OneOffInvestmentFuture",
      money(solution.oneOffInvestmentFuture)
    );

    setText(
      "step8TenYearInvestmentFuture",
      money(solution.tenYearInvestmentFuture)
    );

    setText(
      "step8InvestmentFuture",
      money(solution.investmentFuture)
    );

    setText(
      "step8CombinedRetirementAssets",
      money(combinedRetirementAssets)
    );

    const gapHero =
      document.getElementById(
        "step8GapHero"
      );

    const gapMessage =
      document.getElementById(
        "step8GapMessage"
      );

    const balanceLabel =
      document.getElementById(
        "step8BalanceLabel"
      );

    const outcomeHeadline =
      document.getElementById(
        "step8OutcomeHeadline"
      );

    if (
      currentGap <= 0
    ) {

      if (gapHero) {
        gapHero.style.background =
          "#122f57";
      }

      if (gapMessage) {
        gapMessage.textContent =
          `按目前 Step 6 假設，退休資產可支持至 ${simulation.lifeExpectancy} 歲；Step 7 方案可作額外退休安全儲備。`;
      }

      if (balanceLabel) {
        balanceLabel.textContent =
          "額外退休儲備";
      }

      setText(
        "step8Balance",
        money(solutionTotal)
      );

      if (outcomeHeadline) {
        outcomeHeadline.textContent =
          "現有退休基礎已足夠，方案可增加安全墊";
      }

    } else if (
      remainingGap > 0
    ) {

      if (gapHero) {
        gapHero.style.background =
          "#7f1020";
      }

      if (gapMessage) {
        gapMessage.textContent =
          `退休資金缺口為 ${money(currentGap)}，下一步集中補足這部分。`;
      }

      if (balanceLabel) {
        balanceLabel.textContent =
          "尚餘缺口";
      }

      setText(
        "step8Balance",
        money(remainingGap)
      );

      if (outcomeHeadline) {
        outcomeHeadline.textContent =
          `方案已向目標推進 ${Math.min(Math.max(coverage,0),999).toFixed(0)}%`;
      }

    } else {

      if (gapHero) {
        gapHero.style.background =
          "#122f57";
      }

      if (gapMessage) {
        gapMessage.textContent =
          "按目前假設，Step 7 建議方案的退休時預計價值已可覆蓋退休資金缺口。";
      }

      if (balanceLabel) {
        balanceLabel.textContent =
          "退休時方案預計高於缺口";
      }

      setText(
        "step8Balance",
        money(surplus)
      );

      if (outcomeHeadline) {
        outcomeHeadline.textContent =
          "建議方案已覆蓋退休資金缺口";
      }
    }

    const finalPicture =
      simulateFinalRetirementPicture();
    const timeline =
      document.getElementById(
        "step8GapTimelineChart"
      );

    if (timeline) {
      timeline.innerHTML =
        createStep8GapTimelineChart(
          finalPicture
        );
    }


    const fourPercentCard =
      document.getElementById(
        "step8FourPercentCard"
      );

    const useFourPercent =
      getOneOffWithdrawalMode() ===
        "fourPercent" &&
      solution.oneOffInvestmentFuture > 0;

    if (fourPercentCard) {
      fourPercentCard.hidden =
        !useFourPercent;
    }

    if (useFourPercent) {

      const projection =
        calculateOneOffFourPercentProjection(
          solution.oneOffInvestmentFuture,
          percentage(
            "oneOffInvestmentReturn"
          )
        );

      setText(
        "step8FourPercentStartAssets",
        money(projection.initialAssets)
      );

      setText(
        "step8FourPercentAnnual",
        money(projection.annualWithdrawal)
      );

      setText(
        "step8FourPercentMonthly",
        money(projection.monthlyWithdrawal)
      );

      setText(
        "step8FourPercentLegacy",
        money(projection.endingAssets)
      );
    }
  }


  function getStep8ShareText() {

    const basic =
      getBasicData();

    const gapData =
      calculateGap();

    const solution =
      calculateStep7Solutions();

    const simulation =
      gapData.simulation;

    const gap =
      Math.max(
        simulation.fundingGap || 0,
        0
      );

    const balance =
      solution.totalFuture >= gap
        ? `退休時方案預計高於缺口：${money(solution.totalFuture - gap)}（只代表退休時方案預計價值與 Step 6 退休期累積缺口的差額，並非預計壽命時剩餘資產）`
        : `尚餘缺口：${money(gap - solution.totalFuture)}`;

    const clientInfo =
      getClientInfo();

    const lines = [
      "TERRA 退休解決方案",
      "",
      `客戶姓名：${clientInfo.clientName}`,
      `規劃日期：${formatDateHK(clientInfo.planningDate)}`,
      "",
      `退休目標：${basic.retirementAge}歲退休，規劃至${basic.lifeExpectancy}歲`,
      `退休首年每月生活費：${money(gapData.expense.firstMonthlyExpense)}`,
      `總退休生活費用：${money(gapData.expense.totalExpense)}`,
      `退休時預計現有資產：${money(simulation.initialAssets)}`,
      `退休資金缺口：${money(gap)}`,
      gap > 0
        ? `只需要再準備 ${money(gap)}，便可享受更完善的退休生活。`
        : "目前退休資源已覆蓋規劃需要。",
      `MPF預計開始動用年齡：${getMpfAccessAge()}歲`,
      `退休橋接期：${basic.retirementAge < getMpfAccessAge() ? `${basic.retirementAge}–${getMpfAccessAge()}歲` : "沒有"}`,
      `半退休／過渡工作收入：${getSemiRetirementData().enabled ? `${money(getSemiRetirementData().income)}／月（${getSemiRetirementData().startAge}–${getSemiRetirementData().endAge}歲）` : "沒有"}`,
      "",
      "建議退休方案：",
      `靈活整筆投入：${money(solution.lumpFuture)}`,
      `五年儲蓄計劃：${money(solution.savingFuture)}`,
      `一次性投資方案：${money(solution.oneOffInvestmentFuture)}`,
      `十年投資計劃：${money(solution.tenYearInvestmentFuture)}`,
      `方案合計退休時預計價值：${money(solution.totalFuture)}`,
      balance,
      "",
      "退休資金使用原則：投資資產較早處理，逐步補位，晚年簡化管理。"
    ];

    if (
      getOneOffWithdrawalMode() ===
        "fourPercent" &&
      solution.oneOffInvestmentFuture > 0
    ) {

      const projection =
        calculateOneOffFourPercentProjection(
          solution.oneOffInvestmentFuture,
          percentage(
            "oneOffInvestmentReturn"
          )
        );

      lines.push(
        "",
        "4%退休提取參考（只適用於一次性投資方案）：",
        `每年參考提款：${money(projection.annualWithdrawal)}`,
        `平均每月參考現金流：${money(projection.monthlyWithdrawal)}`,
        `預計壽命時尚餘資產：${money(projection.endingAssets)}`,
        "*4% Rule 為經驗法則，並非保證回報、保證收入或保證本金不減。"
      );
    }

    lines.push(
      "",
      "下一步：確認退休目標、投入預算及方案組合，開始執行並每年檢視。",
      "",
      "*以上只作退休規劃及教育參考。"
    );

    return lines.join("\n");
  }


  /* =================================
     Step 9
     時間價值分析
  ================================= */

  function calculateCurrentStep7Principal() {

    const {
      yearsToRetire
    } = getBasicData();


    let lumpPrincipal = 0;


    for (
      let i = 1;
      i <= lumpSumEntryCount;
      i++
    ) {

      const year =
        Math.max(
          0,
          Math.min(
            number(
              `lumpSumYear${i}`
            ),
            yearsToRetire
          )
        );


      if (
        year <= yearsToRetire
      ) {

        lumpPrincipal +=
          number(
            `lumpSumAmount${i}`
          );
      }
    }


    const maxSavingCount =
      getMaxSavingPlanCount();


    let savingPrincipal = 0;


    for (
      let i = 1;
      i <= Math.min(
        savingPlanCount,
        maxSavingCount
      );
      i++
    ) {

      savingPrincipal +=
        number(
          `savingPlan${i}`
        ) *
        5;
    }


    let investmentPrincipal = 0;


    for (
      let i = 1;
      i <= oneOffInvestmentEntryCount;
      i++
    ) {

      const year =
        Math.max(
          0,
          Math.min(
            number(
              `oneOffInvestmentYear${i}`
            ),
            yearsToRetire
          )
        );


      if (
        year <= yearsToRetire
      ) {
        investmentPrincipal +=
          number(
            `oneOffInvestmentAmount${i}`
          );
      }
    }


    if (
      yearsToRetire >= 10
    ) {

      investmentPrincipal +=
        number(
          "investmentContribution"
        ) *
        10;
    }


    if (
      investmentTopUpEnabled &&
      yearsToRetire >= 20
    ) {

      investmentPrincipal +=
        number(
          "investmentTopUp"
        ) *
        10;
    }


    return {
      lumpPrincipal,
      savingPrincipal,
      investmentPrincipal,
      totalPrincipal:
        lumpPrincipal +
        savingPrincipal +
        investmentPrincipal
    };
  }


  function calculateDelayedStep7Scenario(
    delayYears = 5
  ) {

    const {
      yearsToRetire
    } = getBasicData();


    const target =
      calculateStep7Solutions();


    const lumpRate =
      percentage(
        "lumpSumReturn"
      );


    const savingRate =
      percentage(
        "savingPlanReturn"
      );


    const investmentRate =
      percentage(
        "futureInvestmentReturn"
      );


    let delayedLumpFuture = 0;
    let delayedLumpPrincipal = 0;


    for (
      let i = 1;
      i <= lumpSumEntryCount;
      i++
    ) {

      const originalYear =
        Math.max(
          0,
          Math.min(
            number(
              `lumpSumYear${i}`
            ),
            yearsToRetire
          )
        );


      const delayedYear =
        originalYear +
        delayYears;


      const amount =
        number(
          `lumpSumAmount${i}`
        );


      if (
        delayedYear >
        yearsToRetire
      ) {

        continue;
      }


      delayedLumpPrincipal +=
        amount;


      const growthYears =
        Math.max(
          yearsToRetire -
          delayedYear -
          4,
          0
        );


      delayedLumpFuture +=
        amount *
        Math.pow(
          1 + lumpRate,
          growthYears
        );
    }


    const maxSavingCount =
      getMaxSavingPlanCount();


    let delayedSavingFuture = 0;
    let delayedSavingPrincipal = 0;


    for (
      let i = 1;
      i <= Math.min(
        savingPlanCount,
        maxSavingCount
      );
      i++
    ) {

      const delayedStartYear =
        (i - 1) *
        5 +
        delayYears;


      const annualAmount =
        number(
          `savingPlan${i}`
        );


      /*
        要完整完成5年供款，
        最後一次供款不能遲過退休時點。
      */

      if (
        delayedStartYear + 5 >
        yearsToRetire
      ) {

        continue;
      }


      const principal =
        annualAmount *
        5;


      delayedSavingPrincipal +=
        principal;


      const growthYears =
        Math.max(
          yearsToRetire -
          delayedStartYear -
          7,
          0
        );


      delayedSavingFuture +=
        principal *
        Math.pow(
          1 + savingRate,
          growthYears
        );
    }


    let delayedInvestmentFuture = 0;
    let delayedInvestmentPrincipal = 0;


    /*
      一次性投資方案：每一筆整體延遲5年，
      只要仍在退休前，就按相同回報率累積。
    */

    const oneOffInvestmentRate =
      percentage(
        "oneOffInvestmentReturn"
      );


    for (
      let i = 1;
      i <= oneOffInvestmentEntryCount;
      i++
    ) {

      const originalYear =
        Math.max(
          0,
          Math.min(
            number(
              `oneOffInvestmentYear${i}`
            ),
            yearsToRetire
          )
        );

      const delayedYear =
        originalYear +
        delayYears;

      const amount =
        number(
          `oneOffInvestmentAmount${i}`
        );

      if (
        delayedYear > yearsToRetire
      ) {
        continue;
      }

      delayedInvestmentPrincipal +=
        amount;

      delayedInvestmentFuture +=
        amount *
        Math.pow(
          1 + oneOffInvestmentRate,
          Math.max(
            yearsToRetire - delayedYear,
            0
          )
        );
    }


    /*
      第1個10年投資：
      延遲5年後仍要有完整10年。
    */

    if (
      yearsToRetire >=
      delayYears + 10
    ) {

      const annualAmount =
        number(
          "investmentContribution"
        );


      delayedInvestmentPrincipal +=
        annualAmount *
        10;


      delayedInvestmentFuture +=
        futureValueOfAnnualContributions(
          annualAmount,
          investmentRate,
          delayYears,
          10,
          yearsToRetire
        );
    }


    /*
      第2個10年 TOP UP：
      原本第11年開始，延遲5年即第16年開始。
      必須仍有完整10年才納入。
    */

    if (
      investmentTopUpEnabled &&
      yearsToRetire >=
        delayYears + 20
    ) {

      const annualAmount =
        number(
          "investmentTopUp"
        );


      delayedInvestmentPrincipal +=
        annualAmount *
        10;


      delayedInvestmentFuture +=
        futureValueOfAnnualContributions(
          annualAmount,
          investmentRate,
          10 + delayYears,
          10,
          yearsToRetire
        );
    }


    const baseDelayedFuture =
      delayedLumpFuture +
      delayedSavingFuture +
      delayedInvestmentFuture;


    const baseDelayedPrincipal =
      delayedLumpPrincipal +
      delayedSavingPrincipal +
      delayedInvestmentPrincipal;


    const targetFuture =
      Math.max(
        target.totalFuture || 0,
        0
      );


    const scaleFactor =
      targetFuture > 0 &&
      baseDelayedFuture > 0
        ? targetFuture /
          baseDelayedFuture
        : 0;


    return {
      delayYears,
      targetFuture,
      baseDelayedFuture,
      baseDelayedPrincipal,
      scaleFactor,
      delayedPrincipal:
        baseDelayedPrincipal *
        scaleFactor,
      delayedLumpPrincipal:
        delayedLumpPrincipal *
        scaleFactor,
      delayedSavingPrincipal:
        delayedSavingPrincipal *
        scaleFactor,
      delayedInvestmentPrincipal:
        delayedInvestmentPrincipal *
        scaleFactor,
      lostInvestmentTopUp:
        investmentTopUpEnabled &&
        yearsToRetire <
          delayYears + 20
    };
  }


  function updateDelayNoMore() {

    const basic =
      getBasicData();


    const current =
      calculateCurrentStep7Principal();


    const delayed =
      calculateDelayedStep7Scenario(
        5
      );


    const setText =
      (
        id,
        value
      ) => {

        const el =
          document.getElementById(id);


        if (el) {
          el.textContent = value;
        }
      };


    const extraCost =
      Math.max(
        delayed.delayedPrincipal -
        current.totalPrincipal,
        0
      );


    const increasePct =
      current.totalPrincipal > 0
        ? (
            extraCost /
            current.totalPrincipal
          ) *
          100
        : 0;


    setText(
      "delayNowAge",
      `${basic.currentAge} 歲開始`
    );


    setText(
      "delayLaterAge",
      `${basic.currentAge + 5} 歲開始`
    );


    setText(
      "delayNowYears",
      `${basic.yearsToRetire} 年`
    );


    setText(
      "delayLaterYears",
      `${Math.max(basic.yearsToRetire - 5,0)} 年`
    );


    setText(
      "delayNowPrincipal",
      money(current.totalPrincipal)
    );


    setText(
      "delayLaterPrincipal",
      money(delayed.delayedPrincipal)
    );


    setText(
      "delayExtraCost",
      money(extraCost)
    );


    setText(
      "delayIncreasePct",
      `+${increasePct.toFixed(0)}%`
    );


    setText(
      "delayTargetFuture",
      money(delayed.targetFuture)
    );


    setText(
      "delayLumpNow",
      money(current.lumpPrincipal)
    );


    setText(
      "delaySavingNow",
      money(current.savingPrincipal)
    );


    setText(
      "delayInvestmentNow",
      money(current.investmentPrincipal)
    );


    setText(
      "delayLumpLater",
      money(delayed.delayedLumpPrincipal)
    );


    setText(
      "delaySavingLater",
      money(delayed.delayedSavingPrincipal)
    );


    setText(
      "delayInvestmentLater",
      money(delayed.delayedInvestmentPrincipal)
    );


    const hero =
      document.getElementById(
        "delayNoMoreHero"
      );


    const message =
      document.getElementById(
        "delayHeroMessage"
      );


    const methodNote =
      document.getElementById(
        "delayMethodNote"
      );


    if (
      delayed.targetFuture <= 0
    ) {

      if (hero) {
        hero.style.background =
          "#122f57";
      }


      setText(
        "delayExtraCost",
        "請先完成 Step 7"
      );


      setText(
        "delayIncreasePct",
        "—"
      );


      if (message) {
        message.textContent =
          "Step 7 尚未設定退休儲備方案，因此暫時未能計算延遲5年的代價。";
      }


      if (methodNote) {
        methodNote.textContent =
          "請返回 Step 7 輸入建議方案後，再作延遲比較。";
      }


      return;
    }


    if (
      delayed.baseDelayedFuture <= 0
    ) {

      if (hero) {
        hero.style.background =
          "#7f1020";
      }


      setText(
        "delayExtraCost",
        "時間不足"
      );


      setText(
        "delayIncreasePct",
        "—"
      );


      if (message) {
        message.textContent =
          "延遲5年後，現有方案結構已沒有足夠時間完成，因此不能用相同方式達到原本退休儲備目標。";
      }


      if (methodNote) {
        methodNote.textContent =
          "這代表延遲除了增加供款壓力，也可能令部分原定方案失去足夠完成年期，需要重新設計退休策略。";
      }


      return;
    }


    if (hero) {
      hero.style.background =
        "#7f1020";
    }


    if (message) {
      message.textContent =
        `若延遲5年，按同一退休時儲備目標估算，總投入由 ${money(current.totalPrincipal)} 增至約 ${money(delayed.delayedPrincipal)}。`;
    }


    if (methodNote) {

      let note =
        "計算方法：保持同一個退休目標及同一套回報假設，只把目前 Step 7 方案整體延遲5年；再按比例提高仍可完成的供款，使退休時預計價值回到與現在開始相同的目標。";


      if (
        delayed.lostInvestmentTopUp
      ) {

        note +=
          " 由於延遲後時間不足以完成第2個10年 TOP UP，該段不再納入，所需目標由其餘可完成方案承擔。";
      }


      note +=
        " 此為數學情境比較，並非產品報價或回報保證；重點是顯示延遲開始對所需投入的影響。";


      methodNote.textContent =
        note;
    }

  }


  /* =================================
     舊 Step 9 summary function
     保留以兼容，但新流程不再使用。
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
     Step 10
     Annual Review 客戶資料
  ================================= */

  function updateAnnualReview() {

    const clientInfo =
      getClientInfo();


    const setText =
      (
        id,
        value
      ) => {

        const el =
          document.getElementById(id);


        if (el) {
          el.textContent = value;
        }
      };


    setText(
      "step10ClientName",
      clientInfo.clientName
    );


    setText(
      "step10PlanningDate",
      formatDateHK(
        clientInfo.planningDate
      )
    );


    const nextReviewDate =
      addOneYearToDate(
        clientInfo.planningDate
      );


    setText(
      "step10NextReviewDate",
      nextReviewDate
        ? formatDateHK(
            nextReviewDate
          )
        : "12 個月內"
    );
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
      currentStep === 1
    ) {
      updateExpenseSplitPreview();
    }


    if (
      currentStep === 2
    ) {

      updateExpenseSummary();
    }


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
  currentStep === 5
) {

  syncSemiRetirementUI();
  updateGovernmentSupport();
  updateRetirementIncomeSummary();
}

    if (
      currentStep === 6
    ) {

      updateGapResult();
    }


    if (
      currentStep === 7
    ) {

      /*
        進入 Step 7 時才重新建立一次動態輸入結構，
        以套用最新「距離退休年期」。
        之後打字只更新結果，不再重建 input。
      */

      renderLumpSumEntries();

      renderSavingPlanEntries();

      renderOneOffInvestmentEntries();

      syncInvestmentPlanUI();

      updateStep7Results();
    }


    if (
      currentStep === 8
    ) {

      updateActionPlan();
    }


    if (
      currentStep === 9
    ) {

      updateDelayNoMore();
    }


    if (
      currentStep === 10
    ) {

      updateAnnualReview();
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


    const clientInfo =
      getClientInfo();


    if (
      clientInfo.clientName === "—"
    ) {

      alert(
        "請輸入客戶姓名。"
      );

      return false;
    }


    if (
      !clientInfo.planningDate
    ) {

      alert(
        "請輸入規劃日期。"
      );

      return false;
    }


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
     Step 6
     調整退休假設
  ================================= */

  const adjustRetirementAssumptionsBtn =
    document.getElementById(
      "adjustRetirementAssumptionsBtn"
    );


  if (
    adjustRetirementAssumptionsBtn
  ) {

    adjustRetirementAssumptionsBtn
      .addEventListener(
        "click",
        () => {

          /*
            保留所有已輸入資料，
            只直接返回 Step 1，
            讓顧問／客戶調高或調低
            退休年齡、生活費、壽命、
            通脹等核心假設。
          */

          showStep(1);

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

            const essentialPct =
              Number(card.dataset.essentialPct) || 70;

            const essentialInput =
              document.getElementById("essentialExpensePct");

            const enjoymentInput =
              document.getElementById("enjoymentExpensePct");

            if (essentialInput) essentialInput.value = essentialPct;
            if (enjoymentInput) enjoymentInput.value = Math.max(0, 100 - essentialPct);

            acceptedExpenseAuto =
              true;

            updateSuggestedAndAccepted();
            updateExpenseSplitPreview();
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
          updateExpenseSplitPreview();
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
          updateCashBufferTargetUI();
        }
      );
  }


  ["essentialExpensePct","enjoymentExpensePct"].forEach(
    id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const otherId = id === "essentialExpensePct" ? "enjoymentExpensePct" : "essentialExpensePct";
        const other = document.getElementById(otherId);
        const value = Math.max(0, Math.min(Number(el.value) || 0, 100));
        if (other) other.value = Math.max(0, 100 - value);
        updateExpenseSplitPreview();
      });
    }
  );


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

    "stockBalance",
    "stockReturn",

    "fundBalance",
    "fundReturn"
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
     Step 4
     MPF 即時更新
  ================================= */

  [
    "mpfBalance",
    "mpfMonthly",
    "mpfReturn"
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

            calculateMPF();
          }
        );


        el.addEventListener(
          "change",
          () => {

            calculateMPF();
          }
        );
      }
    }
  );


  /* =================================
     Step 4
     MPF 投資取向按鈕
  ================================= */

  mpfProfileCards.forEach(
    card => {

      card.addEventListener(
        "click",
        () => {

          mpfProfileCards.forEach(
            item => {

              item.style.borderColor =
                "#eadfcd";

              item.style.background =
                "#fffdf8";

              item.style.boxShadow =
                "none";
            }
          );


          card.style.borderColor =
            "#d7a922";

          card.style.background =
            "#fff9e8";

          card.style.boxShadow =
            "0 8px 22px rgba(18,47,87,0.10)";


          const selectedReturn =
            Number(
              card.dataset.mpfReturn
            ) || 0;


          const mpfReturnInput =
            document.getElementById(
              "mpfReturn"
            );


          if (mpfReturnInput) {

            mpfReturnInput.value =
              selectedReturn;
          }


          calculateMPF();
        }
      );
    }
  );


  /* =================================
     預設第一步
  ================================= */
/* =================================
   Step 5
   退休固定收入及其他支援
================================= */

const governmentSupportSelect =
  document.getElementById(
    "governmentSupportSelect"
  );


const governmentSupportInput =
  document.getElementById(
    "governmentSupport"
  );


const terraInfoToggles =
  document.querySelectorAll(
    ".terra-info-toggle"
  );


/* =================================
   Step 5
   資料說明 ? 開關
================================= */

terraInfoToggles.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const targetId =
          button.dataset.target;


        const panel =
          document.getElementById(
            targetId
          );


        if (!panel) {

          return;
        }


        const isOpen =
          !panel.hidden;


        panel.hidden =
          isOpen;


        button.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );


        /*
          TERRA style：
          展開時轉金色
        */

        if (!isOpen) {

          button.style.background =
            "#d7a922";

          button.style.color =
            "#122f57";

          button.style.transform =
            "scale(1.06)";

        } else {

          button.style.background =
            "#122f57";

          button.style.color =
            "#ffffff";

          button.style.transform =
            "scale(1)";
        }

      }
    );

  }
);


/* =================================
   Step 5
   政府津貼選擇
================================= */

function updateGovernmentSupport() {

  if (
    !governmentSupportSelect ||
    !governmentSupportInput
  ) {

    return;
  }


  const amount =
    Number(
      governmentSupportSelect.value
    ) || 0;


  governmentSupportInput.value =
    amount;


  updateRetirementIncomeSummary();
}


if (governmentSupportSelect) {

  governmentSupportSelect
    .addEventListener(
      "change",
      updateGovernmentSupport
    );
}


/* =================================
   Step 5
   每月收入總覽
================================= */

function updateRetirementIncomeSummary() {

  const government =
    number(
      "governmentSupport"
    );


  const family =
    number(
      "familySupport"
    );


  const rental =
    number(
      "rentalIncome"
    );


  const annuity =
    number(
      "hkAnnuity"
    );


  const reverseMortgage =
    number(
      "reverseMortgage"
    );


  const other =
    number(
      "otherIncome"
    );

  const semiRetirement =
    getSemiRetirementData();

  const semiIncome =
    semiRetirement.enabled
      ? semiRetirement.income
      : 0;


  const total =
    government +
    family +
    rental +
    annuity +
    reverseMortgage +
    other +
    semiIncome;


  const previewMap = {

    incomeGovernmentPreview:
      government,

    incomeFamilyPreview:
      family,

    incomeRentalPreview:
      rental,

    incomeAnnuityPreview:
      annuity,

    incomeReverseMortgagePreview:
      reverseMortgage,

    incomeSemiRetirementPreview:
      semiIncome,

    incomeOtherPreview:
      other,

    monthlyRetirementIncomeTotal:
      total
  };


  Object.entries(
    previewMap
  ).forEach(
    ([id, value]) => {

      const el =
        document.getElementById(id);


      if (el) {

        el.textContent =
          money(value);
      }

    }
  );
}


/* =================================
   Step 5
   所有收入即時更新
================================= */

[
  "familySupport",
  "rentalIncome",
  "hkAnnuity",
  "reverseMortgage",
  "otherIncome"
].forEach(
  id => {

    const el =
      document.getElementById(id);


    if (!el) {

      return;
    }


    el.addEventListener(
      "input",
      updateRetirementIncomeSummary
    );


    el.addEventListener(
      "change",
      updateRetirementIncomeSummary
    );

  }
);


const semiRetirementEnabled =
  document.getElementById("semiRetirementEnabled");

if (semiRetirementEnabled) {
  semiRetirementEnabled.addEventListener("change", () => {
    const basic = getBasicData();
    const start = document.getElementById("semiRetirementStartAge");
    const end = document.getElementById("semiRetirementEndAge");
    if (semiRetirementEnabled.checked) {
      if (start && !start.value) start.value = basic.retirementAge || "";
      if (end && !end.value) end.value = Math.min(getMpfAccessAge(), basic.lifeExpectancy || getMpfAccessAge());
    }
    syncSemiRetirementUI();
    updateRetirementIncomeSummary();
  });
}

["semiRetirementIncome","semiRetirementStartAge","semiRetirementEndAge"].forEach(
  id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      syncSemiRetirementUI();
      updateRetirementIncomeSummary();
    });
    el.addEventListener("change", () => {
      syncSemiRetirementUI();
      updateRetirementIncomeSummary();
    });
  }
);

document.querySelectorAll('input[name="mpfAccessAge"]').forEach(
  input => {
    input.addEventListener("change", () => {
      updateRetirementIncomeSummary();
      if (currentStep === 6) updateGapResult();
    });
  }
);


/* =================================
   Step 5
   初次載入
================================= */

syncSemiRetirementUI();
updateGovernmentSupport();
updateRetirementIncomeSummary();
  /* =========================================
   STEP 6 DASHBOARD UPGRADE
   iPad Landscape / 退休資產可持續性分析
========================================= */


/* =========================================
   資產名稱及預設提款次序
========================================= */

const sustainabilityAssetLabels = {
  mpf: "MPF",
  stock: "股票",
  fund: "基金",
  fixed: "定息",
  insurance: "保險",
  cash: "銀行活期"
};


let withdrawalOrder = [
  "mpf",
  "stock",
  "fund",
  "fixed",
  "insurance",
  "cash"
];


let retirementScenario =
  "conservative";


/*
  Step 6 提款策略與回報假設分開。
  custom    = 使用顧問手動排序
  defensive = 優先低波動／高流動性資產
  harvest   = 優先較高增長資產作簡化收割情境
*/

let withdrawalMode =
  "custom";


const defensiveWithdrawalOrder = [
  "cash",
  "fixed",
  "insurance",
  "fund",
  "stock",
  "mpf"
];


const harvestWithdrawalOrder = [
  "stock",
  "fund",
  "mpf",
  "insurance",
  "fixed",
  "cash"
];



function getActiveWithdrawalOrder() {

  if (
    withdrawalMode ===
    "defensive"
  ) {

    return [
      ...defensiveWithdrawalOrder
    ];
  }


  if (
    withdrawalMode ===
    "harvest"
  ) {

    return [
      ...harvestWithdrawalOrder
    ];
  }


  return [
    ...withdrawalOrder
  ];
}

function getCashBufferTarget() {
  return Math.max(getRetirementMonthlyExpense() * 12, 0);
}

function updateCashBufferTargetUI() {
  const el = document.getElementById("cashBufferTarget");
  if (el) el.textContent = money(getCashBufferTarget());
}



function syncWithdrawalModeUI() {

  document
    .querySelectorAll(
      "[data-withdrawal-mode]"
    )
    .forEach(
      button => {

        const selected =
          button.dataset
            .withdrawalMode ===
          withdrawalMode;


        button.style.border =
          selected
            ? "2px solid #d7a922"
            : "1px solid #eadfcd";


        button.style.background =
          selected
            ? "#fff4cf"
            : "#ffffff";

      }
    );


  const note =
    document.getElementById(
      "withdrawalModeNote"
    );


  if (note) {

    if (
      withdrawalMode ===
      "defensive"
    ) {

      note.textContent =
        "流動性優先：先使用銀行活期、定息及較低波動資產，做法直接易明，但會較早消耗流動安全墊。";

    } else if (
      withdrawalMode ===
      "harvest"
    ) {

      note.textContent =
        "資產整理優先：較早處理股票、基金及需要較多管理的資產，目標是讓年紀較大時資產結構逐步簡化。";

    } else {

      note.textContent =
        "自訂次序：按 ↑ ↓ 自行設定提款先後，右邊結果會即時更新。";
    }
  }

}


/* =========================================
   退休前回報率
========================================= */

function getPreRetirementReturnRates() {

  return {
    mpf:
      percentage("mpfReturn"),

    stock:
      percentage("stockReturn"),

    fund:
      percentage("fundReturn"),

    fixed:
      percentage("fixedReturn"),

    insurance:
      percentage("insuranceReturn"),

    cash:
      percentage("cashReturn")
  };
}


/* =========================================
   較穩健退休後規劃假設

   注意：
   這不是市場預測或保證回報。
   只是在退休可持續性分析中，
   避免無條件沿用高增長假設。

   規則：
   退休後回報不高於退休前設定，
   並加入以下規劃上限。
========================================= */

function getConservativeRetirementReturns() {

  const pre =
    getPreRetirementReturnRates();


  return {
    mpf:
      Math.min(
        pre.mpf,
        0.035
      ),

    stock:
      Math.min(
        pre.stock,
        0.04
      ),

    fund:
      Math.min(
        pre.fund,
        0.04
      ),

    fixed:
      Math.min(
        pre.fixed,
        0.03
      ),

    insurance:
      Math.min(
        pre.insurance,
        0.04
      ),

    cash:
      Math.min(
        pre.cash,
        0.01
      )
  };
}


/* =========================================
   自訂退休後回報率
========================================= */

function getCustomRetirementReturns() {

  return {
    mpf:
      percentage(
        "retirementReturnMpf"
      ),

    stock:
      percentage(
        "retirementReturnStock"
      ),

    fund:
      percentage(
        "retirementReturnFund"
      ),

    fixed:
      percentage(
        "retirementReturnFixed"
      ),

    insurance:
      percentage(
        "retirementReturnInsurance"
      ),

    cash:
      percentage(
        "retirementReturnCash"
      )
  };
}


/* =========================================
   目前 Step 6 使用的退休後回報率
========================================= */

function getRetirementReturnRates() {

  if (
    retirementScenario ===
    "current"
  ) {

    return (
      getPreRetirementReturnRates()
    );
  }


  if (
    retirementScenario ===
    "custom"
  ) {

    return (
      getCustomRetirementReturns()
    );
  }


  return (
    getConservativeRetirementReturns()
  );
}


/* =========================================
   顯示退休前 / 退休後回報率
========================================= */

function syncRetirementReturnUI() {

  const pre =
    getPreRetirementReturnRates();


  let post;


  if (
    retirementScenario ===
    "current"
  ) {

    post = pre;

  } else if (
    retirementScenario ===
    "custom"
  ) {

    post =
      getCustomRetirementReturns();

  } else {

    post =
      getConservativeRetirementReturns();
  }


  const rows = {
    mpf: {
      preId:
        "preReturnMpf",
      postId:
        "retirementReturnMpf"
    },

    stock: {
      preId:
        "preReturnStock",
      postId:
        "retirementReturnStock"
    },

    fund: {
      preId:
        "preReturnFund",
      postId:
        "retirementReturnFund"
    },

    fixed: {
      preId:
        "preReturnFixed",
      postId:
        "retirementReturnFixed"
    },

    insurance: {
      preId:
        "preReturnInsurance",
      postId:
        "retirementReturnInsurance"
    },

    cash: {
      preId:
        "preReturnCash",
      postId:
        "retirementReturnCash"
    }
  };


  Object.entries(
    rows
  ).forEach(
    (
      [
        key,
        ids
      ]
    ) => {

      const preEl =
        document.getElementById(
          ids.preId
        );


      const postEl =
        document.getElementById(
          ids.postId
        );


      if (preEl) {

        preEl.textContent =
          (
            pre[key] *
            100
          )
            .toFixed(1) +
          "%";
      }


      if (
        postEl &&
        retirementScenario !==
          "custom"
      ) {

        postEl.value =
          (
            post[key] *
            100
          )
            .toFixed(1);
      }


      if (postEl) {

        postEl.disabled =
          retirementScenario !==
          "custom";


        postEl.style.background =
          retirementScenario ===
          "custom"
            ? "#ffffff"
            : "#f4f1e8";


        postEl.style.color =
          "#122f57";
      }

    }
  );


  const note =
    document.getElementById(
      "retirementScenarioNote"
    );


  if (note) {

    if (
      retirementScenario ===
      "conservative"
    ) {

      note.textContent =
        "較穩健：退休後回報不高於退休前設定，並使用 TERRA 規劃上限。此為規劃情境，不是回報保證。";

    } else if (
      retirementScenario ===
      "current"
    ) {

      note.textContent =
        "沿用目前：退休後仍使用 Step 3 / Step 4 的回報率。若股票或基金回報假設偏高，退休需求可能被低估。";

    } else {

      note.textContent =
        "自行設定：你可以逐項輸入退休後回報率，右邊結果會即時更新。";
    }

  }


  document
    .querySelectorAll(
      "[data-retirement-scenario]"
    )
    .forEach(
      button => {

        const selected =
          button.dataset
            .retirementScenario ===
          retirementScenario;


        button.style.border =
          selected
            ? "2px solid #d7a922"
            : "1px solid #eadfcd";


        button.style.background =
          selected
            ? "#fff4cf"
            : "#ffffff";

      }
    );
}


/* =========================================
   政府收入按年齡開始
========================================= */

function getGovernmentSupportAtAge(
  age
) {

  const select =
    document.getElementById(
      "governmentSupportSelect"
    );


  if (!select) {

    return 0;
  }


  const selectedOption =
    select.options[
      select.selectedIndex
    ];


  if (!selectedOption) {

    return 0;
  }


  const type =
    selectedOption.dataset
      .supportType;


  const amount =
    Number(
      select.value
    ) || 0;


  if (
    type === "oaa"
  ) {

    return age >= 70
      ? amount
      : 0;
  }


  if (
    type === "oala"
  ) {

    return age >= 65
      ? amount
      : 0;
  }


  return 0;
}


/* =========================================
   指定年齡固定退休收入
========================================= */

function getFixedIncomeAtAge(
  age
) {

  return (
    getGovernmentSupportAtAge(
      age
    ) +

    number(
      "familySupport"
    ) +

    number(
      "rentalIncome"
    ) +

    number(
      "hkAnnuity"
    ) +

    number(
      "reverseMortgage"
    ) +

    number(
      "otherIncome"
    ) +

    getSemiRetirementIncomeAtAge(
      age
    )
  );
}


/* =========================================
   升級退休固定收入計算
========================================= */

calculateRetirementIncome =
  function() {

    const {
      retirementAge,
      retirementYears
    } = getBasicData();


    const rows = [];

    let totalIncome = 0;


    for (
      let year = 0;
      year < retirementYears;
      year++
    ) {

      const age =
        retirementAge +
        year;


      const monthlyIncome =
        getFixedIncomeAtAge(
          age
        );


      const annualIncome =
        monthlyIncome *
        12;


      totalIncome +=
        annualIncome;


      rows.push({
        age,
        year:
          year + 1,
        monthlyIncome,
        annualIncome
      });
    }


    return {
      monthlyIncome:
        getFixedIncomeAtAge(
          retirementAge
        ),

      totalIncome,

      rows
    };

  };


/* =========================================
   資產總和
========================================= */

function sumSustainabilityAssets(
  balances
) {

  return Object
    .values(
      balances
    )
    .reduce(
      (
        total,
        value
      ) =>
        total +
        (
          Number(value) ||
          0
        ),
      0
    );
}


/* =========================================
   建立資產使用統計
========================================= */

function createAssetUsageStats(
  balances
) {

  const stats = {};


  Object.keys(
    balances
  ).forEach(
    key => {

      stats[key] = {
        initialBalance:
          balances[key] || 0,

        firstWithdrawalAge:
          null,

        lastWithdrawalAge:
          null,

        depletedAge:
          null,

        balanceAtFirstWithdrawal:
          null,

        totalWithdrawn:
          0
      };

    }
  );


  return stats;
}


/* =========================================
   退休資產年度模擬
========================================= */

function simulateRetirementSustainability(
  options = {}
) {

  const basic =
    getBasicData();


  const expenses =
    calculateRetirementExpenses();


  const assets =
    calculateAssets();


  const mpf =
    calculateMPF();


  let balances = {
    mpf,
    stock:
      assets.stock,
    fund:
      assets.fund,
    fixed:
      assets.fixed,
    insurance:
      assets.insurance,
    cash:
      assets.cash
  };


  const returns =
    options.returnRates ||
    getRetirementReturnRates();


  const order =
    options.withdrawalOrder ||
    getActiveWithdrawalOrder();


  const initialAssets =
    sumSustainabilityAssets(
      balances
    );


  const usageStats =
    createAssetUsageStats(
      balances
    );


  const rows = [];

  let fundingGap = 0;

  let firstShortfallAge =
    null;

  let totalGrowth = 0;

  let totalIncomeUsed = 0;

  let totalIncomeReceived = 0;

  let totalWithdrawals = 0;


  const growthByAsset = {
    mpf: 0,
    stock: 0,
    fund: 0,
    fixed: 0,
    insurance: 0,
    cash: 0
  };


  expenses.rows.forEach(
    expenseRow => {

      const age =
        expenseRow.age;


      const openingAssets =
        sumSustainabilityAssets(
          balances
        );


      const annualIncome =
        getFixedIncomeAtAge(
          age
        ) *
        12;


      const incomeUsed =
        Math.min(
          annualIncome,
          expenseRow.annualExpense
        );


      totalIncomeReceived +=
        annualIncome;


      totalIncomeUsed +=
        incomeUsed;


      const amountRequired =
        Math.max(
          expenseRow.annualExpense -
          incomeUsed,
          0
        );


      let remainingNeed =
        amountRequired;


      const withdrawals = {
        mpf: 0,
        stock: 0,
        fund: 0,
        fixed: 0,
        insurance: 0,
        cash: 0
      };


      order.forEach(
        assetKey => {

          if (
            remainingNeed <= 0
          ) {

            return;
          }


          /*
            一般退休情境：
            65歲前先不使用 MPF。
          */

          if (
            assetKey === "mpf" &&
            age < getMpfAccessAge()
          ) {

            return;
          }


          const rawAvailable =
            Math.max(
              balances[
                assetKey
              ] || 0,
              0
            );

          let available =
            rawAvailable;

          if (assetKey === "cash") {
            const buffer = getCashBufferTarget();
            const protectedCash = Math.max(rawAvailable - buffer, 0);
            const otherAvailable = order
              .filter(
                key =>
                  key !== "cash" &&
                  !(key === "mpf" && age < getMpfAccessAge())
              )
              .reduce(
                (total, key) =>
                  total + Math.max(balances[key] || 0, 0),
                0
              );

            available =
              otherAvailable >= remainingNeed
                ? protectedCash
                : rawAvailable;
          }


          if (
            available <= 0
          ) {

            return;
          }


          if (
            usageStats[
              assetKey
            ]
              .firstWithdrawalAge ===
            null
          ) {

            usageStats[
              assetKey
            ]
              .firstWithdrawalAge =
              age;


            usageStats[
              assetKey
            ]
              .balanceAtFirstWithdrawal =
              available;
          }


          const take =
            Math.min(
              available,
              remainingNeed
            );


          balances[
            assetKey
          ] -=
            take;


          withdrawals[
            assetKey
          ] +=
            take;


          usageStats[
            assetKey
          ]
            .totalWithdrawn +=
            take;


          usageStats[
            assetKey
          ]
            .lastWithdrawalAge =
            age;


          remainingNeed -=
            take;


          if (
            balances[
              assetKey
            ] <= 0.01
          ) {

            balances[
              assetKey
            ] = 0;


            usageStats[
              assetKey
            ]
              .depletedAge =
              age;
          }

        }
      );


      const totalWithdrawal =
        Object
          .values(
            withdrawals
          )
          .reduce(
            (
              total,
              value
            ) =>
              total +
              value,
            0
          );


      totalWithdrawals +=
        totalWithdrawal;


      const unmetShortfall =
        Math.max(
          remainingNeed,
          0
        );


      if (
        unmetShortfall > 0
      ) {

        fundingGap +=
          unmetShortfall;


        if (
          firstShortfallAge ===
          null
        ) {

          firstShortfallAge =
            age;
        }

      }


      /*
        年末：
        未提款的餘額繼續按退休後回報增值。
      */

      let annualGrowth = 0;


      Object.keys(
        balances
      ).forEach(
        assetKey => {

          const currentBalance =
            balances[
              assetKey
            ] || 0;


          if (
            currentBalance <= 0
          ) {

            return;
          }


          const growth =
            currentBalance *
            (
              returns[
                assetKey
              ] || 0
            );


          balances[
            assetKey
          ] +=
            growth;


          annualGrowth +=
            growth;


          growthByAsset[
            assetKey
          ] +=
            growth;

        }
      );


      totalGrowth +=
        annualGrowth;


      const endingAssets =
        sumSustainabilityAssets(
          balances
        );


      rows.push({
        age,
        year:
          expenseRow.year,
        annualExpense:
          expenseRow.annualExpense,
        annualIncome,
        incomeUsed,
        amountRequired,
        totalWithdrawal,
        unmetShortfall,
        openingAssets,
        annualGrowth,
        endingAssets,
        withdrawals,
        balances:
          {
            ...balances
          }
      });

    }
  );


  const endingAssets =
    sumSustainabilityAssets(
      balances
    );


  Object.keys(
    usageStats
  ).forEach(
    key => {

      usageStats[
        key
      ].endingBalance =
        balances[
          key
        ] || 0;


      const first =
        usageStats[
          key
        ].firstWithdrawalAge;


      const last =
        usageStats[
          key
        ].lastWithdrawalAge;


      usageStats[
        key
      ].yearsUsed =
        first !== null &&
        last !== null
          ? (
              last -
              first +
              1
            )
          : 0;

    }
  );


  const mpfAccessAge =
    getMpfAccessAge();

  const bridgeRows =
    rows.filter(
      row =>
        row.age < mpfAccessAge
    );

  const bridgeFundingNeed =
    bridgeRows.reduce(
      (total, row) =>
        total + row.amountRequired,
      0
    );

  const bridgeSemiIncome =
    bridgeRows.reduce(
      (total, row) =>
        total +
        getSemiRetirementIncomeAtAge(row.age) * 12,
      0
    );


  return {
    initialAssets,
    endingAssets,
    fundingGap,
    firstShortfallAge,
    sustainableToLifeExpectancy:
      fundingGap <= 0,
    mpfAccessAge,
    bridgeFundingNeed,
    bridgeSemiIncome,
    rows,
    finalBalances:
      {
        ...balances
      },
    retirementAge:
      basic.retirementAge,
    lifeExpectancy:
      basic.lifeExpectancy,
    returnRates:
      {
        ...returns
      },
    usageStats,
    totalGrowth,
    growthByAsset,
    totalIncomeUsed,
    totalIncomeReceived,
    totalWithdrawals
  };
}


/* =========================================
   升級 calculateGap
========================================= */

calculateGap =
  function() {

    const expense =
      calculateRetirementExpenses();


    const assets =
      calculateAssets();


    const mpf =
      calculateMPF();


    const income =
      calculateRetirementIncome();


    const simulation =
      simulateRetirementSustainability();


    return {
      expense,
      assets,
      mpf,
      income,
      totalAssets:
        simulation.initialAssets,
      gap:
        simulation.fundingGap,
      simulation
    };

  };


/* =========================================
   Scenario 顯示文字
========================================= */

function describeSimulationResult(
  simulation
) {

  if (
    simulation.fundingGap > 0
  ) {

    return (
      `${simulation.firstShortfallAge}歲開始不足 · ` +
      `${money(simulation.fundingGap)}`
    );
  }


  return (
    `可支持至${simulation.lifeExpectancy}歲 · ` +
    `餘 ${money(simulation.endingAssets)}`
  );
}


/* =========================================
   Sustainability Chart
========================================= */

function createSustainabilityChart(
  simulation
) {

  const rows =
    simulation.rows;


  if (
    !rows ||
    rows.length === 0
  ) {

    return "";
  }


  const width = 760;
  const height = 330;

  const left = 78;
  const right = 78;
  const top = 32;
  const bottom = 48;


  const chartWidth =
    width -
    left -
    right;


  const chartHeight =
    height -
    top -
    bottom;


  const maxAssets =
    Math.max(
      simulation.initialAssets,
      ...rows.map(
        row =>
          row.endingAssets
      ),
      1
    ) *
    1.08;


  const maxExpense =
    Math.max(
      ...rows.map(
        row =>
          row.annualExpense
      ),
      1
    ) *
    1.10;


  const points =
    rows.map(
      (
        row,
        index
      ) => {

        const x =
          left +
          (
            index /
            Math.max(
              rows.length - 1,
              1
            )
          ) *
          chartWidth;


        const assetY =
          top +
          chartHeight -
          (
            row.endingAssets /
            maxAssets
          ) *
          chartHeight;


        const expenseY =
          top +
          chartHeight -
          (
            row.annualExpense /
            maxExpense
          ) *
          chartHeight;


        return {
          ...row,
          x,
          assetY,
          expenseY
        };
      }
    );


  const assetLine =
    points
      .map(
        point =>
          `${point.x},${point.assetY}`
      )
      .join(" ");


  const expenseLine =
    points
      .map(
        point =>
          `${point.x},${point.expenseY}`
      )
      .join(" ");


  const gridLines = [];


  for (
    let i = 0;
    i <= 4;
    i++
  ) {

    const ratio =
      i / 4;


    const y =
      top +
      chartHeight -
      ratio *
      chartHeight;


    const assetValue =
      maxAssets *
      ratio;


    const expenseValue =
      maxExpense *
      ratio;


    gridLines.push(`

      <line
        x1="${left}"
        y1="${y}"
        x2="${left + chartWidth}"
        y2="${y}"
        stroke="#eadfcd"
        stroke-width="1"
      />

      <text
        x="${left - 10}"
        y="${y + 4}"
        text-anchor="end"
        font-size="10"
        fill="#687386"
      >
        ${compactMoney(assetValue)}
      </text>

      <text
        x="${left + chartWidth + 10}"
        y="${y + 4}"
        text-anchor="start"
        font-size="10"
        fill="#b38200"
      >
        ${compactMoney(expenseValue)}
      </text>

    `);
  }


  let shortfallMarker = "";


  if (
    simulation.firstShortfallAge
  ) {

    const point =
      points.find(
        item =>
          item.age ===
          simulation
            .firstShortfallAge
      );


    if (point) {

      shortfallMarker = `

        <line
          x1="${point.x}"
          y1="${top}"
          x2="${point.x}"
          y2="${top + chartHeight}"
          stroke="#9f1020"
          stroke-width="2"
          stroke-dasharray="6 6"
        />

        <text
          x="${point.x + 6}"
          y="${top + 15}"
          font-size="10"
          fill="#9f1020"
          font-weight="700"
        >
          ${point.age}歲不足
        </text>

      `;
    }
  }


  const startPoint =
    points[0];


  const middlePoint =
    points[
      Math.floor(
        points.length / 2
      )
    ];


  const endPoint =
    points[
      points.length - 1
    ];


  return `

    <div
      style="
        width:100%;
        overflow:hidden;
      "
    >

      <svg
        viewBox="0 0 ${width} ${height}"
        width="100%"
        style="
          display:block;
        "
      >

        ${gridLines.join("")}

        <polyline
          points="${assetLine}"
          fill="none"
          stroke="#122f57"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <polyline
          points="${expenseLine}"
          fill="none"
          stroke="#d7a922"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        ${shortfallMarker}

        <line
          x1="${left}"
          y1="${top + chartHeight}"
          x2="${left + chartWidth}"
          y2="${top + chartHeight}"
          stroke="#122f57"
          stroke-width="2"
        />

        <text
          x="${startPoint.x}"
          y="${height - 15}"
          text-anchor="start"
          font-size="11"
          fill="#687386"
        >
          ${startPoint.age}歲
        </text>

        <text
          x="${middlePoint.x}"
          y="${height - 15}"
          text-anchor="middle"
          font-size="11"
          fill="#687386"
        >
          ${middlePoint.age}歲
        </text>

        <text
          x="${endPoint.x}"
          y="${height - 15}"
          text-anchor="end"
          font-size="11"
          fill="#687386"
        >
          ${endPoint.age}歲
        </text>

      </svg>

    </div>

  `;
}


/* =========================================
   提款次序 UI
========================================= */

function renderWithdrawalOrder() {

  const container =
    document.getElementById(
      "withdrawalOrderList"
    );


  if (!container) {

    return;
  }


  const activeOrder =
    getActiveWithdrawalOrder();


  const allowManualEdit =
    withdrawalMode ===
    "custom";


  container.innerHTML =
    activeOrder
      .map(
        (
          assetKey,
          index
        ) => `

          <div
            style="
              display:grid;
              grid-template-columns:30px 1fr auto;
              gap:8px;
              align-items:center;
              padding:6px 8px;
              border:1px solid #eadfcd;
              border-radius:10px;
              background:#ffffff;
            "
          >

            <span
              style="
                display:flex;
                align-items:center;
                justify-content:center;
                width:26px;
                height:26px;
                border-radius:50%;
                background:#122f57;
                color:#ffffff;
                font-size:11px;
                font-weight:800;
              "
            >
              ${index + 1}
            </span>

            <strong
              style="
                color:#122f57;
                font-size:12px;
              "
            >
              ${
                sustainabilityAssetLabels[
                  assetKey
                ]
              }
            </strong>

            <div
              style="
                display:flex;
                gap:5px;
              "
            >

              <button
                type="button"
                data-order-direction="up"
                data-order-index="${index}"
                ${
                  !allowManualEdit ||
                  index === 0
                    ? "disabled"
                    : ""
                }
                style="
                  width:31px;
                  height:29px;
                  border:1px solid #eadfcd;
                  border-radius:7px;
                  background:#ffffff;
                  color:#122f57;
                  cursor:${allowManualEdit ? "pointer" : "default"};
                  opacity:${allowManualEdit ? "1" : ".35"};
                  font-size:14px;
                  padding:0;
                "
              >
                ↑
              </button>

              <button
                type="button"
                data-order-direction="down"
                data-order-index="${index}"
                ${
                  !allowManualEdit ||
                  index ===
                  activeOrder.length -
                  1
                    ? "disabled"
                    : ""
                }
                style="
                  width:31px;
                  height:29px;
                  border:1px solid #eadfcd;
                  border-radius:7px;
                  background:#ffffff;
                  color:#122f57;
                  cursor:${allowManualEdit ? "pointer" : "default"};
                  opacity:${allowManualEdit ? "1" : ".35"};
                  font-size:14px;
                  padding:0;
                "
              >
                ↓
              </button>

            </div>

          </div>

        `
      )
      .join("");
}


/* =========================================
   各類資產使用年期
========================================= */

function createAssetUsageTable(
  simulation
) {

  const {
    retirementAge,
    lifeExpectancy
  } = simulation;


  const totalYears =
    Math.max(
      lifeExpectancy -
      retirementAge,
      1
    );


  const rows =
    getActiveWithdrawalOrder().map(
      assetKey => {

        const stat =
          simulation
            .usageStats[
              assetKey
            ];


        const initial =
          stat.initialBalance;


        let periodText =
          "未需要使用";


        let yearsText =
          "—";


        let firstAmountText =
          "—";


        if (
          initial <= 0
        ) {

          periodText =
            "沒有資產";

        } else if (
          stat.firstWithdrawalAge !==
          null
        ) {

          const endAge =
            stat.depletedAge !==
            null
              ? stat.depletedAge
              : lifeExpectancy;


          periodText =
            stat.depletedAge !==
            null
              ? `${stat.firstWithdrawalAge}–${endAge}歲`
              : `${stat.firstWithdrawalAge}歲開始，預計壽命時仍有餘額`;


          yearsText =
            stat.depletedAge !==
            null
              ? `約 ${stat.yearsUsed} 年`
              : "仍未用完";


          firstAmountText =
            money(
              stat
                .balanceAtFirstWithdrawal ||
              0
            );
        }


        const startAge =
          stat.firstWithdrawalAge;


        const endAge =
          stat.depletedAge !== null
            ? stat.depletedAge
            : (
                startAge !== null
                  ? lifeExpectancy
                  : retirementAge
              );


        const leftPct =
          startAge !== null
            ? Math.max(
                0,
                Math.min(
                  100,
                  (
                    (
                      startAge -
                      retirementAge
                    ) /
                    totalYears
                  ) *
                  100
                )
              )
            : 0;


        const widthPct =
          startAge !== null
            ? Math.max(
                2,
                Math.min(
                  100 -
                  leftPct,
                  (
                    (
                      endAge -
                      startAge +
                      1
                    ) /
                    totalYears
                  ) *
                  100
                )
              )
            : 0;


        return `

          <tr>

            <td
              style="
                padding:10px 8px;
                border-bottom:1px solid #f0ebe1;
                font-weight:800;
                color:#122f57;
                white-space:nowrap;
              "
            >
              ${
                sustainabilityAssetLabels[
                  assetKey
                ]
              }
            </td>

            <td
              style="
                padding:10px 8px;
                border-bottom:1px solid #f0ebe1;
                white-space:nowrap;
              "
            >
              ${money(initial)}
            </td>

            <td
              style="
                padding:10px 8px;
                border-bottom:1px solid #f0ebe1;
                white-space:nowrap;
              "
            >
              ${firstAmountText}
            </td>

            <td
              style="
                padding:10px 8px;
                border-bottom:1px solid #f0ebe1;
                min-width:250px;
              "
            >

              <div
                style="
                  margin-bottom:5px;
                  font-size:11px;
                  color:#687386;
                "
              >
                ${periodText}
              </div>

              <div
                style="
                  position:relative;
                  height:8px;
                  border-radius:999px;
                  background:#eee7da;
                  overflow:hidden;
                "
              >

                ${
                  startAge !== null
                    ? `
                      <div
                        style="
                          position:absolute;
                          left:${leftPct}%;
                          width:${widthPct}%;
                          height:100%;
                          border-radius:999px;
                          background:#d7a922;
                        "
                      ></div>
                    `
                    : ""
                }

              </div>

            </td>

            <td
              style="
                padding:10px 8px;
                border-bottom:1px solid #f0ebe1;
                font-weight:800;
                color:#7f1020;
                white-space:nowrap;
              "
            >
              ${yearsText}
            </td>

            <td
              style="
                padding:10px 8px;
                border-bottom:1px solid #f0ebe1;
                white-space:nowrap;
              "
            >
              ${money(
                stat.endingBalance ||
                0
              )}
            </td>

          </tr>

        `;
      }
    )
      .join("");


  return `

    <div
      style="
        border:1px solid #eadfcd;
        border-radius:16px;
        background:#fffdf8;
        overflow:hidden;
      "
    >

      <table
        style="
          width:100%;
          border-collapse:collapse;
          font-size:12px;
        "
      >

        <thead
          style="
            background:#122f57;
            color:#ffffff;
          "
        >

          <tr>

            <th style="padding:10px 8px;text-align:left;">
              資產
            </th>

            <th style="padding:10px 8px;text-align:left;">
              退休時金額
            </th>

            <th style="padding:10px 8px;text-align:left;">
              開始提款時金額
            </th>

            <th style="padding:10px 8px;text-align:left;">
              使用時間線
            </th>

            <th style="padding:10px 8px;text-align:left;">
              可用年期
            </th>

            <th style="padding:10px 8px;text-align:left;">
              預計壽命時餘額
            </th>

          </tr>

        </thead>

        <tbody>
          ${rows}
        </tbody>

      </table>

    </div>

  `;
}


/* =========================================
   Step 6 主畫面更新
========================================= */

updateGapResult =
  function() {

    syncRetirementReturnUI();

    updateCashBufferTargetUI();

    const data =
      calculateGap();


    const simulation =
      data.simulation;


    /*
      比較：
      沿用退休前回報
    */

    const baselineSimulation =
      simulateRetirementSustainability({
        returnRates:
          getPreRetirementReturnRates(),
        withdrawalOrder:
          getActiveWithdrawalOrder()
      });


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


    const growth =
      document.getElementById(
        "retirementGrowthResult"
      );


    const gap =
      document.getElementById(
        "retirementGapResult"
      );


    const gapLabel =
      document.getElementById(
        "retirementGapLabel"
      );


    const gapDescription =
      document.getElementById(
        "retirementGapDescription"
      );


    const gapCard =
      document.getElementById(
        "retirementGapCard"
      );


    const shortfallAge =
      document.getElementById(
        "shortfallAgeResult"
      );


    const endingAssets =
      document.getElementById(
        "endingAssetsResult"
      );


    const status =
      document.getElementById(
        "sustainabilityStatus"
      );


    const chart =
      document.getElementById(
        "sustainabilityChart"
      );


    const baselineResult =
      document.getElementById(
        "baselineScenarioResult"
      );


    const activeResult =
      document.getElementById(
        "activeScenarioResult"
      );


    const activeLabel =
      document.getElementById(
        "activeScenarioLabel"
      );


    const usageTable =
      document.getElementById(
        "assetUsageTable"
      );


    const reconciliation =
      document.getElementById(
        "retirementReconciliation"
      );


    const initialAssetsLabel =
      document.getElementById(
        "initialAssetsLabel"
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
          simulation
            .initialAssets
        );
    }


    if (
      initialAssetsLabel
    ) {

      initialAssetsLabel.textContent =
        `${simulation.retirementAge}歲退休時起始可動用資產`;
    }


    if (income) {

      income.textContent =
        money(
          simulation
            .totalIncomeReceived
        );
    }


    if (growth) {

      growth.textContent =
        "+ " +
        money(
          simulation
            .totalGrowth
        );
    }


    if (endingAssets) {

      endingAssets.textContent =
        money(
          simulation
            .endingAssets
        );
    }


    const bridgeLabel = document.getElementById("bridgePeriodLabel");
    const bridgeNeed = document.getElementById("bridgeFundingNeed");
    const bridgeSemi = document.getElementById("bridgeSemiIncome");
    const bridgeExplanation = document.getElementById("bridgeExplanation");

    if (bridgeLabel) {
      bridgeLabel.textContent =
        simulation.retirementAge < simulation.mpfAccessAge
          ? `${simulation.retirementAge}–${simulation.mpfAccessAge}歲｜退休橋接期`
          : "沒有 MPF 橋接期";
    }

    if (bridgeNeed) {
      bridgeNeed.textContent =
        simulation.retirementAge < simulation.mpfAccessAge
          ? money(simulation.bridgeFundingNeed)
          : "HK$ 0";
    }

    if (bridgeSemi) {
      bridgeSemi.textContent =
        money(simulation.bridgeSemiIncome);
    }

    if (bridgeExplanation) {
      bridgeExplanation.textContent =
        simulation.retirementAge < simulation.mpfAccessAge
          ? `由 ${simulation.retirementAge} 歲退休至 ${simulation.mpfAccessAge} 歲 MPF 預計開始動用前，生活費先由半退休收入、固定收入及其他可動用資產支援。`
          : "退休年齡已達 MPF 預計開始動用年齡，沒有額外 MPF 橋接期。";
    }


    if (
      simulation.fundingGap > 0
    ) {

      if (gapLabel) {

        gapLabel.textContent =
          "退休資金缺口（退休期累積）";
      }


      if (gap) {

        gap.textContent =
          money(
            simulation
              .fundingGap
          );
      }


      if (
        shortfallAge
      ) {

        shortfallAge.textContent =
          `${simulation.firstShortfallAge} 歲`;
      }


      if (
        gapDescription
      ) {

        gapDescription.textContent =
          `這不是退休開始時需要一次過準備的金額，而是逐年模擬後，由 ${simulation.firstShortfallAge} 歲開始至預計壽命期間仍未能支付的累積金額。`;
      }


      if (gapCard) {

        gapCard.style.background =
          "#7f1020";
      }


      if (status) {

        status.textContent =
          `${simulation.firstShortfallAge}歲開始資金不足`;
      }

    } else {

      if (gapLabel) {

        gapLabel.textContent =
          "退休資金缺口（退休期累積）";
      }


      if (gap) {

        gap.textContent =
          "HK$ 0";
      }


      if (
        shortfallAge
      ) {

        shortfallAge.textContent =
          "沒有";
      }


      if (
        gapDescription
      ) {

        gapDescription.textContent =
          `按目前假設，退休資產可支持至預計壽命 ${simulation.lifeExpectancy} 歲。`;
      }


      if (gapCard) {

        gapCard.style.background =
          "#122f57";
      }


      if (status) {

        status.textContent =
          `可支持至${simulation.lifeExpectancy}歲`;
      }

    }


    if (chart) {

      chart.innerHTML =
        createSustainabilityChart(
          simulation
        );
    }


    if (
      baselineResult
    ) {

      baselineResult.textContent =
        describeSimulationResult(
          baselineSimulation
        );
    }


    if (
      activeResult
    ) {

      activeResult.textContent =
        describeSimulationResult(
          simulation
        );
    }


    if (
      activeLabel
    ) {

      const labels = {
        conservative:
          "較穩健退休後回報",
        current:
          "沿用目前回報",
        custom:
          "自行設定退休後回報"
      };


      const modeLabels = {
        custom:
          "自訂次序",
        defensive:
          "流動性優先",
        harvest:
          "資產整理優先"
      };


      activeLabel.textContent =
        (
          labels[
            retirementScenario
          ] ||
          "目前情境"
        ) +
        " · " +
        (
          modeLabels[
            withdrawalMode
          ] ||
          "自訂次序"
        );
    }


    if (
      usageTable
    ) {

      usageTable.innerHTML =
        createAssetUsageTable(
          simulation
        );
    }


    if (
      reconciliation
    ) {

      const difference =
        simulation
          .initialAssets +
        simulation
          .totalGrowth +
        simulation
          .totalIncomeUsed -
        data.expense
          .totalExpense;


      if (
        difference >= 0
      ) {

        reconciliation.innerHTML =
          `<strong>${simulation.retirementAge}歲起始資產</strong> ${money(simulation.initialAssets)}
           ＋ <strong>退休期間資產增值</strong> ${money(simulation.totalGrowth)}
           ＋ <strong>實際用作生活費的固定收入</strong> ${money(simulation.totalIncomeUsed)}
           － <strong>退休總支出</strong> ${money(data.expense.totalExpense)}
           ＝ 預計仍有 <strong>${money(simulation.endingAssets)}</strong> 資產。`;

      } else {

        reconciliation.innerHTML =
          `<strong>${simulation.retirementAge}歲起始資產</strong> ${money(simulation.initialAssets)}
           ＋ <strong>退休期間資產增值</strong> ${money(simulation.totalGrowth)}
           ＋ <strong>實際用作生活費的固定收入</strong> ${money(simulation.totalIncomeUsed)}
           仍不足以支付 <strong>退休總支出 ${money(data.expense.totalExpense)}</strong>，
           因此退休期累積未能支付金額為 <strong>${money(simulation.fundingGap)}</strong>。`;
      }

    }

  };


/* =========================================
   Scenario Buttons
========================================= */

document
  .querySelectorAll(
    "[data-retirement-scenario]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const nextScenario =
            button.dataset
              .retirementScenario;


          /*
            由非 custom 轉入 custom：
            先保留當前畫面回報率，
            再開放輸入。
          */

          if (
            nextScenario ===
              "custom" &&
            retirementScenario !==
              "custom"
          ) {

            const currentRates =
              getRetirementReturnRates();


            const map = {
              retirementReturnMpf:
                currentRates.mpf,
              retirementReturnStock:
                currentRates.stock,
              retirementReturnFund:
                currentRates.fund,
              retirementReturnFixed:
                currentRates.fixed,
              retirementReturnInsurance:
                currentRates.insurance,
              retirementReturnCash:
                currentRates.cash
            };


            Object.entries(
              map
            ).forEach(
              (
                [
                  id,
                  value
                ]
              ) => {

                const el =
                  document.getElementById(
                    id
                  );


                if (el) {

                  el.value =
                    (
                      value *
                      100
                    )
                      .toFixed(1);
                }

              }
            );

          }


          retirementScenario =
            nextScenario;


          updateGapResult();

        }
      );

    }
  );



/* =========================================
   提款策略模式按鈕
========================================= */

document
  .querySelectorAll(
    "[data-withdrawal-mode]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          withdrawalMode =
            button.dataset
              .withdrawalMode ||
            "custom";


          syncWithdrawalModeUI();

          renderWithdrawalOrder();

          updateGapResult();

        }
      );

    }
  );


/* =========================================
   自訂退休後回報：即時更新
========================================= */

[
  "retirementReturnMpf",
  "retirementReturnStock",
  "retirementReturnFund",
  "retirementReturnFixed",
  "retirementReturnInsurance",
  "retirementReturnCash"
].forEach(
  id => {

    const el =
      document.getElementById(
        id
      );


    if (!el) {

      return;
    }


    el.addEventListener(
      "input",
      () => {

        if (
          retirementScenario ===
          "custom"
        ) {

          updateGapResult();
        }

      }
    );


    el.addEventListener(
      "change",
      () => {

        if (
          retirementScenario ===
          "custom"
        ) {

          updateGapResult();
        }

      }
    );

  }
);


/* =========================================
   提款次序按鈕：即時更新
========================================= */

const withdrawalOrderContainer =
  document.getElementById(
    "withdrawalOrderList"
  );


if (
  withdrawalOrderContainer
) {

  withdrawalOrderContainer
    .addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "button[data-order-direction]"
          );


        if (!button) {

          return;
        }


        if (
          withdrawalMode !==
          "custom"
        ) {

          return;
        }


        const index =
          Number(
            button.dataset.orderIndex
          );


        const direction =
          button.dataset
            .orderDirection;


        const targetIndex =
          direction === "up"
            ? index - 1
            : index + 1;


        if (
          targetIndex < 0 ||
          targetIndex >=
            withdrawalOrder.length
        ) {

          return;
        }


        [
          withdrawalOrder[
            index
          ],
          withdrawalOrder[
            targetIndex
          ]
        ] = [
          withdrawalOrder[
            targetIndex
          ],
          withdrawalOrder[
            index
          ]
        ];


        renderWithdrawalOrder();


        updateGapResult();

      }
    );

}



/* =========================================
   STEP 7
   填補退休缺口 / Solution Dashboard
========================================= */

let lumpSumEntryCount = 1;
let savingPlanCount = 1;
let investmentTopUpEnabled = false;
let oneOffInvestmentEntryCount = 1;


/* =========================================
   通用：按年供款的退休時未來價值

   contributionYear:
   第幾年年末作出供款，1 = 第1年年末
========================================= */

function futureValueAtRetirement(
  amount,
  annualRate,
  contributionYear,
  yearsToRetire
) {

  const yearsGrowing =
    Math.max(
      yearsToRetire -
      contributionYear,
      0
    );


  return (
    amount *
    Math.pow(
      1 + annualRate,
      yearsGrowing
    )
  );
}


/* =========================================
   通用：連續每年供款
========================================= */

function futureValueOfAnnualContributions(
  annualAmount,
  annualRate,
  startYear,
  numberOfYears,
  yearsToRetire
) {

  let total = 0;


  for (
    let i = 1;
    i <= numberOfYears;
    i++
  ) {

    const contributionYear =
      startYear +
      i;


    if (
      contributionYear >
      yearsToRetire
    ) {

      break;
    }


    total +=
      futureValueAtRetirement(
        annualAmount,
        annualRate,
        contributionYear,
        yearsToRetire
      );
  }


  return total;
}


/* =========================================
   Step 7 Target Gap
========================================= */

function getStep7TargetGap() {

  const data =
    calculateGap();


  return Math.max(
    data.gap || 0,
    0
  );
}


/* =========================================
   靈活整筆投入方案 UI
========================================= */

function renderLumpSumEntries() {

  const container =
    document.getElementById(
      "lumpSumEntries"
    );


  if (!container) {

    return;
  }


  const {
    yearsToRetire
  } = getBasicData();


  let html = "";


  for (
    let i = 1;
    i <= lumpSumEntryCount;
    i++
  ) {

    const existingYear =
      document.getElementById(
        `lumpSumYear${i}`
      )?.value;


    const existingAmount =
      document.getElementById(
        `lumpSumAmount${i}`
      )?.value;


    const defaultYear =
      i === 1
        ? 0
        : Math.min(
            i - 1,
            yearsToRetire
          );


    html += `

      <div
        style="
          padding:9px;
          border:1px solid #eadfcd;
          border-radius:11px;
          background:#ffffff;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:8px;
            margin-bottom:6px;
          "
        >

          <strong
            style="
              color:#122f57;
              font-size:12px;
            "
          >
            第 ${i} 筆投入
          </strong>

          <div
            style="
              display:flex;
              align-items:center;
              gap:6px;
            "
          >

            <span
              style="
                color:#687386;
                font-size:9px;
              "
            >
              0 = 現在
            </span>

            ${
              i > 1
                ? `
                  <button
                    type="button"
                    data-remove-lump-index="${i}"
                    style="
                      border:1px solid #d7a922;
                      border-radius:8px;
                      background:#7f1020;
                      color:#ffffff;
                      font-size:9px;
                      font-weight:800;
                      padding:4px 7px;
                      cursor:pointer;
                      white-space:nowrap;
                    "
                  >
                    － 移除此筆
                  </button>
                `
                : ""
            }

          </div>

        </div>


        <div
          style="
            display:grid;
            grid-template-columns:.8fr 1.2fr;
            gap:7px;
          "
        >

          <div>

            <label
              for="lumpSumYear${i}"
              style="
                display:block;
                color:#687386;
                font-size:9px;
                margin-bottom:4px;
              "
            >
              第幾年投入
            </label>

            <input
              type="number"
              id="lumpSumYear${i}"
              min="0"
              max="${yearsToRetire}"
              value="${
                existingYear !== undefined
                  ? existingYear
                  : defaultYear
              }"
              style="
                width:100%;
                padding:8px;
              "
            >

          </div>


          <div>

            <label
              for="lumpSumAmount${i}"
              style="
                display:block;
                color:#687386;
                font-size:9px;
                margin-bottom:4px;
              "
            >
              投入金額（HK$）
            </label>

            <input
              type="number"
              id="lumpSumAmount${i}"
              min="0"
              value="${
                existingAmount !== undefined
                  ? existingAmount
                  : 0
              }"
              style="
                width:100%;
                padding:8px;
              "
            >

          </div>

        </div>

      </div>

    `;
  }


  container.innerHTML =
    html;


  container
    .querySelectorAll("input")
    .forEach(
      input => {

        input.addEventListener(
          "input",
          updateStep7Results
        );


        input.addEventListener(
          "change",
          updateStep7Results
        );

      }
    );


  container
    .querySelectorAll(
      "[data-remove-lump-index]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const removeIndex =
              Number(
                button.dataset
                  .removeLumpIndex
              );


            if (
              removeIndex <= 1 ||
              removeIndex >
                lumpSumEntryCount
            ) {

              return;
            }


            for (
              let i = removeIndex;
              i < lumpSumEntryCount;
              i++
            ) {

              const nextYear =
                document.getElementById(
                  `lumpSumYear${i + 1}`
                )?.value ?? 0;


              const nextAmount =
                document.getElementById(
                  `lumpSumAmount${i + 1}`
                )?.value ?? 0;


              const currentYear =
                document.getElementById(
                  `lumpSumYear${i}`
                );


              const currentAmount =
                document.getElementById(
                  `lumpSumAmount${i}`
                );


              if (currentYear) {

                currentYear.value =
                  nextYear;
              }


              if (currentAmount) {

                currentAmount.value =
                  nextAmount;
              }

            }


            lumpSumEntryCount--;


            renderLumpSumEntries();

            updateStep7Results();
          }
        );

      }
    );


  const addBtn =
    document.getElementById(
      "addLumpSumBtn"
    );


  if (addBtn) {

    addBtn.disabled =
      lumpSumEntryCount >= 5;


    addBtn.style.opacity =
      lumpSumEntryCount >= 5
        ? ".45"
        : "1";


    addBtn.textContent =
      lumpSumEntryCount >= 5
        ? "已達最多5筆投入"
        : "＋ 新增下一筆投入";
  }
}


/* =========================================
   五年儲蓄計劃 UI
========================================= */

function getMaxSavingPlanCount() {

  const {
    yearsToRetire
  } = getBasicData();


  if (
    yearsToRetire >= 15
  ) {

    return 3;
  }


  if (
    yearsToRetire >= 10
  ) {

    return 2;
  }


  if (
    yearsToRetire >= 5
  ) {

    return 1;
  }


  return 0;
}


function renderSavingPlanEntries() {

  const container =
    document.getElementById(
      "savingPlanEntries"
    );


  if (!container) {

    return;
  }


  const maxCount =
    getMaxSavingPlanCount();


  savingPlanCount =
    Math.max(
      1,
      Math.min(
        savingPlanCount,
        Math.max(
          maxCount,
          1
        )
      )
    );


  if (
    maxCount === 0
  ) {

    container.innerHTML = `

      <div
        style="
          padding:11px;
          border:1px solid #eadfcd;
          border-radius:11px;
          background:#fff8f7;
          color:#7f1020;
          font-size:11px;
          line-height:1.55;
        "
      >
        距離退休不足5年，未能完成一個完整5年儲蓄階段。
      </div>

    `;

  } else {

    let html = "";


    for (
      let i = 1;
      i <= savingPlanCount;
      i++
    ) {

      const existingAmount =
        document.getElementById(
          `savingPlan${i}`
        )?.value;


      const startYear =
        (i - 1) *
        5 +
        1;


      const endYear =
        i *
        5;


      html += `

        <div
          style="
            padding:9px;
            border:1px solid #eadfcd;
            border-radius:11px;
            background:#ffffff;
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:8px;
              margin-bottom:6px;
            "
          >

            <strong
              style="
                color:#122f57;
                font-size:12px;
              "
            >
              第 ${i} 個5年方案
            </strong>

            <div
              style="
                display:flex;
                align-items:center;
                gap:6px;
              "
            >

              <span
                style="
                  color:#687386;
                  font-size:9px;
                "
              >
                第${startYear}–${endYear}年
              </span>

              ${
                i === savingPlanCount &&
                i > 1
                  ? `
                    <button
                      type="button"
                      data-remove-saving-plan="${i}"
                      style="
                        border:1px solid #d7a922;
                        border-radius:8px;
                        background:#7f1020;
                        color:#ffffff;
                        font-size:9px;
                        font-weight:800;
                        padding:4px 7px;
                        cursor:pointer;
                        white-space:nowrap;
                      "
                    >
                      － 移除此段
                    </button>
                  `
                  : ""
              }

            </div>

          </div>


          <label
            for="savingPlan${i}"
            style="
              display:block;
              color:#687386;
              font-size:9px;
              margin-bottom:4px;
            "
          >
            每年供款（HK$）
          </label>

          <input
            type="number"
            id="savingPlan${i}"
            min="0"
            value="${
              existingAmount !== undefined
                ? existingAmount
                : 0
            }"
            style="
              width:100%;
              padding:8px;
            "
          >

        </div>

      `;
    }


    container.innerHTML =
      html;


    container
      .querySelectorAll("input")
      .forEach(
        input => {

          input.addEventListener(
            "input",
            updateStep7Results
          );


          input.addEventListener(
            "change",
            updateStep7Results
          );

        }
      );
  }


  container
    .querySelectorAll(
      "[data-remove-saving-plan]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (
              savingPlanCount <= 1
            ) {

              return;
            }


            savingPlanCount--;


            renderSavingPlanEntries();

            updateStep7Results();
          }
        );

      }
    );


  const addBtn =
    document.getElementById(
      "addSavingPlanBtn"
    );


  if (addBtn) {

    const canAdd =
      maxCount > 0 &&
      savingPlanCount <
        maxCount;


    addBtn.disabled =
      !canAdd;


    addBtn.style.opacity =
      canAdd
        ? "1"
        : ".45";


    if (
      maxCount === 0
    ) {

      addBtn.textContent =
        "距離退休不足5年";

    } else if (
      savingPlanCount >=
      maxCount
    ) {

      addBtn.textContent =
        maxCount >= 3
          ? "已達最多3個5年方案"
          : "退休前未有足夠時間再加下一段";

    } else {

      addBtn.textContent =
        "＋ 增加下一個5年方案";
    }
  }


  const note =
    document.getElementById(
      "savingPlanAvailabilityNote"
    );


  if (note) {

    if (
      maxCount === 0
    ) {

      note.textContent =
        "可考慮使用靈活整筆投入方案。";

    } else {

      note.textContent =
        `按目前距離退休年期，可完整安排最多 ${maxCount} 個5年接力階段。`;
    }
  }
}


/* =========================================
   一次性投資方案 UI
========================================= */

function renderOneOffInvestmentEntries() {

  const container =
    document.getElementById(
      "oneOffInvestmentEntries"
    );

  if (!container) {
    return;
  }

  const {
    yearsToRetire
  } = getBasicData();

  let html = "";

  for (
    let i = 1;
    i <= oneOffInvestmentEntryCount;
    i++
  ) {

    const existingYear =
      document.getElementById(
        `oneOffInvestmentYear${i}`
      )?.value;

    const existingAmount =
      document.getElementById(
        `oneOffInvestmentAmount${i}`
      )?.value;

    const defaultYear =
      i === 1
        ? 0
        : Math.min(
            i - 1,
            yearsToRetire
          );

    html += `
      <div style="padding:8px;border:1px solid #eadfcd;border-radius:10px;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:7px;margin-bottom:5px;">
          <strong style="color:#122f57;font-size:10px;">第 ${i} 筆一次性投資</strong>
          ${
            i > 1
              ? `<button type="button" data-remove-one-off-index="${i}" style="border:1px solid #d7a922;border-radius:7px;background:#7f1020;color:#ffffff;font-size:8px;font-weight:800;padding:3px 6px;cursor:pointer;">－ 移除</button>`
              : `<span style="color:#687386;font-size:8px;">0 = 現在</span>`
          }
        </div>
        <div style="display:grid;grid-template-columns:.8fr 1.2fr;gap:6px;">
          <div>
            <label for="oneOffInvestmentYear${i}" style="display:block;color:#687386;font-size:8px;margin-bottom:3px;">第幾年投入</label>
            <input type="number" id="oneOffInvestmentYear${i}" min="0" max="${yearsToRetire}" value="${existingYear !== undefined ? existingYear : defaultYear}" style="width:100%;padding:7px;">
          </div>
          <div>
            <label for="oneOffInvestmentAmount${i}" style="display:block;color:#687386;font-size:8px;margin-bottom:3px;">投入金額（HK$）</label>
            <input type="number" id="oneOffInvestmentAmount${i}" min="0" value="${existingAmount !== undefined ? existingAmount : 0}" style="width:100%;padding:7px;">
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  container
    .querySelectorAll("input")
    .forEach(
      input => {
        input.addEventListener(
          "input",
          updateStep7Results
        );
        input.addEventListener(
          "change",
          updateStep7Results
        );
      }
    );

  container
    .querySelectorAll(
      "[data-remove-one-off-index]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {

            const removeIndex =
              Number(
                button.dataset
                  .removeOneOffIndex
              );

            if (
              removeIndex <= 1 ||
              removeIndex > oneOffInvestmentEntryCount
            ) {
              return;
            }

            for (
              let i = removeIndex;
              i < oneOffInvestmentEntryCount;
              i++
            ) {

              const nextYear =
                document.getElementById(
                  `oneOffInvestmentYear${i + 1}`
                )?.value ?? 0;

              const nextAmount =
                document.getElementById(
                  `oneOffInvestmentAmount${i + 1}`
                )?.value ?? 0;

              const currentYear =
                document.getElementById(
                  `oneOffInvestmentYear${i}`
                );

              const currentAmount =
                document.getElementById(
                  `oneOffInvestmentAmount${i}`
                );

              if (currentYear) {
                currentYear.value = nextYear;
              }

              if (currentAmount) {
                currentAmount.value = nextAmount;
              }
            }

            oneOffInvestmentEntryCount--;

            renderOneOffInvestmentEntries();
            updateStep7Results();
          }
        );
      }
    );

  const addBtn =
    document.getElementById(
      "addOneOffInvestmentBtn"
    );

  if (addBtn) {
    addBtn.disabled =
      oneOffInvestmentEntryCount >= 5;
    addBtn.style.opacity =
      oneOffInvestmentEntryCount >= 5
        ? ".45"
        : "1";
    addBtn.textContent =
      oneOffInvestmentEntryCount >= 5
        ? "已達最多5筆一次性投資"
        : "＋ 新增下一筆投資";
  }
}


/* =========================================
   十年投資計劃 UI
========================================= */

function syncInvestmentPlanUI() {

  const {
    yearsToRetire
  } = getBasicData();


  const mainInput =
    document.getElementById(
      "investmentContribution"
    );


  const returnInput =
    document.getElementById(
      "futureInvestmentReturn"
    );


  const addBtn =
    document.getElementById(
      "addInvestmentTopUpBtn"
    );


  const wrap =
    document.getElementById(
      "investmentTopUpWrap"
    );


  const note =
    document.getElementById(
      "investmentAvailabilityNote"
    );


  const canRunFirst =
    yearsToRetire >= 10;


  const canRunSecond =
    yearsToRetire >= 20;


  if (mainInput) {

    mainInput.disabled =
      !canRunFirst;
  }


  if (returnInput) {

    returnInput.disabled =
      !canRunFirst;
  }


  if (
    !canRunSecond
  ) {

    investmentTopUpEnabled =
      false;
  }


  if (wrap) {

    wrap.hidden =
      !investmentTopUpEnabled;
  }


  if (addBtn) {

    addBtn.disabled =
      !canRunSecond;


    addBtn.style.opacity =
      canRunSecond
        ? "1"
        : ".45";


    if (
      !canRunFirst
    ) {

      addBtn.textContent =
        "距離退休不足10年";

      addBtn.style.background =
        "#9aa8b8";

    } else if (
      !canRunSecond
    ) {

      addBtn.textContent =
        "退休前未有足夠時間加入第2個10年";

      addBtn.style.background =
        "#9aa8b8";

    } else if (
      investmentTopUpEnabled
    ) {

      addBtn.textContent =
        "－ 移除第2個10年 TOP UP";

      addBtn.style.background =
        "#7f1020";

    } else {

      addBtn.textContent =
        "＋ 加入第2個10年 TOP UP";

      addBtn.style.background =
        "#122f57";
    }


    addBtn.style.color =
      "#ffffff";
  }


  if (note) {

    if (
      !canRunFirst
    ) {

      note.textContent =
        "距離退休不足10年，未能完成一個完整10年投資階段。";

    } else if (
      !canRunSecond
    ) {

      note.textContent =
        "可完成第一個10年階段；退休前時間不足以再完成第二個10年 TOP UP。";

    } else {

      note.textContent =
        "可先完成第一個10年，再按需要加入第二個10年 TOP UP。";
    }
  }
}


/* =========================================
   Step 7 計算
========================================= */

function calculateStep7Solutions() {

  const {
    yearsToRetire
  } = getBasicData();

  const targetGap =
    getStep7TargetGap();

  /* 靈活整筆投入 */
  const lumpRate =
    percentage("lumpSumReturn");

  let lumpFuture = 0;

  for (
    let i = 1;
    i <= lumpSumEntryCount;
    i++
  ) {
    const year =
      Math.max(
        0,
        Math.min(
          number(`lumpSumYear${i}`),
          yearsToRetire
        )
      );

    const amount =
      number(`lumpSumAmount${i}`);

    const lumpGrowthYears =
      Math.max(
        yearsToRetire -
        year -
        4,
        0
      );

    lumpFuture +=
      amount *
      Math.pow(
        1 + lumpRate,
        lumpGrowthYears
      );
  }

  /* 五年儲蓄 */
  const savingRate =
    percentage("savingPlanReturn");

  const maxSavingCount =
    getMaxSavingPlanCount();

  let savingFuture = 0;

  if (maxSavingCount > 0) {
    for (
      let i = 1;
      i <= Math.min(
        savingPlanCount,
        maxSavingCount
      );
      i++
    ) {
      const annualAmount =
        number(`savingPlan${i}`);

      const startYear =
        (i - 1) * 5;

      const savingPrincipal =
        annualAmount * 5;

      const savingGrowthYears =
        Math.max(
          yearsToRetire -
          startYear -
          7,
          0
        );

      savingFuture +=
        savingPrincipal *
        Math.pow(
          1 + savingRate,
          savingGrowthYears
        );
    }
  }

  /* 一次性投資方案：由實際投入年份開始增值，沒有回本等待期 */
  const oneOffInvestmentRate =
    percentage(
      "oneOffInvestmentReturn"
    );

  let oneOffInvestmentFuture = 0;

  for (
    let i = 1;
    i <= oneOffInvestmentEntryCount;
    i++
  ) {
    const year =
      Math.max(
        0,
        Math.min(
          number(
            `oneOffInvestmentYear${i}`
          ),
          yearsToRetire
        )
      );

    const amount =
      number(
        `oneOffInvestmentAmount${i}`
      );

    const growthYears =
      Math.max(
        yearsToRetire - year,
        0
      );

    oneOffInvestmentFuture +=
      amount *
      Math.pow(
        1 + oneOffInvestmentRate,
        growthYears
      );
  }

  /* 原有十年投資計劃 */
  const investmentRate =
    percentage(
      "futureInvestmentReturn"
    );

  let tenYearInvestmentFuture = 0;

  if (yearsToRetire >= 10) {
    tenYearInvestmentFuture +=
      futureValueOfAnnualContributions(
        number(
          "investmentContribution"
        ),
        investmentRate,
        0,
        10,
        yearsToRetire
      );
  }

  if (
    investmentTopUpEnabled &&
    yearsToRetire >= 20
  ) {
    tenYearInvestmentFuture +=
      futureValueOfAnnualContributions(
        number(
          "investmentTopUp"
        ),
        investmentRate,
        10,
        10,
        yearsToRetire
      );
  }

  const investmentFuture =
    oneOffInvestmentFuture +
    tenYearInvestmentFuture;

  const totalFuture =
    lumpFuture +
    savingFuture +
    investmentFuture;

  const coverage =
    targetGap > 0
      ? (
          totalFuture /
          targetGap
        ) * 100
      : 100;

  const remainingGap =
    Math.max(
      targetGap -
      totalFuture,
      0
    );

  const surplus =
    Math.max(
      totalFuture -
      targetGap,
      0
    );

  return {
    targetGap,
    yearsToRetire,
    lumpFuture,
    savingFuture,
    oneOffInvestmentFuture,
    tenYearInvestmentFuture,
    investmentFuture,
    totalFuture,
    coverage,
    remainingGap,
    surplus
  };
}


/* =========================================
   Step 7 Live Results
========================================= */

function updateStep7Results() {

  /*
    只更新計算結果，不重新建立輸入框。
    這樣在 iPad / 電腦輸入連續數字時，
    focus 不會因 DOM 重建而消失。
  */

  syncInvestmentPlanUI();


  const data =
    calculateStep7Solutions();


  const setText =
    (
      id,
      value
    ) => {

      const el =
        document.getElementById(id);


      if (el) {

        el.textContent =
          value;
      }
    };


  setText(
    "step7TargetGap",
    money(
      data.targetGap
    )
  );


  setText(
    "step7SummaryGap",
    money(
      data.targetGap
    )
  );


  setText(
    "step7YearsToRetire",
    `${data.yearsToRetire} 年`
  );


  setText(
    "lumpSumFutureValue",
    money(
      data.lumpFuture
    )
  );


  setText(
    "savingPlanFutureValue",
    money(
      data.savingFuture
    )
  );


  setText(
    "investmentFutureValue",
    money(
      data.investmentFuture
    )
  );


  setText(
    "oneOffInvestmentFutureValue",
    money(
      data.oneOffInvestmentFuture
    )
  );

  const fourPercentPreview =
    document.getElementById(
      "oneOffFourPercentPreview"
    );

  const useFourPercent =
    getOneOffWithdrawalMode() ===
      "fourPercent" &&
    data.oneOffInvestmentFuture > 0;

  if (fourPercentPreview) {
    fourPercentPreview.hidden =
      !useFourPercent;

    if (useFourPercent) {
      const projection =
        calculateOneOffFourPercentProjection(
          data.oneOffInvestmentFuture,
          percentage(
            "oneOffInvestmentReturn"
          )
        );

      fourPercentPreview.textContent =
        `4%參考：每年 ${money(projection.annualWithdrawal)} ｜ 每月約 ${money(projection.monthlyWithdrawal)} ｜ 預計壽命時尚餘 ${money(projection.endingAssets)}`;
    }
  }


  setText(
    "step7TotalFutureValue",
    money(
      data.totalFuture
    )
  );


  const displayCoverage =
    Math.max(
      data.coverage,
      0
    );


  const coverageText =
    `${displayCoverage.toFixed(0)}%`;


  setText(
    "step7HeroCoverage",
    coverageText
  );


  setText(
    "step7CoverageRate",
    coverageText
  );


  const individualCoverage =
    (
      value
    ) =>
      data.targetGap > 0
        ? Math.min(
            (
              value /
              data.targetGap
            ) *
            100,
            999
          )
        : 100;


  setText(
    "lumpSumCoverage",
    `覆蓋缺口 ${individualCoverage(data.lumpFuture).toFixed(0)}%`
  );


  setText(
    "savingPlanCoverage",
    `覆蓋缺口 ${individualCoverage(data.savingFuture).toFixed(0)}%`
  );


  setText(
    "investmentCoverage",
    `覆蓋缺口 ${individualCoverage(data.investmentFuture).toFixed(0)}%`
  );


  const balanceLabel =
    document.getElementById(
      "step7BalanceLabel"
    );


  const resultMessage =
    document.getElementById(
      "step7ResultMessage"
    );


  const combined =
    document.getElementById(
      "step7CombinedResult"
    );


  if (
    data.targetGap <= 0
  ) {

    if (balanceLabel) {

      balanceLabel.textContent =
        "目前沒有退休資金缺口";
    }


    setText(
      "step7RemainingGap",
      "HK$ 0"
    );


    if (resultMessage) {

      resultMessage.textContent =
        "按 Step 6 的目前假設，退休資產已可支持至預計壽命；本頁方案可作額外退休儲備參考。";
    }


    if (combined) {

      combined.style.background =
        "#122f57";
    }

  } else if (
    data.remainingGap > 0
  ) {

    if (balanceLabel) {

      balanceLabel.textContent =
        "尚餘缺口";
    }


    setText(
      "step7RemainingGap",
      money(
        data.remainingGap
      )
    );


    if (resultMessage) {

      resultMessage.textContent =
        `按目前輸入，方案預計可填補約 ${Math.min(data.coverage,999).toFixed(0)}% 的退休資金缺口，仍可按需要調整投入金額或回報假設。`;
    }


    if (combined) {

      combined.style.background =
        "#7f1020";
    }

  } else {

    if (balanceLabel) {

      balanceLabel.textContent =
        "退休時方案預計高於缺口";
    }


    setText(
      "step7RemainingGap",
      money(
        data.surplus
      )
    );


    if (resultMessage) {

      resultMessage.textContent =
        "按目前假設，建議方案的退休時預計價值已可覆蓋退休資金缺口；高於缺口的金額只屬退休時點的差額比較，並非預計壽命時剩餘資產。";
    }


    if (combined) {

      combined.style.background =
        "#122f57";
    }
  }


  const bar =
    document.getElementById(
      "step7CoverageBar"
    );


  if (bar) {

    bar.style.width =
      `${Math.min(
        Math.max(
          data.coverage,
          0
        ),
        100
      )}%`;
  }


  const hero =
    document.getElementById(
      "step7GapHero"
    );


  if (hero) {

    hero.style.background =
      data.targetGap > 0
        ? "#7f1020"
        : "#122f57";
  }
}


/* =========================================
   Step 7 Button Events
========================================= */

const addLumpSumBtn =
  document.getElementById(
    "addLumpSumBtn"
  );


if (addLumpSumBtn) {

  addLumpSumBtn.addEventListener(
    "click",
    () => {

      if (
        lumpSumEntryCount < 5
      ) {

        lumpSumEntryCount++;

        renderLumpSumEntries();

        updateStep7Results();
      }

    }
  );
}


const addOneOffInvestmentBtn =
  document.getElementById(
    "addOneOffInvestmentBtn"
  );


if (addOneOffInvestmentBtn) {
  addOneOffInvestmentBtn.addEventListener(
    "click",
    () => {
      if (
        oneOffInvestmentEntryCount < 5
      ) {
        oneOffInvestmentEntryCount++;
        renderOneOffInvestmentEntries();
        updateStep7Results();
      }
    }
  );
}


const addSavingPlanBtn =
  document.getElementById(
    "addSavingPlanBtn"
  );


if (addSavingPlanBtn) {

  addSavingPlanBtn.addEventListener(
    "click",
    () => {

      const maxCount =
        getMaxSavingPlanCount();


      if (
        savingPlanCount <
        maxCount
      ) {

        savingPlanCount++;

        renderSavingPlanEntries();

        updateStep7Results();
      }

    }
  );
}


const addInvestmentTopUpBtn =
  document.getElementById(
    "addInvestmentTopUpBtn"
  );


if (
  addInvestmentTopUpBtn
) {

  addInvestmentTopUpBtn
    .addEventListener(
      "click",
      () => {

        const {
          yearsToRetire
        } = getBasicData();


        if (
          yearsToRetire < 20
        ) {

          return;
        }


        if (
          investmentTopUpEnabled
        ) {

          investmentTopUpEnabled =
            false;


          const topUpInput =
            document.getElementById(
              "investmentTopUp"
            );


          if (topUpInput) {

            topUpInput.value =
              0;
          }

        } else {

          investmentTopUpEnabled =
            true;
        }


        syncInvestmentPlanUI();

        updateStep7Results();

      }
    );
}


[
  "lumpSumReturn",
  "savingPlanReturn",
  "oneOffInvestmentReturn",
  "investmentContribution",
  "futureInvestmentReturn",
  "investmentTopUp"
].forEach(
  id => {

    const el =
      document.getElementById(id);


    if (!el) {

      return;
    }


    el.addEventListener(
      "input",
      updateStep7Results
    );


    el.addEventListener(
      "change",
      updateStep7Results
    );

  }
);


document
  .querySelectorAll(
    'input[name="oneOffWithdrawalMode"]'
  )
  .forEach(
    input => {
      input.addEventListener(
        "change",
        updateStep7Results
      );
    }
  );


const resetStep7Btn =
  document.getElementById(
    "resetStep7Btn"
  );


if (resetStep7Btn) {

  resetStep7Btn.addEventListener(
    "click",
    () => {

      lumpSumEntryCount = 1;

      savingPlanCount = 1;

      investmentTopUpEnabled =
        false;

      oneOffInvestmentEntryCount =
        1;


      const defaults = {
        lumpSumReturn: 4,
        savingPlanReturn: 4,
        oneOffInvestmentReturn: 6,
        investmentContribution: 0,
        futureInvestmentReturn: 6,
        investmentTopUp: 0
      };


      Object.entries(
        defaults
      ).forEach(
        (
          [
            id,
            value
          ]
        ) => {

          const el =
            document.getElementById(id);


          if (el) {

            el.value =
              value;
          }

        }
      );


      renderLumpSumEntries();

      renderSavingPlanEntries();

      renderOneOffInvestmentEntries();

      const normalWithdrawal =
        document.querySelector(
          'input[name="oneOffWithdrawalMode"][value="normal"]'
        );

      if (normalWithdrawal) {
        normalWithdrawal.checked = true;
      }

      syncInvestmentPlanUI();


      const firstLumpYear =
        document.getElementById(
          "lumpSumYear1"
        );


      const firstLumpAmount =
        document.getElementById(
          "lumpSumAmount1"
        );


      const firstSaving =
        document.getElementById(
          "savingPlan1"
        );


      const firstOneOffYear =
        document.getElementById(
          "oneOffInvestmentYear1"
        );


      const firstOneOffAmount =
        document.getElementById(
          "oneOffInvestmentAmount1"
        );


      if (firstLumpYear) {

        firstLumpYear.value =
          0;
      }


      if (firstLumpAmount) {

        firstLumpAmount.value =
          0;
      }


      if (firstSaving) {

        firstSaving.value =
          0;
      }


      if (firstOneOffYear) {
        firstOneOffYear.value = 0;
      }


      if (firstOneOffAmount) {
        firstOneOffAmount.value = 0;
      }


      updateStep7Results();

    }
  );
}



/* =========================================
   Step 8 分享 / 列印
========================================= */

const printStep8Btn =
  document.getElementById(
    "printStep8Btn"
  );


if (printStep8Btn) {

  printStep8Btn.addEventListener(
    "click",
    () => {

      updateActionPlan();

      document.body
        .classList.add(
          "print-step8-only"
        );


      window.print();


      setTimeout(
        () => {

          document.body
            .classList.remove(
              "print-step8-only"
            );

        },
        300
      );

    }
  );
}


const shareWhatsAppBtn =
  document.getElementById(
    "shareWhatsAppBtn"
  );


if (shareWhatsAppBtn) {

  shareWhatsAppBtn.addEventListener(
    "click",
    () => {

      updateActionPlan();


      const text =
        getStep8ShareText();


      const url =
        "https://wa.me/?text=" +
        encodeURIComponent(
          text
        );


      window.open(
        url,
        "_blank"
      );

    }
  );
}


const shareEmailBtn =
  document.getElementById(
    "shareEmailBtn"
  );


if (shareEmailBtn) {

  shareEmailBtn.addEventListener(
    "click",
    () => {

      updateActionPlan();


      const clientInfo =
        getClientInfo();


      const subject =
        clientInfo.clientName !== "—"
          ? `TERRA 退休解決方案 - ${clientInfo.clientName}`
          : "TERRA 退休解決方案";


      const body =
        getStep8ShareText();


      window.location.href =
        "mailto:?subject=" +
        encodeURIComponent(
          subject
        ) +
        "&body=" +
        encodeURIComponent(
          body
        );

    }
  );
}


/* =========================================
   初始 Step 7 UI
========================================= */

renderLumpSumEntries();

renderSavingPlanEntries();

renderOneOffInvestmentEntries();

syncInvestmentPlanUI();



/* =========================================
   Legacy Cashflow Table
   保留舊功能，現時 Step 9 已改為時間價值分析。
========================================= */

createCashflowTable =
  function() {

    const container =
      document.getElementById(
        "cashflowTable"
      );


    if (!container) {

      return;
    }


    const data =
      calculateGap();


    const rows =
      data.simulation.rows;


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
              <th>資產增值</th>
              <th>年末資產</th>
              <th>資金不足</th>
            </tr>

          </thead>

          <tbody>

    `;


    rows.forEach(
      row => {

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
                row.annualIncome
              )}
            </td>

            <td>
              ${money(
                row.totalWithdrawal
              )}
            </td>

            <td>
              ${money(
                row.annualGrowth
              )}
            </td>

            <td>
              ${money(
                row.endingAssets
              )}
            </td>

            <td>
              ${
                row.unmetShortfall > 0
                  ? money(
                      row.unmetShortfall
                    )
                  : "—"
              }
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

  };


/* =========================================
   初始 Step 6 UI
========================================= */

syncWithdrawalModeUI();

renderWithdrawalOrder();

syncRetirementReturnUI();

updateCashBufferTargetUI();

setDefaultPlanningDate();

updateExpenseSplitPreview();

syncSemiRetirementUI();


  showStep(1);

});
