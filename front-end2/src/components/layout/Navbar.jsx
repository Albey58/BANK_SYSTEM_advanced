import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

/* ---- Anchor link (scrolls to section on home page) ---- */
const AnchorLink = ({ href, children, onClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const sectionId = href.replace('/#', '');
    const isActive = location.hash === `#${sectionId}`;

    const handleClick = (e) => {
        e.preventDefault();
        if (onClick) onClick();
        if (location.pathname === '/') {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/');
            setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
        >
            <span className={styles.navLinkText} data-text={children}>
                {children}
            </span>
        </a>
    );
};

/* ---- Route link (navigates to a page) ---- */
const NavItem = ({ to, children, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            onClick={onClick}
        >
            <span className={styles.navLinkText} data-text={children}>
                {children}
            </span>
        </Link>
    );
};

/* ---- Navbar ---- */
const Navbar = ({ onOpenLogin, onOpenRegister }) => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const closeMenu = () => setIsMenuOpen(false);

    const publicLinks = [
        { label: 'Home',     href: '/#home'     },
        { label: 'Products', href: '/#products' },
        { label: 'Rates',    href: '/#rates'    },
        { label: 'Security', href: '/#security' },
        { label: 'FAQ',      href: '/#faq'      },
    ];

    const authLinks = [
        { label: 'Dashboard', to: '/dashboard'    },
        { label: 'Payments',  to: '/transactions' },
        { label: 'Profile',   to: '/profile'      },
        { label: 'Admin',     to: '/admin'        },
    ];

    return (
        <motion.nav
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}
        >
            <div className={styles.container}>

                {/* ── Logo ── */}
                <Link to="/" className={styles.logo} onClick={closeMenu}>
                    <div className={styles.logoIcon}>
                        <div className={styles.logoIconInner} />
                    </div>
                    <span className={styles.logoText}>
                        Comet Bank
                    </span>
                </Link>

                {/* ── Desktop nav ── */}
                <div className={styles.desktopNav}>
                    {user ? (
                        <>
                            {authLinks.map(({ label, to }) => (
                                <NavItem key={to} to={to} onClick={closeMenu}>{label}</NavItem>
                            ))}

                            <div className={styles.divider} />

                            <button
                                onClick={handleLogout}
                                className={styles.logoutBtn}
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            {publicLinks.map(({ label, href }) => (
                                <AnchorLink key={href} href={href}>{label}</AnchorLink>
                            ))}

                            <div className={styles.divider} />

                            <button
                                onClick={onOpenLogin}
                                className={styles.loginBtn}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={onOpenRegister}
                                className={styles.registerBtn}
                            >
                                Get Started <ChevronRight size={14} />
                            </button>
                        </>
                    )}
                </div>

                {/* ── Mobile hamburger ── */}
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* ── Mobile drawer ── */}
            <div className={`${styles.mobileDrawer} ${isMenuOpen ? styles.open : ''}`}>
                {user ? (
                    <>
                        {authLinks.map(({ label, to }) => (
                            <Link
                                key={to}
                                to={to}
                                onClick={closeMenu}
                                className={styles.mobileNavLink}
                            >
                                {label}
                            </Link>
                        ))}
                        <div className={styles.mobileDivider} />
                        <button
                            onClick={handleLogout}
                            className={styles.mobileLogoutBtn}
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        {publicLinks.map(({ label, href }) => (
                            <AnchorLink key={href} href={href} onClick={closeMenu}>
                                {label}
                            </AnchorLink>
                        ))}
                        <div className={styles.mobileDivider} />
                        <button
                            onClick={() => { onOpenLogin(); closeMenu(); }}
                            className={styles.mobileLoginBtn}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { onOpenRegister(); closeMenu(); }}
                            className={styles.mobileRegisterBtn}
                        >
                            Get Started <ChevronRight size={16} />
                        </button>
                    </>
                )}
            </div>
        </motion.nav>
    );
};

export default Navbar;
