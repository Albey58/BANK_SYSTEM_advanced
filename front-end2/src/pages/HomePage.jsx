import React, { useEffect } from 'react';
import Hero from '../components/home/Hero';
import TrustIndicators from '../components/home/TrustIndicators';
import ProductsGrid from '../components/home/ProductsGrid';
import USP from '../components/home/USP';
import InterestRates from '../components/home/InterestRates';
import MobileApp from '../components/home/MobileApp';
import Testimonials from '../components/home/Testimonials';
import SecurityBanner from '../components/home/SecurityBanner';
import FAQ from '../components/home/FAQ';
import CTA from '../components/home/CTA';
import Footer from '../components/home/Footer';

const HomePage = ({ onOpenRegister }) => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', width: '100%' }}>
            <Hero onOpenRegister={onOpenRegister} />
            <TrustIndicators />
            <ProductsGrid />
            <USP />
            <section id="rates"><InterestRates /></section>
            <MobileApp />
            <Testimonials />
            <section id="security"><SecurityBanner /></section>
            <section id="faq"><FAQ /></section>
            <CTA onOpenRegister={onOpenRegister} />
            <Footer />
        </div>
    );
};

export default HomePage;
