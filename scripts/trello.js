var activeInput = null;
var activeItem = null;
/* Drag and drop src: https://stackoverflow.com/a/44920470 */
var dragSrcElement = null;
const ADD_CARD = "+ Add card";
const STORE = "MyTrello";
const OPTIONS_MENU = "⋮";

function dragStart(elem) {
    dragSrcElement = this;

    elem.dataTransfer.effectAllowed = 'move';
    elem.dataTransfer.setData('text/html', this.outer.HTML);

    this.classList.add('dragElem');
}

function dragOver(elem) {
    if (elem.preventDefault) {
        elem.preventDefault();
    }
    this.classList.add('over');

    elem.dataTransfer.dropEffect = 'move';

    return false;
}

function dragEnter(elem) {
    elem.preventDefault();
}

function dragLeave(elem) {
    this.classList.remove('over');
}

function drop(elem) {
    if (elem.stopPropagation) {
        elem.stopPropagation();
    }

    if (dragSrcElement != this) {
        dragSrcElement.parentNode.removeChild(dragSrcElement);
        var dropHTML = elem.dataTransfer.getData('text/html');
        this.insertAdjacentHTML('beforebegin', dropHTML);
        var dropElem = this.previousSibling;
        addDnD(dropElem);
    }
    this.classList.remove('over');
    save();

    return false;
}

function dragEnd(elem) {
    this.classList.remove('over');
}

/* link `elem` with all the drag&drop machinery */
function addDnD(elem) {
    elem.addEventListener('dragstart', dragStart, false);
    elem.addEventListener('dragenter', dragEnter, false);
    elem.addEventListener('dragover', dragOver, false);
    elem.addEventListener('dragleave', dragLeave, false);
    elem.addEventListener('drop', drop, false);
    elem.addEventListener('dragend', dragEnd, false);
}

/* Loop all `li` elements to add D&D support */
function setDnD() {
    var cols = document.getElementsByTagName('li');
    [].forEach.call(cols, addDnD);
}

/* Clear board */
function clear() {
    const board = document.getElementsByClassName("lists")[0];
    while (board.lastElementChild) {
        board.removeChild(board.lastElementChild);
    }
}

/* Dump board state to JSON */
function dumps() {
    var board = document.getElementsByClassName("board")[0].innerText;
    var list = document.getElementsByClassName("list");
    var state = {"board": board, "lists": []};

    for (var i = 0; list[i]; ++i) {
        var li = list[i].getElementsByTagName("li");
        var items = {
            "header": list[i].getElementsByTagName("header")[0]
                             .innerText.split('\n')[0],
            "items": []
        };

        for (var j = 0; li[j+1]; ++j) { // skip last item - placeholder
            items["items"].push(li[j].innerText);
        }

        state["lists"].push(items);
    }

    return state;
}

/* Save board to `localStorage` */
function save() {
    var state = JSON.stringify(dumps());
    localStorage.setItem(STORE, state)
}

/* Load board from JSON */
function loads(state) {
    document.getElementsByClassName("board")[0].innerText = state["board"];
    var board = document.getElementsByClassName("lists")[0];

    for (var i = 0; state["lists"][i]; ++i) {
        var data = state["lists"][i];

        var list = document.createElement("div");
        list.className = "list"

        var header = document.createElement("header");
        var options = createDropdownButton();

        header.innerText = data["header"];
        header.appendChild(options);
        list.appendChild(header);

        var ul = document.createElement("ul");

        for (var j = 0; data["items"][j]; ++j) {
            var li = generateLi(data["items"][j]);
            ul.appendChild(li);
        }

        list.appendChild(ul);

        var footer = document.createElement("footer");
        footer.innerText = ADD_CARD;
        footer.contentEditable = true;
        footer.addEventListener("focusin", () => {
            activeInput = document.activeElement;
            if (activeInput.innerText == ADD_CARD) {
                activeInput.innerText = "";
            };
        });
        footer.addEventListener("focusout", () => {
            if (activeInput.innerText == "") {
                activeInput.innerText = ADD_CARD;
            }
        });
        footer.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();

                var li = generateLi(activeInput.innerText.trim());
                var col = activeInput.previousElementSibling;
                var idx = col.childNodes[col.childNodes.length - 1];
                col.insertBefore(li, idx);

                activeInput.innerText = "";
                activeInput.innerText = activeInput.innerText.trim();
                save();
            }
        });
        list.appendChild(footer);

        board.appendChild(list);
    }

    setDnD();
}

/* Set up all the board */
function load() {
    var val = localStorage.getItem(STORE);

    if (!val) {
        val = '{"board": "Workflow", "lists": [ {"header": "To do", "items": []}, {"header": "In progress", "items": []}, {"header": "Blocked", "items": []}, {"header": "Done", "items": []} ] }';
    }
    var state = JSON.parse(val);
    loads(state);
    createPlaceholders();
}

/* Reset board state to default */
function resetBoard() {
    clear();
    localStorage.removeItem(STORE);
    load();
}

/* Add empty items in the boatd to support D&D even for empty lists */
function createPlaceholders() {
    var ul = document.getElementsByTagName("ul");

    for (var i = 0; ul[i]; ++i) {
        var li = document.createElement("li");
        li.className = "placeholder";
        li.style.backgroundColor = "#e2e4e6";
        addDnD(li);
        ul[i].appendChild(li);
    }
}

/* Generate `li` in the list */
function generateLi(text) {
    var li = document.createElement("li");
    li.innerText = text;
    li.contentEditable = true;
    li.draggable = true;
    li.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    });
    li.addEventListener("focusin", () => {
        activeItem = document.activeElement;
    });
    li.addEventListener("focusout", () => {
        if (activeItem.innerText == '') {
            activeItem.remove();
            save();
        }
    });
    addDnD(li);

    return li;
}

/* Dropdown options menu */
function createDropdownButton() {
    var div = document.createElement("div");
    div.classList.add("dropdown");
    div.classList.add("right");

    var button = document.createElement("button");
    button.className = "dropbutton";
    button.innerText = OPTIONS_MENU;

    var content = document.createElement("div");
    content.className = "dropdown-content";

    var clear = document.createElement("a");
    clear.setAttribute("href", "#");
    clear.innerHTML = "Clear";

    content.appendChild(clear);
    div.appendChild(button);
    div.appendChild(content);

    /* Handle Clear click */
    clear.addEventListener("click", function(e) {
        var container = div.parentElement.parentElement;
        var ul = container.getElementsByTagName("ul")[0];

        while (ul.childElementCount > 1) {
            ul.removeChild(ul.firstElementChild);
        }

        save();
    });

    return div;
}