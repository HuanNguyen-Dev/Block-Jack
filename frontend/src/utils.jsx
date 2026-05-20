export const parseTxError = (err) => {
    console.error(err);

    // Wallet rejection
    if (err?.code === "ACTION_REJECTED") {
        return "Transaction cancelled";
    }

    // Ethers v6 revert extraction
    const reason =
        err?.reason ||
        err?.revert?.args?.[0] ||
        err?.shortMessage ||
        err?.info?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "";

    // Vault errors
    if (reason.includes("withdrawal amount")) return "Enter a valid amount";
    if (reason.includes("Insufficient balance")) return "Not enough balance";
    if (reason.includes("House insolvent")) return "Casino has insufficient liquidity";

    // Blackjack errors
    if (reason.includes("Game already in progress")) return "Finish your current game first";

    if (reason.includes("Bet out of range")) return "Bet must be within table limits";
    
    if (reason.includes("No active game currently")) return "Start a game first";
    
    if (reason.includes("Bet already placed")) return "Bet already placed";
    
    if (reason.includes("Token has not been assigned")) return "Game not initialized";

    if (reason.includes("Deck has already been shuffled")) return "Deck already shuffled";

    if (reason.includes("Deck has not been shuffled")) return "Deck not shuffled";
    
    if (reason.includes("Game has already finished")) return "Game already finished";

    if (reason.includes("It is not the players turn")) return "Not your turn";

    if (reason.includes("Cannot hit")) return "Cannot hit";
    
    if (reason.includes("No game has been started")) return "No active game";




    return reason || "Transaction failed";
};