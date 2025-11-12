const form = document.getElementById('analyzerForm');
const priceInput = document.getElementById('prices');
const tradeLimitInput = document.getElementById('tradeLimit');
const minSpreadInput = document.getElementById('minSpread');
const errorLabel = document.getElementById('error');
const resultsSection = document.getElementById('results');
const summaryContainer = document.getElementById('summary');
const tradesContainer = document.getElementById('trades');
const statsContainer = document.getElementById('stats');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearOutput();

    const prices = parsePrices(priceInput.value);
    const tradeLimit = parseInt(tradeLimitInput.value, 10);
    const minSpread = parseFloat(minSpreadInput.value);

    if (!prices.length) {
        showError('請至少輸入兩筆有效的價格資料。');
        return;
    }
    if (prices.some((price) => Number.isNaN(price) || price <= 0)) {
        showError('資料中包含無效數值，請確認每個價格都是大於 0 的數字。');
        return;
    }
    if (prices.length < 2) {
        showError('至少需要兩筆價格資料才能分析買賣時機。');
        return;
    }
    if (Number.isNaN(tradeLimit) || tradeLimit < 1) {
        showError('交易上限必須是正整數。');
        return;
    }
    if (Number.isNaN(minSpread) || minSpread < 0) {
        showError('最小價差必須是大於等於 0 的數字。');
        return;
    }

    const analysis = analyze(prices, tradeLimit, minSpread);
    renderResults(analysis, tradeLimit);
});

function parsePrices(raw) {
    return raw
        .split(/[\s,]+/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map(Number);
}

function analyze(prices, tradeLimit, minSpread) {
    const singleTrade = findBestSingleTrade(prices);
    const trades = findBestTrades(prices, tradeLimit, minSpread);
    const stats = calculateStats(prices);

    return { prices, singleTrade, trades, stats };
}

function findBestSingleTrade(prices) {
    let minPrice = prices[0];
    let minIndex = 0;
    let bestProfit = Number.NEGATIVE_INFINITY;
    let best = null;

    prices.forEach((price, index) => {
        const potentialProfit = price - minPrice;
        if (potentialProfit > bestProfit && index > minIndex) {
            bestProfit = potentialProfit;
            best = {
                buyIndex: minIndex,
                sellIndex: index,
                buyPrice: minPrice,
                sellPrice: price,
                profit: potentialProfit,
                percent: (potentialProfit / minPrice) * 100,
            };
        }
        if (price < minPrice) {
            minPrice = price;
            minIndex = index;
        }
    });

    if (!best || best.profit <= 0) {
        return null;
    }

    return best;
}

function findBestTrades(prices, tradeLimit, minSpread) {
    const trades = [];
    let i = 0;
    const n = prices.length;

    while (i < n - 1) {
        while (i < n - 1 && prices[i] >= prices[i + 1]) {
            i += 1;
        }
        if (i >= n - 1) break;

        const buyIndex = i;
        i += 1;

        while (i < n && prices[i] >= prices[i - 1]) {
            i += 1;
        }

        const sellIndex = i - 1;
        const buyPrice = prices[buyIndex];
        const sellPrice = prices[sellIndex];
        const profit = sellPrice - buyPrice;

        if (profit >= minSpread) {
            trades.push({
                buyIndex,
                sellIndex,
                buyPrice,
                sellPrice,
                profit,
                percent: (profit / buyPrice) * 100,
            });
        }
    }

    trades.sort((a, b) => b.profit - a.profit);
    return trades.slice(0, tradeLimit);
}

function calculateStats(prices) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const sum = prices.reduce((acc, price) => acc + price, 0);
    const average = sum / prices.length;

    const returns = [];
    for (let i = 1; i < prices.length; i += 1) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const meanReturn = returns.reduce((acc, value) => acc + value, 0) / (returns.length || 1);
    const variance =
        returns.reduce((acc, value) => acc + (value - meanReturn) ** 2, 0) / (returns.length || 1);
    const volatility = Math.sqrt(variance);

    let peak = prices[0];
    let maxDrawdown = 0;
    prices.forEach((price) => {
        if (price > peak) {
            peak = price;
        }
        const drawdown = (peak - price) / peak;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });

    const cumulativeReturn = (prices[prices.length - 1] - prices[0]) / prices[0];

    return {
        minPrice,
        maxPrice,
        average,
        meanReturn,
        volatility,
        maxDrawdown,
        cumulativeReturn,
    };
}

function renderResults(analysis, tradeLimit) {
    const { singleTrade, trades, stats, prices } = analysis;
    resultsSection.classList.remove('hidden');

    summaryContainer.innerHTML = '';
    const summaryItems = [
        {
            title: '資料筆數',
            value: `${prices.length} 天`,
        },
        {
            title: '最低價格',
            value: formatCurrency(stats.minPrice),
        },
        {
            title: '最高價格',
            value: formatCurrency(stats.maxPrice),
        },
        {
            title: '平均價格',
            value: formatCurrency(stats.average),
        },
    ];

    if (singleTrade) {
        summaryItems.push({
            title: '最佳單筆報酬',
            value: `${formatCurrency(singleTrade.profit)} (${formatPercent(singleTrade.percent)})`,
        });
    } else {
        summaryItems.push({
            title: '最佳單筆報酬',
            value: '暫無可獲利的交易',
        });
    }

    summaryItems.forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'summary-item';
        const title = document.createElement('h3');
        title.textContent = item.title;
        const value = document.createElement('p');
        value.textContent = item.value;
        wrapper.appendChild(title);
        wrapper.appendChild(value);
        summaryContainer.appendChild(wrapper);
    });

    tradesContainer.innerHTML = '';
    const tradesHeading = document.createElement('h3');
    tradesHeading.textContent = `推薦交易 (最多 ${tradeLimit} 筆)`;
    tradesContainer.appendChild(tradesHeading);

    if (trades.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = '依照設定無法找到符合條件的獲利交易。';
        tradesContainer.appendChild(empty);
    } else {
        const list = document.createElement('div');
        list.className = 'trade-list';
        trades.forEach((trade, index) => {
            const card = document.createElement('div');
            card.className = 'trade-card';
            const title = document.createElement('h3');
            title.textContent = `第 ${index + 1} 筆交易`;
            const details = document.createElement('ul');
            details.innerHTML = `
                <li>買進日：第 ${trade.buyIndex + 1} 天，價格 ${formatCurrency(trade.buyPrice)}</li>
                <li>賣出日：第 ${trade.sellIndex + 1} 天，價格 ${formatCurrency(trade.sellPrice)}</li>
                <li>獲利：${formatCurrency(trade.profit)} (${formatPercent(trade.percent)})</li>
            `;
            card.appendChild(title);
            card.appendChild(details);
            list.appendChild(card);
        });
        tradesContainer.appendChild(list);
    }

    statsContainer.innerHTML = '';
    const statsHeading = document.createElement('h3');
    statsHeading.textContent = '其他指標';
    statsContainer.appendChild(statsHeading);

    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    const statsItems = [
        {
            title: '總報酬率',
            value: formatPercent(stats.cumulativeReturn * 100),
        },
        {
            title: '日均報酬率',
            value: formatPercent(stats.meanReturn * 100),
        },
        {
            title: '波動度 (日標準差)',
            value: formatPercent(stats.volatility * 100),
        },
        {
            title: '最大回檔',
            value: formatPercent(stats.maxDrawdown * 100),
        },
    ];

    statsItems.forEach((item) => {
        const stat = document.createElement('div');
        stat.className = 'stat';
        const title = document.createElement('h3');
        title.textContent = item.title;
        const value = document.createElement('p');
        value.textContent = item.value;
        stat.appendChild(title);
        stat.appendChild(value);
        statsGrid.appendChild(stat);
    });

    statsContainer.appendChild(statsGrid);
}

function formatCurrency(value) {
    if (!Number.isFinite(value)) {
        return '--';
    }

    return new Intl.NumberFormat('zh-Hant', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 2,
    }).format(value);
}

function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return '--';
    }

    return `${value.toFixed(2)}%`;
}

function showError(message) {
    errorLabel.textContent = message;
    resultsSection.classList.add('hidden');
}

function clearOutput() {
    errorLabel.textContent = '';
    summaryContainer.innerHTML = '';
    tradesContainer.innerHTML = '';
    statsContainer.innerHTML = '';
    resultsSection.classList.add('hidden');
}
