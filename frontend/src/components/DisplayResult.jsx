import { Box, Button, Stack, Typography } from '@mui/material'
export default function DisplayResults({Result}) {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 300,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
            }}
        >
            <Typography
                sx={{
                    color: 'white',
                    mb: 2,
                    fontFamily: "'Pixelify Sans', sans-serif",
                    fontSize: '2rem',
                }}
            >
                {Result}
            </Typography>
        </Box> 
    )
}