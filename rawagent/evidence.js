(() => {
  "use strict";
  const asset = window.rawAgentAsset || (file => file);
  const rounds = [
  {
    "number": 1,
    "firstLine": 5,
    "lines": [
      "def _interp(z, mask, sigma):",
      "    m = mask.astype(np.float64)",
      "    a = ndimage.gaussian_filter(z * m, sigma, mode=\"reflect\")",
      "    b = ndimage.gaussian_filter(m, sigma, mode=\"reflect\")",
      "    return a / np.maximum(b, 1e-8)"
    ],
    "psnr": 28.321,
    "ssim": 0.82533,
    "title": "从邻域插值开始",
    "detail": "按同色像素的有效权重归一化插值，先估计绿色，再恢复红、蓝色差。"
  },
  {
    "number": 6,
    "firstLine": 80,
    "lines": [
      "vp = np.clip(v, 0.0, 1.0)",
      "sig = np.sqrt(",
      "    vp / full_well",
      "    + (read_noise / full_well) ** 2",
      "    + 1.0 / (12.0 * scale * scale)",
      ") / exposure"
    ],
    "psnr": 29.903,
    "ssim": 0.85348,
    "title": "按曝光估算噪声",
    "detail": "把散粒噪声、读出噪声和量化误差写进同一个方差估计，用它控制后续滤波。"
  },
  {
    "number": 9,
    "firstLine": 141,
    "lines": [
      "eps = 2.0 * n + 1e-4",
      "wh = 1.0 / (dh + eps)",
      "wv = 1.0 / (dv + eps)",
      "g_est = (wh * gh + wv * gv) / np.maximum(wh + wv, 1e-12)",
      "g_init = np.where(gm, z, g_est)"
    ],
    "psnr": 31.172,
    "ssim": 0.88547,
    "title": "沿着边缘恢复绿色",
    "detail": "分别估计水平和竖直方向，再对变化较小的方向赋予更高权重。该轮在十个候选中得分最高。"
  }
];
  const scores = [28.3211, 27.5934, 29.5898, 28.7601, 27.7238, 29.9029, 29.1584, 29.9029, 31.1724, 31.1071];

  const process = document.getElementById("process");
  const results = document.getElementById("results");
  if (!process || !results) return;
  const read = id => process.querySelector("#" + id);
  const roundButtons = [...process.querySelectorAll("[data-ev-round]")];

  function tokens(line) {
    const text = document.createElement("code");
    text.className = "ev-code-txt";
    const matches = line.matchAll(/\b(?:def|return|if|else)\b|\b\d+(?:\.\d+)?(?:e-?\d+)?\b|\b[A-Za-z_]\w*(?=\()/g);
    let start = 0;
    for (const match of matches) {
      text.append(document.createTextNode(line.slice(start, match.index)));
      const token = document.createElement("span");
      token.textContent = match[0];
      token.className = /^\d/.test(match[0]) ? "ev-code-num" : ["def", "return", "if", "else"].includes(match[0]) ? "ev-code-key" : "ev-code-fn";
      text.append(token);
      start = match.index + match[0].length;
    }
    text.append(document.createTextNode(line.slice(start)));
    return text;
  }

  function renderCode(record) {
    read("ev-snippet").replaceChildren(...record.lines.map((line, index) => {
      const row = document.createElement("div");
      row.className = "ev-code-row";
      const number = document.createElement("span");
      number.className = "ev-code-ln";
      number.setAttribute("aria-hidden", "true");
      number.textContent = record.firstLine + index;
      row.append(number, tokens(line));
      return row;
    }));
  }

  function svgElement(name, attrs, content) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function renderTrend(round) {
    const chart = read("ev-trend");
    const left = 32, right = 338, top = 10, bottom = 66;
    const x = i => left + i * (right - left) / (scores.length - 1);
    const y = score => bottom - (score - 27) / 5 * (bottom - top);
    const nodes = [];
    for (const val of [32, 27]) {
      nodes.push(svgElement("line", { x1:left, y1:y(val), x2:right, y2:y(val), stroke:"#c7d4c4", "stroke-dasharray":"2 4" }));
      nodes.push(svgElement("text", { x:1, y:y(val) + 4 }, val));
    }
    nodes.push(svgElement("text", { x:left-2, y:87 }, "1 轮"));
    nodes.push(svgElement("text", { x:right, y:87, "text-anchor":"end" }, "10 轮"));
    nodes.push(svgElement("polyline", { points:scores.map((score, idx) => x(idx) + "," + y(score)).join(" "), fill:"none", stroke:"#3c7150", "stroke-width":2 }));
    scores.forEach((score, idx) => {
      const selected = idx + 1 === round;
      nodes.push(svgElement("circle", { cx:x(idx), cy:y(score), r:selected ? 5 : 2.5, fill:selected ? "#c8ea7d" : "#3c7150", stroke:"#385d3f", "stroke-width":selected ? 2 : 1 }));
    });
    chart.replaceChildren(...nodes);
    chart.setAttribute("aria-label", "同一组 10 个候选的开发集评分，当前为第 " + round + " 轮，" + scores[round-1].toFixed(2) + " dB");
  }

  function chooseRound(number) {
    const record = rounds.find(item => item.number === number);
    if (!record) return;
    const id = String(number).padStart(2, "0");
    roundButtons.forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.evRound) === number)));
    read("ev-psnr").textContent = scores[number-1].toFixed(2);
    read("ev-ssim").textContent = "全开发集 SSIM " + record.ssim.toFixed(4);
    read("ev-source-file").textContent = "c" + id + " / source.py";
    read("ev-round-preview").src = asset("evidence-assets/round-" + id + ".png");
    read("ev-round-preview").alt = "第 " + number + " 轮在低照高山湖场景的归档输出";
    read("ev-full-code").href = asset("evidence-assets/round-" + id + ".py.txt");
    read("ev-change-title").textContent = record.title;
    read("ev-change-detail").textContent = record.detail;
    renderCode(record);
    renderTrend(number);
  }
  roundButtons.forEach(button => button.addEventListener("click", () => chooseRound(Number(button.dataset.evRound))));
  chooseRound(1);

  // Each tabbed section (benchmarks, multi-model experiments) manages its own tab list.
  for (const section of document.querySelectorAll(".ev-results")) {
    const tabs = [...section.querySelectorAll('[role="tab"]')];
    const chooseTab = active => {
      tabs.forEach(tab => {
        const selected = tab === active;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => chooseTab(tab));
      tab.addEventListener("keydown", event => {
        const keys = { ArrowLeft:(index+tabs.length-1)%tabs.length, ArrowRight:(index+1)%tabs.length, Home:0, End:tabs.length-1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        const next = tabs[keys[event.key]];
        chooseTab(next);
        next.focus();
      });
    });
  }
})();
