import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

interface Props {
  startTime: string;
}

const TripTimer = ({ startTime }: Props) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) return;

    const update = () => {
      const diff = new Date().getTime() - new Date(startTime).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <Text
      style={{
        backgroundColor: '#1E7F3A',
        color: '#fff',
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        overflow: 'hidden',
      }}
    >
      {elapsed}
    </Text>
  );
};

export default TripTimer;
