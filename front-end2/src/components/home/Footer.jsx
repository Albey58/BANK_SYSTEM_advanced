import React from 'react';
import { Twitter, Facebook, Instagram, Linkedin, Github } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>NEXUS BANK</div>
            <p className={styles.tagline}>
              Simplifying finance for the modern world. Secure, transparent, and built around you.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialLink}><Twitter size={20} /></a>
              <a href="#" className={styles.socialLink}><Facebook size={20} /></a>
              <a href="#" className={styles.socialLink}><Instagram size={20} /></a>
              <a href="#" className={styles.socialLink}><Linkedin size={20} /></a>
            </div>
          </div>
          
          <div className={styles.links}>
            <div className={styles.col}>
              <h4>Products</h4>
              <ul>
                <li><a href="#">Checking</a></li>
                <li><a href="#">Savings</a></li>
                <li><a href="#">Credit Cards</a></li>
                <li><a href="#">Loans</a></li>
                <li><a href="#">Investments</a></li>
              </ul>
            </div>
            
            <div className={styles.col}>
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Partners</a></li>
              </ul>
            </div>
            
            <div className={styles.col}>
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Status</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
            
            <div className={styles.col}>
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
                <li><a href="#">Disclosures</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} Nexus Bank Inc. All rights reserved.</p>
          <p className={styles.disclaimer}>
            Nexus Bank is a Member FDIC. Equal Housing Lender. NMLS #123456.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
