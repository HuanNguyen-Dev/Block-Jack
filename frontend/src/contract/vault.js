import { Contract } from "ethers";
import { getBlackjackContract } from "./blackjack-table"; // reuse provider
import vaultAbi from "./abi/vault.json";
import { VAULT_ADDRESS } from "./config";

export async function getVaultContract() {
    const blackjack = await getBlackjackContract();
    const provider = blackjack.runner.provider;
    const signer = await provider.getSigner();

    return new Contract(VAULT_ADDRESS, vaultAbi, signer);
}