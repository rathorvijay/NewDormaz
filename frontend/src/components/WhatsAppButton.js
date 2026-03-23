import React from 'react';
import { Fab, Tooltip, Zoom } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const WhatsAppButton = () => {
  const waNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '918817709195';
  const waLink = `https://wa.me/${waNumber}?text=Hello%20Dormez!%20I%20need%20help%20with%20a%20mattress.`;

  return (
    <Tooltip title="Chat with Dormez Support 🛏️" placement="left" TransitionComponent={Zoom}>
      <Fab
        component="a"
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#25D366',
          color: 'white',
          zIndex: 9999,
          width: 60,
          height: 60,
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.5)',
          '&:hover': {
            bgcolor: '#128C7E',
            transform: 'scale(1.1)',
            boxShadow: '0 6px 25px rgba(37, 211, 102, 0.7)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <WhatsAppIcon sx={{ fontSize: 32 }} />
      </Fab>
    </Tooltip>
  );
};

export default WhatsAppButton;
