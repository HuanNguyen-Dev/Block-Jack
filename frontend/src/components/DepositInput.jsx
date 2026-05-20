import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// Obtained from: https://mui.com/material-ui/react-dialog/

export default function PlaceDepositDialogue({ onPlaceDeposit }) {
    const [open, setOpen] = React.useState(false);
    const [amount, setAmount] = React.useState('');

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (e) => {
        setAmount(e.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const amount = formJson.amount;
        if (!amount || isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        // Parent call back function
        onPlaceDeposit(amount);
        console.log(amount);

        // Backend Logic here maybe

        handleClose();
    };

    return (
        <React.Fragment>
            <button
                className='base-button bet-button'
                variant="contained"
                onClick={handleClickOpen}
                style={{
                    position: "absolute",
                    top: "250px",
                    transform: "translateY(-20px)",
                    zIndex: 10
                }}
            >
                Place Deposit Amount
            </button>
            <Dialog
                open={open}
                onClose={handleClose}
                sx={{
                    zIndex: 11,
                }}

            >
                <DialogTitle>Enter in Ether</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the amount you would like to deposit.
                    </DialogContentText>
                    <form onSubmit={handleSubmit} id="place-deposit">
                        <TextField
                            autoFocus
                            required
                            margin="dense"
                            id="deposit"
                            name="amount"
                            label="Deposit Amount"
                            type="number"
                            fullWidth
                            variant="standard"
                            value={amount}
                            onChange={handleChange}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <button 
                    className='base-button bet-button'
                    onClick={handleClose}>Cancel</button>
                    <button 
                    className='base-button bet-button'
                    type="submit" form="place-deposit">
                        SET
                    </button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
