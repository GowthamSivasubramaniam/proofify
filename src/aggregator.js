const { detectBrowserQuirks } = require('./browser-quirk');
const { probeAPIs } = require('./api-probing');


// Function to aggregate the bot detection scores from different methods
function aggregateScores( quirks,apis,mlConfidence,pos,pow) {
    let score = 0;
    console.log(score);  // Base score

    // // Proof-of-Work (Optional)
    // if (puzzle && verifySolution(puzzle.challenge, puzzle.nonce, puzzle.target)) {
    //     score += 20;
    //     console.log(score);
    // }

    // // Proof-of-Space (Optional)
    // if (proofOfSpace && verifyProofOfSpace(proofOfSpace.filePath, proofOfSpace.sizeMB)) {
    //     score += 10;
    //     console.log(score);
    // }


    // if (quirks && quirks.javaEnabled) {
    //     score += 2.5;
    //     console.log("1",score);
    // }
    if (!quirks.headlessChrome)
    {
        score += 2.5;
        console.log("2",score);
    }

    // API Probing
    console.log("pos agg" , pos);
    if (quirks && apis && apis.webGL && apis.geolocation && pos==1) {
        score += 7.5;
        console.log(pos);
        console.log("3",score);
    }
    console.log("pow agg" , pow);
    if (pow) {
        score += pow;
        console.log("4",score);
    }
    
    // Machine Learning Confidence Score
    if (mlConfidence >= 0) {
        score +=(mlConfidence*70) ;  // Scale ML confidence to a max of 30 points
        console.log(score);
    }

    return score;
}

module.exports = { aggregateScores };
