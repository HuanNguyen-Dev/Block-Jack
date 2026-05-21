import { useState } from "react";
import { Box, Stack } from '@mui/material'
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { parseEther } from "ethers";

export default function WithdrawButton({onWithdraw}) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    const handleWithdraw = async () => {
        try {
            setError("");

            if (!amount || Number(amount) <= 0) {
                setError("Enter a valid amount");
                return;
            }

            onWithdraw(parseEther(amount));

            setOpen(false);
            setAmount("");
        } catch (err) {
            console.error(err);
            setError("Withdrawal failed");
        } 
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                className="base-button withdraw-button"
                variant="outlined"
                color="primary"
                onClick={() => setOpen(true)}
            >
                Withdraw
            </button>

            {/* Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Withdraw Funds</DialogTitle>

                <DialogContent>
                        <TextField
                            label="Amount (ETH)"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            fullWidth
                        />

                </DialogContent>

                <DialogActions>
                    <button
                        className="base-button withdraw-button"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </button>

                    <button
                        className="base-button withdraw-button"
                        onClick={handleWithdraw}
                        variant="contained"
                        color="success"
                        label="Submit"
                    >
                        Submit
                    </button>
                </DialogActions>
            </Dialog>
        </>
    );
}