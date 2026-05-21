import { Box, Button, Stack, Typography } from '@mui/material'
import BackButton from './BackButton'
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
export default function DisplayMessage({title, subtitle}) {
    return (
        <Box
            component="section"
            className="blackjack-hero"
            sx={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
            }}
        >
            {/* Background image */}
            <img
                src={blackjackTableIMG}
                alt="Blackjack Table"
                className="table-image"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />

            <BackButton></BackButton>

            {/* Center overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                }}
            >
                <Box
                    sx={{
                        px: 6,
                        py: 4,
                        borderRadius: 4,
                        textAlign: 'center',
                        backdropFilter: 'blur(8px)',
                        background: 'rgba(0,0,0,0.55)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            color: '#fff',
                            fontWeight: 700,
                            mb: 1,
                            letterSpacing: 1,
                            fontFamily: "'Pixelify Sans', sans-serif",

                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '1.1rem',
                            fontFamily: "'Pixelify Sans', sans-serif",
                        }}
                    >
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}
