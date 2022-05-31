/**
 * A website which allows users to create their own website.
 * Features include adding elements, removing elements, and editing
 * elements.  Relies heavily on CSS and HTML principles.
 * @author hekate.neocities.org <howsoonisnow1121@gmail.com>
 */
"use strict";
(function() {
  const DFONTS = ["Verdana", "Times New Roman", "Helvetica"];
  const BASEURL = "https://fonts.googleapis.com/css2?family=";
  let clipboard = [];

  window.addEventListener("load", init);
  window.addEventListener("beforeunload", function(event) {
    event.returnValue = "\o/";
  });

  /**
   * Sets up page functionality- makes tabs collapsable and body editable!
   */
  function init() {
    id("save-btn").addEventListener("click", save);
    $(".menu").draggable().resizable();

    qs("#colorchoose input").addEventListener("change", function(evt) {
      let col = evt.target.value;
      qs(":root").style.setProperty('--primary', col);
    });

    makeEditable(qsa("main"));

    qsa(".collapse").forEach((elem) => {
      elem.addEventListener("click", function(e) {
        collapseTab(this.parentNode);
      });
    });
    
    qsa("nav a").forEach((elmt) => {
      elmt.addEventListener("click", function(e) {
        e.preventDefault();
        openTab(e);
      });
    });
  }

  /**
   * Sets up elements to have attributes for proper editing, makes sure
   * that the correct menus appear when interacting with elements.
   * @param {Array} ndlst - a list of elements
   * @param {boolean} def - whether or not the elements were pre-defined  
   */
  function makeEditable(ndlst, def = true) {
    let timer = null;
    let textNodes = ["H1", "H2", "H3", "H4", "P"];
    for (let i = 0; i < ndlst.length; i++) {
      let elem = ndlst[i];
      let initStyles = elem.getAttribute("style");
      elem.addEventListener("contextmenu", function(event) {
        preventClick(event);
        if (event.target === this) {
          editMenu(event);
        }
      });
      
      if (textNodes.includes(elem.tagName)) {
        elem.setAttribute("contenteditable", true);
        if (!elem.textContent) {
          elem.textContent = "Click to Edit!";
        };

        elem.addEventListener("click", function(e) {
          if (elem.textContent === "Click to Edit!") {
            elem.textContent = "";
          }
          e.target.focus();
        });

        elem.addEventListener("input", function(e) {
          if (!e.target.textContent) {
            elem.textContent = "\xa0";
          }
        });
      } else {
        if (elem.tagName !== "MAIN") {
          if (elem.tagName === "IMG" && def) {
            elem.src = "assets/placeholder.png";
            elem.style.width = "100px";
            elem.style.height = "100px";
          }

          if (elem.tagName !== "IMG") {
            $(elem).resizable();
          }
          $(elem).draggable();

          $(elem).on('resize', function (e) {
            e.stopPropagation();
          });
        }

        elem.addEventListener("click", function(event) {
          preventClick(event);
          if (!timer && event.target === this && event.target.tagName !== "IMG") {
            timer = setTimeout(() => {
              let newMenu = id("newMenu").cloneNode(true);
              addMenu(event, newMenu);
              timer = null;
            }, 200);
          }
        });
      }

      if (elem.tagName !== "MAIN") {
        if (def) {
          addStyles(elem);
          elem.classList.add("glow_box");
        }
        elem.addEventListener("dblclick", function(event) {
          preventClick(event);
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          removeElem(event);
        });
      }

      elem.addEventListener("contextmenu", function(event) {
        preventClick(event);
        editMenu(event);
      });

      // overrides jquery styling
      if (!def) {
        elem.setAttribute("style", initStyles);
      }
    }
  };

  /**
   * Adds a new item to the page.
   * @param {Event} e - the event that triggered the addition of the element
   */
  function addItem(e) {
    let tab = e.target.closest(".menu");
    let parent = qs(tab.dataset.tagName);
    let tag = tab.querySelector("input[name='elem']:checked").value;
    let elmt = document.createElement(tag);
    elmt.id = "id_" + Date.now();

    elmt.dataset["type"] = tab.querySelector("input[name='elem']:checked").dataset["type"];

    makeEditable([elmt]);

    parent.appendChild(elmt);
  }

  /**
   * Creates a menu from which the user can edit a selected element.
   * @param {Event} event - the event which triggered the addition of the menu.
   */
  async function editMenu(event) {
    let newMenu = id("editMenu").cloneNode(true);
    newMenu.style.top = event.clientY + "px";
    newMenu.style.left = event.clientX + "px";
    newMenu.classList.remove("hidden");

    newMenu.querySelector("span").textContent = event.target.tagName;
    newMenu.querySelector("span").dataset["value"] = generateQuerySelector(event.target);

    newMenu.querySelector(".close").addEventListener("click", function(e) {
      this.closest(".menu").remove();
    });

    newMenu.querySelector(".copy").addEventListener("click", copy);

    buildEditStyles(newMenu, event);

    document.body.appendChild(newMenu);
    $(newMenu).draggable({
      stack: ".menu"
    });
  }

  function copy(event) {
    let selElem = qs(event.target.closest(".menu").querySelector("span").dataset["value"]).cloneNode(true);

    removeDrags(selElem);

    selElem.querySelectorAll("*").forEach((elem) => {
      removeDrags(elem);
    });

    event.target.textContent = "Element copied!";
    clipboard = selElem;
  }

  function removeDrags(elem) {
    if (elem.classList.contains("ui-resizable-handle")) {
      elem.remove();
    } else {
      if (elem.getAttribute("contenteditable")) {
        elem.removeAttribute("contenteditable");
      }
  
      if ($(elem).data('draggable')) {
        $(elem).draggable("destroy");
      }
  
      if ($(elem).data('resizable')) {
        $(elem).resizable("destroy");
      }
    }

    elem.removeAttribute("class");
  }

  /**
   * Retrieves and displays the options that should be displayed in an edit menu.
   * @param {HTMLObject} menu - the menu which holds the options.
   * @param {Event} event - the event which triggered the addition of the menu.
   */
  async function buildEditStyles(menu, event) {
    let res = await getEditStyles(event);
    let ul = document.createElement("ul");

    for (let i = 0; i < res.length; i++) {
      let par = document.createElement("li");
      let parText = document.createElement("p");
      let styles = await getAllStyles(res[i]);
      let sub = document.createElement("ul");

      parText.addEventListener("click", function(event) {
        this.parentNode.classList.toggle("active");
      });

      parText.textContent = res[i];
      par.appendChild(parText);

      let keys = Object.keys(styles);
      let vals = Object.values(styles);

      for (let j = 0; j < keys.length; j++) {
        let li = document.createElement("li");
        let dv = document.createElement("div");

        li.textContent = keys[j] + ": ";
        
        for (let k = 0; k < vals[j]['input'].length; k++) {
          let lab = document.createElement("label");
          let type = vals[j]['input'][k];
          let input;

          if (type === "select") {
          input = document.createElement("select");
          if (vals[j]['class']) {
            input.classList.add(vals[j]['class']);
          }

          if (!vals[j]['default']) {
            alert(
              "Error: No defaults were set for property " +
              keys[j] +
              ". Please contact the developer.")
          } else {
            for (let l = 0; l < vals[j]['default'].length; l++) {
              let opt = document.createElement("option");
              opt.value = vals[j]['default'][l];
              opt.textContent = vals[j]['default'][l];
              let units = (event.target.style[keys[j]]).match(/([a-zA-Z%]+)(?:\^(-?\d+))?/);
              let font = (event.target.style[keys[j]]).match(/([a-zA-Z0-9]+\s?)+/);

              if ( opt.value === event.target.style[keys[j]]) {
                opt.selected = true;
              } else if ( units && opt.value === units[0]) {
                opt.selected = true;
              } else if ( font && opt.value === font[0]) {
                opt.selected = true;
              }
              input.appendChild(opt);
            }
          }
          } else {
            let setValue = event.target.style[keys[j]];
            input = document.createElement("input");
            input.type = vals[j]['input'][k];
            
            if (type === "checkbox") {
              input.checked = true;
            }
          
          if (setValue && type !== "file") {
            if (!isNaN(parseInt(setValue))) {
              input.value = parseInt(setValue);
            } else if (type === "color") {
              input.value = rgbToHex(setValue);
            } else {
              input.value = setValue;
            }
          }
        }

        input.addEventListener('input', captureInput);
        lab.appendChild(input);
        dv.appendChild(lab);
        }
        li.appendChild(dv);
        sub.appendChild(li);
      }

      par.appendChild(sub);
      ul.appendChild(par);
    }

    menu.querySelector("div").appendChild(ul);
  }

  /**
   * Responds to the user entering custom values, and displays those
   * values on the page.
   * @param {Event} event - the event of the input changing.
   */
  function captureInput(event) {
    let selector = this.closest(".menu").querySelector("span")["dataset"]["value"];
    let elem = qs(selector);
    let prop = this.closest("li").textContent.split(":")[0].trim();

    if (this["type"] === "number") {
      elem.style[prop] = this.value + this.closest('li').querySelector('select').value;
    } else if (this["type"] === "file") {
      let reader = new FileReader();
      reader.addEventListener("load", () => {
        const uploaded_image = reader.result;
        if (prop === "background-image") {
          elem.style.backgroundImage = `url(${uploaded_image})`;
          elem.dataset.backgroundSrc = (this.value).split(/(\\|\/)/g).pop();
        } else {
          elem.src = uploaded_image;
          elem.style.width = "auto";
          elem.style.height = "auto";
          elem.alt = (this.value).split(/(\\|\/)/g).pop();
        }
      });
        reader.readAsDataURL(this.files[0]);
    } else if (this.classList.contains("units")) {
      elem.style[prop] = this.closest("div").querySelector("input").value + this.value;
    } else if (this["type"] === "checkbox") {
      if (!this.checked) {
        elem.style[prop] = "";
      } else {
        if (prop === "background") {
          elem.style[prop] = this.closest("ul").querySelector("input[type='color']").value;
        }
      }
    } else {
      if (prop === "font-family") {
        const apiurl = [BASEURL];
        elem.style[prop] = "'" + this.value + "'";

        if(document.head.querySelector("#font-link")) {
          document.head.querySelector("#font-link").remove();
        }

        let allFonts = [...qsa("main, main *")].filter((elem) => {
          return (elem.style.fontFamily && !DFONTS.includes((elem.style.fontFamily).match(/([a-zA-Z0-9]+\s?)+/)[0]));
        });

        allFonts = allFonts.map((elem) => {
          return (elem.style.fontFamily).match(/([a-zA-Z0-9]+\s?)+/)[0];
        })

        if (!allFonts.includes((this.value).match(/([a-zA-Z0-9]+\s?)+/)[0]) && !DFONTS.includes((this.value).match(/([a-zA-Z0-9]+\s?)+/)[0])) {
          allFonts.push((this.value).match(/([a-zA-Z0-9]+\s?)+/)[0]);
        }

        allFonts.forEach((elem) => {
          if (apiurl.length === 1) {
            apiurl.push((elem).replace(/\s/g, '+'));
          } else {
            apiurl.push("&family=" + (elem).replace(/\s/g, '+'));
          }
        });
        
        if (apiurl.length > 1) {
          document.head.appendChild(genFontLink(apiurl));
        }
      } else {
        elem.style[prop] = this.value;
      }
    }
  }

  /**
   * Constructs a link to the Google fonts service, based on fonts that
   * are used in the page.
   * @param {Array} apiurl - The elements of the link to be constructed
   * @returns A link to the Google fonts service
   */
  function genFontLink(apiurl) {
    let link = document.createElement('link');
    link.id = "font-link";
    link.rel = 'stylesheet';
    link.href = apiurl.join('');
    return link;
  }

  /**
   * Retrieves all the possible styles for a given property.
   * @param {String} style - the property to search for.
   * @returns all the possible styles for the provided property.
   */
  async function getAllStyles(style) {
    try {
      let res = await fetch("/styles/" + style + "/properties");
      await statusCheck(res);
      res = await res.json();

      return res;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Retrieves all of the possible categories of styles that
   * can be edited for a specified type of element.
   * @param {Event} event - the event of the categories being requested.
   * @returns all the possible categories of styles.
   */
  async function getEditStyles(event) {
    try {
      let res;
      if (event.target.dataset["type"]) {
        res = await fetch("/styles/" + event.target.dataset["type"]);
      } else {
        res = await fetch("/styles/div");
      }
      await statusCheck(res);
      res = await res.json();
      
      return res;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Creates a menu to remove a selected element.
   * @param {Event} event - the event of the remove menu being requested.
   */
  function removeElem(event) {
    let newMenu = id("close").cloneNode(true);
    newMenu.style.top = event.clientY + "px";
    newMenu.style.left = event.clientX + "px";
    newMenu.classList.remove("hidden");

    newMenu.querySelector("span").textContent = event.target.tagName;

    document.body.appendChild(newMenu);
    $(newMenu).draggable({
      stack: ".menu"
    });

    newMenu.querySelector(".close").addEventListener("click", function(e) {
      this.closest(".menu").remove();
    });

    newMenu.querySelector(".cancel").addEventListener("click", function(e) {
      this.closest(".menu").remove();
    });

    newMenu.querySelector(".remove").addEventListener("click", () => {
      let otsMn = qsa(`[data-value='${generateQuerySelector(event.target)}']`);
      otsMn.forEach(elm => elm.closest('.menu').remove());
      event.target.remove();
      newMenu.remove();
    });
  }

  /**
   * Creates a menu to insert something into a selected element.
   * @param {Event} e - the event of the add menu being requested.
   * @param {HTMLElement} node - the menu displayed on the page.
   */
  function addMenu(e, node) {
    node.dataset.tagName = generateQuerySelector(e.target);
    node.style.top = e.clientY + "px";
    node.style.left = e.clientX + "px";
    node.classList.remove("hidden");

    node.querySelector("span").textContent = e.target.tagName;
    node.querySelector("span").dataset["value"] = generateQuerySelector(e.target);

    node.querySelector(".close").addEventListener("click", function(e) {
      this.closest('.menu').remove();
    });

    node.querySelector(".paste").addEventListener("click", paste);

    node.querySelector("form").addEventListener("submit", function(e) {
      e.preventDefault();
      e.target.closest(".menu").remove();
      addItem(e);
    });

    document.body.appendChild(node);
    $(node).draggable({
      stack: ".menu"
    });
  }

  function paste(event) {
    if (clipboard.lenght === 0) {
      alert("You haven't copied anything.");
    } else {
      let par = qs(event.target.closest(".menu").querySelector("span").dataset["value"]);
      let newElem = clipboard.cloneNode("true");
      makeEditable([newElem]);
      console.log(newElem)
      par.appendChild(newElem);
    }
  }

  /**
   * Collapses a menu into a tab
   * @param {HTMLElement} node - the menu to be collapsed
   */
  function collapseTab(node) {
    let select = generateQuerySelector(node);
    node.classList.add("hidden");

    createTab(select);
  }

  /**
   * Creates a tab for a specified menu.
   * @param {String} tag - the selector to identify the menu that is being collapsed.
   */
  function createTab(tag) {
    let tab = document.createElement("div");
    let open = document.createElement("a");

    if (qs(tag).id) {
      tab.textContent = qs(tag).id;
    } else {
      tab.textContent = qs(tag).tagName;
    }
    
    open.textContent = "↑";
    open.href = tag;

    open.addEventListener("click", function(e) {
      e.preventDefault();
      openTab(e);
    });

    tab.appendChild(open);
    qs("body > nav").appendChild(tab);
  }

  /**
   * Opens a menu from clicking on a tab.
   * @param {Event} e - the event of opening the tab
   */
  function openTab(e) {
    let elmt = e.target.getAttribute("href");
    qs(elmt).classList.remove("hidden");
    e.target.parentNode.remove();
  }

  /**
   * Applies default appearance to some element.
   * @param {HTMLObject} obj - the object to change the appearance of.
   */
  function addStyles(obj) {
    let textTypes = ["h1", "h2", "h3", "h4", "p", "strong", "i"];
    obj.style.zIndex = "90";
    obj.style.width = "100px";
    obj.style.height = "100px";
    obj.style.border = "1px solid #000";
    obj.style.position = "absolute";
    if (textTypes.includes(obj.tagName.toLowerCase())) {
    obj.style.border = "none";
    obj.style.overflowWrap = "break-word";
    obj.style.position = "static";
    obj.style.display = "block";
    obj.style.width = "auto";
    obj.style.height = "auto";
    obj.style.margin = 0;
    } else if (obj.tagName.toLowerCase() !== "img") {
      obj.style.backgroundColor = "#dcdcdc";
    }
  }

  /** Saves the current work */
  function save() {
    qsa("main *").forEach((elem) => {      
      removeDrags(elem);
    });

    let prev = qs("main").outerHTML;
    console.log(prev);
  
    let cssContent = makeStyles();
    let htmlContent = makeHTML();
    
    htmlDownload(htmlContent);
    cssDownload(cssContent);

    qs("main").outerHTML = prev;
    console.log(prev);
    makeEditable(qsa("main, main *"), false);
  }

  /** Creates more readable html from working html on the page */
  function makeHTML() {
    qsa("main, main *").forEach((elem) => {
      elem.removeAttribute("style");
      elem.removeAttribute("data-type");
      elem.removeAttribute("class");
    });

    qsa("main img").forEach((elem) => {
      elem.src = elem.alt;
    });

    let results = [
      "<!DOCTYPEhtml>\n<html>\n<head>\n<link rel='stylesheet' type='text/css' href='styles.css'>\n" +
      (document.head.querySelector("#font-link") ? "<link rel='stylesheet' href='" +
      document.head.querySelector("#font-link").href +
      "'>\n" : "") +
      "</head>\n<body>\n" + 
      qs("main").innerHTML +
      "\n</body>\n</html>"
    ];

    return results;
  }

  /**
   * Creates a seperate file for page styling.
   * @param {String} cssContent - the content to seperate into the file.
   */
  function cssDownload(cssContent) {
    let bl = new Blob([cssContent], {type: "text/css"});
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "styles.css";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML = "CSS is rlly cool";
    a.click();
    a.remove();
  }

  /**
   * Creates a seperate file for the elements on the page.
   * @param {String} htmlContent - the content to seperate into the file.
   */
  function htmlDownload(htmlContent) {
    let bl = new Blob(htmlContent, {type: "text/html"});
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "index.html";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML = "HTML is cooler";
    a.click();
    a.remove();
  }

  /**
   * Formats and parses through the pages styling
   * @returns the formatted styling
   */
  function makeStyles() {
    let styles = "";
    qsa('main, main *').forEach(e => {
      e.removeAttribute('class')
      if (e.dataset.backgroundSrc) {
        let rightName = e.dataset.backgroundSrc;
        e.style.backgroundImage = "url(" + rightName + ")";
        e.removeAttribute("data-background-src");
      }
      if (e.getAttribute('style')) {
        if (e.tagName === "MAIN") {
          styles += `body {${formatStyle(e.getAttribute('style'))}}`;
        } else {
          styles += `#${e.id}{${formatStyle(e.getAttribute('style'))}}`;
        }
      }
    });
    return styles;
  }

  /**
   * Formats specific styling rules.
   * @param {String} style - the specific style to be formatted.
   * @returns the formatted styling rule.
   */
  function formatStyle(style) {
    let tmp = '';
    let styles = style.split(';');
    styles.forEach(e => {
      if (e) {
        tmp += `${e};`;
      }
    });
    return tmp;
  }

  /**
   * Determines whether or not the status of a HTTP response is ok.
   * @param {Promise} res - the response from the server.
   * @returns the response to continue parsing.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }  

  /**
  * Returns a unique selector describing a given html element.
  * Retrieved from:
  * https://stackoverflow.com/questions/42184322/javascript-get
  * -element-unique-selector
  * @param {HTMLElement} el - html element to produce tag from
  * @returns a unique selector
  */
  function generateQuerySelector(el, root = "html") {
    if (el.tagName.toLowerCase() === root) {
      return "html";
    } else {
    let str = el.tagName.toLowerCase();

    if (el.className) {
      let classes = el.className.split(/\s/);
      str += (el.id ? "#" + el.id : "");
      for (let i = 0; i < classes.length; i++) {
        str += "." + classes[i]
      }
    }
    return generateQuerySelector(el.parentNode) + " > " + str;
    }
  }

  /**
   * Prevents a function from spreading to other elements.
   * I've admittedly overused this one :-P
   * @param {Event} event - the event of clicking on something.
   */
  function preventClick(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  }

  /**
   * Converts a color from rgb to hex.
   * @param {String} rgb - the rgb color to convert.
   * @returns the color in hex.
   */
  function rgbToHex(rgb) {
    return `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Shorthand, selects elements on the page by a specified id.
   * @param {String} id - the id to search for.
   * @returns the matching element.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Shorthand, selects all elements on the page to a specified query.
   * @param {String} query - the query to search for.
   * @returns all the matching elements.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Shothand, selects the first match on the page to a specifed query.
   * @param {String} query - the query to search for.
   * @returns all the matching elements.
   */
  function qs(query) {
    return document.querySelector(query);
  }
})();