import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// Obtained from: https://mui.com/material-ui/react-dialog/

export default function PlaceBetDialogue({ onPlaceBet }) {
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
        onPlaceBet(amount);
        console.log(amount);

        // Backend Logic here maybe

        handleClose();
    };

    return (
        <React.Fragment>
            <Button
                variant="contained"
                onClick={handleClickOpen}
                sx={{
                    zIndex: 10,
                    bottom: 80,
                }}
            >
                Place Bet Amount
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                sx={{
                    zIndex: 11,
                }}

            >
                <DialogTitle>Enter in GWEI</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your bet amount here. The limits are 100 gwei to 0.001 ether.
                    </DialogContentText>
                    <form onSubmit={handleSubmit} id="place-bet">
                        <TextField
                            autoFocus
                            required
                            margin="dense"
                            id="bet"
                            name="amount"
                            label="Bet Amount"
                            type="number"
                            fullWidth
                            variant="standard"
                            value={amount}
                            onChange={handleChange}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" form="place-bet">
                        SET
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
