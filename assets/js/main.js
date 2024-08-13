(() => {
    let icons;
    const input = document.querySelector("input");
    const deprecatedToggle = document.querySelector("#toggle-deprecated");
    const clearSearch = document.querySelector("#clear-search-input");
    let currentQuery = input.value;

    async function getIcons() {
        const response = await fetch("assets/js/icons.json");
        icons = await response.json();
    }

    async function populateGallery(data = "") {
        await getIcons();
        if (!data) {
            data = icons;
        }

        const gallery = document.querySelector("#gallery");
        const inspector = document.querySelector("#inspector");
        if (gallery.innerHTML) {
            gallery.innerHTML = "";
            inspector.style.display = "block";
            inspector.innerHTML =
                '<div class="empty-state">Choose an icon to see its details here</div>';
        }

        if (JSON.stringify(data) === "{}") {
            gallery.innerHTML =
                '<div class="empty-state">No matching icons found</div>';
            inspector.style.display = "none";
        }

        const iconSummaryTemplate = document.querySelector(
            "#icon-summary-template"
        );

        // Sort the JSON alphabetically by key name, just in case it's out of order
        data = Object.keys(data)
            .sort()
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {});

        let count = Object.keys(data).length;
        let countText = count + " matching icon";
        document.querySelector("#icon-count").textContent = "";

        if (count !== 1) {
            countText += "s";
        }

        if (count > 0) {
            document.querySelector("#icon-count").textContent = countText;
        }

        for (let key in data) {
            let iconName = key;
            let iconTags = data[key].tags;
            let iconDescription = data[key].description;
            let iconSource = data[key].source;
            let isDeprecated = data[key].isDeprecated;
            let isNew = data[key].isNew;

            let iconSummary = iconSummaryTemplate.content.cloneNode(true);
            let button = iconSummary.querySelector("button");
            let iconContainer = iconSummary.querySelector("figure > div");
            let figcaption = iconSummary.querySelector("figcaption");

            button.addEventListener("click", function (e) {
                const currentButton = document.querySelector("button.current");
                if (currentButton) {
                    currentButton.classList.toggle("current");
                }
                e.currentTarget.classList.toggle("current");
                showIconDetails(
                    iconName,
                    iconTags,
                    iconDescription,
                    iconSource,
                    isDeprecated,
                    isNew
                );
            });
            button.setAttribute("aria-label", iconName);

            // Use fetch() to get the actual SVG code (so that maybe one day we can have a color picker)
            fetch("assets/img/icons/" + iconName + ".svg")
                .then((response) => response.text())
                .then((svg) => {
                    iconContainer.innerHTML = svg;
                });

            if (isDeprecated) {
                figcaption.innerHTML = '<span class="deprecated-dot"></span>';
            } else if (isNew) {
                figcaption.innerHTML = '<span class="new-dot"></span>';
            }

            figcaption.innerHTML += iconName;

            gallery.appendChild(iconSummary);
        }
    }

    async function filterIcons(query = "", hideDeprecated = false) {
        await getIcons();
        let matchingIcons = {};
        if (!query) {
            query = input.value;
        }

        const regex = new RegExp(escapeRegex(query.toLowerCase().trim()));

        for (let key in icons) {
            let iconName = key;
            let iconTags = icons[key].tags;
            let iconDescription = icons[key].description;

            if (hideDeprecated && icons[key].isDeprecated) {
                continue;
            }

            if (iconName.toLowerCase().search(regex) !== -1) {
                matchingIcons[key] = icons[key];
                continue;
            }

            for (let i = 0; i < iconTags.length; i++) {
                if (iconTags[i].toLowerCase().search(regex) !== -1) {
                    matchingIcons[key] = icons[key];
                    continue;
                }
            }

            if (iconDescription.toLowerCase().search(regex) !== -1) {
                matchingIcons[key] = icons[key];
                continue;
            }
        }

        populateGallery(matchingIcons);
    }

    function showIconDetails(
        name,
        tags,
        description,
        source,
        isDeprecated,
        isNew
    ) {
        const inspector = document.querySelector("#inspector");

        const iconDetailTemplate = document.querySelector(
            "#icon-detail-template"
        );

        let iconDetail = iconDetailTemplate.content.cloneNode(true);
        let container = iconDetail.querySelector(".icon-detail");
        let icon = iconDetail.querySelector("figure > div");
        let figcaption = iconDetail.querySelector("figcaption");
        let ul = iconDetail.querySelector("ul");
        let p = iconDetail.querySelector("p");
        let small = iconDetail.querySelector("small");

        fetch("assets/img/icons/" + name + ".svg")
            .then((response) => response.text())
            .then((svg) => {
                icon.innerHTML = svg;
            });

        figcaption.innerHTML = name;

        if (isDeprecated) {
            figcaption.innerHTML +=
                '<span class="deprecated-badge">Deprecated</span>';
        } else if (isNew) {
            figcaption.innerHTML += '<span class="new-badge">New</span>';
        }

        if (tags.length > 0) {
            const iconTagTemplate =
                document.querySelector("#icon-tag-template");
            for (let i in tags) {
                let iconTag = iconTagTemplate.content.cloneNode(true);
                let button = iconTag.querySelector("button");
                let tagName = tags[i];
                button.textContent = tagName;
                button.addEventListener("click", function (e) {
                    input.value = tagName;
                    filterIcons(tagName);
                });
                ul.appendChild(iconTag);
            }
        } else {
            container.removeChild(ul);
        }

        if (description) {
            p.innerHTML = description;
        } else {
            container.removeChild(p);
        }

        if (source) {
            small.firstChild.nextSibling.innerHTML = source;
        } else {
            container.removeChild(small);
        }

        while (inspector.childNodes.length > 0) {
            inspector.removeChild(inspector.firstChild);
        }

        inspector.appendChild(iconDetail);
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function debounce(func, delay) {
        let debounceTimer;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    input.addEventListener(
        "keyup",
        debounce(function (e) {
            if (this.value.trim() !== currentQuery) {
                const toggleState =
                    deprecatedToggle.getAttribute("aria-checked") === "true";
                currentQuery = this.value;
                filterIcons(this.value, toggleState);
            }

            if (this.value.trim()) {
                clearSearch.style.display = "block";
            } else {
                clearSearch.style.display = "none";
            }
        }, 100)
    );

    deprecatedToggle.addEventListener("click", function (e) {
        const currentState = this.getAttribute("aria-checked") === "true";
        const newState = String(!currentState);
        this.setAttribute("aria-checked", newState);
        filterIcons(input.value, !currentState);
    });

    clearSearch.addEventListener("click", function (e) {
        input.value = "";
        const toggleState =
            deprecatedToggle.getAttribute("aria-checked") === "true";
        filterIcons("", toggleState);
        input.focus();
        this.style.display = "none";
    });

    getIcons();

    if (currentQuery.trim()) {
        filterIcons(currentQuery);
        clearSearch.style.display = "block";
    } else {
        populateGallery();
        clearSearch.style.display = "none";
    }
})();
