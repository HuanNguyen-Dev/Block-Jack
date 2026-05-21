import { useNavigate } from 'react-router-dom'

export default function BackButton() {
    const navigate = useNavigate();
    return (
        <button className='play-button'
            onClick={() => navigate('/')}
            style={{
                position: 'absolute',
                top: 10,
                left: 10,
                padding: '10px 20px',
            }}>
            <span>Back</span>
        </button>
    );
}