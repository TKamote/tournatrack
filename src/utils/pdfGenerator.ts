import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Match, Player, MatchFormat } from "../types";

interface TournamentPDFData {
  tournamentType: string;
  winner: Player;
  runnerUp: Player | null;
  matches: Match[];
  matchFormat: MatchFormat;
  completedDate?: Date;
}

export const generateTournamentPDF = async (
  data: TournamentPDFData
): Promise<void> => {
  const {
    tournamentType,
    winner,
    runnerUp,
    matches,
    matchFormat,
    completedDate,
  } = data;

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const roundKey = `Round ${match.round}${
      match.bracket !== "winners" ? ` - ${match.bracket}` : ""
    }`;
    if (!acc[roundKey]) {
      acc[roundKey] = [];
    }
    acc[roundKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const dateStr = completedDate
    ? completedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  // Generate HTML for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #000;
            font-size: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          .header h1 {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header .subtitle {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .header hr {
            border: none;
            border-top: 1px solid #000;
            margin-bottom: 10px;
          }
          .winners {
            display: flex;
            gap: 5px;
            margin-bottom: 15px;
          }
          .winner-box {
            flex: 1;
            background: #f0f0f0;
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }
          .winner-box .label {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .winner-box .name {
            font-size: 24px;
            font-weight: bold;
          }
          .round-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .round-title {
            background: #e0e0e0;
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            font-weight: bold;
            font-size: 20px;
            margin-bottom: 5px;
          }
          .matches-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 3px;
          }
          .match-card {
            border: 1px solid #c8c8c8;
            padding: 8px;
            font-size: 12px;
            background: #fff;
            min-height: 70px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .match-number {
            font-weight: bold;
            text-align: center;
            margin-bottom: 6px;
            font-size: 10px;
            color: #555;
          }
          .match-players {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
            width: 100%;
          }
          .player-name {
            font-size: 11px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
          }
          .player-name.left {
            text-align: left;
            justify-self: start;
          }
          .player-name.right {
            text-align: right;
            justify-self: end;
          }
          .player-name.winner {
            font-weight: bold;
          }
          .score {
            font-weight: bold;
            font-size: 13px;
            text-align: center;
            white-space: nowrap;
            padding: 0 4px;
          }
          .match-winner {
            text-align: center;
            font-size: 10px;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid #e0e0e0;
          }
          .match-winner.pending {
            color: #666;
            font-style: italic;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #000;
          }
          @media print {
            body {
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${tournamentType}</h1>
          <div class="subtitle">
            Completed: ${dateStr} | Format: Race to ${
    matchFormat.gamesNeededToWin
  }
          </div>
          <hr>
        </div>

        <div class="winners">
          <div class="winner-box">
            <div class="label">🏆 Champion</div>
            <div class="name">${winner.name}</div>
          </div>
          ${
            runnerUp
              ? `<div class="winner-box">
                <div class="label">🥈 Runner Up</div>
                <div class="name">${runnerUp.name}</div>
              </div>`
              : ""
          }
        </div>

        ${Object.entries(matchesByRound)
          .map(
            ([roundTitle, roundMatches]) => `
          <div class="round-section">
            <div class="round-title">${roundTitle}</div>
            <div class="matches-grid">
              ${roundMatches
                .map((match) => {
                  const player1Name = match.player1?.name || "Bye";
                  const player2Name = match.player2?.name || "Bye";
                  const winnerName = match.winner?.name || "";
                  const isBye = !match.player1 || !match.player2;

                  const player1Score = match.games.filter(
                    (g) => g.winner?.id === match.player1?.id
                  ).length;
                  const player2Score = match.games.filter(
                    (g) => g.winner?.id === match.player2?.id
                  ).length;

                  return `
                    <div class="match-card">
                      <div class="match-number">M${match.matchNumber}</div>
                      ${
                        isBye
                          ? `<div class="match-winner">${
                              player1Name || player2Name
                            } - Bye</div>`
                          : `
                        <div class="match-players">
                          <span class="player-name left ${
                            winnerName === player1Name ? "winner" : ""
                          }">${
                              player1Name.length > 12
                                ? player1Name.substring(0, 10) + ".."
                                : player1Name
                            }</span>
                          <span class="score">${player1Score}-${player2Score}</span>
                          <span class="player-name right ${
                            winnerName === player2Name ? "winner" : ""
                          }">${
                              player2Name.length > 12
                                ? player2Name.substring(0, 10) + ".."
                                : player2Name
                            }</span>
                        </div>
                        <div class="match-winner ${
                          !match.winner ? "pending" : ""
                        }">
                          ${
                            match.winner
                              ? `✓ ${
                                  winnerName.length > 12
                                    ? winnerName.substring(0, 10) + ".."
                                    : winnerName
                                }`
                              : "Pending"
                          }
                        </div>
                      `
                      }
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}

        <div class="footer">
          TournaTrack • ${new Date().toLocaleDateString()}
        </div>
      </body>
    </html>
  `;

  try {
    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Tournament Results",
      });
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
