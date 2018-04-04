
var myWorker = new Worker("minMaxWorker.js");

myWorker.onmessage = function (e) {
    let block = document.createElement("ul");
    for (let text of e.data)
    {
        let element = document.createElement("li");
        element.textContent = text;
        block.appendChild(element);
    }
    document.body.appendChild(block);
};

myWorker.postMessage(0);