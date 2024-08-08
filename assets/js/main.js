(() => {
    let icons;

    async function getIcons() {
        const response = await fetch('assets/js/icons.json');
        icons = await response.json(); 
    }
    
    async function populateGallery(data = '') {
        await getIcons();
        if (!data) {
            data = icons;
        }

        const gallery = document.querySelector("#gallery");
        const inspector = document.querySelector("#inspector");
        if (gallery.innerHTML) {
            gallery.innerHTML = '';
            inspector.style.display = "block";
            inspector.innerHTML = '<div class="empty-state">Choose an icon to see its details here</div>';
        }

        if (JSON.stringify(data) === '{}') {
            console.log(data);
            gallery.innerHTML = '<div class="empty-state">No matching icons found</div>';
            inspector.style.display = "none";
        }

        
        const iconSummaryTemplate = document.querySelector("#icon-summary-template");

        // Sort the JSON alphabetically by key name, just in case it's out of order
        data = Object.keys(data).sort(sortIcons).reduce(
            (obj, key) => { 
              obj[key] = data[key]; 
              return obj;
            }, 
            {}
        );

        let count = Object.keys(data).length + " matching icon";

        if (Object.keys(data).length !== 1) {
            count += "s";
        }

        document.querySelector('#icon-count').textContent = count;

        for (var key in data) {
            let iconName = key;
            let iconTags = data[key].tags;
            let iconDescription = data[key].description;
            
            let iconSummary = iconSummaryTemplate.content.cloneNode(true);
            let button = iconSummary.querySelector('button');
            let iconContainer = iconSummary.querySelector('figure > div');
            let figcaption = iconSummary.querySelector('figcaption');

            button.addEventListener('click', function(e) {    
                const currentButton = document.querySelector('button.current')
                if (currentButton) {
                    currentButton.classList.toggle('current');
                }
                e.currentTarget.classList.toggle('current');
                showIconDetails(iconName, iconTags, iconDescription);
            });
            button.setAttribute('aria-label', iconName);

            // Use fetch() to get the actual SVG code (so that maybe one day we can have a color picker)
            fetch('assets/img/icons/' + iconName + '.svg')
                .then((response) => response.text())
                .then((svg) => { iconContainer.innerHTML = svg });

            figcaption.textContent = iconName;

            gallery.appendChild(iconSummary);
        }
    };

    async function filterIcons(query = '') {
        await getIcons();
        let matchingIcons = {};

        const regex = new RegExp(query.trim());
        
        for (var key in icons) {
            let iconName = key;
            let iconTags = icons[key].tags;
            let iconDescription = icons[key].description;


            if (iconName.search(regex) !== -1) {
               matchingIcons[key] = icons[key];
               continue;
            }

            for (var i = 0; i < iconTags.length; i++) {
                if (iconTags[i].search(regex) !== -1) {
                    matchingIcons[key] = icons[key];
                    continue;
                }     
            }

            if (iconDescription.search(regex) !== -1) {
                matchingIcons[key] = icons[key];
                continue;
            }
        }

        populateGallery(matchingIcons);
    }

    function showIconDetails(name, tags, description) {
        const inspector = document.querySelector("#inspector");
        
        const iconDetailTemplate = document.querySelector("#icon-detail-template");
        
        let iconDetail = iconDetailTemplate.content.cloneNode(true);
        let container = iconDetail.querySelector('.icon-detail');
        let icon = iconDetail.querySelector('figure > div');
        let figcaption = iconDetail.querySelector('figcaption');
        let ul = iconDetail.querySelector('ul');
        let p = iconDetail.querySelector('p');

        fetch('assets/img/icons/' + name + '.svg')
            .then((response) => response.text())
            .then((svg) => { icon.innerHTML = svg });

        figcaption.textContent = name;    

        if (tags.length > 0) {
            const iconTagTemplate = document.querySelector("#icon-tag-template");
            for (var i in tags) {
                let iconTag = iconTagTemplate.content.cloneNode(true);
                let button = iconTag.querySelector('button');
                let tagName = tags[i];
                button.textContent = tagName;
                button.addEventListener('click', function(e) {
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

        while (inspector.childNodes.length > 0) {
            inspector.removeChild(inspector.firstChild);
        }

        inspector.appendChild(iconDetail);
    };

    function sortIcons(a, b) {
        // TODO: close... the simpler ones come at the end though
        a = a.split("-"), b = b.split("-");

        for (let i = 0; i < a.length; i++) {
            if (i+1 > b.length) {
                return 1;
            }

            if (a[i] > b[i]) {
                return 1;
            } else if (a[i] < b[i]) {
                return -1;
            }
            return 0;
        }
    }

    getIcons();
    populateGallery();

    const input = document.querySelector("input");
    if (input.value) {
        filterIcons(input.value);
    }

    const debounce = (func, delay) => {
        let debounceTimer;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    }

    input.addEventListener('keyup', debounce(function(e) {
        if (this.value) {
            filterIcons(this.value);
        } else {
            populateGallery();
        }
    }, 250));
})();