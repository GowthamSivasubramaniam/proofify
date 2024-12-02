const axios = require("axios");
const { generateChallenge, solveChallenge } = require("./src/pow");
const { createProofOfSpace } = require("./src/pos");
const { detectBrowserQuirks } = require("./src/browser-quirk");
const { probeAPIs } = require("./src/api-probing");
const { aggregateScores } = require("./src/aggregator");
const { getMLConfidenceScore } = require("./src/ml-model");
const { getBehaviorData } = require("./src/behavior-capture");
const { caller } = require("./src/pos")
const {monitorPerformance} = require("./src/pow");

const calculateMouseSpeedStd = (mouseData) => {
  if (mouseData.length < 2) {
    return { avgSpeed: 0, totalDistance: 0, avgAngleChange: 0 };
  }

  var totalDistance = 0;
  var totalTime =
    mouseData[mouseData.length - 1].timestamp - mouseData[0].timestamp;
  var speedList = [];
  var angleChanges = [];

  for (var i = 1; i < mouseData.length; i++) {
    var x1 = mouseData[i - 1].x;
    var y1 = mouseData[i - 1].y;
    var x2 = mouseData[i].x;
    var y2 = mouseData[i].y;

    var timeDiff = mouseData[i].timestamp - mouseData[i - 1].timestamp;

    if (timeDiff === 0) continue;

    var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    totalDistance += distance;

    var speed = distance / timeDiff;
    speedList.push(speed);

    if (i > 1) {
      var x0 = mouseData[i - 2].x;
      var y0 = mouseData[i - 2].y;
      var angle1 = Math.atan2(y1 - y0, x1 - x0);
      var angle2 = Math.atan2(y2 - y1, x2 - x1);
      var angleChange = Math.abs(angle2 - angle1);
      angleChanges.push(angleChange);
    }
  }

  var avgSpeed =
    speedList.length > 0
      ? speedList.reduce((a, b) => a + b, 0) / speedList.length
      : 0;
  var avgAngleChange =
    angleChanges.length > 0
      ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length
      : 0;

  return {
    avgSpeed: avgSpeed,
    totalDistance: totalDistance,
    avgAngleChange: avgAngleChange,
  };
};

// Function to simulate capturing new behavior data
async function appendBehaviorData() {
  const newData = getBehaviorData();
  // Increment or update behavior data
  behaviorData.clicks += newData.clicks;
  behaviorData.keystrokes += newData.keystrokes;
  behaviorData.backspaceCount += newData.backspaceCount;
  behaviorData.repeatedKeyCount += newData.repeatedKeyCount;

  // Update mouse movements and scroll speed
  behaviorData.mouseMovements += newData.mouseMovements;
  behaviorData.scrollSpeed += newData.scrollSpeed;

  // Append new click data
  behaviorData.clickData = [...behaviorData.clickData, ...newData.clickData];

  // Append new mouse movement data
  behaviorData.mouseMovement = [
    ...behaviorData.mouseMovement,
    ...newData.mouseMovement,
  ];

  // Append new scroll data
  behaviorData.scrollData = [...behaviorData.scrollData, ...newData.scrollData];

  // Update pageTimeData (cumulative time spent on Forms page)
  if (newData.pageTimeData.Forms) {
    behaviorData.pageTimeData.Forms += newData.pageTimeData.Forms;
  }

  console.log("Updated Behavior Data:", behaviorData);
}

const calculateJitterAndTremors = (mouseData) => {
  if (mouseData.length < 3) {
    return { jitter: 0, tremors: 0 };
  }

  var jitterDistances = [];
  var tremorCounts = 0;

  for (var i = 2; i < mouseData.length; i++) {
    var x1 = mouseData[i - 2].x;
    var y1 = mouseData[i - 2].y;
    var x2 = mouseData[i - 1].x;
    var y2 = mouseData[i - 1].y;
    var x3 = mouseData[i].x;
    var y3 = mouseData[i].y;

    var dist1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    var dist2 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2));

    var distanceDiff = Math.abs(dist2 - dist1);
    if (distanceDiff > 0 && distanceDiff < 5) {
      jitterDistances.push(distanceDiff);
    }
    var angle1 = Math.atan2(y2 - y1, x2 - x1);
    var angle2 = Math.atan2(y3 - y2, x3 - x2);
    var angleChange = Math.abs(angle2 - angle1);

    if (angleChange > Math.PI / 2) {
      tremorCounts++;
    }
  }
  var jitter =
    jitterDistances.length > 0
      ? jitterDistances.reduce((a, b) => a + b, 0) / jitterDistances.length
      : 0;
  var tremors = tremorCounts;
  return { jitter: jitter, tremors: tremors };
};
const calculateClickIntervalAvg = (clickData) => {
  const intervals = [];
  for (let i = 1; i < clickData.length; i++) {
    const interval = clickData[i].timestamp - clickData[i - 1].timestamp;
    intervals.push(interval);
  }
  return intervals.length > 0
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : 0;
};
const calculateClickAreaVariability = (clickData) => {
  if (clickData.length < 2) {
    return { xVariance: 0, yVariance: 0, totalVariance: 0 };
  }

  const xCoords = clickData.map((click) => click.x);
  const yCoords = clickData.map((click) => click.y);

  const calculateVariance = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return (
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length
    );
  };

  const xVariance = calculateVariance(xCoords);
  const yVariance = calculateVariance(yCoords);

  const totalVariance = Math.sqrt(xVariance + yVariance);

  return {
    xVariance: xVariance,
    yVariance: yVariance,
    totalVariance: totalVariance,
  };
};
const calculateScrollSpeedAvg = (scrollData) => {
  const speeds = [];
  for (let i = 1; i < scrollData.length; i++) {
    const distance =
      scrollData[i].scrollPosition - scrollData[i - 1].scrollPosition;
    const dt = scrollData[i].timestamp - scrollData[i - 1].timestamp;

    if (dt > 0 && !isNaN(distance) && !isNaN(dt)) {
      const speed = distance / dt;
      speeds.push(speed);
    }
  }
  return speeds.length > 0
    ? speeds.reduce((a, b) => a + b, 0) / speeds.length
    : 0;
};
const calculateAverageTypingSpeed = (typingSpeeds) => {
  const totalTimeSpent = fieldData.reduce(
    (total, data) => total + data.timeSpent,
    0
  );
  const averageTimeSpent = totalTimeSpent / fieldData.length;
  return averageTimeSpent;
};
const concatenateFieldData = (data) => {
  const result = {};

  data.forEach((entry) => {
    const { fieldName, intervals, keystrokes, timeSpent, startTime1, endTime } =
      entry;

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
      result[fieldName].endTime = Math.max(result[fieldName].endTime, endTime);
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
    console.log(timeInterval);

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
const calculateStatistics = (keyHoldData) => {
  const durations = Object.values(keyHoldData)
    .map((data) => data.holdDuration)
    .filter((duration) => duration > 0);

  if (durations.length === 0) return { avgDuration: 0, stdDev: 0 };

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  const variance =
    durations.reduce((a, b) => a + Math.pow(b - avgDuration, 2), 0) /
    durations.length;
  const stdDev = Math.sqrt(variance);

  return { avgKeyHoldDurarion: avgDuration, avdStdKeyHoldDev: stdDev };
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
      `Average keystroke interval for ${field.fieldName}: ${avgInterval.toFixed(
        2
      )}`
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
// Main function to run bot detection system
async function runBotDetection(backspaceCount , repeatedKeyCount , startTime , keyHoldData, clickData, mouseMovement,scrollData,fieldData,endTime) {
  try {
    // Proof of Work (Optional)
    // const pow = generateChallenge();
    // const nonce = solveChallenge(pow.challenge, pow.target);
    // pow.nonce = nonce;

    // Proof of Space (Optional)
    // const pos = { filePath: './spaceProof.tmp', sizeMB: 5 };
    // createProofOfSpace(pos.filePath, pos.sizeMB);
    const mouseSpeedStd = calculateMouseSpeedStd(mouseMovement);
    const jittersandTremors = calculateJitterAndTremors(
      mouseMovement
    );
    const clickIntervalAvg = calculateClickIntervalAvg(clickData);
    const variableData = calculateClickAreaVariability(clickData);
    const concatenatedData = concatenateFieldData(fieldData);
    const scrollSpeedAvg = calculateScrollSpeedAvg(scrollData);
    // const averageTypingSpeed = calculateAverageTypingSpeed(
    //   behaviorData.fieldData
    // );
    const keyHoldValues = calculateStatistics(keyHoldData);
    const averageTimeSpent = (endTime - startTime) / 1000;
    const keyFieldData = calculateAverageKeystrokeInterval(
      concatenatedData.concatenatedData
    );
    const data = [];
    data.push(
      mouseSpeedStd.avgSpeed,
      mouseSpeedStd.avgAngleChange,
      jittersandTremors.tremors,
      jittersandTremors.jitter,
      variableData.xVariance,
      variableData.yVariance,
      variableData.totalVariance,
      keyHoldValues.avgKeyHoldDurarion,
      keyHoldValues.avdStdKeyHoldDev,
      clickIntervalAvg,
      scrollSpeedAvg,
      keyFieldData.overallAvgInterval,
      keyFieldData.avgTimeSpent,
      parseFloat(concatenatedData.averageInterval),
      backspaceCount,
      averageTimeSpent
    );
    const finalBehaviourData = {
        features: data,
      };

    // Browser Quirks Detection
    const quirks = detectBrowserQuirks();

    // API Probing
    const apis = probeAPIs();
    
    // ML Confidence Score
    // const behaviorData = getBehaviorData();
    
    console.log("Behavior Data:", finalBehaviourData);
    let ml = await getMLConfidenceScore(finalBehaviourData);
    console.log("ML score",ml);
    // Aggregate scores
    let pos = await caller();caller();
    console.log("pos" ,pos );
    const result = monitorPerformance(6e6);
    console.log('pow of ', result.k);
   
    const score = aggregateScores(quirks,apis, ml,pos,result.k);

    // Post the score to your server
    // await axios.post("http://localhost:5001/api/save-behavior", {
    //   score,
    // });

    console.log(`Bot Detection Score: ${score}`);

    return score;
  } catch (error) {
    console.error("Error running bot detection:", error);
  }
}

module.exports = { runBotDetection, appendBehaviorData };
