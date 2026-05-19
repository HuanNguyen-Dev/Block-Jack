import { Contract } from "ethers";
import { getProvider } from "./provider";
import abi from "./abi/BlackJackTable.json";
import { BLACKJACK_ADDRESS } from "./config";

export async function getBlackjackContract() {
  const provider = await getProvider();
  const signer = await provider.getSigner();

  return new Contract(
    BLACKJACK_ADDRESS,
    abi,
    signer
  );
}