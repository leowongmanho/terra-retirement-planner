document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("start-btn");

  if (!startBtn) return;

  startBtn.addEventListener("click", function () {
    startBtn.textContent = "規劃已開始 ✓";
    startBtn.disabled = true;

    const planner = document.createElement("div");
    planner.className = "planner-panel";

    planner.innerHTML = `
      <h2>你的退休規劃</h2>
      <p>請先完成以下基本資料，我們會逐步建立你的退休計劃。</p>

      <form id="retirement-form">

        <label for="current-age">目前年齡</label>
        <input
          type="number"
          id="current-age"
          min="18"
          max="100"
          placeholder="例如：45"
          required
        >

        <label for="retirement-age">預計退休年齡</label>
        <input
          type="number"
          id="retirement-age"
          min="40"
          max="100"
          placeholder="例如：65"
          required
        >

        <label for="savings">目前退休儲蓄</label>
        <input
          type="number"
          id="savings"
          min="0"
          placeholder="例如：500000"
          required
        >

        <label for="monthly-saving">每月退休儲蓄</label>
        <input
          type="number"
          id="monthly-saving"
          min="0"
          placeholder="例如：5000"
          required
        >

        <button type="submit">
          計算我的退休進度
        </button>

      </form>

      <div id="planner-result"></div>
    `;

    startBtn.parentNode.insertBefore(
      planner,
      startBtn.nextSibling
    );

    const form = document.getElementById("retirement-form");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const currentAge =
        Number(document.getElementById("current-age").value);

      const retirementAge =
        Number(document.getElementById("retirement-age").value);

      const savings =
        Number(document.getElementById("savings").value);

      const monthlySaving =
        Number(document.getElementById("monthly-saving").value);

      const yearsLeft = retirementAge - currentAge;

      const result =
        document.getElementById("planner-result");

      if (yearsLeft <= 0) {
        result.innerHTML = `
          <p>
            請輸入一個高於目前年齡的退休年齡。
          </p>
        `;
        return;
      }

      const monthsLeft = yearsLeft * 12;

      const futureSavings =
        savings + monthlySaving * monthsLeft;

      result.innerHTML = `
        <h3>初步退休規劃結果</h3>

        <p>
          距離退休：約
          <strong>${yearsLeft} 年</strong>
        </p>

        <p>
          按目前儲蓄速度，
          未計投資回報前，
          預計退休時可累積：
        </p>

        <p class="result-number">
          HK$ ${futureSavings.toLocaleString()}
        </p>

        <p>
          下一階段可以加入投資回報、
          通脹、退休開支、MPF、
          年金及退休收入分析。
        </p>
      `;
    });
  });
});
