/**
 * Windsurf AI advertisement implementation for the SpellbookEntity2
 * Displays a cyberpunk-styled advertisement with referral link
 */

function displayWindsurfAdvertisement() {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'spellbook-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease-in-out';
    
    // Create spellbook page container
    const spellbookPage = document.createElement('div');
    spellbookPage.style.width = '90%';
    spellbookPage.style.maxWidth = '800px';
    spellbookPage.style.height = '90%';
    spellbookPage.style.maxHeight = '700px';
    spellbookPage.style.backgroundColor = '#0a0a14'; // Dark cyberpunk background
    spellbookPage.style.borderRadius = '5px';
    spellbookPage.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(128, 0, 255, 0.3)';
    spellbookPage.style.padding = '30px';
    spellbookPage.style.overflowY = 'auto';
    spellbookPage.style.color = '#e0e0ff';
    spellbookPage.style.position = 'relative';
    spellbookPage.style.fontFamily = '"Rajdhani", "Orbitron", sans-serif';
    
    // Create neon border effect
    const borderGlow = document.createElement('div');
    borderGlow.style.position = 'absolute';
    borderGlow.style.top = '0';
    borderGlow.style.left = '0';
    borderGlow.style.width = '100%';
    borderGlow.style.height = '100%';
    borderGlow.style.boxShadow = 'inset 0 0 2px #0ff, inset 0 0 5px #0ff, inset 0 0 10px #0ff';
    borderGlow.style.pointerEvents = 'none';
    borderGlow.style.borderRadius = '5px';
    spellbookPage.appendChild(borderGlow);
    
    // Add header with Windsurf logo and title
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'center';
    header.style.marginBottom = '25px';
    header.style.position = 'relative';
    
    // Add official Windsurf logo
    const logoContainer = document.createElement('div');
    logoContainer.style.marginBottom = '20px';
    logoContainer.style.width = '100%';
    logoContainer.style.display = 'flex';
    logoContainer.style.justifyContent = 'center';
    
    // Official Windsurf logo with glow effect
    const logoSVG = `
    <div style="position: relative; width: 150px; height: 150px; display: flex; justify-content: center; align-items: center; background-color: #000; border-radius: 50%;">
        <svg viewBox="0 0 100 100" width="100" height="100">
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <g filter="url(#neonGlow)">
                <path d="M25,30 C50,30 75,45 75,45" stroke="#00ff9d" stroke-width="8" stroke-linecap="round" fill="none" />
                <path d="M25,50 C50,50 75,65 75,65" stroke="#00ff9d" stroke-width="8" stroke-linecap="round" fill="none" />
                <path d="M25,70 C50,70 75,85 75,85" stroke="#00ff9d" stroke-width="8" stroke-linecap="round" fill="none" />
            </g>
        </svg>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, rgba(0,255,157,0.2) 0%, transparent 70%); pointer-events: none;"></div>
    </div>`;
    
    logoContainer.innerHTML = logoSVG;
    header.appendChild(logoContainer);
    
    // Title
    const title = document.createElement('h1');
    title.innerHTML = 'WINDSURF <span style="color: #0ff;">AI</span> EDITOR';
    title.style.fontSize = '36px';
    title.style.margin = '0';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    title.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.7)';
    title.style.letterSpacing = '2px';
    header.appendChild(title);
    
    // Tagline
    const tagline = document.createElement('p');
    tagline.textContent = "RIDE THE DIGITAL WAVE | CODE BEYOND REALITY";
    tagline.style.fontSize = '18px';
    tagline.style.margin = '10px 0 0';
    tagline.style.color = '#ff00ff';
    tagline.style.textAlign = 'center';
    tagline.style.fontStyle = 'italic';
    tagline.style.textShadow = '0 0 8px rgba(255, 0, 255, 0.5)';
    header.appendChild(tagline);
    
    spellbookPage.appendChild(header);
    
    // Main content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '25px';
    content.style.padding = '0 15px';
    
    // Feature highlights section
    const featuresSection = document.createElement('div');
    featuresSection.style.marginBottom = '30px';
    
    const featuresTitle = document.createElement('h2');
    featuresTitle.textContent = 'TRANSCEND YOUR CODE';
    featuresTitle.style.borderBottom = '2px solid #0ff';
    featuresTitle.style.paddingBottom = '10px';
    featuresTitle.style.color = '#0ff';
    featuresTitle.style.fontSize = '24px';
    featuresTitle.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
    featuresSection.appendChild(featuresTitle);
    
    // Features list
    const featuresList = document.createElement('ul');
    featuresList.style.listStyleType = 'none';
    featuresList.style.padding = '0';
    featuresList.style.margin = '20px 0';
    
    const features = [
        {
            title: "GENERATE COMPLEX ENVIRONMENTS",
            description: "Build fully realized 3D game engines and sophisticated applications that other AI editors struggle to create"
        },
        {
            title: "SEAMLESS CONVERSATION COPYING",
            description: "Copy entire agent conversations with one motion - including code snippets and terminal commands"
        },
        {
            title: "PROFESSIONAL VS CODE INTEGRATION",
            description: "Powerful yet accessible environment that grows with your skills beyond beginner-focused editors"
        }
    ];
    
    features.forEach(feature => {
        const featureItem = document.createElement('li');
        featureItem.style.margin = '0 0 25px 0';
        featureItem.style.position = 'relative';
        featureItem.style.paddingLeft = '30px';
        
        // Create neon bullet point
        const bulletPoint = document.createElement('div');
        bulletPoint.style.position = 'absolute';
        bulletPoint.style.left = '0';
        bulletPoint.style.top = '5px';
        bulletPoint.style.width = '15px';
        bulletPoint.style.height = '15px';
        bulletPoint.style.borderRadius = '50%';
        bulletPoint.style.backgroundColor = '#ff00ff';
        bulletPoint.style.boxShadow = '0 0 10px #ff00ff';
        featureItem.appendChild(bulletPoint);
        
        const featureTitle = document.createElement('h3');
        featureTitle.textContent = feature.title;
        featureTitle.style.margin = '0 0 5px 0';
        featureTitle.style.fontSize = '18px';
        featureTitle.style.color = '#ff00ff';
        featureTitle.style.textShadow = '0 0 5px rgba(255, 0, 255, 0.3)';
        featureItem.appendChild(featureTitle);
        
        const featureDesc = document.createElement('p');
        featureDesc.textContent = feature.description;
        featureDesc.style.margin = '0';
        featureDesc.style.fontSize = '16px';
        featureDesc.style.color = '#e0e0ff';
        featureDesc.style.lineHeight = '1.4';
        featureItem.appendChild(featureDesc);
        
        featuresList.appendChild(featureItem);
    });
    
    featuresSection.appendChild(featuresList);
    content.appendChild(featuresSection);
    
    // Testimonial section
    const testimonialSection = document.createElement('div');
    testimonialSection.style.backgroundColor = 'rgba(0, 0, 30, 0.4)';
    testimonialSection.style.padding = '20px';
    testimonialSection.style.borderRadius = '5px';
    testimonialSection.style.marginBottom = '30px';
    testimonialSection.style.border = '1px solid rgba(0, 255, 255, 0.3)';
    testimonialSection.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.2)';
    
    const testimonialQuote = document.createElement('p');
    testimonialQuote.innerHTML = `"As a novice developer, I found Windsurf AI capable of generating complex environments I failed to achieve with other editors. After just a few dozen hours of coding experience, Windsurf became my essential creative partner."`;
    testimonialQuote.style.fontSize = '16px';
    testimonialQuote.style.fontStyle = 'italic';
    testimonialQuote.style.margin = '0 0 10px 0';
    testimonialQuote.style.lineHeight = '1.6';
    testimonialSection.appendChild(testimonialQuote);
    
    const testimonialAuthor = document.createElement('p');
    testimonialAuthor.textContent = "— Circuit Sanctum Developer";
    testimonialAuthor.style.textAlign = 'right';
    testimonialAuthor.style.margin = '0';
    testimonialAuthor.style.fontSize = '15px';
    testimonialAuthor.style.color = '#0ff';
    testimonialSection.appendChild(testimonialAuthor);
    
    content.appendChild(testimonialSection);
    
    // Call to action section
    const ctaSection = document.createElement('div');
    ctaSection.style.textAlign = 'center';
    ctaSection.style.marginTop = '10px';
    ctaSection.style.padding = '25px';
    ctaSection.style.backgroundColor = 'rgba(128, 0, 255, 0.1)';
    ctaSection.style.borderRadius = '5px';
    ctaSection.style.border = '1px solid rgba(128, 0, 255, 0.3)';
    
    const ctaTitle = document.createElement('h3');
    ctaTitle.textContent = 'SUPPORT THE VIBE CODING COMMUNITY';
    ctaTitle.style.margin = '0 0 15px 0';
    ctaTitle.style.color = '#ff00ff';
    ctaTitle.style.fontSize = '20px';
    ctaTitle.style.textShadow = '0 0 8px rgba(255, 0, 255, 0.5)';
    ctaSection.appendChild(ctaTitle);
    
    const ctaText = document.createElement('p');
    ctaText.innerHTML = 'Sign up for a premium Windsurf account using my affiliate link.<br>Each signup earns flex credits to help create more content for the community.';
    ctaText.style.margin = '0 0 20px 0';
    ctaText.style.fontSize = '16px';
    ctaText.style.lineHeight = '1.5';
    ctaSection.appendChild(ctaText);
    
    // Radio button styling with animation
    const radioContainer = document.createElement('label');
    radioContainer.style.display = 'flex';
    radioContainer.style.alignItems = 'center';
    radioContainer.style.justifyContent = 'center';
    radioContainer.style.cursor = 'pointer';
    radioContainer.style.margin = '0 auto';
    radioContainer.style.padding = '12px 30px';
    radioContainer.style.borderRadius = '5px';
    radioContainer.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
    radioContainer.style.border = '1px solid #0ff';
    radioContainer.style.width = 'fit-content';
    radioContainer.style.transition = 'all 0.3s ease';
    radioContainer.style.position = 'relative';
    radioContainer.style.overflow = 'hidden';
    
    // Add mobile-friendly touch styling (from TV shuffle button implementation memory)
    radioContainer.style.touchAction = 'manipulation';
    radioContainer.style.webkitTapHighlightColor = 'transparent';
    
    // Add pseudo-neon glow effect
    const radioGlow = document.createElement('div');
    radioGlow.style.position = 'absolute';
    radioGlow.style.top = '0';
    radioGlow.style.left = '0';
    radioGlow.style.right = '0';
    radioGlow.style.bottom = '0';
    radioGlow.style.boxShadow = 'inset 0 0 10px rgba(0, 255, 255, 0.5)';
    radioGlow.style.opacity = '0';
    radioGlow.style.transition = 'opacity 0.3s ease';
    radioContainer.appendChild(radioGlow);
    
    // Radiobutton with cyberpunk styling
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'signup';
    radio.style.appearance = 'none';
    radio.style.WebkitAppearance = 'none';
    radio.style.MozAppearance = 'none';
    radio.style.width = '20px';
    radio.style.height = '20px';
    radio.style.borderRadius = '50%';
    radio.style.border = '2px solid #0ff';
    radio.style.marginRight = '10px';
    radio.style.position = 'relative';
    radio.style.backgroundColor = 'transparent';
    radio.style.boxShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
    radio.style.cursor = 'pointer';
    radio.style.transition = 'all 0.2s ease';
    
    // Create inner circle for checked state
    const radioInner = document.createElement('div');
    radioInner.style.position = 'absolute';
    radioInner.style.top = '50%';
    radioInner.style.left = '50%';
    radioInner.style.transform = 'translate(-50%, -50%) scale(0)';
    radioInner.style.width = '10px';
    radioInner.style.height = '10px';
    radioInner.style.borderRadius = '50%';
    radioInner.style.backgroundColor = '#0ff';
    radioInner.style.boxShadow = '0 0 10px #0ff';
    radioInner.style.transition = 'transform 0.2s ease';
    radio.appendChild(radioInner);
    
    // Radio button text
    const radioText = document.createElement('span');
    radioText.textContent = 'SIGN UP WITH MY REFERRAL LINK';
    radioText.style.fontSize = '18px'; // Larger font for mobile (as per memory)
    radioText.style.fontWeight = 'bold';
    radioText.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
    
    radioContainer.appendChild(radio);
    radioContainer.appendChild(radioText);
    
    // Add hover and touch effects to radio container
    const handleButtonHighlight = () => {
        radioContainer.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
        radioGlow.style.opacity = '1';
        radio.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.8)';
        radioContainer.style.transform = 'scale(0.97)'; // Subtle scale effect for tactile feedback
    };
    
    const handleButtonNormal = () => {
        radioContainer.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
        radioGlow.style.opacity = '0';
        radio.style.boxShadow = '0 0 5px rgba(0, 255, 255, 0.5)';
        radioContainer.style.transform = 'scale(1)';
    };
    
    // Add both mouse and touch events
    radioContainer.addEventListener('mouseover', handleButtonHighlight);
    radioContainer.addEventListener('mouseout', handleButtonNormal);
    radioContainer.addEventListener('touchstart', handleButtonHighlight, { passive: true });
    radioContainer.addEventListener('touchend', handleButtonNormal, { passive: true });
    
    // Add click and touch effect
    const handleSignupAction = () => {
        radioInner.style.transform = 'translate(-50%, -50%) scale(1)';
        
        // Simulate navigating to affiliate link
        setTimeout(() => {
            window.open('https://windsurf.com/refer?referral_code=qhea2mro7z30oc0e', '_blank');
        }, 300);
        
        // Create pulse animation
        const pulse = document.createElement('div');
        pulse.style.position = 'absolute';
        pulse.style.top = '50%';
        pulse.style.left = '50%';
        pulse.style.transform = 'translate(-50%, -50%)';
        pulse.style.width = '5px';
        pulse.style.height = '5px';
        pulse.style.borderRadius = '50%';
        pulse.style.backgroundColor = '#0ff';
        pulse.style.animation = 'pulse 0.5s linear';
        
        // Add keyframes for pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { width: 5px; height: 5px; opacity: 1; }
                100% { width: 50px; height: 50px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        radio.appendChild(pulse);
        setTimeout(() => {
            if (pulse.parentNode === radio) {
                radio.removeChild(pulse);
            }
        }, 500);
    };
    
    radio.addEventListener('click', handleSignupAction);
    radioContainer.addEventListener('click', () => {
        radio.checked = true;
        handleSignupAction();
    });
    
    ctaSection.appendChild(radioContainer);
    content.appendChild(ctaSection);
    
    spellbookPage.appendChild(content);
    
    // Create close button (styled as an arcane symbol)
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '15px';
    closeButton.style.right = '15px';
    closeButton.style.width = '40px';
    closeButton.style.height = '40px';
    closeButton.style.borderRadius = '50%';
    closeButton.style.background = 'radial-gradient(circle, rgba(128,0,255,0.1) 0%, rgba(128,0,255,0.2) 100%)';
    closeButton.style.display = 'flex';
    closeButton.style.justifyContent = 'center';
    closeButton.style.alignItems = 'center';
    closeButton.style.fontSize = '28px';
    closeButton.style.color = '#ff00ff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.transition = 'all 0.2s';
    closeButton.style.boxShadow = 'none';
    
    closeButton.onmouseover = () => {
        closeButton.style.background = 'radial-gradient(circle, rgba(128,0,255,0.2) 0%, rgba(128,0,255,0.3) 100%)';
        closeButton.style.boxShadow = '0 0 10px rgba(128,0,255,0.5)';
    };
    
    closeButton.onmouseout = () => {
        closeButton.style.background = 'radial-gradient(circle, rgba(128,0,255,0.1) 0%, rgba(128,0,255,0.2) 100%)';
        closeButton.style.boxShadow = 'none';
    };
    
    // Function to close the overlay
    const closeOverlay = () => {
        // Fade out and remove overlay
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                // Remove the event listener when overlay is closed
                document.removeEventListener('keydown', handleKeyDown);
            }
        }, 500);
        
        // Play closing sound (if available)
        if (typeof this.playPageTurnSound === 'function') {
            this.playPageTurnSound();
        }
    };
    
    closeButton.onclick = closeOverlay;
    spellbookPage.appendChild(closeButton);
    
    // Event handler for keyboard input
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            console.log('Windsurf Ad: Escape key detected, closing overlay');
            closeOverlay();
        }
    };
    
    // Add event listener for keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Add the spellbook page to the overlay
    overlay.appendChild(spellbookPage);
    
    // Add the overlay to the document body
    document.body.appendChild(overlay);
    
    // Add animated scanning lines for cyberpunk effect
    const scanLines = document.createElement('div');
    scanLines.style.position = 'absolute';
    scanLines.style.top = '0';
    scanLines.style.left = '0';
    scanLines.style.width = '100%';
    scanLines.style.height = '100%';
    scanLines.style.backgroundImage = 'linear-gradient(transparent 50%, rgba(0, 255, 255, 0.03) 50%)';
    scanLines.style.backgroundSize = '100% 4px';
    scanLines.style.pointerEvents = 'none';
    scanLines.style.zIndex = '1';
    spellbookPage.appendChild(scanLines);
    
    // Fade in the overlay
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    // Play a sound effect for immersion
    if (typeof this.playPageTurnSound === 'function') {
        this.playPageTurnSound();
    }
    
    console.log('Windsurf AI advertisement displayed');
    
    return overlay;
}
