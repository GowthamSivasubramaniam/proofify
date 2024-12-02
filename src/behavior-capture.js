let behaviorData = {
    clicks: 0,
    keystrokes: 0,
    mouseMovements: 0,
    scrollSpeed: 0,
    sessionDuration: 0,
    browserPlugins: [],
    backspaceCount: 0,
    repeatedKeyCount: 0,
    keyHoldData: {},
    fieldData: [],
    screenResolution: { width: window.screen.width, height: window.screen.height },
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    clickData: [],
    mouseMovement: [],
    scrollData: [],
    pageTimeData: JSON.parse(localStorage.getItem("pageTimeData")) || {}
};

let mouseMoveCount = 0;
let lastScrollTime = null;
let lastKey = null;
let lastKeyTime = 0;
let fieldData = [];

// Capture clicks
document.addEventListener('click', (event) => {
    const clickInfo = {
        timestamp: Date.now(),
        x: event.clientX,
        y: event.clientY,
        element: event.target.tagName,
    };
    behaviorData.clicks += 1;
    behaviorData.clickData.push(clickInfo);
});


document.addEventListener('keydown', (event) => {
    const currentTime = new Date().getTime();
    const currentKey = event.key;

    if (currentKey === "Backspace") {
        behaviorData.backspaceCount += 1;
    }

    if (lastKey === currentKey && currentTime - lastKeyTime < 300) {
        behaviorData.repeatedKeyCount += 1;
    }

    lastKey = currentKey;
    lastKeyTime = currentTime;

    if (!behaviorData.keyHoldData[currentKey]) {
        behaviorData.keyHoldData[currentKey] = { pressTime: currentTime, holdDuration: 0 };
    }
});

document.addEventListener('keyup', (event) => {
    const keyData = behaviorData.keyHoldData[event.key];
    if (keyData && keyData.pressTime) {
        const releaseTime = new Date().getTime();
        const holdDuration = releaseTime - keyData.pressTime;
        behaviorData.keyHoldData[event.key] = { ...keyData, holdDuration };
    }
});

let startTime1 = null;
let keystrokes = 0;
let intervals = [];
let lastKeystrokeTime = null;

const handleFocus = (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        startTime1 = Date.now();
        keystrokes = 0;
        intervals = [];
    }
};

const handleInput = (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        keystrokes += 1;
        const currentTime = Date.now();

        if (lastKeystrokeTime) {
            const timeInterval = currentTime - lastKeystrokeTime;
            intervals.push(timeInterval);
        }

        lastKeystrokeTime = currentTime;
    }
};

const handleBlur = (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        const endTime = Date.now();
        const timeSpent = (endTime - startTime1) / 1000;

        behaviorData.fieldData.push({
            fieldName: event.target.name,
            keystrokes: keystrokes,
            timeSpent: timeSpent,
            intervals: intervals,
            startTime1: startTime1,
            endTime: endTime
        });

        console.log(`Field: ${event.target.name}`);
        console.log(`Keystrokes: ${keystrokes}`);
        console.log(`Time Spent: ${timeSpent} seconds`);
    }
};

document.addEventListener("focus", handleFocus, true);
document.addEventListener("input", handleInput, true);
document.addEventListener("blur", handleBlur, true);

// Capture mouse movements
document.addEventListener('mousemove', (event) => {
    const currentTime = Date.now();
    const delayThreshold = 1000;
    if (currentTime - (behaviorData.lastRecordedTime || 0) >= delayThreshold) {
        behaviorData.mouseMovement.push({
            x: event.clientX,
            y: event.clientY,
            timestamp: currentTime
        });
        behaviorData.lastRecordedTime = currentTime;
    }
});

const handleScroll = () => {
    const currentScrollPosition = window.scrollY;
    const timestamp = Date.now();
    const documentHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;

    const scrollDepth = Math.min(
        (currentScrollPosition / (documentHeight - viewportHeight)) * 100,
        100
    );

    const scrollInfo = {
        timestamp: timestamp,
        scrollPosition: currentScrollPosition,
        scrollDepth: scrollDepth,
        scrollSpeed: 0,
        scrollDirection: "none",
    };

    if (behaviorData.scrollData.length > 0) {
        const lastScroll = behaviorData.scrollData[behaviorData.scrollData.length - 1];
        const timeElapsed = (timestamp - lastScroll.timestamp) / 1000;
        const distanceScrolled = Math.abs(
            currentScrollPosition - lastScroll.scrollPosition
        );
        scrollInfo.scrollSpeed = distanceScrolled / timeElapsed;

        if (currentScrollPosition > lastScroll.scrollPosition) {
            scrollInfo.scrollDirection = "down";
        } else if (currentScrollPosition < lastScroll.scrollPosition) {
            scrollInfo.scrollDirection = "up";
        } else {
            scrollInfo.scrollDirection = "none";
        }
    }

    behaviorData.scrollData.push(scrollInfo);
};

window.addEventListener("scroll", handleScroll);

const analyzeScrollBehavior = () => {
    if (behaviorData.scrollData.length < 2) return;

    const suspiciousPattern = behaviorData.scrollData.every((data, index) => {
        if (index === 0) return true;
        const prevData = behaviorData.scrollData[index - 1];
        const speedDifference = Math.abs(
            data.scrollSpeed - prevData.scrollSpeed
        );

        const consistentSpeed = speedDifference < 10;

        const directionPattern = behaviorData.scrollData.map((data) => data.scrollDirection);
        const directionChanges = new Set(directionPattern).size;

        return consistentSpeed && directionChanges <= 1;
    });

    const maxScrollDepth = Math.max(
        ...behaviorData.scrollData.map((data) => data.scrollDepth)
    );
    const timeSpentScrolling = (Date.now() - behaviorData.scrollStartTime) / 1000;

    const fastScrollToBottom = maxScrollDepth > 90 && timeSpentScrolling < 5;

    if (suspiciousPattern || fastScrollToBottom) {
        localStorage.setItem("ScrollData", JSON.stringify(behaviorData.scrollData));
        console.log(
            "Suspicious scrolling behavior detected, possible bot activity."
        );
    }
};

setInterval(analyzeScrollBehavior, 5000);


const entryTime = Date.now();


// Calculate statistics
const calculateMouseSpeedStd = (mouseData) => {
    if (mouseData.length < 2) {
        return { avgSpeed: 0, totalDistance: 0, avgAngleChange: 0 };
    }

    let totalDistance = 0;
    let totalTime = mouseData[mouseData.length - 1].timestamp - mouseData[0].timestamp;
    let speedList = [];
    let angleChanges = [];

    for (let i = 1; i < mouseData.length; i++) {
        let x1 = mouseData[i - 1].x;
        let y1 = mouseData[i - 1].y;
        let x2 = mouseData[i].x;
        let y2 = mouseData[i].y;

        let timeDiff = mouseData[i].timestamp - mouseData[i - 1].timestamp;

        if (timeDiff === 0) continue;

        let distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        totalDistance += distance;

        let speed = distance / timeDiff;
        speedList.push(speed);

        if (i > 1) {
            let x0 = mouseData[i - 2].x;
            let y0 = mouseData[i - 2].y;
            let angle1 = Math.atan2(y1 - y0, x1 - x0);
            let angle2 = Math.atan2(y2 - y1, x2 - x1);
            let angleChange = Math.abs(angle2 - angle1);
            angleChanges.push(angleChange);
        }
    }

    let avgSpeed = speedList.length > 0 ? speedList.reduce((a, b) => a + b, 0) / speedList.length : 0;
    let avgAngleChange = angleChanges.length > 0 ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length : 0;

    return {
        avgSpeed: avgSpeed,
        totalDistance: totalDistance,
        avgAngleChange: avgAngleChange,
    };
};

const calculateJitterAndTremors = (mouseData) => {
    if (mouseData.length < 3) {
        return { jitter: 0, tremors: 0 };
    }

    let jitterDistances = [];
    let tremorCounts = 0;

    for (let i = 2; i < mouseData.length; i++) {
        let x1 = mouseData[i - 2].x;
        let y1 = mouseData[i - 2].y;
        let x2 = mouseData[i - 1].x;
        let y2 = mouseData[i - 1].y;
        let x3 = mouseData[i].x;
        let y3 = mouseData[i].y;

        let dist1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        let dist2 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2));

        let distanceDiff = Math.abs(dist2 - dist1);
        if (distanceDiff > 0 && distanceDiff < 5) {
            jitterDistances.push(distanceDiff);
        }

        let angle1 = Math.atan2(y2 - y1, x2 - x1);
        let angle2 = Math.atan2(y3 - y2, x3 - x2);
        let angleChange = Math.abs(angle2 - angle1);

        if (angleChange > Math.PI / 2) {
            tremorCounts++;
        }
    }

    let jitter = jitterDistances.length > 0 ? jitterDistances.reduce((a, b) => a + b, 0) / jitterDistances.length : 0;
    let tremors = tremorCounts;

    return { jitter: jitter, tremors: tremors };
};

const calculateClickIntervalAvg = (clickData) => {
    const intervals = [];
    for (let i = 1; i < clickData.length; i++) {
        const interval = clickData[i].timestamp - clickData[i - 1].timestamp;
        intervals.push(interval);
    }
    return intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
};

const calculateClickAreaVariability = (clickData) => {
    if (clickData.length < 2) {
        return { xVariance: 0, yVariance: 0, totalVariance: 0 };
    }

    const xCoords = clickData.map((click) => click.x);
    const yCoords = clickData.map((click) => click.y);

    const calculateVariance = (values) => {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    };

    const xVariance = calculateVariance(xCoords);
    const yVariance = calculateVariance(yCoords);
    const totalVariance = Math.sqrt(xVariance + yVariance);

    return { xVariance: xVariance, yVariance: yVariance, totalVariance: totalVariance };
};

const clickToScrollRatio = (scrollCount, clickCount) => {
    return scrollCount > 0 ? (clickCount / scrollCount).toFixed(2) : 0;
};

const calculateScrollSpeedAvg = (scrollData) => {
    const speeds = [];
    for (let i = 1; i < scrollData.length; i++) {
        const distance = scrollData[i].scrollPosition - scrollData[i - 1].scrollPosition;
        const dt = scrollData[i].timestamp - scrollData[i - 1].timestamp;

        if (dt > 0 && !isNaN(distance) && !isNaN(dt)) {
            const speed = distance / dt;
            speeds.push(speed);
        }
    }
    return speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
};

const calculateAverageTypingSpeed = (typingSpeeds) => {
    const totalTimeSpent = behaviorData.fieldData.reduce(
        (total, data) => total + data.timeSpent,
        0
    );
    const averageTimeSpent = totalTimeSpent / behaviorData.fieldData.length;
    return averageTimeSpent;
};

const calculateAverageTimeSpent = () => {
    let totalTimeSpent = 0;
    let pageCount = 0;
    for (let page in behaviorData.pageTimeData) {
        if (behaviorData.pageTimeData.hasOwnProperty(page)) {
            totalTimeSpent += behaviorData.pageTimeData[page];
            pageCount += 1;
        }
    }
    const averageTimeSpent = totalTimeSpent / pageCount;
    return averageTimeSpent;
};

const concatenateFieldData = (data) => {
    const result = {};

    data.forEach((entry) => {
        const {
            fieldName,
            intervals,
            keystrokes,
            timeSpent,
            startTime1,
            endTime,
        } = entry;

        if (!result[fieldName]) {
            result[fieldName] = {
                fieldName: fieldName,
                intervals: [...intervals],
                keystrokes: keystrokes,
                timeSpent: timeSpent,
                startTime1: startTime1,
                endTime: endTime,
            };
        } else {
            result[fieldName].intervals =
                result[fieldName].intervals.concat(intervals);
            result[fieldName].keystrokes += keystrokes;
            result[fieldName].timeSpent += timeSpent;
            result[fieldName].startTime1 = Math.min(
                result[fieldName].startTime1,
                startTime1
            );
            result[fieldName].endTime = Math.max(
                result[fieldName].endTime,
                endTime
            );
        }
    });

    let concatenatedData = Object.values(result);
    concatenatedData.sort((a, b) => a.startTime1 - b.startTime1);
    const fieldIntervals = [];
    let totalInterval = 0;
    for (let i = 1; i < concatenatedData.length; i++) {
        const previousField = concatenatedData[i - 1];
        const currentField = concatenatedData[i];
        const timeInterval =
            (currentField.startTime1 - previousField.endTime) / 1000;
        totalInterval += timeInterval;

        fieldIntervals.push({
            fromField: previousField.fieldName,
            toField: currentField.fieldName,
            timeInterval: timeInterval,
        });
    }
    const averageInterval =
        fieldIntervals.length > 0 ? totalInterval / fieldIntervals.length : 0;

    return {
        concatenatedData,
        averageInterval: averageInterval,
    };
};

const calculateStatistics = () => {
    const durations = Object.values(behaviorData.keyHoldData)
        .map((data) => data.holdDuration)
        .filter((duration) => duration > 0);

    if (durations.length === 0) return { avgDuration: 0, stdDev: 0 };

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    const variance =
        durations.reduce((a, b) => a + Math.pow(b - avgDuration, 2), 0) /
        durations.length;
    const stdDev = Math.sqrt(variance);

    return { avgKeyHoldDuration: avgDuration, avgStdKeyHoldDev: stdDev };
};

const calculateAverageKeystrokeInterval = (data) => {
    const avgIntervals = [];
    let totalTimeSpent = 0;
    data.forEach((field) => {
        const intervals = field.intervals;
        const avgInterval =
            intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
        totalTimeSpent += field.timeSpent;
        avgIntervals.push(avgInterval);
        console.log(
            `Average keystroke interval for ${
                field.fieldName
            }: ${avgInterval.toFixed(2)}`
        );
    });
    const avgTimeSpent = totalTimeSpent / data.length;
    const overallAvgInterval =
        avgIntervals.reduce((sum, value) => sum + value, 0) / avgIntervals.length;
    console.log(
        `Overall average keystroke interval: ${overallAvgInterval.toFixed(2)}`
    );

    return {
        avgTimeSpent: avgTimeSpent,
        avgIntervals: avgIntervals,
        overallAvgInterval: overallAvgInterval,
    };
};

// To handle the page unload and persist data
window.addEventListener('beforeunload', () => {
    localStorage.setItem('clickPatterns', JSON.stringify(behaviorData.clickData));
    localStorage.setItem('mouseMovements', JSON.stringify(behaviorData.mouseMovement));
    localStorage.setItem('scrollData', JSON.stringify(behaviorData.scrollData));
});



// Function to return the captured behavior data
function getBehaviorData() {
    return behaviorData;
}

module.exports = { getBehaviorData };
