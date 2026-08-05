'use client'
import { useEffect } from "react";
import AOS from "aos"
import 'aos/dist/aos.css';

interface AoscompoProps {
    children: React.ReactNode;
}

const Aoscompo = ({ children }: AoscompoProps) => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: false,
        })
    }, [])
    return (
        <div>
            {children}
        </div>
    )
}

export default Aoscompo
