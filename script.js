
document.addEventListener("DOMContentLoaded", () => {
    const siteIntro = document.getElementById("siteIntro");

    if (siteIntro) {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        if (reducedMotion.matches) {
            document.body.classList.remove("page-loading");
            siteIntro.remove();
        } else {
            const introLogo = siteIntro.querySelector(".site-intro-logo");
            const navbarLogo = document.querySelector(".navbar .logo");

            if (introLogo && navbarLogo) {
                const introBounds = introLogo.getBoundingClientRect();
                const navbar = navbarLogo.closest(".navbar");
                const navbarLogoBounds = navbarLogo.getBoundingClientRect();
                const navbarBounds = navbar.getBoundingClientRect();
                const scaleX = navbarBounds.width / navbar.offsetWidth;
                const scaleY = navbarBounds.height / navbar.offsetHeight;
                const transformOrigin = getComputedStyle(navbar).transformOrigin
                    .split(" ")
                    .map(parseFloat);
                const originX = navbarBounds.left + transformOrigin[0] * scaleX;
                const originY = navbarBounds.top + transformOrigin[1] * scaleY;
                const targetLeft = originX + (navbarLogoBounds.left - originX) / scaleX;
                const targetTop = originY + (navbarLogoBounds.top - originY) / scaleY;
                const targetWidth = navbarLogoBounds.width / scaleX;
                const targetHeight = navbarLogoBounds.height / scaleY;
                const translateX = targetLeft + targetWidth / 2
                    - (introBounds.left + introBounds.width / 2);
                const translateY = targetTop + targetHeight / 2
                    - (introBounds.top + introBounds.height / 2);
                const introStyle = getComputedStyle(introLogo);
                const navbarLogoStyle = getComputedStyle(navbarLogo);
                const duration = 2700;

                introLogo.animate([
                    {
                        transform: "translate(0, 0)",
                        fontSize: introStyle.fontSize,
                        letterSpacing: introStyle.letterSpacing,
                        lineHeight: introStyle.lineHeight,
                        offset: 0
                    },
                    {
                        transform: "translate(0, 0)",
                        fontSize: introStyle.fontSize,
                        letterSpacing: introStyle.letterSpacing,
                        lineHeight: introStyle.lineHeight,
                        offset: 0.08
                    },
                    {
                        transform: "translate(0, 0)",
                        fontSize: introStyle.fontSize,
                        letterSpacing: introStyle.letterSpacing,
                        lineHeight: introStyle.lineHeight,
                        offset: 0.35,
                        easing: "cubic-bezier(.42,0,.58,1)"
                    },
                    {
                        transform: `translate(${translateX}px, ${translateY}px)`,
                        fontSize: navbarLogoStyle.fontSize,
                        letterSpacing: navbarLogoStyle.letterSpacing,
                        lineHeight: navbarLogoStyle.lineHeight,
                        offset: 1
                    }
                ], {
                    duration,
                    easing: "linear",
                    fill: "forwards"
                });
            }

            window.setTimeout(() => {
                document.body.classList.remove("page-loading");
                siteIntro.remove();
            }, 2800);
        }
    }

    // Footer year
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    const smoothScrollTo = (targetY) => {
        const startY = window.scrollY;
        const distance = targetY - startY;

        if (Math.abs(distance) < 2) {
            window.scrollTo(0, targetY);
            return;
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            window.scrollTo(0, targetY);
            return;
        }

        const duration = Math.min(900, Math.max(320, Math.abs(distance) * 0.25));
        const startTime = performance.now();

        const animateScroll = (timestamp) => {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
                window.requestAnimationFrame(animateScroll);
            }
        };

        window.requestAnimationFrame(animateScroll);
    };

    document.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const link = event.target.closest('a[href^="#"]');

        if (!link || link.target === "_blank" || link.hasAttribute("download")) {
            return;
        }

        const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));

        if (!target) {
            return;
        }

        event.preventDefault();

        if (window.location.hash !== link.hash) {
            window.history.pushState(null, "", link.hash);
        }

        const header = document.querySelector(".navbar");
        const headerOffset = header ? Math.max(88, header.getBoundingClientRect().height + 20) : 88;
        const targetY = target.id === "home"
            ? 0
            : window.scrollY + target.getBoundingClientRect().top - headerOffset;

        smoothScrollTo(Math.max(0, targetY));
    });

    // Profile portraits follow the pointer across the page.
    const profileFrame = document.querySelector(".profile-frame");

    if (profileFrame) {
        const portraitPaths = {
            center: "assets/profile/LookingAtCamera.png",
            left: "assets/profile/LookingLeft.png",
            right: "assets/profile/LookingRight.png",
            up: "assets/profile/LookingUpStraight.png",
            down: "assets/profile/LookingRightSlightUp%20(2).png",
            upperLeft: "assets/profile/LookingLeftSlightUp%20(2).png",
            lowerLeft: "assets/profile/LookingLeftSlightDown.png",
            upperRight: "assets/profile/LookingRightSlightUp.png",
            lowerRight: "assets/profile/LookingRightSlightDown.png"
        };

        Object.values(portraitPaths).forEach((path) => {
            const portrait = new Image();
            portrait.addEventListener("error", () => {
                console.error(`Failed to load profile portrait: ${path}`);
            }, { once: true });
            portrait.src = path;
        });

        const portraitLayers = profileFrame.querySelectorAll(".profile-image-layer");
        let activeLayer = 0;
        let activePortrait = "center";
        let pointerFrame = null;
        let pointerX = 0;
        let pointerY = 0;
        let smoothedPointerX = null;
        let smoothedPointerY = null;
        let lastPointerFrameTime = 0;
        const dizzyStars = profileFrame.querySelector(".dizzy-stars");
        let circlingStartedAt = 0;
        let lastCircleMoveAt = 0;
        let lastCircleAngle = null;
        let circleRotation = 0;
        let dizzyResetTimer = null;
        let dizzyHideTimer = null;

        const clearDizzyTracking = () => {
            circlingStartedAt = 0;
            lastCircleMoveAt = 0;
            lastCircleAngle = null;
            circleRotation = 0;

            if (dizzyResetTimer !== null) {
                window.clearTimeout(dizzyResetTimer);
                dizzyResetTimer = null;
            }
        };

        const resetDizzyTracking = () => {
            clearDizzyTracking();
            profileFrame.classList.remove("is-dizzy");

            if (dizzyHideTimer !== null) {
                window.clearTimeout(dizzyHideTimer);
                dizzyHideTimer = null;
            }
        };

        const finishDizzyTracking = () => {
            clearDizzyTracking();

            if (profileFrame.classList.contains("is-dizzy")) {
                dizzyHideTimer = window.setTimeout(() => {
                    profileFrame.classList.remove("is-dizzy");
                    dizzyHideTimer = null;
                }, 3500);
            }
        };

        const trackCursorCircling = (event) => {
            if (!dizzyStars || (event.pointerType !== "mouse" && event.pointerType !== "pen")) {
                return;
            }

            const bounds = profileFrame.getBoundingClientRect();
            const normalizedX = (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width * .55);
            const normalizedY = (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height * .55);
            const radius = Math.hypot(normalizedX, normalizedY);
            const now = performance.now();

            if (radius < .18 || radius > 1.8) {
                resetDizzyTracking();
                return;
            }

            if (lastCircleMoveAt && now - lastCircleMoveAt > 600) {
                circlingStartedAt = 0;
                lastCircleAngle = null;
                circleRotation = 0;
            }

            const angle = Math.atan2(normalizedY, normalizedX);

            if (lastCircleAngle !== null && circlingStartedAt !== 0) {
                const angleDelta = Math.atan2(
                    Math.sin(angle - lastCircleAngle),
                    Math.cos(angle - lastCircleAngle)
                );

                if (Math.abs(angleDelta) <= 2.2) {
                    circleRotation += angleDelta;
                }
            } else {
                circlingStartedAt = now;
            }

            lastCircleAngle = angle;
            lastCircleMoveAt = now;

            if (now - circlingStartedAt >= 5000 && Math.abs(circleRotation) >= Math.PI * 2) {
                if (dizzyHideTimer !== null) {
                    window.clearTimeout(dizzyHideTimer);
                    dizzyHideTimer = null;
                }
                profileFrame.classList.add("is-dizzy");
            }

            if (dizzyResetTimer !== null) {
                window.clearTimeout(dizzyResetTimer);
            }
            dizzyResetTimer = window.setTimeout(finishDizzyTracking, 300);
        };

        const showPortrait = (direction) => {
            const portraitKey = direction;

            if (!portraitPaths[portraitKey] || portraitKey === activePortrait) {
                return;
            }

            const nextLayer = 1 - activeLayer;
            portraitLayers[nextLayer].src = portraitPaths[portraitKey];
            portraitLayers[nextLayer].classList.add("is-active");
            portraitLayers[activeLayer].classList.remove("is-active");
            activeLayer = nextLayer;
            activePortrait = portraitKey;
        };

        const selectPortrait = (timestamp) => {
            pointerFrame = null;
            const deltaTime = lastPointerFrameTime === 0
                ? 1000 / 60
                : Math.min(timestamp - lastPointerFrameTime, 50);
            lastPointerFrameTime = timestamp;
            const smoothing = 1 - Math.exp(-deltaTime / 45);

            if (smoothedPointerX === null || smoothedPointerY === null) {
                smoothedPointerX = pointerX;
                smoothedPointerY = pointerY;
            } else {
                smoothedPointerX += (pointerX - smoothedPointerX) * smoothing;
                smoothedPointerY += (pointerY - smoothedPointerY) * smoothing;
            }

            const bounds = profileFrame.getBoundingClientRect();
            const x = (smoothedPointerX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
            const y = (smoothedPointerY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
            const horizontalThreshold = 0.3;
            const verticalThreshold = 0.3;

            if (Math.hypot(x, y) < 0.28) {
                showPortrait("center");
                return;
            }

            const horizontal = Math.abs(x) >= horizontalThreshold;
            const vertical = Math.abs(y) >= verticalThreshold;

            if (horizontal && vertical) {
                if (x < 0) {
                    showPortrait(y < 0 ? "upperLeft" : "lowerLeft");
                } else {
                    showPortrait(y < 0 ? "upperRight" : "lowerRight");
                }
            } else if (horizontal) {
                showPortrait(x < 0 ? "left" : "right");
            } else if (vertical) {
                showPortrait(y < 0 ? "up" : "down");
            } else {
                showPortrait("center");
            }

            const remainingDistance = Math.hypot(
                pointerX - smoothedPointerX,
                pointerY - smoothedPointerY
            );

            if (remainingDistance > 0.5) {
                pointerFrame = window.requestAnimationFrame(selectPortrait);
            } else {
                smoothedPointerX = pointerX;
                smoothedPointerY = pointerY;
                lastPointerFrameTime = 0;
            }
        };

        window.addEventListener("pointermove", (event) => {
            if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
                return;
            }

            pointerX = event.clientX;
            pointerY = event.clientY;
            trackCursorCircling(event);

            if (pointerFrame === null) {
                pointerFrame = window.requestAnimationFrame(selectPortrait);
            }
        }, { passive: true });

        window.addEventListener("pointerleave", () => {
            resetDizzyTracking();

            if (pointerFrame !== null) {
                window.cancelAnimationFrame(pointerFrame);
                pointerFrame = null;
            }
            smoothedPointerX = null;
            smoothedPointerY = null;
            lastPointerFrameTime = 0;
            showPortrait("center");
        });
    }

    // Team photo carousel
    const teamPhotoCarousel = document.getElementById("teamPhotoCarousel");

    if (teamPhotoCarousel) {
        const teamPhotoSlides = Array.from(teamPhotoCarousel.querySelectorAll(".team-photo-slide"));
        const teamPhotoDots = Array.from(teamPhotoCarousel.querySelectorAll(".team-photo-dot"));
        let activeTeamPhoto = 0;
        let carouselVisible = false;
        let autoplayTimer = null;

        const updateTeamPhoto = (index) => {
            activeTeamPhoto = (index + teamPhotoSlides.length) % teamPhotoSlides.length;

            teamPhotoSlides.forEach((slide, slideIndex) => {
                const isActive = slideIndex === activeTeamPhoto;
                slide.classList.toggle("is-active", isActive);
                slide.setAttribute("aria-hidden", String(!isActive));
            });

            teamPhotoDots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === activeTeamPhoto;
                dot.classList.toggle("is-active", isActive);
                dot.setAttribute("aria-pressed", String(isActive));
            });

        };

        const stopAutoplay = () => {
            if (autoplayTimer !== null) {
                window.clearTimeout(autoplayTimer);
                autoplayTimer = null;
            }
        };

        const scheduleAutoplay = () => {
            if (!carouselVisible || autoplayTimer !== null) {
                return;
            }

            autoplayTimer = window.setTimeout(() => {
                autoplayTimer = null;

                if (document.visibilityState === "visible") {
                    updateTeamPhoto(activeTeamPhoto + 1);
                }

                scheduleAutoplay();
            }, 3000);
        };

        const startAutoplay = () => {
            scheduleAutoplay();
        };

        const handleManualSelection = (index) => {
            updateTeamPhoto(index);
            stopAutoplay();
            scheduleAutoplay();
        };

        teamPhotoDots.forEach((dot, index) => {
            dot.addEventListener("click", () => handleManualSelection(index));
        });

        const teamPhotoStage = teamPhotoCarousel.querySelector(".team-photo-stage");

        teamPhotoStage?.addEventListener("click", (event) => {
            if (event.target.closest(".team-photo-pagination")) {
                return;
            }

            const bounds = teamPhotoStage.getBoundingClientRect();
            const clickedLeftHalf = event.clientX < bounds.left + bounds.width / 2;
            handleManualSelection(activeTeamPhoto + (clickedLeftHalf ? -1 : 1));
        });

        if ("IntersectionObserver" in window) {
            const carouselObserver = new IntersectionObserver(([entry]) => {
                carouselVisible = entry.isIntersecting;

                if (carouselVisible) {
                    startAutoplay();
                } else {
                    stopAutoplay();
                }
            });
            carouselObserver.observe(teamPhotoCarousel);
        } else {
            carouselVisible = true;
            startAutoplay();
        }

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });
    }

    // Dark mode and smoke transition
    const themeToggle = document.getElementById("themeToggle");
    const smokeLayer = document.getElementById("smokeLayer");

    if (themeToggle) {
        let themeEffectTimer = null;

        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            document.body.classList.add("theme-transitioning");

            if (smokeLayer) {
                const toggleBounds = themeToggle.getBoundingClientRect();
                smokeLayer.style.setProperty(
                    "--theme-origin-x",
                    `${toggleBounds.left + toggleBounds.width / 2}px`
                );
                smokeLayer.style.setProperty(
                    "--theme-origin-y",
                    `${toggleBounds.top + toggleBounds.height / 2}px`
                );

                if (themeEffectTimer !== null) {
                    window.clearTimeout(themeEffectTimer);
                }

                smokeLayer.classList.remove(
                    "smoke-active",
                    "theme-dark-active",
                    "theme-light-active"
                );
                void smokeLayer.offsetWidth;
                const isDark = document.body.classList.contains("dark-mode");
                smokeLayer.classList.add(
                    "smoke-active",
                    isDark ? "theme-dark-active" : "theme-light-active"
                );

                themeEffectTimer = window.setTimeout(() => {
                    smokeLayer.classList.remove(
                        "smoke-active",
                        "theme-dark-active",
                        "theme-light-active"
                    );
                    themeEffectTimer = null;
                }, 1800);
            }

            setTimeout(() => {
                document.body.classList.remove("theme-transitioning");
            }, 1300);

            const icon = themeToggle.querySelector("i");
            const isDark = document.body.classList.contains("dark-mode");

            if (icon) {
                icon.classList.remove("fa-moon", "fa-sun");
                icon.classList.add(isDark ? "fa-sun" : "fa-moon");
            }

            themeToggle.setAttribute("aria-pressed", String(isDark));
            themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
        });
    }

    // Mobile navigation
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("open");

            const icon = menuToggle.querySelector("i");

            if (icon) {
                const isOpen = navLinks.classList.contains("open");
                icon.classList.toggle("fa-bars", !isOpen);
                icon.classList.toggle("fa-xmark", isOpen);
            }
        });

        navLinks.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                navLinks.querySelectorAll(".nav-link").forEach((navLink) => {
                    navLink.classList.toggle("active", navLink === link);
                });

                const icon = menuToggle.querySelector("i");

                if (icon) {
                    icon.classList.remove("fa-xmark");
                    icon.classList.add("fa-bars");
                }
            });
        });
    }

    // Scroll reveal
    const revealElements = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15
        });

        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => {
            element.classList.add("is-visible");
        });
    }

    // Scroll progress and back-to-top control
    const scrollProgress = document.getElementById("scrollProgress");
    if (scrollProgress) {
        const pageSections = document.querySelectorAll("main > section[id]");
        let scrollUpdatePending = false;

        const updateActiveNavigation = () => {
            if (!navLinks) {
                return;
            }

            const activeLine = window.innerHeight * 0.3;
            const activeSection = [...pageSections].find((section) => {
                const bounds = section.getBoundingClientRect();
                return bounds.top <= activeLine && bounds.bottom > activeLine;
            });

            if (activeSection) {
                navLinks.querySelectorAll(".nav-link").forEach((link) => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${activeSection.id}`);
                });
            }
        };

        const updateScrollProgress = () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollableHeight > 0
                ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
                : 0;
            const isVisible = window.scrollY > 80;

            scrollProgress.style.setProperty("--scroll-progress", `${progress * 100}%`);
            scrollProgress.classList.toggle("is-visible", isVisible);
            scrollProgress.setAttribute("aria-hidden", String(!isVisible));
            scrollProgress.tabIndex = isVisible ? 0 : -1;
            updateActiveNavigation();
        };

        const scheduleScrollUpdate = () => {
            if (!scrollUpdatePending) {
                scrollUpdatePending = true;
                window.requestAnimationFrame(() => {
                    updateScrollProgress();
                    scrollUpdatePending = false;
                });
            }
        };

        scrollProgress.addEventListener("click", () => {
            smoothScrollTo(0);
        });

        window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
        window.addEventListener("resize", scheduleScrollUpdate);
        updateScrollProgress();
    }
});
