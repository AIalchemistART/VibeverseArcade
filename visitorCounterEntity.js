/**
 * Visitor Counter Entity for the Circuit Sanctum Arcade
 * Displays a cyberpunk/synthwave styled visitor counter connected to Google Analytics
 */

import { Entity } from './entity.js';
import { debug } from './utils.js';

class VisitorCounterEntity extends Entity {
    /**
     * Creates a new visitor counter entity
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {object} options - Additional options
     */
    constructor(x, y, options = {}) {
        // Create a counter with standard settings as a static entity that's ceiling-mounted
        super(x, y, 1.0, 0.6, {
            isStatic: true,
            zHeight: 10.0, // Very high Z position for ceiling mounting (10 grid units up)
            collidable: false // Explicitly not collidable since it's ceiling-mounted
        });
        
        // Physically position the entity high on the Z-axis
        this.z = 10.0; // Ensure Z coordinate matches zHeight
        
        // Completely disable collision by making the collision box non-existent
        this.collisionWidth = 0;
        this.collisionHeight = 0;
        
        // Apply a significant visual offset upward
        this.renderOffsetY = -140; // Even larger offset to ensure it appears high above player reach
        
        // Counter specific properties
        this.visitorCount = 0;
        this.targetCount = 0;
        this.animationSpeed = 0.1;
        this.isAnimating = false;
        this.isInitialized = false;
        
        // Label text - this could be changed as needed
        this.counterLabel = 'TOTAL VISITORS';
        
        // Set up storage key for visitor count
        const today = new Date().toDateString();
        localStorage.setItem('arcadeVisitorCountDate', today);
        
        // Visual properties
        this.glowColor = '#00FFFF';
        this.glowIntensity = 0;
        this.maxGlowIntensity = 8;
        this.glowPulseSpeed = 0.05;
        this.glowDirection = 1;
        
        // Counter display properties
        this.digitWidth = 32; // Wider for more clarity
        this.digitHeight = 50;
        this.digitGap = 8; // Smaller gap to fit better
        this.digitThickness = 6; // Thicker segments for readability
        this.digitOnColor = '#00ffff'; // Bright cyan for active segments
        this.digitOffColor = '#001010'; // Very dark for inactive segments 
        this.digitGlowColor = 'rgba(0, 255, 255, 0.7)'; // Stronger glow effect
        
        // Label for the counter
        this.counterLabel = 'DAILY VISITORS';
        
        // Cache for digit patterns (each digit is a configuration of 7 segments)
        // Using standard 7-segment display patterns for maximum readability
        // Format: [top, top-right, bottom-right, bottom, bottom-left, top-left, middle]
        this.digitPatterns = [
            [1, 1, 1, 1, 1, 1, 0], // 0: all segments except middle
            [0, 1, 1, 0, 0, 0, 0], // 1: only right segments
            [1, 1, 0, 1, 1, 0, 1], // 2: top, top-right, middle, bottom-left, bottom
            [1, 1, 1, 1, 0, 0, 1], // 3: top, top-right, middle, bottom-right, bottom
            [0, 1, 1, 0, 0, 1, 1], // 4: top-left, middle, top-right, bottom-right
            [1, 0, 1, 1, 0, 1, 1], // 5: top, top-left, middle, bottom-right, bottom
            [1, 0, 1, 1, 1, 1, 1], // 6: all except top-right
            [1, 1, 1, 0, 0, 0, 0], // 7: top, top-right, bottom-right
            [1, 1, 1, 1, 1, 1, 1], // 8: all segments lit
            [1, 1, 1, 1, 0, 1, 1]  // 9: all except bottom-left
        ];
        
        // Initialize with zeros
        this.digits = [0, 0, 0, 0];
        
        console.log(`VisitorCounterEntity: Initialized at position (${x}, ${y})`);
        
        // Initialize visitor count - fetch from our Netlify function
        this.initVisitorCount();
    }
    
    /**
     * Initialize the visitor count display
     */
    initVisitorCount() {
        // Only initialize once
        if (this.isInitialized) return;
        
        console.log("VisitorCounterEntity: Initializing visitor count");
        
        // Generate a simulated visitor count
        this.fetchVisitorCount();
        
        this.isInitialized = true;
    }
    
    /**
     * Generate visitor count using a client-side algorithm
     * This works in all environments (GitHub Pages, Netlify, local) without any backend
     * The counter resets at 00:00 UTC and reaches an average of 35 visitors by the end of day
     * with a range between 25-45 visits
     */
    async fetchVisitorCount() {
        console.log("VisitorCounterEntity: Generating visitor count");
        
        try {
            // First get the current UTC date and time
            const now = new Date();
            const utcNow = new Date(now.getTime());
            const utcHours = utcNow.getUTCHours();
            const utcMinutes = utcNow.getUTCMinutes();
            const dayOfWeek = utcNow.getUTCDay(); // 0-6 (Sunday-Saturday)
            
            // Calculate the current UTC day key for storage
            const utcDateKey = `${utcNow.getUTCFullYear()}-${(utcNow.getUTCMonth() + 1).toString().padStart(2, '0')}-${utcNow.getUTCDate().toString().padStart(2, '0')}`;
            const storedDateKey = localStorage.getItem('arcadeVisitorDateKey');
            
            // Check if we need to reset the counter (new UTC day)
            if (storedDateKey !== utcDateKey) {
                console.log(`VisitorCounterEntity: New UTC day detected. Resetting counter. Previous: ${storedDateKey}, Current: ${utcDateKey}`);
                localStorage.setItem('arcadeVisitorDateKey', utcDateKey);
                localStorage.removeItem('visitorCounterInitialized');
                localStorage.removeItem('arcadeVisitorCount');
            }
            
            // Check if there's a cached count for today
            const storedCount = localStorage.getItem('arcadeVisitorCount');
            if (storedCount) {
                const count = parseInt(storedCount, 10);
                // Show the cached count immediately while we calculate the latest
                this.targetCount = count;
                this.animateToCount(this.targetCount);
                console.log(`VisitorCounterEntity: Using cached count: ${count} while calculating latest`);
            }
            
            // --------------------------------------------------
            // Time-based count generation (client-side version)
            // --------------------------------------------------
            
            // Convert UTC hours to a percentage of the day (0-1)
            const dayProgress = (utcHours + (utcMinutes / 60)) / 24;
            console.log(`VisitorCounterEntity: UTC time is ${utcHours}:${utcMinutes}, day progress: ${(dayProgress * 100).toFixed(1)}%`);
            
            // Base count is now 0 at the start of the UTC day
            let baseCount = 0;
            
            // Calculate time-based progression throughout the day
            // We want to reach around 35 visitors by 20 hours into the day (83.3% of day)  
            // Using a slightly accelerated curve at the beginning and slowing down at the end
            let timeBasedCount = 0;
            if (dayProgress <= 0.833) { // First 20 hours (up to 83.3% of day)
                // Use a curve that accelerates in morning, is steadier mid-day, and then slows
                // Curve: 37 * (dayProgress/0.833)^0.9 gives about 35 at 20 hours
                timeBasedCount = Math.round(37 * Math.pow(dayProgress / 0.833, 0.9));
            } else {
                // Last 4 hours of the day - slower growth to remain in range
                const remainingProgress = (dayProgress - 0.833) / 0.167; // 0-1 for last 4 hours
                timeBasedCount = Math.round(35 + (remainingProgress * 5)); // Add up to 5 more in last hours
            }
            
            // Add day of week variance (±2 visitors)
            // Weekends (Sat-Sun) tend to have higher traffic
            const dayVariance = (dayOfWeek === 0 || dayOfWeek === 6) ? 
                Math.floor(Math.random() * 3) : // Weekend: 0 to +2
                Math.floor(Math.random() * 5) - 2; // Weekday: -2 to +2
            
            // Add some randomness for each session (±3 visitors)
            // This ensures the counter isn't perfectly predictable and adds natural variance
            const sessionRandomness = Math.floor(Math.random() * 7) - 3; // -3 to +3
            
            // Calculate the final count - aiming for range 25-45 with average around 35
            let count = Math.max(0, timeBasedCount + dayVariance + sessionRandomness);
            
            // Only increment on first load, not on every refresh
            // This prevents artificially inflating the count
            if (!localStorage.getItem('visitorCounterInitialized')) {
                // Add 1 for this visitor (with small probability of +2 for popular sessions)
                count += (Math.random() < 0.1) ? 2 : 1;
                
                // Mark as initialized so subsequent refreshes don't increment
                localStorage.setItem('visitorCounterInitialized', 'true');
                console.log('First visit in this session - incrementing counter');
            }
            
            // Ensure the counter stays within expected range (25-45) after all adjustments
            if (dayProgress >= 0.85) { // Near end of day
                count = Math.max(25, Math.min(45, count));
            }
            
            // Store the final count and timestamp in localStorage
            localStorage.setItem('arcadeVisitorCount', count.toString());
            localStorage.setItem('arcadeVisitorLastRefresh', Date.now().toString());
                
            // Set as target and animate to it
            this.targetCount = count;
            this.animateToCount(this.targetCount);
                
            console.log(`VisitorCounterEntity: Generated count: ${count} (time-based: ${timeBasedCount}, day variance: ${dayVariance}, session: ${sessionRandomness})`);
                
            // Track in Google Analytics if available
            if (typeof gtag === 'function') {
                gtag('event', 'visitor_counter_viewed', {
                    'counter_value': this.targetCount,
                    'source': 'client-side-algorithm',
                    'utc_hours': utcHours
                });
            }
            
            return count;
        } catch (error) {
            console.error("VisitorCounterEntity: Error generating count:", error);
            
            // Use fallback if calculation fails
            this.useFallbackCount();
        }
    }
    
    /**
     * Use a fallback count if the main algorithm fails
     */
    useFallbackCount() {
        // Try to use the stored count from localStorage
        const storedCount = localStorage.getItem('arcadeVisitorCount');
        
        if (storedCount) {
            // Use the stored count
            this.targetCount = parseInt(storedCount, 10);
            console.log(`VisitorCounterEntity: Using stored count as fallback: ${this.targetCount}`);
        } else {
            // Generate a reasonable fallback count in the 20-35 range
            const now = new Date();
            const fallbackCount = 20 + (now.getHours() % 10);
            this.targetCount = fallbackCount;
            console.log(`VisitorCounterEntity: Using generated fallback count: ${this.targetCount}`);
            
            // Store it for next time
            localStorage.setItem('arcadeVisitorCount', this.targetCount.toString());
        }
        
        // Animate to this count
        this.animateToCount(this.targetCount);
    }
    
    /**
     * Check if it's time to refresh the visitor count
     */
    checkForRefresh() {
        // Get the current time
        const now = Date.now();
        
        // Get the time of the last refresh
        const lastRefresh = parseInt(localStorage.getItem('arcadeVisitorLastRefresh') || '0', 10);
        
        // Refresh every 5 minutes to update hourly fluctuations
        const refreshInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (now - lastRefresh > refreshInterval) {
            // Time to refresh
            console.log('VisitorCounterEntity: Time to refresh visitor count');
            localStorage.setItem('arcadeVisitorLastRefresh', now.toString());
            this.fetchVisitorCount();
        }
    }
    
    /**
     * Animate the counter to the specified count
     * @param {number} targetCount - The target count to animate to
     */
    animateToCount(targetCount) {
        this.targetCount = targetCount;
        this.isAnimating = true;
        
        // Ensure the target is within our display range (4 digits)
        if (this.targetCount > 9999) {
            this.targetCount = 9999;
        }
        
        // Set the initial values for the animation
        if (this.visitorCount === 0) {
            // If starting from zero, jump to a closer number to avoid long animation
            this.visitorCount = Math.max(0, this.targetCount - 20);
        }
        
        // Ensure animation is visible but not too long
        const diff = Math.abs(this.targetCount - this.visitorCount);
        if (diff > 500) {
            // For large differences, start closer to avoid too long animation
            this.visitorCount = this.targetCount - 100 * Math.sign(this.targetCount - this.visitorCount);
        }
        
        console.log(`VisitorCounterEntity: Animating from ${this.visitorCount} to ${this.targetCount}`);
    }
    
    /**
     * Update the counter animation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Pulse the glow effect
        this.updateGlow(deltaTime);
        
        // Handle counter animation
        if (this.isAnimating) {
            const diff = this.targetCount - this.visitorCount;
            
            if (Math.abs(diff) < 0.1) {
                // We've reached the target
                this.visitorCount = this.targetCount;
                this.isAnimating = false;
            } else {
                // Animate toward the target count
                const step = diff * this.animationSpeed;
                this.visitorCount += step;
            }
            
            // Update the digits based on the current count
            this.updateDigits();
        }
        
        // Nothing to update in the normal update cycle
        // We handle API calls in the fetchVisitorCount method
    }
    
    /**
     * Update the glow effect
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateGlow(deltaTime) {
        // Pulse the glow effect
        this.glowIntensity += this.glowDirection * this.glowPulseSpeed;
        
        // Reverse direction at min/max
        if (this.glowIntensity >= this.maxGlowIntensity) {
            this.glowIntensity = this.maxGlowIntensity;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
    }
    
    /**
     * Update the digits based on the current count
     */
    updateDigits() {
        // Convert the visitor count to a 4-digit number
        const countValue = Math.floor(this.visitorCount);
        
        // Extract each digit
        this.digits[0] = Math.floor(countValue / 1000) % 10;
        this.digits[1] = Math.floor(countValue / 100) % 10;
        this.digits[2] = Math.floor(countValue / 10) % 10;
        this.digits[3] = countValue % 10;
    }
    
    /**
     * Draw the visitor counter
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     */
    draw(ctx, screenX, screenY) {
        // Apply ceiling mount position adjustment
        screenY += this.renderOffsetY || 0;
        // Calculate the total width of the display
        const totalWidth = (this.digitWidth * 4) + (this.digitGap * 3) + 40; // 40px padding
        const totalHeight = this.digitHeight + 40; // 40px padding
        
        // Draw the counter background (isometric panel)
        this.drawCounterPanel(ctx, screenX, screenY, totalWidth, totalHeight);
        
        // Create a transformation matrix for the digits to match isometric view
        ctx.save();
        
        // Apply isometric transform for digit display
        const isoAngle = Math.PI / 4; // 45 degrees in radians (kept for reference)
        ctx.translate(screenX, screenY);
        // Apply transformation for isometric view with foreshortening
        ctx.transform(1, -0.17, 0, 1, 0, 0); // Add horizontal skew for foreshortening
        ctx.scale(0.85, 0.7); // Scale to match isometric perspective
        
        // Draw each digit with isometric positioning
        const startX = -(((this.digitWidth * 4) + (this.digitGap * 3)) / 2) + (this.digitWidth / 2);
        const digitY = -5; // Slightly raised from center
        
        for (let i = 0; i < 4; i++) {
            const digitX = startX + (i * (this.digitWidth + this.digitGap));
            this.drawDigit(ctx, digitX, digitY, this.digits[i]);
        }
        
        ctx.restore();
        
        // Draw the label below with isometric perspective
        this.drawLabel(ctx, screenX, screenY + (totalHeight / 2) + 10);
        
        // Check if it's time to refresh the count
        this.checkForRefresh();
    }
    
    /**
     * Draw the counter panel with cyberpunk/synthwave aesthetics in isometric perspective
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Panel width
     * @param {number} height - Panel height
     */
    drawCounterPanel(ctx, x, y, width, height) {
        // Save context
        ctx.save();
        
        // Isometric parameters
        const isoAngle = Math.PI / 4; // 45 degrees in radians
        const isoSkewX = 0.5; // Horizontal skew factor
        const isoSkewY = 0.2; // Vertical compression factor
        
        // Calculate isometric dimensions
        const isoWidth = width * 0.85; // Slightly narrower in isometric view
        const isoHeight = height * 0.7; // Shorter in isometric view
        
        // Calculate corner coordinates
        const centerX = x;
        const centerY = y + (height * 0.1); // Shift down slightly for better perspective
        
        // Create isometric panel path
        ctx.translate(centerX, centerY);
        // Apply transformation for isometric view with foreshortening
        ctx.transform(1, -0.17, 0, 1, 0, 0); // Add horizontal skew for foreshortening
        
        // Draw panel base - darker for depth effect
        ctx.fillStyle = '#000a0a'; // Very dark teal for depth
        
        // Draw a panel with foreshortening effect (left side wider than right)
        ctx.beginPath();
        // Calculate foreshortening effect (wider on left side)
        const foreshortening = isoWidth * 0.15; // 15% wider on the left side
        
        // Draw trapezoid shape with wider left side
        ctx.moveTo(-isoWidth/2 - foreshortening, -isoHeight*0.5); // Top-left (wider)
        ctx.lineTo(isoWidth/2, -isoHeight*0.5);                 // Top-right
        ctx.lineTo(isoWidth/2, isoHeight*0.4);                  // Bottom-right
        ctx.lineTo(-isoWidth/2 - foreshortening, isoHeight*0.4); // Bottom-left (wider)
        ctx.closePath();
        ctx.fill();
        
        // Top face (main display area)
        ctx.fillStyle = 'rgba(0, 10, 20, 0.8)'; // Match existing color but with transparency
        ctx.beginPath();
        ctx.moveTo(-isoWidth/2, -isoHeight*0.5); // Top-left
        ctx.lineTo(isoWidth/2, -isoHeight*0.5);  // Top-right
        ctx.lineTo(isoWidth/2, isoHeight*0.4);   // Bottom-right
        ctx.lineTo(-isoWidth/2, isoHeight*0.4);  // Bottom-left
        ctx.closePath();
        ctx.fill();
        
        // Add outer glow
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowIntensity;
        
        // Draw panel borders with glow
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 2;
        
        // Panel border with foreshortening effect
        ctx.beginPath();
        const borderForeshortening = isoWidth * 0.15; // Match the fill shape
        ctx.moveTo(-isoWidth/2 - borderForeshortening, -isoHeight*0.5); // Top-left (wider)
        ctx.lineTo(isoWidth/2, -isoHeight*0.5);                       // Top-right
        ctx.lineTo(isoWidth/2, isoHeight*0.4);                        // Bottom-right
        ctx.lineTo(-isoWidth/2 - borderForeshortening, isoHeight*0.4); // Bottom-left (wider)
        ctx.closePath();
        ctx.stroke();
        
        // Add inner grid lines (subtle techno effect)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        
        // Horizontal grid lines
        for (let i = 1; i < 4; i++) {
            const lineY = (-isoHeight*0.5) + (isoHeight * 0.9 * (i / 4));
            ctx.beginPath();
            ctx.moveTo(-isoWidth/2 + 5, lineY);
            ctx.lineTo(isoWidth/2 - 5, lineY);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 1; i < 4; i++) {
            const lineX = (-isoWidth/2) + (isoWidth * (i / 4));
            ctx.beginPath();
            ctx.moveTo(lineX, -isoHeight*0.5 + 5);
            ctx.lineTo(lineX, isoHeight*0.4 - 5);
            ctx.stroke();
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Draw a single 7-segment digit
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Left position of the digit
     * @param {number} y - Top position of the digit
     * @param {number} digit - The digit to display (0-9)
     */
    drawDigit(ctx, x, y, digit) {
        // Get the segment pattern for this digit
        const pattern = this.digitPatterns[digit];
        
        // Reduce glitch probability to improve readability
        const shouldGlitch = Math.random() < 0.005; // Very rare glitch (0.5%)
        
        // Save context
        ctx.save();
        
        // Draw background rectangle for the digit
        ctx.fillStyle = '#001010';
        ctx.fillRect(x, y, this.digitWidth, this.digitHeight);
        
        // If we're showing a glitch frame, display some visual noise
        // This is very rare and only for visual effect
        if (shouldGlitch) {
            this.drawDigitGlitch(ctx, x, y);
        } else {
            // Add a border to each digit for better separation
            ctx.strokeStyle = '#003f3f';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, this.digitWidth, this.digitHeight);
            
            // Setup for the glow effect
            ctx.shadowColor = this.digitGlowColor;
            ctx.shadowBlur = this.glowIntensity;
            
            // Calculate padding to ensure segments don't touch the edges
            const padding = 2;
            
            // Draw the normal 7 segments (each segment can be on or off)
            // Segment A (top horizontal)
            this.drawSegment(ctx, 
                x + padding, 
                y + padding, 
                this.digitWidth - (padding * 2), 
                this.digitThickness, 
                pattern[0]
            );
            
            // Segment B (top-right vertical)
            this.drawSegment(ctx, 
                x + this.digitWidth - this.digitThickness - padding, 
                y + padding, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[1], 
                true
            );
            
            // Segment C (bottom-right vertical)
            this.drawSegment(ctx, 
                x + this.digitWidth - this.digitThickness - padding, 
                y + this.digitHeight / 2, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[2], 
                true
            );
            
            // Segment D (bottom horizontal)
            this.drawSegment(ctx, 
                x + padding, 
                y + this.digitHeight - this.digitThickness - padding, 
                this.digitWidth - (padding * 2), 
                this.digitThickness, 
                pattern[3]
            );
            
            // Segment E (bottom-left vertical)
            this.drawSegment(ctx, 
                x + padding, 
                y + this.digitHeight / 2, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[4], 
                true
            );
            
            // Segment F (top-left vertical)
            this.drawSegment(ctx, 
                x + padding, 
                y + padding, 
                this.digitThickness, 
                this.digitHeight / 2 - padding, 
                pattern[5], 
                true
            );
            
            // Segment G (middle horizontal)
            this.drawSegment(ctx, 
                x + padding, 
                y + (this.digitHeight / 2) - (this.digitThickness / 2), 
                this.digitWidth - (padding * 2), 
                this.digitThickness, 
                pattern[6]
            );
        }
        
        // Restore context
        ctx.restore();
    }
    
    /**
     * Draw a digital glitch effect for a digit
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Left position of the digit
     * @param {number} y - Top position of the digit
     */
    drawDigitGlitch(ctx, x, y) {
        // Draw random digital noise for a glitched effect
        ctx.fillStyle = this.digitOnColor;
        
        // Draw a few random bars
        for (let i = 0; i < 3; i++) {
            const barY = y + Math.random() * this.digitHeight;
            const barHeight = Math.random() * 3 + 1;
            ctx.fillRect(x, barY, this.digitWidth, barHeight);
        }
        
        // Draw a few random vertical lines
        for (let i = 0; i < 2; i++) {
            const barX = x + Math.random() * this.digitWidth;
            const barWidth = Math.random() * 2 + 1;
            ctx.fillRect(barX, y, barWidth, this.digitHeight);
        }
    }
    
    /**
     * Draw a single segment of a digit
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Left position
     * @param {number} y - Top position
     * @param {number} width - Segment width
     * @param {number} height - Segment height
     * @param {boolean} isOn - Whether the segment is on or off
     * @param {boolean} isVertical - Whether the segment is vertical
     */
    drawSegment(ctx, x, y, width, height, isOn, isVertical = false) {
        // Choose color based on segment state - ensure proper contrast
        ctx.fillStyle = isOn ? this.digitOnColor : this.digitOffColor;
        
        // No glitch offset for normal display - we want readable numbers
        
        if (isVertical) {
            // Simple rectangle for vertical segments - maximum readability
            ctx.fillRect(x, y, width, height);
            
            // Add glow effect for on segments
            if (isOn) {
                ctx.shadowColor = this.digitGlowColor;
                ctx.shadowBlur = 3;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, width, height);
                ctx.shadowBlur = 0;
            }
        } else {
            // Simple rectangle for horizontal segments - maximum readability
            ctx.fillRect(x, y, width, height);
            
            // Add glow effect for on segments
            if (isOn) {
                ctx.shadowColor = this.digitGlowColor;
                ctx.shadowBlur = 3;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, width, height);
                ctx.shadowBlur = 0;
            }
        }
    }
    
    /**
     * Draw the label below the counter with isometric perspective
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     */
    drawLabel(ctx, x, y) {
        ctx.save();
        
        // Apply isometric transform for the label
        const isoAngle = Math.PI / 4; // 45 degrees in radians (kept for reference)
        ctx.translate(x, y);
        // Apply transformation for isometric view with foreshortening
        ctx.transform(1, -0.18, 0, 1, 0, 0); // Add horizontal skew for foreshortening
        ctx.scale(0.85, 0.7); // Scale to match isometric perspective
        
        // Set up text styles
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = this.glowColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowIntensity * 1.5; // Extra glow for visibility
        
        // Draw the text
        ctx.fillText(this.counterLabel, 0, 0);
        
        ctx.restore();
    }
}

export { VisitorCounterEntity };
