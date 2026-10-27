
document.addEventListener("DOMContentLoaded", () => {
    // 1. SKILLS CATEGORY FILTER
    const categoryButtons = document.querySelectorAll(".category-btn");
    const techItems = document.querySelectorAll(".tech-item");

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            categoryButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            const category = button.dataset.category;

            techItems.forEach((item) => {
                const visible =
                    category === "all" || item.classList.contains(category);

                item.classList.toggle("hidden", !visible);
            });
        });
    });

    // 2. PROJECT SLIDER — one handler for all five projects
    const slider = document.querySelector(".project-slider");
    const projects = Array.from(
        document.querySelectorAll(".project-slider .single-project")
    );
    const dots = Array.from(document.querySelectorAll(".project-dot"));
    const previousButton = document.getElementById("prev-project");
    const nextButton = document.getElementById("next-project");

    let currentIndex = 0;

    function showProject(index) {
        if (!projects.length) return;

        currentIndex = (index + projects.length) % projects.length;

        projects.forEach((project, i) => {
            const active = i === currentIndex;
            project.classList.toggle("active-project", active);
            project.setAttribute("aria-hidden", String(!active));
        });

        dots.forEach((dot, i) => {
            const active = i === currentIndex;
            dot.classList.toggle("active-dot", active);
            dot.setAttribute("aria-pressed", String(active));
        });
    }

    previousButton?.addEventListener("click", () => {
        showProject(currentIndex - 1);
    });

    nextButton?.addEventListener("click", () => {
        showProject(currentIndex + 1);
    });

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const index = Number(dot.dataset.index);

            if (Number.isInteger(index) && index >= 0 && index < projects.length) {
                showProject(index);
            }
        });
    });

    if (slider && projects.length) {
        showProject(0);
    }

    // Optional keyboard navigation while focused inside the slider
    slider?.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            showProject(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            showProject(currentIndex + 1);
        }
    });

    // 3. CONTACT FORM
    const contactForm = document.getElementById("contactForm");
    const formMessage = document.getElementById("formMessage");
    const submitButton = document.getElementById("submitBtn");

    // Keep this consistent with the email address you want to receive messages at.
    const recipientEmail = "subashjeyaraj8@gmail.com";

    if (contactForm && formMessage) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !message) {
                formMessage.textContent = "Please fill in all fields.";
                formMessage.style.color = "#ff4d6d";
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                formMessage.textContent = "Please enter a valid email address.";
                formMessage.style.color = "#ff4d6d";
                return;
            }

            const originalButtonHTML = submitButton?.innerHTML;

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = "<span>Sending message...</span>";
            }

            formMessage.textContent = "Sending your message...";
            formMessage.style.color = "#aaaaaa";

            try {
                if (window.location.protocol === "file:") {
                    throw new Error("The page is not running on a web server.");
                }

                const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, message })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Contact service unavailable.");
                }

                formMessage.textContent = "Your message was accepted by the server.";
                formMessage.style.color = "#4ade80";
                contactForm.reset();
            } catch (error) {
                // Static GitHub Pages sites need a backend or an email fallback.
                console.warn("Contact API unavailable:", error);

                const subject = encodeURIComponent(`Portfolio contact from ${name}`);
                const body = encodeURIComponent(
                    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
                );
                const mailtoURL =
                    `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

                formMessage.textContent =
                    "The contact server is unavailable. ";

                const emailLink = document.createElement("a");
                emailLink.href = mailtoURL;
                emailLink.textContent = "Click here to email me";
                emailLink.style.color = "#ea43a8";
                emailLink.style.textDecoration = "underline";

                formMessage.appendChild(emailLink);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML =
                        originalButtonHTML || "<span>Send Message →</span>";
                }
            }
        });
    }
});
