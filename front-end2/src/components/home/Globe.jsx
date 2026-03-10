import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

const Globe = () => {
    const canvasRef = useRef();

    useEffect(() => {
        let phi = 0;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 1000 * 2,
            height: 1000 * 2,
            phi: 0,
            theta: 0,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.3, 0.3, 0.3], // Brighter base for visibility
            markerColor: [1, 1, 1],
            glowColor: [1, 1, 1],
            opacity: 1,
            offset: [0, 0],
            markers: [
                { location: [40.7128, -74.0060], size: 0.1 },
                { location: [35.6762, 139.6503], size: 0.1 },
                { location: [51.5074, -0.1278], size: 0.1 },
            ],
            onRender: (state) => {
                state.phi = phi;
                phi += 0.01;
            },
        });

        return () => {
            globe.destroy();
        };
    }, []);

    return (
        <div style={{
            width: '100%',
            maxWidth: 600,
            aspectRatio: 1,
            margin: 'auto',
            position: 'relative',
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    opacity: 1, 
                    display: 'block',
                }}
            />
        </div>
    );
}

export default Globe;