
import React from 'react';

// SVG Icons
const LinkedInIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

// This is the app's logo, sized for the footer.
const QuaCKIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g>
      <polygon points="22,6 24,8 20,8" fill="#f8c246"/>
      <polygon points="16,4 22,6 20,8" fill="#93c5fd"/>
      <polygon points="14,14 16,4 20,8" fill="#3b82f6"/>
      <polygon points="21,18 14,14 20,8" fill="#2563eb"/>
      <polygon points="8,20 14,14 21,18" fill="#1d4ed8"/>
      <polygon points="6,15 3,18 8,20" fill="#60a5fa"/>
      <polygon points="14,14 8,20 6,15" fill="#1e40af"/>
    </g>
  </svg>
);


const CVIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
);

const FooterLink: React.FC<{ href: string; children: React.ReactNode; text: string }> = ({ href, children, text }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors group"
        aria-label={`View ${text}`}
    >
        {children}
        <span className="group-hover:underline hidden sm:inline">{text}</span>
    </a>
);


const Footer: React.FC = () => {
    return (
        <footer className="mt-16 py-8 text-center border-t border-border-color">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center space-x-6 sm:space-x-8">
                    <FooterLink href="https://www.linkedin.com/in/andrewbadura/" text="LinkedIn">
                        <LinkedInIcon />
                    </FooterLink>
                    <FooterLink href="https://quack.wherd.app/" text="QuaCK App">
                        <QuaCKIcon />
                    </FooterLink>
                    <FooterLink href="https://andrewbadura.github.io/" text="CV">
                        <CVIcon />
                    </FooterLink>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
