const crypto = require('crypto');
const os = require('os');

// Function to perform a high-computation task
function performHighComputationTask(iterations = 6e6) {
    const time1 = Date.now();
    let k1=10;
    for (let i = 0; i < iterations; i++) {
    
        crypto.createHash('sha256').update(`${Math.random()}`).digest('hex');
        let time2=Date.now();
        if(time2-time1 >50000)
        {
          k1=8;
        }
        else if(time2-time1 >750000)
        {
            k1=6;
        }
        else if (time2-time1 >100000)
        {
            k1=4;
        }
        else if (time2-time1 >110000)
        {
            k1=0;
            break;
        }
    }
    
    return k1;
}

// Function to get CPU usage
function getCpuUsage() {
    const cpus = os.cpus();
    console.log("cpusss",cpus);
    if (!cpus) {
        console.error("Failed to retrieve CPU information.");
        return [];
    }
    return cpus.map((cpu, index) => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        console.log(`CPU ${index}: Total - ${total}, Idle - ${idle}`);
        return {
            idle,
            total,
        };
    });
}

// Function to calculate CPU utilization
function calculateCpuUtilization(start, end) {
    if (start.length !== end.length) {
        console.error('Mismatch in CPU core count');
        return [];
    }

    return start.map((cpu, index) => {
        const idleDiff = end[index].idle - cpu.idle;
        const totalDiff = end[index].total - cpu.total;

        if (totalDiff <= 0) {
            console.warn(`Invalid totalDiff at index ${index}`);
            return null; // Prevent division by zero or negative differences
        }

        const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
        return usage;
    }).filter(usage => usage !== null); // Remove any null values
}

// Main function to monitor performance
function monitorPerformance(iterations = 6e6) {
    console.log('Step 1: Capturing initial CPU ...');
    const startCpuState = getCpuUsage();
    console.log('Initial CPU state captured:', startCpuState);

    console.log('Step 2: Performing the high-computation task...');
    const startTime = Date.now();
    const flag=1;
    let k=0;
    try{
     k = performHighComputationTask(iterations);
     console.log('CPU Utilization (%):',k);
    }
    catch(error)
    {
      flag=0;
    }
    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;``
    console.log('Execution Time (ms):', executionTimeMs);

    // console.log('Step 3: Capturing CPU state after the task...');
    // const endCpuState = getCpuUsage();
    // console.log('Final CPU state captured:', endCpuState);

    // console.log('Step 4: Calculating CPU utilization...');
    // const cpuUtilization = calculateCpuUtilization(startCpuState, endCpuState);
    // console.log('CPU Utilization (%):',k);
    if (k && flag==1)
    return {k};
    else
    {
    k=0;
    return {k};
    }
}

module.exports = { monitorPerformance };